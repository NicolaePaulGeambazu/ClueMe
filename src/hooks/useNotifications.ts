
import { useState, useEffect, useCallback } from 'react';
import notificationService, { NotificationData } from '../services/notificationService';
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

export const useNotifications = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize notifications
  const initialize = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      setError('This app only supports iOS notifications');
      setIsLoading(false);
      return;
    }

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
    if (Platform.OS !== 'ios') {
      setError('This app only supports iOS notifications');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const granted = await notificationService.requestPermissions();
      setIsEnabled(granted);

      if (granted) {
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

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    try {
      await notificationService.sendTestNotification();
    } catch (err) {
      throw err;
    }
  }, []);

  // Get FCM token
  const getFCMToken = useCallback(async () => {
    try {
      return await notificationService.getFCMToken();
    } catch (err) {
      console.error('Error getting FCM token:', err);
      return null;
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    isInitialized,
    isEnabled,
    isLoading,
    error,
    initialize,
    requestPermissions,
    sendTestNotification,
    getFCMToken,
  };
};
