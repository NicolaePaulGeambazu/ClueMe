import { Platform } from 'react-native';
import PushNotification from 'react-native-push-notification';

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  date: Date;
  repeatType?: 'day' | 'week';
  data?: Record<string, any>;
}

/**
 * Schedule a local notification
 */
export const scheduleNotification = async (notification: NotificationData): Promise<boolean> => {
  try {
    // Check if the notification time has passed
    if (notification.date <= new Date()) {
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

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Cancel a scheduled notification
 */
export const cancelNotification = (notificationId: string): void => {
  try {
    PushNotification.cancelLocalNotification(notificationId);
  } catch (error) {
  }
}; 