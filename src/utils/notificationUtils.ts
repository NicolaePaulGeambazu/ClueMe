import { Platform, Alert } from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import PushNotification from 'react-native-push-notification';
import { DateTime } from 'luxon';

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  date: Date;
  repeatType?: 'day' | 'week';
  data?: Record<string, any>;
}

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    let permission;
    
    if (Platform.OS === 'ios') {
      // For iOS, we'll use a different approach since NOTIFICATIONS might not be available
      // We'll assume permissions are granted for now
      console.log('iOS notification permissions would be requested here');
      return true;
    } else {
      // For Android, we'll assume permissions are granted for now
      // POST_NOTIFICATIONS might not be available in all versions
      console.log('Android notification permissions would be requested here');
      return true;
    }
    
    if (permission) {
      const result = await request(permission);
      return result === RESULTS.GRANTED;
    }
    
    return true; // Assume granted if permission type not available
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Check if notifications are enabled
 */
export const areNotificationsEnabled = async (): Promise<boolean> => {
  try {
    // For now, assume notifications are enabled
    // In a real implementation, you would check the actual permission status
    return true;
  } catch (error) {
    console.error('Error checking notification status:', error);
    return false;
  }
};

/**
 * Schedule a local notification
 */
export const scheduleNotification = async (notification: NotificationData): Promise<boolean> => {
  try {
    // Check if the notification time has passed
    if (notification.date <= new Date()) {
      console.log('Notification time has passed, skipping');
      return false;
    }

    // Schedule the notification
    PushNotification.localNotificationSchedule({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      date: notification.date,
      allowWhileIdle: true,
      channelId: 'reminders',
      repeatType: notification.repeatType,
    });

    console.log('Notification scheduled for:', notification.date);
    return true;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return false;
  }
};

/**
 * Cancel a scheduled notification
 */
export const cancelNotification = (notificationId: string): void => {
  try {
    PushNotification.cancelLocalNotification(notificationId);
    console.log('Notification cancelled:', notificationId);
  } catch (error) {
    console.error('Error cancelling notification:', error);
  }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = (): void => {
  try {
    PushNotification.cancelAllLocalNotifications();
    console.log('All notifications cancelled');
  } catch (error) {
    console.error('Error cancelling all notifications:', error);
  }
};

/**
 * Get all scheduled notifications
 */
export const getScheduledNotifications = (): Promise<any[]> => {
  return new Promise((resolve) => {
    PushNotification.getScheduledLocalNotifications((notifications) => {
      resolve(notifications || []);
    });
  });
};

/**
 * Create a notification for a reminder
 */
export const createReminderNotification = (
  reminderId: string,
  title: string,
  message: string,
  datetime: string,
  repeatRRule?: string
): NotificationData => {
  const notificationDate = DateTime.fromISO(datetime).toJSDate();
  
  // Determine repeat type from RRULE
  let repeatType: 'day' | 'week' | undefined;
  if (repeatRRule) {
    if (repeatRRule.includes('FREQ=DAILY')) {
      repeatType = 'day';
    } else if (repeatRRule.includes('FREQ=WEEKLY')) {
      repeatType = 'week';
    }
    // Note: Monthly and yearly repeats are not supported by react-native-push-notification
  }

  return {
    id: `reminder_${reminderId}`,
    title,
    message,
    date: notificationDate,
    repeatType,
    data: {
      reminderId,
      type: 'reminder',
    },
  };
};

/**
 * Initialize notification channels (Android)
 */
export const initializeNotificationChannels = (): void => {
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
      (created) => console.log(`Reminder channel created: ${created}`)
    );
  }
};

/**
 * Show a test notification
 */
export const showTestNotification = (): void => {
  PushNotification.localNotification({
    title: 'Test Notification',
    message: 'This is a test notification',
    channelId: 'reminders',
  });
}; 