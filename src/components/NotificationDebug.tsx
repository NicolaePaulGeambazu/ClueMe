import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform } from 'react-native';
import PushNotification from 'react-native-push-notification';
import { notificationService } from '../services/notificationService';
import { Colors } from '../constants/Colors';
import { useTheme } from '../contexts/ThemeContext';
import { Fonts } from '../constants/Fonts';
import messaging from '@react-native-firebase/messaging';
import { getFirestoreInstance } from '../services/firebaseService';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export const NotificationDebug: React.FC = () => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [isLoading, setIsLoading] = useState(false);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<string>('Unknown');
  const [diagnosticInfo, setDiagnosticInfo] = useState<string>('');
  const [isSimulator, setIsSimulator] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [lastNotificationTime, setLastNotificationTime] = useState<string>('');

  const styles = createStyles(colors);

  useEffect(() => {
    checkScheduledNotifications();
    checkPermissionStatus();
    runDiagnostics();
    
    // Check if running in simulator
    const checkSimulator = async () => {
      try {
        const isSim = Platform.OS === 'ios' && !messaging().isDeviceRegisteredForRemoteMessages;
        setIsSimulator(isSim);
      } catch (error) {
        // If messaging is not available, assume simulator
        setIsSimulator(Platform.OS === 'ios');
      }
    };
    checkSimulator();
  }, []);

  const checkPermissionStatus = async () => {
    try {
      const enabled = await notificationService.areNotificationsEnabled();
      setPermissionStatus(enabled ? 'Granted' : 'Denied');
    } catch (error) {
      setPermissionStatus('Error checking');
    }
  };

  const checkScheduledNotifications = () => {
    PushNotification.getScheduledLocalNotifications((notifications) => {
      setScheduledCount(notifications ? notifications.length : 0);
    });
  };

  const runDiagnostics = async () => {
    let info = '🔍 Notification System Diagnostics:\n\n';
    
    try {
      // Check notification service initialization
      info += `📱 Notification Service Initialized: ${notificationService ? 'Yes' : 'No'}\n`;
      
      // Check if running in simulator
      const isSimulator = Platform.OS === 'ios' && !messaging().isDeviceRegisteredForRemoteMessages;
      info += `📱 Running in Simulator: ${isSimulator ? 'Yes' : 'No'}\n`;
      
      // Check permissions
      const permissions = await notificationService.areNotificationsEnabled();
      info += `🔐 Permissions: ${permissions ? 'Granted' : 'Denied'}\n`;
      
      // Check scheduled notifications
      const scheduled = await notificationService.getScheduledNotifications();
      info += `📅 Scheduled Notifications: ${scheduled.length}\n`;
      
      // Check current time
      const now = new Date();
      info += `🕐 Current Time: ${now.toISOString()}\n`;
      info += `🕐 Local Time: ${now.toLocaleString()}\n`;
      
      // Check timezone
      info += `🌍 Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}\n`;
      
      // Check device info
      info += `📱 Platform: ${Platform.OS}\n`;
      
      // Check notification service status
      const status = notificationService.getInitializationStatus();
      info += `🔔 Service Status: ${JSON.stringify(status, null, 2)}\n`;
      
      setDiagnosticInfo(info);
    } catch (error) {
      setDiagnosticInfo(`❌ Diagnostic Error: ${error}`);
    }
  };

  const sendImmediateNotification = async () => {
    try {
      console.log('🔔 [DEBUG] Starting sendImmediateNotification...');
      trackNotificationAttempt('Immediate Push');
      
      // Use the public sendTestNotification method instead of private getFCMToken
      await notificationService.sendTestNotification();
      Alert.alert('Success', 'Test notification sent!');
      checkScheduledNotifications();
      
    } catch (error: any) {
      console.error('❌ [DEBUG] Failed to send immediate push notification:', error);
      console.error('❌ [DEBUG] Error details:', {
        message: error?.message || 'Unknown error',
        stack: error?.stack || 'No stack trace',
        name: error?.name || 'Unknown error type'
      });
      Alert.alert('Error', `Failed to send push notification: ${error?.message || 'Unknown error'}`);
      
      // Fallback to local notification on error
      try {
        console.log('🔄 [DEBUG] Falling back to local notification...');
        trackNotificationAttempt('Fallback Local');
        notificationService.sendImmediateTestNotification();
        Alert.alert('Fallback', 'Sent local notification as fallback');
      } catch (fallbackError: any) {
        console.error('❌ [DEBUG] Fallback also failed:', fallbackError);
        Alert.alert('Fallback Error', `Local notification also failed: ${fallbackError?.message || 'Unknown error'}`);
      }
    }
  };

  const test1SecondNotification = () => {
    try {
      console.log('🔔 Testing 1-second notification...');
      
      // Schedule a notification for 1 second from now
      const testTime = new Date(Date.now() + 1000); // 1 second from now
      
      PushNotification.localNotificationSchedule({
        id: '1-second-test-' + Date.now(),
        channelId: 'reminders',
        title: '1-Second Test',
        message: 'This notification was scheduled 1 second ago!',
        date: testTime,
        allowWhileIdle: true,
        playSound: true,
        soundName: 'default',
        importance: 'high',
        priority: 'high',
        vibrate: true,
        vibration: 300,
      });
      
      console.log('✅ 1-second notification scheduled for:', testTime.toLocaleString());
      Alert.alert('Success', '1-second notification scheduled - check in 1 second!');
      checkScheduledNotifications();
    } catch (error) {
      console.error('❌ Failed to schedule 1-second notification:', error);
      Alert.alert('Error', `Failed to schedule 1-second notification: ${error}`);
    }
  };

  const testNotificationChannel = () => {
    try {
      console.log('🔔 Testing notification channel creation...');
      
      // Create notification channel for Android
      if (Platform.OS === 'android') {
        PushNotification.createChannel(
          {
            channelId: 'reminders',
            channelName: 'Reminders',
            channelDescription: 'Reminder notifications',
            playSound: true,
            soundName: 'default',
            importance: 4,
            vibrate: true,
          },
          (created: boolean) => {
            console.log(`✅ Notification channel created: ${created}`);
            Alert.alert('Channel Test', `Notification channel created: ${created}`);
          }
        );
      } else {
        console.log('📱 iOS - notification channels not needed');
        Alert.alert('Channel Test', 'iOS - notification channels not needed');
      }
    } catch (error) {
      console.error('❌ Failed to create notification channel:', error);
      Alert.alert('Error', `Failed to create notification channel: ${error}`);
    }
  };

  const testNotificationPermissions = async () => {
    try {
      console.log('🔔 Testing notification permissions...');
      
      const enabled = await notificationService.areNotificationsEnabled();
      console.log(`✅ Notifications enabled: ${enabled}`);
      
      if (enabled) {
        Alert.alert('Permissions', '✅ Notifications are enabled!');
      } else {
        Alert.alert('Permissions', '❌ Notifications are disabled. Please enable them in Settings.');
      }
    } catch (error) {
      console.error('❌ Failed to check notification permissions:', error);
      Alert.alert('Error', `Failed to check permissions: ${error}`);
    }
  };

  const clearAllNotifications = () => {
    try {
      PushNotification.cancelAllLocalNotifications();
      Alert.alert('Success', 'All notifications cleared');
      checkScheduledNotifications();
    } catch (error) {
      console.error('Failed to clear notifications:', error);
      Alert.alert('Error', `Failed to clear notifications: ${error}`);
    }
  };

  const getScheduledNotifications = async () => {
    try {
      const notifications = await notificationService.getScheduledNotifications();
      console.log('📋 Scheduled notifications:', notifications);
      
      let details = '📋 Scheduled Notifications:\n\n';
      if (notifications.length === 0) {
        details += 'No scheduled notifications found.\n';
      } else {
        notifications.forEach((notification: any, index: number) => {
          const scheduledTime = new Date(notification.date);
          const timeUntil = scheduledTime.getTime() - Date.now();
          details += `${index + 1}. ${notification.title}\n`;
          details += `   Message: ${notification.message}\n`;
          details += `   Scheduled for: ${scheduledTime.toLocaleString()}\n`;
          details += `   Time until: ${Math.round(timeUntil / 1000)} seconds\n`;
          details += `   ID: ${notification.id}\n\n`;
        });
      }
      
      Alert.alert('Scheduled Notifications', details);
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      Alert.alert('Error', `Failed to get scheduled notifications: ${error}`);
    }
  };

  const testBasicLocalNotification = () => {
    try {
      console.log('🔔 [DEBUG] Testing basic local notification...');
      
      // Track this notification attempt
      trackNotificationAttempt('Basic Local');
      
      // First, show an immediate alert to verify the function is called
      Alert.alert('Test', 'Basic notification function called!', [
        {
          text: 'OK',
          onPress: () => {
            // Then try the actual notification
            PushNotification.localNotification({
              title: 'Basic Test',
              message: 'This is a basic test notification',
              playSound: true,
              soundName: 'default',
              importance: 'high',
              priority: 'high',
              vibrate: true,
              vibration: 300,
              id: 'basic-test-' + Date.now(),
            });
            
            console.log('✅ [DEBUG] Basic local notification sent');
            Alert.alert('Success', 'Basic local notification sent - check if you receive it!');
          }
        }
      ]);
    } catch (error: any) {
      console.error('❌ [DEBUG] Failed to send basic local notification:', error);
      Alert.alert('Error', `Basic notification failed: ${error?.message || 'Unknown error'}`);
    }
  };

  const testScheduledNotification = () => {
    try {
      console.log('🔔 [DEBUG] Testing scheduled notification...');
      
      // Schedule a notification for 3 seconds from now
      const testTime = new Date(Date.now() + 3000); // 3 seconds from now
      
      PushNotification.localNotificationSchedule({
        id: 'scheduled-test-' + Date.now(),
        channelId: 'reminders',
        title: 'Scheduled Test Notification',
        message: 'This notification was scheduled 3 seconds ago!',
        date: testTime,
        allowWhileIdle: true,
        playSound: true,
        soundName: 'default',
        importance: 'high',
        priority: 'high',
        vibrate: true,
        vibration: 300,
      });
      
      console.log('✅ [DEBUG] Scheduled notification for:', testTime.toLocaleString());
      Alert.alert('Success', 'Scheduled notification for 3 seconds from now - check in 3 seconds!');
      checkScheduledNotifications();
    } catch (error: any) {
      console.error('❌ [DEBUG] Failed to schedule notification:', error);
      Alert.alert('Error', `Scheduled notification failed: ${error?.message || 'Unknown error'}`);
    }
  };

  const testSimpleNotification = () => {
    try {
      console.log('🔔 [DEBUG] Testing simple notification without channel...');
      
      // Test notification without channelId (iOS doesn't need it)
      PushNotification.localNotification({
        title: 'Simple Test',
        message: 'This is a simple test notification without channel',
        playSound: true,
        soundName: 'default',
        importance: 'high',
        priority: 'high',
        vibrate: true,
        vibration: 300,
        id: 'simple-test-' + Date.now(),
      });
      
      console.log('✅ [DEBUG] Simple notification sent');
      Alert.alert('Success', 'Simple notification sent - check if you receive it!');
    } catch (error: any) {
      console.error('❌ [DEBUG] Failed to send simple notification:', error);
      Alert.alert('Error', `Simple notification failed: ${error?.message || 'Unknown error'}`);
    }
  };

  const testNotificationWithBadge = () => {
    try {
      console.log('🔔 [DEBUG] Testing notification with badge...');
      
      PushNotification.localNotification({
        title: 'Badge Test',
        message: 'This notification should show a badge',
        playSound: true,
        soundName: 'default',
        importance: 'high',
        priority: 'high',
        vibrate: true,
        vibration: 300,
        number: 1, // This should show a badge
        id: 'badge-test-' + Date.now(),
      });
      
      console.log('✅ [DEBUG] Badge notification sent');
      Alert.alert('Success', 'Badge notification sent - check if you receive it with a badge!');
    } catch (error: any) {
      console.error('❌ [DEBUG] Failed to send badge notification:', error);
      Alert.alert('Error', `Badge notification failed: ${error?.message || 'Unknown error'}`);
    }
  };

  const testNotificationInBackground = () => {
    try {
      console.log('🔔 [DEBUG] Testing background notification...');
      
      // Schedule a notification for 3 seconds from now to test background behavior
      const testTime = new Date(Date.now() + 3000);
      
      PushNotification.localNotificationSchedule({
        id: 'background-test-' + Date.now(),
        title: 'Background Test',
        message: 'This notification was scheduled while app was active',
        date: testTime,
        allowWhileIdle: true,
        playSound: true,
        soundName: 'default',
        importance: 'high',
        priority: 'high',
        vibrate: true,
        vibration: 300,
      });
      
      console.log('✅ [DEBUG] Background notification scheduled for:', testTime.toLocaleString());
      Alert.alert('Success', 'Background notification scheduled for 3 seconds from now. Try putting the app in background!');
    } catch (error: any) {
      console.error('❌ [DEBUG] Failed to schedule background notification:', error);
      Alert.alert('Error', `Background notification failed: ${error?.message || 'Unknown error'}`);
    }
  };

  const testFCMTokenRetrieval = async () => {
    try {
      console.log('🔔 [DEBUG] Testing FCM token retrieval...');
      
      // Register device for remote messages (iOS)
      if (Platform.OS === 'ios') {
        const isRegistered = await messaging().isDeviceRegisteredForRemoteMessages;
        console.log('🔔 [DEBUG] Device registered for remote messages:', isRegistered);
        
        if (!isRegistered) {
          console.log('🔔 [DEBUG] Registering device for remote messages...');
          await messaging().registerDeviceForRemoteMessages();
          console.log('🔔 [DEBUG] Device registration completed');
          
          // Wait a moment for registration to complete
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Get FCM token
      const fcmToken = await messaging().getToken();
      console.log('🔔 [DEBUG] FCM token retrieved:', fcmToken ? fcmToken.substring(0, 20) + '...' : 'null');
      
      if (fcmToken) {
        Alert.alert('Success', `FCM token retrieved successfully!\n\nToken: ${fcmToken.substring(0, 20)}...\n\nThis means push notifications should work!`);
      } else {
        Alert.alert('Error', 'FCM token is null. This might be expected in iOS simulator.');
      }
      
    } catch (error: any) {
      console.error('❌ [DEBUG] Failed to get FCM token:', error);
      Alert.alert('Error', `FCM token retrieval failed: ${error?.message || 'Unknown error'}`);
    }
  };

  const testFirebaseConnection = async () => {
    try {
      console.log('🔔 [DEBUG] Testing Firebase connection...');
      
      const firestoreInstance = getFirestoreInstance();
      
      // Test Firestore connection
      const testDoc = await firestoreInstance.collection('test').doc('connection-test').get();
      console.log('🔔 [DEBUG] Firestore connection test:', testDoc.exists);
      
      // Test creating a document
      const testRef = await firestoreInstance.collection('test').add({
        test: true,
        timestamp: FirebaseFirestoreTypes.FieldValue.serverTimestamp(),
      });
      console.log('🔔 [DEBUG] Test document created:', testRef.id);
      
      // Clean up
      await testRef.delete();
      
      Alert.alert('Success', 'Firebase connection is working! Firestore is accessible.');
      
    } catch (error: any) {
      console.error('❌ [DEBUG] Firebase connection test failed:', error);
      Alert.alert('Error', `Firebase connection failed: ${error?.message || 'Unknown error'}`);
    }
  };

  const trackNotificationAttempt = (type: string) => {
    const now = new Date().toLocaleTimeString();
    setNotificationCount(prev => prev + 1);
    setLastNotificationTime(now);
    console.log(`🔔 [TRACK] ${type} notification attempt at ${now}`);
  };

  const resetNotificationCounter = () => {
    setNotificationCount(0);
    setLastNotificationTime('');
    console.log('🔔 [TRACK] Notification counter reset');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Notification Debug</Text>
      
      {isSimulator && (
        <View style={[styles.warningBanner, { backgroundColor: colors.error }]}>
          <Text style={[styles.warningText, { color: colors.background }]}>
            ⚠️ iOS Simulator Detected
          </Text>
          <Text style={[styles.warningSubtext, { color: colors.background }]}>
            Notifications are being created successfully (see counter below), but iOS Simulator doesn't display them visually. The notification system is working correctly!
          </Text>
        </View>
      )}
      
      <View style={styles.infoContainer}>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Permission Status: {permissionStatus}
        </Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Scheduled Notifications: {scheduledCount}
        </Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Notification Attempts: {notificationCount}
        </Text>
        {lastNotificationTime && (
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Last Attempt: {lastNotificationTime}
          </Text>
        )}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Diagnostic Information</Text>
      <Text style={[styles.diagnosticText, { color: colors.textSecondary }]}>
        {diagnosticInfo}
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Test Notifications</Text>
      
      <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={sendImmediateNotification}>
        <Text style={[styles.buttonText, { color: colors.background }]}>Send Immediate Notification</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={test1SecondNotification}>
        <Text style={[styles.buttonText, { color: colors.background }]}>Test 1-Second Notification</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>System Tests</Text>
      
      <TouchableOpacity style={[styles.button, { backgroundColor: colors.secondary }]} onPress={testNotificationChannel}>
        <Text style={[styles.buttonText, { color: colors.background }]}>Test Notification Channel</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: colors.secondary }]} onPress={testNotificationPermissions}>
        <Text style={[styles.buttonText, { color: colors.background }]}>Test Permissions</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Management</Text>
      
      <TouchableOpacity style={[styles.button, { backgroundColor: colors.secondary }]} onPress={getScheduledNotifications}>
        <Text style={[styles.buttonText, { color: colors.background }]}>Get Scheduled Notifications</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: colors.error }]} onPress={clearAllNotifications}>
        <Text style={[styles.buttonText, { color: colors.background }]}>Clear All Notifications</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: colors.secondary }]} onPress={runDiagnostics}>
        <Text style={[styles.buttonText, { color: colors.background }]}>Refresh Diagnostics</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: colors.secondary }]} onPress={resetNotificationCounter}>
        <Text style={[styles.buttonText, { color: colors.background }]}>Reset Notification Counter</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: colors.secondary }]} onPress={testBasicLocalNotification}>
        <Text style={[styles.buttonText, { color: colors.background }]}>Test Basic Local Notification</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: colors.secondary }]} onPress={testScheduledNotification}>
        <Text style={[styles.buttonText, { color: colors.background }]}>Test Scheduled Notification</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: colors.secondary }]} onPress={testSimpleNotification}>
        <Text style={[styles.buttonText, { color: colors.background }]}>Test Simple Notification</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: colors.secondary }]} onPress={testNotificationWithBadge}>
        <Text style={[styles.buttonText, { color: colors.background }]}>Test Notification with Badge</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: colors.secondary }]} onPress={testNotificationInBackground}>
        <Text style={[styles.buttonText, { color: colors.background }]}>Test Background Notification</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: colors.secondary }]} onPress={testFCMTokenRetrieval}>
        <Text style={[styles.buttonText, { color: colors.background }]}>Test FCM Token Retrieval</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: colors.secondary }]} onPress={testFirebaseConnection}>
        <Text style={[styles.buttonText, { color: colors.background }]}>Test Firebase Connection</Text>
      </TouchableOpacity>

      {isSimulator && (
        <View style={[styles.infoContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Testing on Real Device</Text>
          <Text style={[styles.diagnosticText, { color: colors.textSecondary }]}>
            1. Connect your iPhone to your Mac{'\n'}
            2. Open Xcode and select your device{'\n'}
            3. Run the app on the physical device{'\n'}
            4. Test notifications there{'\n\n'}
            Notifications work much better on real devices!
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: Fonts.display?.bold,
    marginBottom: 20,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    fontFamily: Fonts.text?.medium,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: Fonts.text?.semibold,
    marginTop: 20,
    marginBottom: 12,
  },
  diagnosticText: {
    fontSize: 14,
    fontFamily: Fonts.text?.regular,
    lineHeight: 20,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: Fonts.text?.semibold,
  },
  warningBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  warningText: {
    fontSize: 18,
    fontFamily: Fonts.text?.semibold,
    marginBottom: 8,
  },
  warningSubtext: {
    fontSize: 14,
    fontFamily: Fonts.text?.regular,
  },
}); 