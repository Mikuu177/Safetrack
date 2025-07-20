import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { lightTheme, darkTheme } from '../utils/theme';

import HomeScreen from '../screens/HomeScreen';
import InputScreen from '../screens/InputScreen';
import AlertScreen from '../screens/AlertScreen';
import TrendsScreen from '../screens/TrendsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const TabIcon = ({ name, focused, color }: { name: string; focused: boolean; color: string }) => {
  const getIcon = () => {
    switch (name) {
      case 'Home':
        return focused ? '🏠' : '🏡';
      case 'Input':
        return focused ? '📝' : '✏️';
      case 'Alerts':
        return focused ? '🚨' : '⚠️';
      case 'Trends':
        return focused ? '📊' : '📈';
      case 'Settings':
        return focused ? '⚙️' : '🔧';
      default:
        return '📱';
    }
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 4 }}>
      <Text style={{ fontSize: 20 }}>{getIcon()}</Text>
    </View>
  );
};

export default function AppNavigator() {
  const { alerts, isDarkMode } = useApp();
  const theme = isDarkMode ? darkTheme : lightTheme;
  
  const unacknowledgedAlerts = alerts.filter(alert => !alert.isAcknowledged);

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={route.name} focused={focused} color={color} />
          ),
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textSecondary,
          tabBarStyle: {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            paddingTop: 4,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            paddingBottom: 4,
          },
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            tabBarLabel: 'Home',
          }}
        />
        <Tab.Screen 
          name="Input" 
          component={InputScreen}
          options={{
            tabBarLabel: 'Add Data',
          }}
        />
        <Tab.Screen 
          name="Alerts" 
          component={AlertScreen}
          options={{
            tabBarLabel: 'Alerts',
            tabBarBadge: unacknowledgedAlerts.length > 0 ? unacknowledgedAlerts.length : undefined,
            tabBarBadgeStyle: {
              backgroundColor: theme.error,
              color: '#ffffff',
              fontSize: 10,
              minWidth: 16,
              height: 16,
            },
          }}
        />
        <Tab.Screen 
          name="Trends" 
          component={TrendsScreen}
          options={{
            tabBarLabel: 'Trends',
          }}
        />
        <Tab.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{
            tabBarLabel: 'Settings',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}