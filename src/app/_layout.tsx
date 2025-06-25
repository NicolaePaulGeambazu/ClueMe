import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';

// Import screens
import IndexScreen from './index';
import NotFoundScreen from './+not-found';

const Stack = createNativeStackNavigator();

export default function RootLayout() {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Index" component={IndexScreen} />
        <Stack.Screen name="NotFound" component={NotFoundScreen} />
      </Stack.Navigator>
    </>
  );
} 