import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import ReportsScreen from './screens/ReportsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#4A90E2',
          tabBarInactiveTintColor: '#94A3B8',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 2,
            borderTopColor: '#E2E8F0',
            height: 70,
            paddingBottom: 12,
            paddingTop: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 10,
          },
          tabBarLabelStyle: {
            fontSize: 13,
            fontWeight: '700',
            letterSpacing: 0.3,
            marginTop: 4,
          },
          headerStyle: {
            backgroundColor: '#4A90E2',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
            height: 100,
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: '800',
            fontSize: 22,
            letterSpacing: 0.5,
          },
        }}
      >
        <Tab.Screen 
          name="Ana Sayfa" 
          component={HomeScreen}
          options={{
            tabBarLabel: 'Zamanlayıcı',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 24 }}>⏱️</Text>
            ),
          }}
        />
        <Tab.Screen 
          name="Raporlar" 
          component={ReportsScreen}
          options={{
            tabBarLabel: 'Raporlar',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 24 }}>📊</Text>
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
