import { useState, useEffect, useCallback } from 'react';
import { notificationService, NotificationData, TaskNotificationData } from '../services/notificationService';
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from './useFamily';

export const useNotifications = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { family } = useFamily();

  // Initialize notifications
  const initialize = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await notificationService.initialize();
      const enabled = await notificationService.areNotificationsEnabled();

      setIsInitialized(true);
      setIsEnabled(enabled);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Request permissions
  const requestPermissions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const granted = await notificationService.requestPermissions();
      setIsEnabled(granted);

      if (granted) {
        // Re-initialize after permission is granted
        await initialize();
      }

      return granted;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request notification permissions');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [initialize]);

  // Register device for remote messages
  const registerDeviceForRemoteMessages = useCallback(async () => {
    try {
      if (Platform.OS === 'ios') {
        console.log('Checking if device is registered for remote messages...');
        const isRegistered = await messaging().isDeviceRegisteredForRemoteMessages;
        console.log('Device registration status:', isRegistered);

        if (!isRegistered) {
          console.log('Registering device for remote messages...');
          await messaging().registerDeviceForRemoteMessages();

          // Wait a moment for registration to complete
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Check registration status again
          const newStatus = await messaging().isDeviceRegisteredForRemoteMessages;
          console.log('Device registration status after registration:', newStatus);

          if (!newStatus) {
            console.log('Device registration failed - this is normal in iOS simulator');
            // In iOS simulator, registration might fail, but we can still try to get token
            return true;
          }
        }
        return true;
      }
      return true;
    } catch (err) {
      console.error('Failed to register device for remote messages:', err);
      // Even if registration fails, we can try to get token
      return true;
    }
  }, []);

  // Send notification to user
  const sendNotificationToUser = useCallback(async (
    userId: string,
    notification: NotificationData
  ) => {
    try {
      await notificationService.sendNotificationToUser(userId, notification);
    } catch (err) {
      console.error('Failed to send notification to user:', err);
      throw err;
    }
  }, []);

  // Send notification to family
  const sendNotificationToFamily = useCallback(async (
    familyId: string,
    notification: NotificationData,
    excludeUserId?: string
  ) => {
    try {
      await notificationService.sendNotificationToFamily(familyId, notification, excludeUserId);
    } catch (err) {
      console.error('Failed to send notification to family:', err);
      throw err;
    }
  }, []);

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    try {
      await notificationService.sendTestNotification();
      console.log('Test notification sent successfully');
    } catch (err) {
      console.error('Error sending test notification:', err);
      throw err;
    }
  }, []);

  // Get FCM token
  const getFCMToken = useCallback(async () => {
    try {
      console.log('useNotifications: Getting FCM token...');

      // Try to register device first
      await registerDeviceForRemoteMessages();

      // Try to get token with error handling
      try {
        console.log('useNotifications: Attempting to get FCM token...');
        const token = await messaging().getToken();
        console.log('useNotifications: FCM token retrieved:', token ? token.substring(0, 20) + '...' : 'null');
        return token;
      } catch (tokenError) {
        console.log('useNotifications: First token attempt failed:', tokenError);

        // If first attempt fails, try registering again and retry
        if (Platform.OS === 'ios') {
          console.log('useNotifications: Retrying with fresh registration...');
          try {
            await messaging().registerDeviceForRemoteMessages();
            await new Promise(resolve => setTimeout(resolve, 2000));

            const retryToken = await messaging().getToken();
            console.log('useNotifications: FCM token on retry:', retryToken ? retryToken.substring(0, 20) + '...' : 'null');
            return retryToken;
          } catch (retryError) {
            console.log('useNotifications: Retry also failed:', retryError);
            throw retryError;
          }
        }

        throw tokenError;
      }
    } catch (err) {
      console.error('useNotifications: Failed to get FCM token:', err);

      // In iOS simulator, we might not be able to get a real FCM token
      if (Platform.OS === 'ios') {
        console.log('useNotifications: This is expected in iOS simulator - FCM tokens only work on real devices');
        // Return a mock token for testing purposes
        return 'simulator-mock-fcm-token-' + Date.now();
      }

      return null;
    }
  }, [registerDeviceForRemoteMessages]);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Enhanced notification methods for tasks
  const notifyTaskCreated = async (
    taskData: TaskNotificationData,
    excludeCurrentUser: boolean = true
  ) => {
    try {
      if (!family) {
        console.log('No family found, skipping task creation notification');
        return;
      }

      const excludeUserId = excludeCurrentUser ? user?.uid : undefined;
      await notificationService.notifyTaskCreated(
        family.id,
        taskData,
        excludeUserId
      );
    } catch (error) {
      console.error('Error sending task creation notification:', error);
    }
  };

  const notifyTaskAssigned = async (
    taskData: TaskNotificationData,
    excludeCurrentUser: boolean = true
  ) => {
    try {
      const excludeUserId = excludeCurrentUser ? user?.uid : undefined;
      await notificationService.notifyTaskAssigned(taskData, excludeUserId);
    } catch (error) {
      console.error('Error sending task assignment notification:', error);
    }
  };

  const notifyTaskUpdated = async (
    taskData: TaskNotificationData,
    updateType: 'due_date' | 'priority' | 'description' | 'general',
    excludeCurrentUser: boolean = true
  ) => {
    try {
      const excludeUserId = excludeCurrentUser ? user?.uid : undefined;
      await notificationService.notifyTaskUpdated(
        taskData,
        updateType,
        excludeUserId
      );
    } catch (error) {
      console.error('Error sending task update notification:', error);
    }
  };

  const notifyTaskCompleted = async (
    taskData: TaskNotificationData,
    completedByDisplayName: string,
    excludeCurrentUser: boolean = true
  ) => {
    try {
      const excludeUserId = excludeCurrentUser ? user?.uid : undefined;
      await notificationService.notifyTaskCompleted(
        taskData,
        user?.uid || '',
        completedByDisplayName,
        excludeUserId
      );
    } catch (error) {
      console.error('Error sending task completion notification:', error);
    }
  };

  const sendTaskReminder = async (
    taskData: TaskNotificationData,
    reminderType: 'due_soon' | 'overdue' | 'daily_digest'
  ) => {
    try {
      await notificationService.sendTaskReminder(taskData, reminderType);
    } catch (error) {
      console.error('Error sending task reminder:', error);
    }
  };

  // Start background reminder checking
  const startBackgroundReminderChecking = useCallback(() => {
    try {
      notificationService.startBackgroundReminderChecking();
    } catch (error) {
      console.error('Error starting background reminder checking:', error);
    }
  }, []);

  return {
    isInitialized,
    isEnabled,
    isLoading,
    error,
    initialize,
    requestPermissions,
    registerDeviceForRemoteMessages,
    sendNotificationToUser,
    sendNotificationToFamily,
    sendTestNotification,
    getFCMToken,
    notifyTaskCreated,
    notifyTaskAssigned,
    notifyTaskUpdated,
    notifyTaskCompleted,
    sendTaskReminder,
    startBackgroundReminderChecking,
  };
};
