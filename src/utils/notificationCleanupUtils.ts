/**
 * Notification Cleanup Utilities
 *
 * Comprehensive utilities to ensure notifications are properly cleaned up
 * when reminders are deleted or modified.
 */

import PushNotification from 'react-native-push-notification';
import notificationService from '../services/notificationService';

export interface NotificationCleanupResult {
  success: boolean;
  cancelledCount: number;
  errors: string[];
  reminderId: string;
}

/**
 * Comprehensive notification cleanup for a deleted reminder
 */
export const cleanupReminderNotifications = async (reminderId: string): Promise<NotificationCleanupResult> => {
  const result: NotificationCleanupResult = {
    success: false,
    cancelledCount: 0,
    errors: [],
    reminderId,
  };

  try {
    console.log(`[NotificationCleanup] Starting cleanup for reminder: ${reminderId}`);

    // Method 1: Use the notification service
    try {
      await notificationService.cancelReminderNotifications(reminderId);
      console.log(`[NotificationCleanup] Service method completed for reminder: ${reminderId}`);
    } catch (error) {
      const errorMsg = `Service method failed: ${error}`;
      console.error(`[NotificationCleanup] ${errorMsg}`);
      result.errors.push(errorMsg);
    }

    // Method 2: Direct cleanup using PushNotification API
    try {
      const directResult = await cleanupNotificationsDirectly(reminderId);
      result.cancelledCount += directResult.cancelledCount;
      console.log(`[NotificationCleanup] Direct method cancelled ${directResult.cancelledCount} notifications for reminder: ${reminderId}`);
    } catch (error) {
      const errorMsg = `Direct method failed: ${error}`;
      console.error(`[NotificationCleanup] ${errorMsg}`);
      result.errors.push(errorMsg);
    }

    // Method 3: Cleanup by notification ID pattern
    try {
      const patternResult = await cleanupByNotificationPattern(reminderId);
      result.cancelledCount += patternResult.cancelledCount;
      console.log(`[NotificationCleanup] Pattern method cancelled ${patternResult.cancelledCount} notifications for reminder: ${reminderId}`);
    } catch (error) {
      const errorMsg = `Pattern method failed: ${error}`;
      console.error(`[NotificationCleanup] ${errorMsg}`);
      result.errors.push(errorMsg);
    }

    result.success = true;
    console.log(`[NotificationCleanup] Cleanup completed for reminder ${reminderId}. Total cancelled: ${result.cancelledCount}`);

  } catch (error) {
    const errorMsg = `Overall cleanup failed: ${error}`;
    console.error(`[NotificationCleanup] ${errorMsg}`);
    result.errors.push(errorMsg);
  }

  return result;
};

/**
 * Direct cleanup using PushNotification API
 */
const cleanupNotificationsDirectly = async (reminderId: string): Promise<{ cancelledCount: number }> => {
  return new Promise((resolve, reject) => {
    try {
      PushNotification.getScheduledLocalNotifications((notifications) => {
        let cancelledCount = 0;

        notifications.forEach((notification: any) => {
          const notifId = notification.id;
          const notifReminderId = notification.userInfo?.reminderId;

          if (notifReminderId === reminderId) {
            console.log(`[NotificationCleanup] Directly cancelling notification: ${notifId}`);
            PushNotification.cancelLocalNotification(notifId);
            cancelledCount++;
          }
        });

        resolve({ cancelledCount });
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Cleanup by notification ID pattern (for recurring reminders)
 */
const cleanupByNotificationPattern = async (reminderId: string): Promise<{ cancelledCount: number }> => {
  return new Promise((resolve, reject) => {
    try {
      PushNotification.getScheduledLocalNotifications((notifications) => {
        let cancelledCount = 0;

        // Patterns to match for this reminder
        const patterns = [
          reminderId,
          `${reminderId}-occurrence`,
          `${reminderId}-notification`,
          `reminder-${reminderId}`,
        ];

        notifications.forEach((notification: any) => {
          const notifId = notification.id;

          // Check if notification ID matches any pattern
          const matchesPattern = patterns.some(pattern =>
            notifId.includes(pattern) || notifId.startsWith(pattern)
          );

          if (matchesPattern) {
            console.log(`[NotificationCleanup] Pattern match - cancelling notification: ${notifId}`);
            PushNotification.cancelLocalNotification(notifId);
            cancelledCount++;
          }
        });

        resolve({ cancelledCount });
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Verify that all notifications for a reminder have been cleaned up
 */
export const verifyNotificationCleanup = async (reminderId: string): Promise<boolean> => {
  try {
    const notifications = await notificationService.getScheduledNotifications();

    const remainingNotifications = notifications.filter((notification: any) => {
      const notifReminderId = notification.userInfo?.reminderId;
      const notifId = notification.id;

      return notifReminderId === reminderId ||
             notifId.includes(reminderId) ||
             notifId.startsWith(reminderId);
    });

    if (remainingNotifications.length > 0) {
      console.warn(`[NotificationCleanup] Found ${remainingNotifications.length} remaining notifications for reminder ${reminderId}:`,
        remainingNotifications.map((n: any) => ({ id: n.id, userInfo: n.userInfo })));
      return false;
    }

    console.log(`[NotificationCleanup] Verification passed - no remaining notifications for reminder ${reminderId}`);
    return true;
  } catch (error) {
    console.error(`[NotificationCleanup] Verification failed for reminder ${reminderId}:`, error);
    return false;
  }
};

/**
 * Force cleanup all notifications (nuclear option)
 */
export const forceCleanupAllNotifications = async (): Promise<{ success: boolean; cancelledCount: number }> => {
  try {
    console.log('[NotificationCleanup] Force cleaning up all notifications...');

    const notifications = await notificationService.getScheduledNotifications();
    const totalNotifications = notifications.length;

    // Cancel all notifications
    PushNotification.cancelAllLocalNotifications();

    console.log(`[NotificationCleanup] Force cleanup completed. Cancelled ${totalNotifications} notifications.`);

    return {
      success: true,
      cancelledCount: totalNotifications,
    };
  } catch (error) {
    console.error('[NotificationCleanup] Force cleanup failed:', error);
    return {
      success: false,
      cancelledCount: 0,
    };
  }
};

/**
 * Debug function to list all scheduled notifications
 */
export const debugScheduledNotifications = async (): Promise<void> => {
  try {
    const notifications = await notificationService.getScheduledNotifications();

    console.log(`[NotificationCleanup] Found ${notifications.length} scheduled notifications:`);

    notifications.forEach((notification: any, index: number) => {
      console.log(`[NotificationCleanup] ${index + 1}. ID: ${notification.id}`);
      console.log(`    Title: ${notification.title}`);
      console.log(`    Message: ${notification.message}`);
      console.log(`    Date: ${notification.date}`);
      console.log('    UserInfo:', notification.userInfo);
      console.log('    ---');
    });
  } catch (error) {
    console.error('[NotificationCleanup] Debug failed:', error);
  }
};
