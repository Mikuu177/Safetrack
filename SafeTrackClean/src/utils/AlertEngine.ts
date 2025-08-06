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

  // Default thresholds for common conditions with personalization
  static getDefaultThresholds(
    userId: number, 
    conditions: string[], 
    age?: number, 
    gender?: 'male' | 'female' | 'other'
  ): Omit<Threshold, 'id'>[] {
    const thresholds: Omit<Threshold, 'id'>[] = [];

    // Calculate personalized base ranges
    const personalizedRanges = this.calculatePersonalizedRanges(age, gender);

    // Basic safe ranges adjusted for age and gender
    thresholds.push(
      {
        userId,
        metricName: 'heart_rate',
        minValue: personalizedRanges.heartRate.min,
        maxValue: personalizedRanges.heartRate.max,
        isActive: true
      },
      {
        userId,
        metricName: 'bp_systolic',
        minValue: personalizedRanges.bloodPressure.systolic.min,
        maxValue: personalizedRanges.bloodPressure.systolic.max,
        isActive: true
      },
      {
        userId,
        metricName: 'bp_diastolic',
        minValue: personalizedRanges.bloodPressure.diastolic.min,
        maxValue: personalizedRanges.bloodPressure.diastolic.max,
        isActive: true
      }
    );

    // Adjust thresholds based on medical conditions
    if (conditions.includes('hypertension')) {
      // More restrictive blood pressure limits
      const systolicThreshold = thresholds.find(t => t.metricName === 'bp_systolic');
      const diastolicThreshold = thresholds.find(t => t.metricName === 'bp_diastolic');
      
      if (systolicThreshold) systolicThreshold.maxValue = Math.min(systolicThreshold.maxValue, 130);
      if (diastolicThreshold) diastolicThreshold.maxValue = Math.min(diastolicThreshold.maxValue, 80);
    }

    if (conditions.includes('cardiovascular') || conditions.includes('heart_disease')) {
      // More restrictive heart rate limits
      const heartRateThreshold = thresholds.find(t => t.metricName === 'heart_rate');
      if (heartRateThreshold) heartRateThreshold.maxValue = Math.min(heartRateThreshold.maxValue, 130);
    }

    if (conditions.includes('asthma')) {
      // Slightly more restrictive for respiratory conditions
      const heartRateThreshold = thresholds.find(t => t.metricName === 'heart_rate');
      if (heartRateThreshold) heartRateThreshold.maxValue = Math.min(heartRateThreshold.maxValue, 140);
    }

    if (conditions.includes('diabetes')) {
      // Diabetes can affect cardiovascular health
      const systolicThreshold = thresholds.find(t => t.metricName === 'bp_systolic');
      if (systolicThreshold) systolicThreshold.maxValue = Math.min(systolicThreshold.maxValue, 135);
    }

    return thresholds;
  }

  // Calculate personalized ranges based on age and gender
  // Based on American Heart Association guidelines and medical research
  private static calculatePersonalizedRanges(age?: number, gender?: 'male' | 'female' | 'other') {
    // Default ranges based on AHA guidelines (2020)
    // Reference: American Heart Association. Target Heart Rates Chart. 2020.
    let heartRateMin = 60;
    let heartRateMax = 150;
    // Blood pressure ranges based on 2017 AHA/ACC Guidelines
    // Reference: Whelton, P.K. et al. (2018). 2017 AHA/ACC Guideline for High Blood Pressure
    let systolicMin = 90;
    let systolicMax = 140;
    let diastolicMin = 60;
    let diastolicMax = 90;

    // Age-based adjustments based on physiological research
    // Reference: Tanaka, H. et al. (2001). Age-predicted maximal heart rate revisited. JACC.
    if (age) {
      if (age >= 65) {
        // Elderly: age-related cardiovascular changes (Strait & Lakatta, 2012)
        heartRateMax = 130; // Reduced maximum heart rate capacity
        systolicMax = 150;   // Slightly higher acceptable systolic (isolated systolic hypertension)
        diastolicMax = 95;
      } else if (age >= 40) {
        // Middle-aged: moderate adjustments
        heartRateMax = 140;
        systolicMax = 145;
      } else if (age < 25) {
        // Young adults: can handle higher heart rates
        heartRateMax = 160;
      }
    }

    // Gender-based adjustments based on cardiovascular research
    // Reference: Vaidya, A. & Forman, J.P. (2018). Hypertension in women. Biology of Sex Differences.
    if (gender === 'female') {
      // Women: higher baseline heart rate (Koenig & Thayer, 2016)
      heartRateMin = 65;
      heartRateMax += 5;
      // Pre-menopausal women: lower baseline blood pressure
      systolicMax -= 5;
      diastolicMax -= 2;
    } else if (gender === 'male') {
      // Men typically have slightly higher blood pressure
      systolicMax += 5;
    }

    return {
      heartRate: {
        min: heartRateMin,
        max: heartRateMax
      },
      bloodPressure: {
        systolic: {
          min: systolicMin,
          max: systolicMax
        },
        diastolic: {
          min: diastolicMin,
          max: diastolicMax
        }
      }
    };
  }
}

export default AlertEngine;