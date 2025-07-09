import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform } from 'react-native';
import PushNotification from 'react-native-push-notification';
import notificationService from '../services/notificationService';
import { Colors } from '../constants/Colors';
import { useTheme } from '../contexts/ThemeContext';
import { Fonts } from '../constants/Fonts';
import messaging from '@react-native-firebase/messaging';
import { getFirestoreInstance } from '../services/firebaseService';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { forceRefreshFCMToken, diagnoseFCMTokenIssues } from '../utils/notificationTestUtils';
import { useAuth } from '../contexts/AuthContext';
import auth from '@react-native-firebase/auth';

export const NotificationDebug: React.FC = () => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<string>('Unknown');
  const [diagnosticInfo, setDiagnosticInfo] = useState<string>('');
  const [isSimulator, setIsSimulator] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [lastNotificationTime, setLastNotificationTime] = useState<string>('');
  const [fcmDiagnosis, setFcmDiagnosis] = useState<any>(null);

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

  const checkScheduledNotifications = async () => {
    try {
      const notifications = await notificationService.getScheduledNotifications();
      setScheduledCount(notifications.length);
    } catch (error) {
    }
  };

  const checkPermissionStatus = async () => {
    try {
      const enabled = await notificationService.areNotificationsEnabled();
      setPermissionStatus(enabled ? 'Granted' : 'Denied');
    } catch (error) {
    }
  };

  const runDiagnostics = async () => {
    try {
      let info = '🔍 Notification System Diagnostics:\n\n';
      
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
      
      setDiagnosticInfo(info);
    } catch (error) {
    }
  };

  const handleTestNotification = async () => {
    try {
      setIsLoading(true);
      await notificationService.sendTestNotification();
      setNotificationCount(prev => prev + 1);
      setLastNotificationTime(new Date().toLocaleTimeString());
      Alert.alert('Success', 'Test notification sent!');
    } catch (error) {
      Alert.alert('Error', `Failed to send test notification: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification30Seconds = async () => {
    try {
      setIsLoading(true);
      notificationService.sendTestNotification30Seconds();
      setNotificationCount(prev => prev + 1);
      setLastNotificationTime(new Date().toLocaleTimeString());
      Alert.alert('Success', 'Test notification scheduled for 30 seconds from now!\n\nPut the app in the background to test.');
    } catch (error) {
      Alert.alert('Error', `Failed to schedule test notification: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPermissions = async () => {
    try {
      setIsLoading(true);
      const granted = await notificationService.requestPermissions();
      if (granted) {
        Alert.alert('Success', 'Notification permissions granted!');
        checkPermissionStatus();
      } else {
        Alert.alert('Permission Denied', 'Notification permissions were denied.');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to request permissions: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearNotifications = async () => {
    try {
      setIsLoading(true);
      await notificationService.cancelAllNotifications();
      setScheduledCount(0);
      Alert.alert('Success', 'All notifications cleared!');
    } catch (error) {
      Alert.alert('Error', `Failed to clear notifications: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiagnoseFCM = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setIsLoading(true);
      const diagnosis = await diagnoseFCMTokenIssues(user.uid);
      setFcmDiagnosis(diagnosis);
      
      let message = `FCM Token Diagnosis:\n\n`;
      message += `Has Tokens: ${diagnosis.hasTokens ? '✅ Yes' : '❌ No'}\n`;
      message += `Token Count: ${diagnosis.tokenCount}\n`;
      message += `Device Registered: ${diagnosis.registrationStatus ? '✅ Yes' : '❌ No'}\n`;
      message += `Last Update: ${diagnosis.lastUpdate || 'Never'}\n`;
      
      if (diagnosis.error) {
        message += `\nError: ${diagnosis.error}`;
      }
      
      Alert.alert('FCM Diagnosis', message);
    } catch (error) {
      Alert.alert('Error', `Failed to diagnose FCM: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceRefreshFCM = async () => {
    try {
      setIsLoading(true);
      const token = await notificationService.forceRefreshFCMToken();
      
      if (token) {
        Alert.alert('Success', `FCM token refreshed successfully!\n\nToken: ${token.substring(0, 20)}...`);
        // Re-run diagnosis
        if (user?.uid) {
          const diagnosis = await diagnoseFCMTokenIssues(user.uid);
          setFcmDiagnosis(diagnosis);
        }
      } else {
        Alert.alert('Error', 'Failed to refresh FCM token');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to refresh FCM token: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testFCMTokenRetrieval = async () => {
    try {
      
      // Register device for remote messages (iOS)
      if (Platform.OS === 'ios') {
        const isRegistered = await messaging().isDeviceRegisteredForRemoteMessages;
        
        if (!isRegistered) {
          await messaging().registerDeviceForRemoteMessages();
          
          // Wait a moment for registration to complete
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Get FCM token
      const fcmToken = await messaging().getToken();
      
      if (fcmToken) {
        Alert.alert('Success', `FCM token retrieved successfully!\n\nToken: ${fcmToken.substring(0, 20)}...\n\nThis means push notifications should work!`);
      } else {
        Alert.alert('Error', 'FCM token is null. This might be expected in iOS simulator.');
      }
      
    } catch (error: any) {
      Alert.alert('Error', `FCM token retrieval failed: ${error?.message || 'Unknown error'}`);
    }
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
      
      <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleTestNotification}>
        <Text style={[styles.buttonText, { color: colors.background }]}>Send Immediate Notification</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleTestNotification30Seconds}>
        <Text style={[styles.buttonText, { color: colors.background }]}>Send Test Notification (30s)</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>System Tests</Text>
      
      <TouchableOpacity style={[styles.button, { backgroundColor: colors.secondary }]} onPress={testFCMTokenRetrieval}>
        <Text style={[styles.buttonText, { color: colors.background }]}>Test FCM Token Retrieval</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: colors.secondary }]} onPress={handleDiagnoseFCM}>
        <Text style={[styles.buttonText, { color: colors.background }]}>Diagnose FCM Token Issues</Text>
      </TouchableOpacity>

                    <TouchableOpacity style={[styles.button, { backgroundColor: colors.secondary }]} onPress={handleForceRefreshFCM}>
        <Text style={[styles.buttonText, { color: colors.background }]}>Force Refresh FCM Token</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: colors.secondary }]} onPress={async () => {
        try {
          setIsLoading(true);
          const token = await notificationService.getFCMToken();
          if (token) {
            Alert.alert('Success', `FCM token retrieved: ${token.substring(0, 20)}...`);
          } else {
            Alert.alert('Error', 'No FCM token available');
          }
        } catch (error) {
          Alert.alert('Error', `FCM token retrieval failed: ${error}`);
        } finally {
          setIsLoading(false);
        }
      }}>
        <Text style={[styles.buttonText, { color: colors.background }]}>Get FCM Token</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: colors.secondary }]} onPress={async () => {
        try {
          setIsLoading(true);
          
          // Run comprehensive FCM token test
          
          // Step 1: Test authentication
          const currentUser = auth().currentUser;
          if (!currentUser) {
            Alert.alert('Error', 'No authenticated user found');
            return;
          }
          
          // Step 2: Test FCM token generation
          const token = await notificationService.getFCMToken();
          if (!token) {
            Alert.alert('Error', 'FCM token generation failed');
            return;
          }
          
          // Step 3: Test push notification flow
          await notificationService.sendPushNotification(token, {
            title: 'FCM Token Test',
            body: 'This is a test push notification from the comprehensive test',
            type: 'test',
            data: {
              testId: 'comprehensive-test-' + Date.now(),
              timestamp: Date.now().toString(),
            }
          });
          
          // Step 4: Check user document
          const firestoreInstance = getFirestoreInstance();
          const userDoc = await firestoreInstance.collection('users').doc(currentUser.uid).get();
          const userData = userDoc.data();
          const fcmTokens = userData?.fcmTokens || [];
          
          let message = `✅ FCM Token Test Complete!\n\n`;
          message += `Token: ${token.substring(0, 20)}...\n`;
          message += `User has ${fcmTokens.length} FCM token(s)\n`;
          message += `Push notification request created successfully`;
          
          Alert.alert('Success', message);
          
        } catch (error) {
          Alert.alert('Error', `FCM token test failed: ${error}`);
        } finally {
          setIsLoading(false);
        }
      }}>
        <Text style={[styles.buttonText, { color: colors.background }]}>Run FCM Token Test</Text>
      </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Management</Text>
        
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.secondary }]} onPress={handleRequestPermissions}>
          <Text style={[styles.buttonText, { color: colors.background }]}>Request Permissions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { backgroundColor: colors.error }]} onPress={handleClearNotifications}>
          <Text style={[styles.buttonText, { color: colors.background }]}>Clear All Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { backgroundColor: colors.secondary }]} onPress={runDiagnostics}>
          <Text style={[styles.buttonText, { color: colors.background }]}>Refresh Diagnostics</Text>
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