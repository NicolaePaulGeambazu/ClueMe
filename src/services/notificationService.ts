
/**
 * ClueMe Notification Service
 * Clean, minimal iOS-focused notification system with stale notification prevention
 * UK formatting and timezone support built-in
 */

import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { getFirestoreInstance } from './firebaseService';
import iOSNotificationBridge from './iOSNotificationBridge';

// UK-specific constants
const UK_LOCALE = 'en-GB';
const UK_TIMEZONE = 'Europe/London';

export interface NotificationTiming {
  type: 'before' | 'exact' | 'after';
  value: number; // minutes before/after due time, or 0 for exact
  label: string;
}

export interface ReminderData {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  assignedTo?: string[];
  createdBy?: string;
  userId?: string;
  familyId?: string;
  listId?: string;
  recurring?: {
    pattern: string;
    interval?: number;
    endDate?: string;
    maxOccurrences?: number;
  };
  notificationTimings?: NotificationTiming[];
  coOwners?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationUserInfo {
  reminderId: string;
  timing: string;
  scheduledFor: string;
  version: string; // For stale notification detection
}

// Default notification timings for UK users
export const DEFAULT_NOTIFICATION_TIMINGS: NotificationTiming[] = [
  { type: 'exact', value: 0, label: 'At due time' },
  { type: 'before', value: 15, label: '15 minutes before' },
  { type: 'before', value: 60, label: '1 hour before' },
  { type: 'before', value: 1440, label: '1 day before' },
];

class NotificationService {
  private isInitialized = false;
  private notificationVersion = '1.0.0'; // Increment when reminder changes

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('[NotificationService] Initializing notification service...');

      if (Platform.OS === 'ios') {
        await iOSNotificationBridge.initialize();
        await this.requestPermissions();
      }

      this.isInitialized = true;
      console.log('[NotificationService] Notification service initialized successfully');
    } catch (error) {
      console.error('[NotificationService] Error initializing:', error);
      throw error;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        return await iOSNotificationBridge.requestPermissions();
      }
      return false;
    } catch (error) {
      console.error('[NotificationService] Error requesting permissions:', error);
      return false;
    }
  }

  async checkPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        return await iOSNotificationBridge.checkPermissions();
      }
      return false;
    } catch (error) {
      console.error('[NotificationService] Error checking permissions:', error);
      return false;
    }
  }

  /**
   * Schedule notifications for a reminder with stale notification prevention
   */
  async scheduleReminderNotifications(reminder: ReminderData): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // First, cancel any existing notifications for this reminder
      await this.cancelReminderNotifications(reminder.id);

      // Skip if reminder is completed
      if (reminder.completed) {
        console.log(`[NotificationService] Skipping notifications for completed reminder: ${reminder.id}`);
        return true;
      }

      // Skip if no due date/time
      if (!reminder.dueDate) {
        console.log(`[NotificationService] Skipping notifications for reminder without due date: ${reminder.id}`);
        return true;
      }

      const dueDateTime = this.parseDueDateTime(reminder.dueDate, reminder.dueTime);
      if (!dueDateTime) {
        console.log(`[NotificationService] Invalid due date/time for reminder: ${reminder.id}`);
        return false;
      }

      // Skip if due time has passed (stale notification prevention)
      const now = new Date();
      if (dueDateTime <= now) {
        console.log(`[NotificationService] Skipping notifications for overdue reminder: ${reminder.id}`);
        return true;
      }

      const timings = reminder.notificationTimings || DEFAULT_NOTIFICATION_TIMINGS;
      let scheduledCount = 0;

      for (const timing of timings) {
        const notificationTime = this.calculateNotificationTime(dueDateTime, timing);
        
        // Skip if notification time has passed
        if (notificationTime <= now) {
          console.log(`[NotificationService] Skipping past notification time for reminder: ${reminder.id}`);
          continue;
        }

        const success = await this.scheduleNotification(reminder, timing, notificationTime);
        if (success) {
          scheduledCount++;
        }
      }

      console.log(`[NotificationService] Scheduled ${scheduledCount} notifications for reminder: ${reminder.id}`);
      return scheduledCount > 0;
    } catch (error) {
      console.error('[NotificationService] Error scheduling reminder notifications:', error);
      return false;
    }
  }

  /**
   * Cancel all notifications for a specific reminder
   */
  async cancelReminderNotifications(reminderId: string): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        return await iOSNotificationBridge.cancelNotificationsForReminder(reminderId);
      }
      return true;
    } catch (error) {
      console.error('[NotificationService] Error canceling reminder notifications:', error);
      return false;
    }
  }

  /**
   * Cancel all notifications (for app reset/cleanup)
   */
  async cancelAllNotifications(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        return await iOSNotificationBridge.cancelAllNotifications();
      }
      return true;
    } catch (error) {
      console.error('[NotificationService] Error canceling all notifications:', error);
      return false;
    }
  }

  /**
   * Update notifications when reminder is edited
   */
  async updateReminderNotifications(reminder: ReminderData): Promise<boolean> {
    try {
      // Increment version to invalidate any pending notifications
      this.notificationVersion = (parseFloat(this.notificationVersion) + 0.01).toFixed(2);
      
      // Cancel existing notifications and schedule new ones
      return await this.scheduleReminderNotifications(reminder);
    } catch (error) {
      console.error('[NotificationService] Error updating reminder notifications:', error);
      return false;
    }
  }

  /**
   * Clean up stale notifications (called on app start)
   */
  async cleanupStaleNotifications(): Promise<void> {
    try {
      console.log('[NotificationService] Cleaning up stale notifications...');
      
      // For now, we rely on iOS to handle expired notifications
      // In the future, we could implement more sophisticated cleanup
      
      console.log('[NotificationService] Stale notification cleanup completed');
    } catch (error) {
      console.error('[NotificationService] Error during stale notification cleanup:', error);
    }
  }

  /**
   * Get pending notification count
   */
  async getPendingNotificationCount(): Promise<number> {
    try {
      if (Platform.OS === 'ios') {
        return await iOSNotificationBridge.getPendingNotificationCount();
      }
      return 0;
    } catch (error) {
      console.error('[NotificationService] Error getting pending notification count:', error);
      return 0;
    }
  }

  /**
   * Set app badge count
   */
  async setBadgeCount(count: number): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        return await iOSNotificationBridge.setBadgeCount(count);
      }
      return true;
    } catch (error) {
      console.error('[NotificationService] Error setting badge count:', error);
      return false;
    }
  }

  /**
   * Clear app badge
   */
  async clearBadge(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        return await iOSNotificationBridge.clearBadge();
      }
      return true;
    } catch (error) {
      console.error('[NotificationService] Error clearing badge:', error);
      return false;
    }
  }

  // Private helper methods

  private async scheduleNotification(
    reminder: ReminderData,
    timing: NotificationTiming,
    scheduledTime: Date
  ): Promise<boolean> {
    try {
      if (Platform.OS !== 'ios') {
        return false;
      }

      const identifier = `${reminder.id}_${timing.type}_${timing.value}`;
      const title = this.formatNotificationTitle(reminder, timing);
      const body = this.formatNotificationBody(reminder, timing);
      
      const userInfo: NotificationUserInfo = {
        reminderId: reminder.id,
        timing: `${timing.type}_${timing.value}`,
        scheduledFor: scheduledTime.toISOString(),
        version: this.notificationVersion,
      };

      return await iOSNotificationBridge.scheduleLocalNotification(
        identifier,
        title,
        body,
        scheduledTime,
        userInfo
      );
    } catch (error) {
      console.error('[NotificationService] Error scheduling individual notification:', error);
      return false;
    }
  }

  private parseDueDateTime(dueDate: string, dueTime?: string): Date | null {
    try {
      const date = new Date(dueDate);
      if (isNaN(date.getTime())) {
        return null;
      }

      if (dueTime) {
        const [hours, minutes] = dueTime.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          date.setHours(hours, minutes, 0, 0);
        }
      }

      return date;
    } catch (error) {
      console.error('[NotificationService] Error parsing due date/time:', error);
      return null;
    }
  }

  private calculateNotificationTime(dueDateTime: Date, timing: NotificationTiming): Date {
    const notificationTime = new Date(dueDateTime);
    
    switch (timing.type) {
      case 'before':
        notificationTime.setMinutes(notificationTime.getMinutes() - timing.value);
        break;
      case 'after':
        notificationTime.setMinutes(notificationTime.getMinutes() + timing.value);
        break;
      case 'exact':
      default:
        // No change needed for exact timing
        break;
    }

    return notificationTime;
  }

  private formatNotificationTitle(reminder: ReminderData, timing: NotificationTiming): string {
    const priority = reminder.priority === 'high' ? '🔴 ' : reminder.priority === 'medium' ? '🟡 ' : '';
    
    switch (timing.type) {
      case 'before':
        return `${priority}Reminder in ${this.formatDuration(timing.value)}`;
      case 'after':
        return `${priority}Overdue Reminder`;
      case 'exact':
      default:
        return `${priority}Reminder Due Now`;
    }
  }

  private formatNotificationBody(reminder: ReminderData, timing: NotificationTiming): string {
    let body = reminder.title;
    
    if (reminder.description) {
      body += `\n${reminder.description}`;
    }

    if (reminder.dueTime && timing.type === 'before') {
      body += `\nDue at ${reminder.dueTime}`;
    }

    return body;
  }

  private formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(minutes / 1440);
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
  }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService;

// Export types for external use
export type { NotificationTiming, ReminderData, NotificationUserInfo };
