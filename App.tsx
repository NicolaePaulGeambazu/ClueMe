/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import '@react-native-firebase/app';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { FamilyProvider } from './src/contexts/FamilyContext';
import { StatusBar } from 'react-native';

// Import layout components
import RootLayout from './src/app/_layout';
import AuthLayout from './src/app/(auth)/_layout';
import TabLayout from './src/app/(tabs)/_layout';

// Import individual screens for direct navigation
import SearchScreen from './src/app/(tabs)/search';
import CalendarScreen from './src/app/(tabs)/calendar';
import CategoriesScreen from './src/app/(tabs)/categories';
import FamilyScreen from './src/app/(tabs)/family';
import ProfileScreen from './src/app/(tabs)/profile';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <FamilyProvider>
          <NavigationContainer>
            <StatusBar barStyle="dark-content" />
            <Stack.Navigator>
              <Stack.Screen 
                name="Root" 
                component={RootLayout} 
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
                  headerBackTitle: 'Back'
                }}
              />
              <Stack.Screen 
                name="Calendar" 
                component={CalendarScreen} 
                options={{ 
                  title: 'Calendar',
                  headerBackTitle: 'Back'
                }}
              />
              <Stack.Screen 
                name="Categories" 
                component={CategoriesScreen} 
                options={{ 
                  title: 'Categories',
                  headerBackTitle: 'Back'
                }}
              />
              <Stack.Screen 
                name="Family" 
                component={FamilyScreen} 
                options={{ 
                  title: 'Family',
                  headerBackTitle: 'Back'
                }}
              />
              <Stack.Screen 
                name="Profile" 
                component={ProfileScreen} 
                options={{ 
                  title: 'Profile',
                  headerBackTitle: 'Back'
                }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </FamilyProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
