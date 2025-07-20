export interface User {
  id: number;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  medicalConditions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface HealthRecord {
  id: number;
  userId: number;
  heartRate: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  timestamp: string;
  exerciseType?: string;
  duration?: number;
}

export interface Threshold {
  id: number;
  userId: number;
  metricName: 'heart_rate' | 'bp_systolic' | 'bp_diastolic';
  minValue: number;
  maxValue: number;
  isActive: boolean;
}

export interface Alert {
  id: number;
  userId: number;
  metricName: string;
  triggeredValue: number;
  thresholdValue: number;
  alertMessage: string;
  severityLevel: 'low' | 'medium' | 'high';
  timestamp: string;
  isAcknowledged: boolean;
}

export interface AppContextType {
  user: User | null;
  healthRecords: HealthRecord[];
  thresholds: Threshold[];
  alerts: Alert[];
  isDarkMode: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  addHealthRecord: (record: Omit<HealthRecord, 'id' | 'timestamp'>) => void;
  updateThresholds: (thresholds: Threshold[]) => void;
  acknowledgeAlert: (alertId: number) => void;
  toggleTheme: () => void;
}