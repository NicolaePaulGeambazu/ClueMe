/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import '@react-native-firebase/app';
import './src/i18n'; // Initialize i18n
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { FamilyProvider } from './src/contexts/FamilyContext';
import { StatusBar } from 'react-native';
import { Colors } from './src/constants/Colors';
import { notificationService } from './src/services/notificationService';

// Import layout components
import AuthLayout from './src/app/(auth)/_layout';
import TabLayout from './src/app/(tabs)/_layout';
import IndexScreen from './src/app/index';

// Import individual screens for quick actions
import SearchScreen from './src/app/(tabs)/search';
import CalendarScreen from './src/app/(tabs)/calendar';
import CategoriesScreen from './src/app/(tabs)/categories';
import FamilyScreen from './src/app/(tabs)/family';
import ListsScreen from './src/app/(tabs)/lists';
import ListDetailScreen from './src/app/(tabs)/list-detail';
import CountdownScreen from './src/app/(tabs)/countdown';

const Stack = createNativeStackNavigator();

function AppContent() {
  const { theme } = useTheme();
  const colors = Colors[theme];

  // Initialize notifications when app starts
  useEffect(() => {
    const initNotifications = async () => {
      try {
        console.log('🔔 Initializing push notifications...');
        await notificationService.initialize();
        console.log('✅ Push notifications initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize push notifications:', error);
      }
    };

    initNotifications();

    // Cleanup on unmount
    return () => {
      notificationService.cleanup();
    };
  }, []);

  return (
    <NavigationContainer>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      <Stack.Navigator 
        initialRouteName="Index"
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            color: colors.text,
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen 
          name="Index" 
          component={IndexScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Auth" 
          component={AuthLayout}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="MainTabs" 
          component={TabLayout}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Search" 
          component={SearchScreen} 
          options={{ 
            title: 'Search',
            headerBackTitle: 'Back',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen 
          name="Calendar" 
          component={CalendarScreen} 
          options={{ 
            title: 'Calendar',
            headerBackTitle: 'Back',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen 
          name="Categories" 
          component={CategoriesScreen} 
          options={{ 
            title: 'Categories',
            headerBackTitle: 'Back',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen 
          name="Family" 
          component={FamilyScreen} 
          options={{ 
            title: 'Family',
            headerBackTitle: 'Back',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen 
          name="Lists" 
          component={ListsScreen} 
          options={{ 
            title: 'Lists',
            headerBackTitle: 'Back',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen 
          name="ListDetail" 
          component={ListDetailScreen} 
          options={{ 
            title: 'List Detail',
            headerBackTitle: 'Back',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen 
          name="Countdown" 
          component={CountdownScreen} 
          options={{ 
            title: 'Countdown',
            headerBackTitle: 'Back',
            headerShadowVisible: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider>
          <FamilyProvider>
            <AppContent />
          </FamilyProvider>
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
