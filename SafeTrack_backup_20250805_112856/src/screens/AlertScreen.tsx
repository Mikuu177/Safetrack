import React, { useState } from 'react';
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

export default function AlertScreen({ navigation }: any) {
  const { alerts, acknowledgeAlert, isDarkMode } = useApp();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [refreshing, setRefreshing] = useState(false);

  const unacknowledgedAlerts = alerts.filter(alert => !alert.isAcknowledged);
  const acknowledgedAlerts = alerts.filter(alert => alert.isAcknowledged);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleAcknowledgeAlert = (alertId: number) => {
    Alert.alert(
      'Acknowledge Alert',
      'Mark this alert as acknowledged?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Acknowledge',
          onPress: () => acknowledgeAlert(alertId),
        },
      ]
    );
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

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return '🚨';
      case 'medium':
        return '⚠️';
      case 'low':
        return 'ℹ️';
      default:
        return '📝';
    }
  };

  const renderAlert = (alert: any, isAcknowledged: boolean = false) => (
    <View
      key={alert.id}
      style={[
        styles.alertCard,
        { backgroundColor: theme.surface, borderLeftColor: getAlertColor(alert.severityLevel) },
        isAcknowledged && styles.acknowledgedAlert,
      ]}
    >
      <View style={styles.alertHeader}>
        <View style={styles.alertTitleContainer}>
          <Text style={styles.alertIcon}>
            {getSeverityIcon(alert.severityLevel)}
          </Text>
          <View style={styles.alertInfo}>
            <Text style={[styles.alertMetric, { color: theme.text }]}>
              {alert.metricName}
            </Text>
            <Text style={[styles.alertValue, { color: getAlertColor(alert.severityLevel) }]}>
              {alert.triggeredValue} (Threshold: {alert.thresholdValue})
            </Text>
          </View>
        </View>
        <View style={styles.alertBadge}>
          <Text style={[
            styles.severityText,
            { color: getAlertColor(alert.severityLevel) }
          ]}>
            {alert.severityLevel.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={[styles.alertMessage, { color: theme.text }]}>
        {alert.alertMessage}
      </Text>

      <View style={styles.alertFooter}>
        <Text style={[styles.alertTime, { color: theme.textSecondary }]}>
          {formatDateTime(alert.timestamp)}
        </Text>
        
        {!isAcknowledged && (
          <TouchableOpacity
            style={[styles.acknowledgeButton, { backgroundColor: theme.success }]}
            onPress={() => handleAcknowledgeAlert(alert.id)}
          >
            <Text style={[styles.acknowledgeButtonText, { color: '#ffffff' }]}>
              Acknowledge
            </Text>
          </TouchableOpacity>
        )}
        
        {isAcknowledged && (
          <View style={[styles.acknowledgedBadge, { backgroundColor: theme.success }]}>
            <Text style={[styles.acknowledgedText, { color: '#ffffff' }]}>
              ✓ Acknowledged
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <Text style={[styles.headerTitle, { color: '#ffffff' }]}>
          Health Alerts
        </Text>
        <Text style={[styles.headerSubtitle, { color: '#ffffff' }]}>
          Monitor your safety thresholds
        </Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Statistics */}
        <View style={[styles.statsContainer, { backgroundColor: theme.surface }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.error }]}>
              {unacknowledgedAlerts.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Active
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.success }]}>
              {acknowledgedAlerts.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Resolved
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.text }]}>
              {alerts.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Total
            </Text>
          </View>
        </View>

        {/* Active Alerts */}
        {unacknowledgedAlerts.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              🚨 Active Alerts ({unacknowledgedAlerts.length})
            </Text>
            {unacknowledgedAlerts.map(alert => renderAlert(alert, false))}
          </View>
        )}

        {/* Acknowledged Alerts */}
        {acknowledgedAlerts.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              ✅ Acknowledged Alerts ({acknowledgedAlerts.length})
            </Text>
            {acknowledgedAlerts.slice(0, 5).map(alert => renderAlert(alert, true))}
            {acknowledgedAlerts.length > 5 && (
              <Text style={[styles.moreText, { color: theme.textSecondary }]}>
                And {acknowledgedAlerts.length - 5} more...
              </Text>
            )}
          </View>
        )}

        {/* No Alerts */}
        {alerts.length === 0 && (
          <View style={[styles.noAlertsContainer, { backgroundColor: theme.surface }]}>
            <Text style={styles.noAlertsIcon}>🎉</Text>
            <Text style={[styles.noAlertsTitle, { color: theme.text }]}>
              No Alerts
            </Text>
            <Text style={[styles.noAlertsText, { color: theme.textSecondary }]}>
              Your health metrics are within safe ranges
            </Text>
          </View>
        )}

        {/* Quick Actions */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Quick Actions
          </Text>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('Input')}
          >
            <Text style={[styles.actionButtonText, { color: '#ffffff' }]}>
              📝 Add New Reading
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.secondary }]}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={[styles.actionButtonText, { color: '#ffffff' }]}>
              ⚙️ Adjust Thresholds
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
  scrollContainer: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  alertCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  acknowledgedAlert: {
    opacity: 0.7,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  alertTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  alertIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertMetric: {
    fontSize: 16,
    fontWeight: '600',
  },
  alertValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  alertBadge: {
    backgroundColor: 'transparent',
  },
  severityText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  alertMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertTime: {
    fontSize: 12,
  },
  acknowledgeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  acknowledgeButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  acknowledgedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  acknowledgedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  noAlertsContainer: {
    margin: 16,
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  noAlertsIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noAlertsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noAlertsText: {
    fontSize: 14,
    textAlign: 'center',
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  moreText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});