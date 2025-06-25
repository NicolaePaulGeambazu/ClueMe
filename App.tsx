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
import AuthLayout from './src/app/(auth)/_layout';
import TabLayout from './src/app/(tabs)/_layout';
import IndexScreen from './src/app/index';

// Import individual screens for quick actions
import SearchScreen from './src/app/(tabs)/search';
import CalendarScreen from './src/app/(tabs)/calendar';
import CategoriesScreen from './src/app/(tabs)/categories';
import FamilyScreen from './src/app/(tabs)/family';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <FamilyProvider>
          <NavigationContainer>
            <StatusBar barStyle="dark-content" />
            <Stack.Navigator initialRouteName="Index">
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
            </Stack.Navigator>
          </NavigationContainer>
        </FamilyProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
