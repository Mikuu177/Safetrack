import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppContextType, User, HealthRecord, Threshold, Alert } from '../types';
import DatabaseService from '../database/DatabaseService';
import AlertEngine from '../utils/AlertEngine';

interface AppState {
  user: User | null;
  healthRecords: HealthRecord[];
  thresholds: Threshold[];
  alerts: Alert[];
  isDarkMode: boolean;
  isLoading: boolean;
  error: string | null;
  isUserSetupComplete: boolean;
}

type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_HEALTH_RECORDS'; payload: HealthRecord[] }
  | { type: 'ADD_HEALTH_RECORD'; payload: HealthRecord }
  | { type: 'SET_THRESHOLDS'; payload: Threshold[] }
  | { type: 'SET_ALERTS'; payload: Alert[] }
  | { type: 'ADD_ALERT'; payload: Alert }
  | { type: 'ACKNOWLEDGE_ALERT'; payload: number }
  | { type: 'TOGGLE_THEME' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER_SETUP_COMPLETE'; payload: boolean };

const initialState: AppState = {
  user: null,
  healthRecords: [],
  thresholds: [],
  alerts: [],
  isDarkMode: false,
  isLoading: false,
  error: null,
  isUserSetupComplete: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_HEALTH_RECORDS':
      return { ...state, healthRecords: action.payload };
    case 'ADD_HEALTH_RECORD':
      return { 
        ...state, 
        healthRecords: [action.payload, ...state.healthRecords] 
      };
    case 'SET_THRESHOLDS':
      return { ...state, thresholds: action.payload };
    case 'SET_ALERTS':
      return { ...state, alerts: action.payload };
    case 'ADD_ALERT':
      return { 
        ...state, 
        alerts: [action.payload, ...state.alerts] 
      };
    case 'ACKNOWLEDGE_ALERT':
      return {
        ...state,
        alerts: state.alerts.map(alert =>
          alert.id === action.payload
            ? { ...alert, isAcknowledged: true }
            : alert
        ),
      };
    case 'TOGGLE_THEME':
      return { ...state, isDarkMode: !state.isDarkMode };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_USER_SETUP_COMPLETE':
      return { ...state, isUserSetupComplete: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const dbService = DatabaseService.getInstance();
  const alertEngine = AlertEngine.getInstance();

  // Initialize user data on app start
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Check if user exists
      const user = await dbService.getUserById(1);
      
      if (user) {
        dispatch({ type: 'SET_USER', payload: user });
        dispatch({ type: 'SET_USER_SETUP_COMPLETE', payload: true });
        await loadUserData(user.id);
      } else {
        // No user exists, need to show setup screen
        dispatch({ type: 'SET_USER_SETUP_COMPLETE', payload: false });
      }
    } catch (error) {
      console.error('Error initializing app:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize app' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadUserData = async (userId: number) => {
    try {
      const [healthRecords, thresholds, alerts] = await Promise.all([
        dbService.getHealthRecordsByUserId(userId),
        dbService.getThresholdsByUserId(userId),
        dbService.getAlertsByUserId(userId),
      ]);

      dispatch({ type: 'SET_HEALTH_RECORDS', payload: healthRecords });
      dispatch({ type: 'SET_THRESHOLDS', payload: thresholds });
      dispatch({ type: 'SET_ALERTS', payload: alerts });
    } catch (error) {
      console.error('Error loading user data:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load user data' });
    }
  };

  const createUserProfile = async (profile: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Create user in database
      const userId = await dbService.createUser(profile);
      
      // Create personalized thresholds based on user profile
      const defaultThresholds = AlertEngine.getDefaultThresholds(
        userId, 
        profile.medicalConditions,
        profile.age,
        profile.gender
      );
      
      for (const threshold of defaultThresholds) {
        await dbService.createThreshold(threshold);
      }
      
      // Load the created user
      const user = await dbService.getUserById(userId);
      if (user) {
        dispatch({ type: 'SET_USER', payload: user });
        dispatch({ type: 'SET_USER_SETUP_COMPLETE', payload: true });
        await loadUserData(user.id);
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create user profile' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const setUser = (user: User | null) => {
    dispatch({ type: 'SET_USER', payload: user });
    if (user) {
      loadUserData(user.id);
    }
  };

  const addHealthRecord = async (record: Omit<HealthRecord, 'id' | 'timestamp'>) => {
    try {
      if (!state.user) return;

      const recordId = await dbService.addHealthRecord(record);
      const fullRecord: HealthRecord = {
        ...record,
        id: recordId,
        timestamp: new Date().toISOString(),
      };

      dispatch({ type: 'ADD_HEALTH_RECORD', payload: fullRecord });

      // Check thresholds and create alerts if needed
      const thresholdResult = await alertEngine.checkThresholds(state.user.id, fullRecord);
      
      // Reload alerts to get the latest ones
      const alerts = await dbService.getAlertsByUserId(state.user.id);
      dispatch({ type: 'SET_ALERTS', payload: alerts });

    } catch (error) {
      console.error('Error adding health record:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save health record' });
    }
  };

  const updateThresholds = async (newThresholds: Threshold[]) => {
    try {
      if (!state.user) return;

      // Update thresholds in database
      for (const threshold of newThresholds) {
        if (threshold.id) {
          await dbService.updateThreshold(threshold.id, threshold);
        } else {
          await dbService.createThreshold(threshold);
        }
      }

      // Reload thresholds from database
      const updatedThresholds = await dbService.getThresholdsByUserId(state.user.id);
      dispatch({ type: 'SET_THRESHOLDS', payload: updatedThresholds });
    } catch (error) {
      console.error('Error updating thresholds:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update thresholds' });
    }
  };

  const acknowledgeAlert = async (alertId: number) => {
    try {
      await dbService.acknowledgeAlert(alertId);
      dispatch({ type: 'ACKNOWLEDGE_ALERT', payload: alertId });
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to acknowledge alert' });
    }
  };

  const toggleTheme = () => {
    dispatch({ type: 'TOGGLE_THEME' });
  };

  const contextValue: AppContextType = {
    ...state,
    setUser,
    addHealthRecord,
    updateThresholds,
    acknowledgeAlert,
    toggleTheme,
    createUserProfile,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}