/**
 * SafeTrack - Health Monitoring App
 * Mobile health tracking application for individuals with chronic conditions
 *
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import { AppProvider, useApp } from './src/contexts/AppContext';
import AppNavigator from './src/components/AppNavigator';
import UserSetupScreen from './src/screens/UserSetupScreen';
import DatabaseManager from './src/database/DatabaseManager';

function AppContent() {
  const { isDarkMode, isLoading, error, isUserSetupComplete } = useApp();

  useEffect(() => {
    // Initialize database on app start
    const initDb = async () => {
      try {
        await DatabaseManager.getInstance().initDatabase();
        console.log('Database initialized successfully');
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };

    initDb();
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <Text style={styles.loadingText}>Loading SafeTrack...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  // Show user setup screen if setup is not complete
  if (!isUserSetupComplete) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <UserSetupScreen />
      </View>
    );
  }

  // Show main app after setup is complete
  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppNavigator />
    </View>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginHorizontal: 20,
  },
});

export default App;
