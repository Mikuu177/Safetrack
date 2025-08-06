import DatabaseManager from './DatabaseManager';
import { User, HealthRecord, Threshold, Alert } from '../types';

class DatabaseService {
  private static instance: DatabaseService;
  private dbManager: DatabaseManager;

  private constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // User operations
  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const db = await this.dbManager.getDatabase();
    const result = await db.executeSql(
      'INSERT INTO users (name, age, gender, medical_conditions) VALUES (?, ?, ?, ?)',
      [user.name, user.age, user.gender, JSON.stringify(user.medicalConditions)]
    );
    return result[0].insertId;
  }

  async getUserById(id: number): Promise<User | null> {
    const db = await this.dbManager.getDatabase();
    const result = await db.executeSql('SELECT * FROM users WHERE id = ?', [id]);
    
    if (result[0].rows.length > 0) {
      const row = result[0].rows.item(0);
      return {
        id: row.id,
        name: row.name,
        age: row.age,
        gender: row.gender,
        medicalConditions: JSON.parse(row.medical_conditions || '[]'),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }
    return null;
  }

  async updateUser(id: number, user: Partial<User>): Promise<void> {
    const db = await this.dbManager.getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (user.name !== undefined) {
      fields.push('name = ?');
      values.push(user.name);
    }
    if (user.age !== undefined) {
      fields.push('age = ?');
      values.push(user.age);
    }
    if (user.gender !== undefined) {
      fields.push('gender = ?');
      values.push(user.gender);
    }
    if (user.medicalConditions !== undefined) {
      fields.push('medical_conditions = ?');
      values.push(JSON.stringify(user.medicalConditions));
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await db.executeSql(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  // Health Records operations
  async addHealthRecord(record: Omit<HealthRecord, 'id' | 'timestamp'>): Promise<number> {
    const db = await this.dbManager.getDatabase();
    const result = await db.executeSql(
      'INSERT INTO health_records (user_id, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, exercise_type, duration) VALUES (?, ?, ?, ?, ?, ?)',
      [record.userId, record.heartRate, record.bloodPressureSystolic, record.bloodPressureDiastolic, record.exerciseType, record.duration]
    );
    return result[0].insertId;
  }

  async getHealthRecordsByUserId(userId: number, limit: number = 50): Promise<HealthRecord[]> {
    const db = await this.dbManager.getDatabase();
    const result = await db.executeSql(
      'SELECT * FROM health_records WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
      [userId, limit]
    );

    const records: HealthRecord[] = [];
    for (let i = 0; i < result[0].rows.length; i++) {
      const row = result[0].rows.item(i);
      records.push({
        id: row.id,
        userId: row.user_id,
        heartRate: row.heart_rate,
        bloodPressureSystolic: row.blood_pressure_systolic,
        bloodPressureDiastolic: row.blood_pressure_diastolic,
        timestamp: row.timestamp,
        exerciseType: row.exercise_type,
        duration: row.duration,
      });
    }
    return records;
  }

  async getLatestHealthRecord(userId: number): Promise<HealthRecord | null> {
    const records = await this.getHealthRecordsByUserId(userId, 1);
    return records.length > 0 ? records[0] : null;
  }

  // Thresholds operations
  async createThreshold(threshold: Omit<Threshold, 'id'>): Promise<number> {
    const db = await this.dbManager.getDatabase();
    const result = await db.executeSql(
      'INSERT INTO thresholds (user_id, metric_name, min_value, max_value, is_active) VALUES (?, ?, ?, ?, ?)',
      [threshold.userId, threshold.metricName, threshold.minValue, threshold.maxValue, threshold.isActive ? 1 : 0]
    );
    return result[0].insertId;
  }

  async getThresholdsByUserId(userId: number): Promise<Threshold[]> {
    const db = await this.dbManager.getDatabase();
    const result = await db.executeSql(
      'SELECT * FROM thresholds WHERE user_id = ? AND is_active = 1',
      [userId]
    );

    const thresholds: Threshold[] = [];
    for (let i = 0; i < result[0].rows.length; i++) {
      const row = result[0].rows.item(i);
      thresholds.push({
        id: row.id,
        userId: row.user_id,
        metricName: row.metric_name,
        minValue: row.min_value,
        maxValue: row.max_value,
        isActive: row.is_active === 1,
      });
    }
    return thresholds;
  }

  async updateThreshold(id: number, threshold: Partial<Threshold>): Promise<void> {
    const db = await this.dbManager.getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (threshold.minValue !== undefined) {
      fields.push('min_value = ?');
      values.push(threshold.minValue);
    }
    if (threshold.maxValue !== undefined) {
      fields.push('max_value = ?');
      values.push(threshold.maxValue);
    }
    if (threshold.isActive !== undefined) {
      fields.push('is_active = ?');
      values.push(threshold.isActive ? 1 : 0);
    }

    values.push(id);

    await db.executeSql(
      `UPDATE thresholds SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  // Alerts operations
  async createAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'isAcknowledged'>): Promise<number> {
    const db = await this.dbManager.getDatabase();
    const result = await db.executeSql(
      'INSERT INTO alerts (user_id, metric_name, triggered_value, threshold_value, alert_message, severity_level) VALUES (?, ?, ?, ?, ?, ?)',
      [alert.userId, alert.metricName, alert.triggeredValue, alert.thresholdValue, alert.alertMessage, alert.severityLevel]
    );
    return result[0].insertId;
  }

  async getAlertsByUserId(userId: number, limit: number = 20): Promise<Alert[]> {
    const db = await this.dbManager.getDatabase();
    const result = await db.executeSql(
      'SELECT * FROM alerts WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
      [userId, limit]
    );

    const alerts: Alert[] = [];
    for (let i = 0; i < result[0].rows.length; i++) {
      const row = result[0].rows.item(i);
      alerts.push({
        id: row.id,
        userId: row.user_id,
        metricName: row.metric_name,
        triggeredValue: row.triggered_value,
        thresholdValue: row.threshold_value,
        alertMessage: row.alert_message,
        severityLevel: row.severity_level,
        timestamp: row.timestamp,
        isAcknowledged: row.is_acknowledged === 1,
      });
    }
    return alerts;
  }

  async acknowledgeAlert(id: number): Promise<void> {
    const db = await this.dbManager.getDatabase();
    await db.executeSql(
      'UPDATE alerts SET is_acknowledged = 1 WHERE id = ?',
      [id]
    );
  }

  async getUnacknowledgedAlerts(userId: number): Promise<Alert[]> {
    const db = await this.dbManager.getDatabase();
    const result = await db.executeSql(
      'SELECT * FROM alerts WHERE user_id = ? AND is_acknowledged = 0 ORDER BY timestamp DESC',
      [userId]
    );

    const alerts: Alert[] = [];
    for (let i = 0; i < result[0].rows.length; i++) {
      const row = result[0].rows.item(i);
      alerts.push({
        id: row.id,
        userId: row.user_id,
        metricName: row.metric_name,
        triggeredValue: row.triggered_value,
        thresholdValue: row.threshold_value,
        alertMessage: row.alert_message,
        severityLevel: row.severity_level,
        timestamp: row.timestamp,
        isAcknowledged: row.is_acknowledged === 1,
      });
    }
    return alerts;
  }
}

export default DatabaseService;