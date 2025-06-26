/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import '@react-native-firebase/app';
import './src/i18n'; // Initialize i18n
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { FamilyProvider } from './src/contexts/FamilyContext';
import { StatusBar } from 'react-native';
import { Colors } from './src/constants/Colors';

// Import layout components
import AuthLayout from './src/app/(auth)/_layout';
import TabLayout from './src/app/(tabs)/_layout';
import IndexScreen from './src/app/index';

// Import individual screens for quick actions
import SearchScreen from './src/app/(tabs)/search';
import CalendarScreen from './src/app/(tabs)/calendar';
import CategoriesScreen from './src/app/(tabs)/categories';
import FamilyScreen from './src/app/(tabs)/family';

const Stack = createNativeStackNavigator();

function AppContent() {
  const { theme } = useTheme();
  const colors = Colors[theme];

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
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <FamilyProvider>
          <AppContent />
        </FamilyProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
