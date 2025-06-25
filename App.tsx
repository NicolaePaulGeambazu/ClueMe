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
            </Stack.Navigator>
          </NavigationContainer>
        </FamilyProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
