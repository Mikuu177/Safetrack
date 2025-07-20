import { HealthRecord, Threshold, Alert } from '../types';
import DatabaseService from '../database/DatabaseService';

export interface ThresholdCheckResult {
  isViolated: boolean;
  alerts: Omit<Alert, 'id' | 'timestamp' | 'isAcknowledged'>[];
}

class AlertEngine {
  private static instance: AlertEngine;
  private dbService: DatabaseService;

  private constructor() {
    this.dbService = DatabaseService.getInstance();
  }

  public static getInstance(): AlertEngine {
    if (!AlertEngine.instance) {
      AlertEngine.instance = new AlertEngine();
    }
    return AlertEngine.instance;
  }

  async checkThresholds(userId: number, healthRecord: HealthRecord): Promise<ThresholdCheckResult> {
    const thresholds = await this.dbService.getThresholdsByUserId(userId);
    const alerts: Omit<Alert, 'id' | 'timestamp' | 'isAcknowledged'>[] = [];

    for (const threshold of thresholds) {
      const violation = this.checkSingleThreshold(healthRecord, threshold);
      if (violation) {
        alerts.push(violation);
      }
    }

    // Save alerts to database
    for (const alert of alerts) {
      await this.dbService.createAlert(alert);
    }

    return {
      isViolated: alerts.length > 0,
      alerts
    };
  }

  private checkSingleThreshold(
    healthRecord: HealthRecord, 
    threshold: Threshold
  ): Omit<Alert, 'id' | 'timestamp' | 'isAcknowledged'> | null {
    let value: number;
    let metricDisplayName: string;

    switch (threshold.metricName) {
      case 'heart_rate':
        value = healthRecord.heartRate;
        metricDisplayName = 'Heart Rate';
        break;
      case 'bp_systolic':
        value = healthRecord.bloodPressureSystolic;
        metricDisplayName = 'Systolic Blood Pressure';
        break;
      case 'bp_diastolic':
        value = healthRecord.bloodPressureDiastolic;
        metricDisplayName = 'Diastolic Blood Pressure';
        break;
      default:
        return null;
    }

    // Check if value is outside threshold range
    if (value < threshold.minValue || value > threshold.maxValue) {
      const severityLevel = this.calculateSeverityLevel(value, threshold);
      const alertMessage = this.generateAlertMessage(metricDisplayName, value, threshold, severityLevel);

      return {
        userId: healthRecord.userId,
        metricName: metricDisplayName,
        triggeredValue: value,
        thresholdValue: value < threshold.minValue ? threshold.minValue : threshold.maxValue,
        alertMessage,
        severityLevel
      };
    }

    return null;
  }

  private calculateSeverityLevel(value: number, threshold: Threshold): 'low' | 'medium' | 'high' {
    const range = threshold.maxValue - threshold.minValue;
    const deviation = Math.abs(value < threshold.minValue 
      ? threshold.minValue - value 
      : value - threshold.maxValue);

    const deviationPercentage = (deviation / range) * 100;

    if (deviationPercentage >= 50) {
      return 'high';
    } else if (deviationPercentage >= 25) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private generateAlertMessage(
    metricName: string,
    value: number,
    threshold: Threshold,
    severity: 'low' | 'medium' | 'high'
  ): string {
    const isHigh = value > threshold.maxValue;
    const direction = isHigh ? 'above' : 'below';
    const safeRange = `${threshold.minValue}-${threshold.maxValue}`;

    switch (severity) {
      case 'high':
        return `⚠️ CRITICAL: ${metricName} is ${value}, significantly ${direction} safe range (${safeRange}). Stop exercise immediately and seek medical attention if needed.`;
      case 'medium':
        return `⚠️ WARNING: ${metricName} is ${value}, ${direction} safe range (${safeRange}). Reduce exercise intensity and monitor closely.`;
      case 'low':
        return `⚠️ CAUTION: ${metricName} is ${value}, slightly ${direction} safe range (${safeRange}). Consider reducing exercise intensity.`;
      default:
        return `${metricName} is ${value}, outside safe range (${safeRange}).`;
    }
  }

  // Default thresholds for common conditions
  static getDefaultThresholds(userId: number, conditions: string[]): Omit<Threshold, 'id'>[] {
    const thresholds: Omit<Threshold, 'id'>[] = [];

    // Basic safe ranges for general population
    thresholds.push(
      {
        userId,
        metricName: 'heart_rate',
        minValue: 60,
        maxValue: 150,
        isActive: true
      },
      {
        userId,
        metricName: 'bp_systolic',
        minValue: 90,
        maxValue: 140,
        isActive: true
      },
      {
        userId,
        metricName: 'bp_diastolic',
        minValue: 60,
        maxValue: 90,
        isActive: true
      }
    );

    // Adjust thresholds based on medical conditions
    if (conditions.includes('hypertension')) {
      // More restrictive blood pressure limits
      const systolicThreshold = thresholds.find(t => t.metricName === 'bp_systolic');
      const diastolicThreshold = thresholds.find(t => t.metricName === 'bp_diastolic');
      
      if (systolicThreshold) systolicThreshold.maxValue = 130;
      if (diastolicThreshold) diastolicThreshold.maxValue = 80;
    }

    if (conditions.includes('cardiovascular disease')) {
      // More restrictive heart rate limits
      const heartRateThreshold = thresholds.find(t => t.metricName === 'heart_rate');
      if (heartRateThreshold) heartRateThreshold.maxValue = 130;
    }

    if (conditions.includes('asthma')) {
      // Slightly more restrictive for respiratory conditions
      const heartRateThreshold = thresholds.find(t => t.metricName === 'heart_rate');
      if (heartRateThreshold) heartRateThreshold.maxValue = 140;
    }

    return thresholds;
  }
}

export default AlertEngine;