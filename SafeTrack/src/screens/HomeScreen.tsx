import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useApp } from '../contexts/AppContext';
import { lightTheme, darkTheme } from '../utils/theme';

export default function HomeScreen({ navigation }: any) {
  const { user, healthRecords, alerts, isDarkMode } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const theme = isDarkMode ? darkTheme : lightTheme;

  const latestRecord = healthRecords.length > 0 ? healthRecords[0] : null;
  const unacknowledgedAlerts = alerts.filter(alert => !alert.isAcknowledged);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return theme.error;
      case 'medium':
        return theme.warning;
      case 'low':
        return theme.info;
      default:
        return theme.textSecondary;
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <Text style={[styles.headerTitle, { color: '#ffffff' }]}>
          SafeTrack
        </Text>
        <Text style={[styles.headerSubtitle, { color: '#ffffff' }]}>
          Welcome back, {user?.name || 'User'}
        </Text>
      </View>

      {/* Alert Status */}
      {unacknowledgedAlerts.length > 0 && (
        <TouchableOpacity
          style={[styles.alertBanner, { backgroundColor: theme.error }]}
          onPress={() => navigation.navigate('Alerts')}
        >
          <Text style={[styles.alertText, { color: '#ffffff' }]}>
            ⚠️ {unacknowledgedAlerts.length} Active Alert{unacknowledgedAlerts.length > 1 ? 's' : ''}
          </Text>
          <Text style={[styles.alertSubtext, { color: '#ffffff' }]}>
            Tap to view details
          </Text>
        </TouchableOpacity>
      )}

      {/* Latest Health Data */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Latest Health Data
        </Text>
        
        {latestRecord ? (
          <View>
            <View style={styles.dataRow}>
              <Text style={[styles.dataLabel, { color: theme.textSecondary }]}>
                Heart Rate
              </Text>
              <Text style={[styles.dataValue, { color: theme.text }]}>
                {latestRecord.heartRate} bpm
              </Text>
            </View>
            
            <View style={styles.dataRow}>
              <Text style={[styles.dataLabel, { color: theme.textSecondary }]}>
                Blood Pressure
              </Text>
              <Text style={[styles.dataValue, { color: theme.text }]}>
                {latestRecord.bloodPressureSystolic}/{latestRecord.bloodPressureDiastolic} mmHg
              </Text>
            </View>
            
            {latestRecord.exerciseType && (
              <View style={styles.dataRow}>
                <Text style={[styles.dataLabel, { color: theme.textSecondary }]}>
                  Exercise Type
                </Text>
                <Text style={[styles.dataValue, { color: theme.text }]}>
                  {latestRecord.exerciseType}
                </Text>
              </View>
            )}
            
            <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
              Recorded: {formatDateTime(latestRecord.timestamp)}
            </Text>
          </View>
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={[styles.noDataText, { color: theme.textSecondary }]}>
              No health data recorded yet
            </Text>
            <Text style={[styles.noDataSubtext, { color: theme.textSecondary }]}>
              Tap "Add Data" to start tracking
            </Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Quick Actions
        </Text>
        
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('Input')}
          >
            <Text style={[styles.actionButtonText, { color: '#ffffff' }]}>
              📝 Add Data
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.success }]}
            onPress={() => navigation.navigate('Trends')}
          >
            <Text style={[styles.actionButtonText, { color: '#ffffff' }]}>
              📊 View Trends
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.secondary }]}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={[styles.actionButtonText, { color: '#ffffff' }]}>
              ⚙️ Settings
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.warning }]}
            onPress={() => navigation.navigate('Alerts')}
          >
            <Text style={[styles.actionButtonText, { color: '#ffffff' }]}>
              🚨 Alerts
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity Summary */}
      {healthRecords.length > 1 && (
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Recent Activity
          </Text>
          
          <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
            {healthRecords.length} records in total
          </Text>
          
          <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
            {alerts.length} alerts generated
          </Text>
          
          <TouchableOpacity
            style={[styles.viewAllButton, { borderColor: theme.border }]}
            onPress={() => navigation.navigate('Trends')}
          >
            <Text style={[styles.viewAllText, { color: theme.primary }]}>
              View All Records →
            </Text>
          </TouchableOpacity>
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
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.9,
  },
  alertBanner: {
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  alertText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  alertSubtext: {
    fontSize: 14,
    marginTop: 2,
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
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dataLabel: {
    fontSize: 16,
  },
  dataValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noDataText: {
    fontSize: 16,
    marginBottom: 4,
  },
  noDataSubtext: {
    fontSize: 14,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryText: {
    fontSize: 14,
    marginBottom: 4,
  },
  viewAllButton: {
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
});