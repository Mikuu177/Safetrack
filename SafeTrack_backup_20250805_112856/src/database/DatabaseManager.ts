import SQLite from 'react-native-sqlite-storage';

// Enable promise for SQLite
SQLite.enablePromise(true);

export interface Database {
  executeSql: (sql: string, params?: any[]) => Promise<any>;
  transaction: (txFunction: (tx: any) => void) => Promise<any>;
  close: () => Promise<void>;
}

class DatabaseManager {
  private static instance: DatabaseManager;
  private database: Database | null = null;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async initDatabase(): Promise<Database> {
    if (this.database) {
      return this.database;
    }

    try {
      this.database = await SQLite.openDatabase({
        name: 'SafeTrack.db',
        location: 'default',
      });

      await this.createTables();
      return this.database;
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.database) return;

    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        gender TEXT NOT NULL,
        medical_conditions TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createHealthRecordsTable = `
      CREATE TABLE IF NOT EXISTS health_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        heart_rate INTEGER NOT NULL,
        blood_pressure_systolic INTEGER NOT NULL,
        blood_pressure_diastolic INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        exercise_type TEXT,
        duration INTEGER,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
    `;

    const createThresholdsTable = `
      CREATE TABLE IF NOT EXISTS thresholds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        metric_name TEXT NOT NULL,
        min_value REAL NOT NULL,
        max_value REAL NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
    `;

    const createAlertsTable = `
      CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        metric_name TEXT NOT NULL,
        triggered_value REAL NOT NULL,
        threshold_value REAL NOT NULL,
        alert_message TEXT NOT NULL,
        severity_level TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_acknowledged BOOLEAN DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
    `;

    try {
      await this.database.executeSql(createUsersTable);
      await this.database.executeSql(createHealthRecordsTable);
      await this.database.executeSql(createThresholdsTable);
      await this.database.executeSql(createAlertsTable);
      
      console.log('All tables created successfully');
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  public async getDatabase(): Promise<Database> {
    if (!this.database) {
      return await this.initDatabase();
    }
    return this.database;
  }

  public async closeDatabase(): Promise<void> {
    if (this.database) {
      await this.database.close();
      this.database = null;
    }
  }
}

export default DatabaseManager;