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
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { FamilyProvider } from './src/contexts/FamilyContext';
import { ModalProvider } from './src/contexts/ModalContext';
import { ToastProvider } from './src/contexts/ToastContext';
import { ReminderProvider } from './src/contexts/ReminderContext';
import { SettingsProvider } from './src/contexts/SettingsContext';
import { StatusBar } from 'react-native';
import { Colors } from './src/constants/Colors';
import notificationService from './src/services/notificationService';
import globalNotificationService from './src/services/globalNotificationService';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import secureKeyService from './src/services/secureKeyService';
import { migrateKeysToKeychain } from './src/utils/migrateKeys';
// Analytics service removed to fix Firebase issues
import { AppState, AppStateStatus } from 'react-native';


// Import navigation components
import TabNavigator from './src/components/navigation/TabNavigator';
import IndexScreen from './src/screens/index';

// Import individual screens for quick actions
import SearchScreen from './src/screens/search';
import CalendarScreen from './src/screens/calendar';
import CategoriesScreen from './src/screens/categories';
import FamilyScreen from './src/screens/family';
import ListsScreen from './src/screens/lists';
import ListDetailScreen from './src/screens/list-detail';
import RemindersDetailScreen from './src/screens/reminders-detail';
import EditReminderScreen from './src/screens/edit-reminder';
import CountdownScreen from './src/screens/countdown';
import LoginScreen from './src/screens/login';
import SignupScreen from './src/screens/signup';
import ForgotPasswordScreen from './src/screens/forgot-password';
import NotificationTestScreen from './src/screens/NotificationTestScreen';

const Stack = createNativeStackNavigator();

function AppContent() {
  const { theme } = useTheme();
  const { isLoading, user } = useAuth();
  const colors = Colors[theme];



  // Initialize notifications when app starts
  useEffect(() => {
    const initNotifications = async () => {
      try {
        // Initialize secure key service first
        await secureKeyService.initialize();
        
        // Run key migration (this will only run once)
        await migrateKeysToKeychain();
        
        // Initialize with a longer timeout and better error handling
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Notification initialization timeout')), 30000); // Increased to 30 seconds
        });
        
        await Promise.race([
          notificationService.initialize(),
          timeoutPromise
        ]);

        // Initialize global notification service
        await globalNotificationService.initialize();

        // Start background reminder checking
        notificationService.startBackgroundReminderChecking();

        // Sync assigned task notifications when app starts
        // This ensures that if the user was assigned tasks while the app was closed,
        // notifications are properly scheduled when they open the app
        setTimeout(async () => {
          try {
            await notificationService.syncAssignedTaskNotifications();
          } catch (error) {
            console.error('Error syncing assigned task notifications:', error);
          }
        }, 5000); // Delay sync to ensure user is authenticated and data is loaded
      } catch (error) {
        // Failed to initialize push notifications
        
        // Try to initialize local notifications only (without FCM)
        try {
          notificationService.initializeLocalNotificationsOnly();
          await globalNotificationService.initialize();
        } catch (localError) {
          // Failed to initialize local notifications
        }
        
        // Continue anyway - notifications are not critical for app functionality
      }
    };

    // Delay initialization slightly to ensure Firebase is ready
    const initTimer = setTimeout(() => {
      initNotifications();
    }, 2000);

    // Cleanup on unmount
    return () => {
      clearTimeout(initTimer);
      notificationService.cleanup();
      globalNotificationService.cleanup();
    };
  }, []);

  return (
    <NavigationContainer>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      <ModalProvider>
        {!isLoading && user ? (
          // User is authenticated, show main app
          <Stack.Navigator
          initialRouteName="MainTabs"
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
            name="MainTabs"
            component={TabNavigator}
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
              headerShown: false,
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
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="RemindersDetail"
            component={RemindersDetailScreen}
            options={{
              title: 'Reminders',
              headerBackTitle: 'Back',
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="EditReminder"
            component={EditReminderScreen}
            options={{
              headerShown: false,
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
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Signup"
            component={SignupScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="NotificationTest"
            component={NotificationTestScreen}
            options={{
              title: 'Test Notifications',
              headerBackTitle: 'Back',
              headerShadowVisible: false,
            }}
          />
        </Stack.Navigator>
      ) : (
        // User is not authenticated or still loading, show auth screens
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
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Signup"
            component={SignupScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      )}
      </ModalProvider>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <FamilyProvider>
              <ReminderProvider>
                <SettingsProvider>
                    <ToastProvider>
                      <StatusBar barStyle="dark-content" />
                      <AppContent />
                    </ToastProvider>
                </SettingsProvider>
              </ReminderProvider>
            </FamilyProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
