import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useApp } from '../contexts/AppContext';
import { lightTheme, darkTheme } from '../utils/theme';

const screenWidth = Dimensions.get('window').width;

const TIME_RANGES = [
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
  { label: '90 Days', days: 90 },
];

const METRICS = [
  { key: 'heartRate', label: 'Heart Rate', unit: 'bpm', color: '#ef4444' },
  { key: 'systolic', label: 'Systolic BP', unit: 'mmHg', color: '#3b82f6' },
  { key: 'diastolic', label: 'Diastolic BP', unit: 'mmHg', color: '#10b981' },
];

export default function TrendsScreen() {
  const { healthRecords, thresholds, isDarkMode } = useApp();
  const theme = isDarkMode ? darkTheme : lightTheme;
  
  const [selectedTimeRange, setSelectedTimeRange] = useState(7);
  const [selectedMetric, setSelectedMetric] = useState('heartRate');

  const chartConfig = {
    backgroundColor: theme.surface,
    backgroundGradientFrom: theme.surface,
    backgroundGradientTo: theme.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(${isDarkMode ? '59, 130, 246' : '37, 99, 235'}, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${isDarkMode ? '148, 163, 184' : '100, 116, 139'}, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: theme.primary,
    },
  };

  const filteredRecords = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - selectedTimeRange);
    
    return healthRecords
      .filter(record => new Date(record.timestamp) >= cutoffDate)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [healthRecords, selectedTimeRange]);

  const chartData = useMemo(() => {
    if (filteredRecords.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [0] }],
      };
    }

    const labels = filteredRecords.map(record => {
      const date = new Date(record.timestamp);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    let dataPoints: number[] = [];
    
    switch (selectedMetric) {
      case 'heartRate':
        dataPoints = filteredRecords.map(record => record.heartRate);
        break;
      case 'systolic':
        dataPoints = filteredRecords.map(record => record.bloodPressureSystolic);
        break;
      case 'diastolic':
        dataPoints = filteredRecords.map(record => record.bloodPressureDiastolic);
        break;
    }

    return {
      labels,
      datasets: [{ data: dataPoints }],
    };
  }, [filteredRecords, selectedMetric]);

  const currentMetric = METRICS.find(m => m.key === selectedMetric);
  const currentThreshold = thresholds.find(t => 
    (selectedMetric === 'heartRate' && t.metricName === 'heart_rate') ||
    (selectedMetric === 'systolic' && t.metricName === 'bp_systolic') ||
    (selectedMetric === 'diastolic' && t.metricName === 'bp_diastolic')
  );

  const getLatestValue = () => {
    if (filteredRecords.length === 0) return 'N/A';
    
    const latest = filteredRecords[filteredRecords.length - 1];
    switch (selectedMetric) {
      case 'heartRate':
        return latest.heartRate;
      case 'systolic':
        return latest.bloodPressureSystolic;
      case 'diastolic':
        return latest.bloodPressureDiastolic;
      default:
        return 'N/A';
    }
  };

  const getAverageValue = () => {
    if (filteredRecords.length === 0) return 'N/A';
    
    let sum = 0;
    filteredRecords.forEach(record => {
      switch (selectedMetric) {
        case 'heartRate':
          sum += record.heartRate;
          break;
        case 'systolic':
          sum += record.bloodPressureSystolic;
          break;
        case 'diastolic':
          sum += record.bloodPressureDiastolic;
          break;
      }
    });
    
    return Math.round(sum / filteredRecords.length);
  };

  const isInSafeRange = (value: number) => {
    if (!currentThreshold) return true;
    return value >= currentThreshold.minValue && value <= currentThreshold.maxValue;
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <Text style={[styles.headerTitle, { color: '#ffffff' }]}>
          Health Trends
        </Text>
        <Text style={[styles.headerSubtitle, { color: '#ffffff' }]}>
          Track your progress over time
        </Text>
      </View>

      {/* Time Range Selector */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Time Range
        </Text>
        <View style={styles.timeRangeContainer}>
          {TIME_RANGES.map((range) => (
            <TouchableOpacity
              key={range.days}
              style={[
                styles.timeRangeButton,
                { borderColor: theme.border },
                selectedTimeRange === range.days && { backgroundColor: theme.primary },
              ]}
              onPress={() => setSelectedTimeRange(range.days)}
            >
              <Text style={[
                styles.timeRangeText,
                { color: theme.text },
                selectedTimeRange === range.days && { color: '#ffffff' },
              ]}>
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Metric Selector */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Metric
        </Text>
        <View style={styles.metricContainer}>
          {METRICS.map((metric) => (
            <TouchableOpacity
              key={metric.key}
              style={[
                styles.metricButton,
                { borderColor: theme.border },
                selectedMetric === metric.key && { backgroundColor: theme.primary },
              ]}
              onPress={() => setSelectedMetric(metric.key)}
            >
              <Text style={[
                styles.metricText,
                { color: theme.text },
                selectedMetric === metric.key && { color: '#ffffff' },
              ]}>
                {metric.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Statistics */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {currentMetric?.label} Statistics
        </Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Latest
            </Text>
            <Text style={[
              styles.statValue,
              { color: isInSafeRange(Number(getLatestValue())) ? theme.success : theme.error }
            ]}>
              {getLatestValue()} {currentMetric?.unit}
            </Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Average
            </Text>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {getAverageValue()} {currentMetric?.unit}
            </Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Readings
            </Text>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {filteredRecords.length}
            </Text>
          </View>
        </View>

        {currentThreshold && (
          <View style={[styles.thresholdInfo, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <Text style={[styles.thresholdLabel, { color: theme.textSecondary }]}>
              Safe Range: {currentThreshold.minValue} - {currentThreshold.maxValue} {currentMetric?.unit}
            </Text>
          </View>
        )}
      </View>

      {/* Chart */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {currentMetric?.label} Trend
        </Text>
        
        {filteredRecords.length > 0 ? (
          <View style={styles.chartContainer}>
            <LineChart
              data={chartData}
              width={screenWidth - 64}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withDots={true}
              withInnerLines={false}
              withOuterLines={true}
              withVerticalLines={false}
              withHorizontalLines={true}
            />
          </View>
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={[styles.noDataText, { color: theme.textSecondary }]}>
              No data available for the selected time range
            </Text>
            <Text style={[styles.noDataSubtext, { color: theme.textSecondary }]}>
              Add some health readings to see trends
            </Text>
          </View>
        )}
      </View>

      {/* Recent Records */}
      {filteredRecords.length > 0 && (
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Recent Records
          </Text>
          
          {filteredRecords.slice(-5).reverse().map((record, index) => (
            <View key={record.id} style={[styles.recordRow, { borderBottomColor: theme.border }]}>
              <View>
                <Text style={[styles.recordDate, { color: theme.text }]}>
                  {new Date(record.timestamp).toLocaleDateString()}
                </Text>
                <Text style={[styles.recordTime, { color: theme.textSecondary }]}>
                  {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={styles.recordValues}>
                <Text style={[styles.recordValue, { color: theme.text }]}>
                  HR: {record.heartRate}
                </Text>
                <Text style={[styles.recordValue, { color: theme.text }]}>
                  BP: {record.bloodPressureSystolic}/{record.bloodPressureDiastolic}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.9,
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeRangeButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  metricContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricButton: {
    width: '32%',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  metricText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  thresholdInfo: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  thresholdLabel: {
    fontSize: 12,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  chart: {
    borderRadius: 12,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 16,
    marginBottom: 4,
  },
  noDataSubtext: {
    fontSize: 14,
  },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  recordDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  recordTime: {
    fontSize: 12,
    marginTop: 2,
  },
  recordValues: {
    alignItems: 'flex-end',
  },
  recordValue: {
    fontSize: 12,
    marginBottom: 2,
  },
});