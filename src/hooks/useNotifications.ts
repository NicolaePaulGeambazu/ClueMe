import { useState, useEffect, useCallback } from 'react';
import { notificationService, NotificationData } from '../services/notificationService';

export const useNotifications = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Get FCM token
  const getFCMToken = useCallback(() => {
    return notificationService.getCurrentFCMToken();
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
    sendNotificationToUser,
    sendNotificationToFamily,
    getFCMToken,
  };
}; 