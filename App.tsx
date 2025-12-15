import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { AuthProvider, useAuth } from './context/AuthContext';
import HomeScreen from './screens/HomeScreen';
import ReportsScreen from './screens/ReportsScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Auth Stack (Giriş yapmamış kullanıcılar için)
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// Main Tab Navigator (Giriş yapmış kullanıcılar için)
function MainTabs() {
  const { logout, userData } = useAuth();

  return (
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
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>
                Merhaba, {userData?.displayName || 'Kullanıcı'} 👋
              </Text>
            </View>
          ),
          headerRight: () => (
            <TouchableOpacity 
              onPress={logout}
              style={{ marginRight: 16, padding: 8 }}
            >
              <Text style={{ fontSize: 20 }}>🚪</Text>
            </TouchableOpacity>
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
          headerRight: () => (
            <TouchableOpacity 
              onPress={logout}
              style={{ marginRight: 16, padding: 8 }}
            >
              <Text style={{ fontSize: 20 }}>🚪</Text>
            </TouchableOpacity>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Navigation Controller
function Navigation() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ color: '#94A3B8', marginTop: 16, fontSize: 16 }}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style={user ? "light" : "light"} />
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  );
}
