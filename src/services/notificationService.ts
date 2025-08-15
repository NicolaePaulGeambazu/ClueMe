
import { Platform } from 'react-native';
import PushNotification from 'react-native-push-notification';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import { getFirestoreInstance } from './firebaseService';

// UK-specific constants
const UK_LOCALE = 'en-GB';
const UK_TIMEZONE = 'Europe/London';

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, string>;
  type?: 'reminder' | 'family_invitation' | 'task_assigned' | 'task_created' | 'general';
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

export interface NotificationTiming {
  type: 'before' | 'exact' | 'after';
  value: number; // minutes before/after due time, or 0 for exact
  label: string;
}

export interface NotificationUserInfo {
  reminderId: string;
  timing: string;
  type: 'reminder' | 'recurring' | 'assigned';
  occurrenceIndex?: number;
  assignedUserId?: string;
}

// Default notification timings with user-friendly labels
export const DEFAULT_NOTIFICATION_TIMINGS: NotificationTiming[] = [
  { type: 'before', value: 15, label: '15 minutes before' },
  { type: 'before', value: 30, label: '30 minutes before' },
  { type: 'before', value: 60, label: '1 hour before' },
  { type: 'exact', value: 0, label: 'At due time' },
];

/**
 * Simplified iOS-only notification service with UK time formatting
 */
class NotificationService {
  private isInitialized = false;
  private ukDateFormatter: Intl.DateTimeFormat;
  private ukTimeFormatter: Intl.DateTimeFormat;

  constructor() {
    // Initialize UK formatters
    this.ukDateFormatter = new Intl.DateTimeFormat(UK_LOCALE, {
      timeZone: UK_TIMEZONE,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    this.ukTimeFormatter = new Intl.DateTimeFormat(UK_LOCALE, {
      timeZone: UK_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  /**
   * Initialize the notification service (iOS only)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (Platform.OS !== 'ios') {
      console.warn('[NotificationService] This service is iOS-only');
      return;
    }

    try {
      console.log('[NotificationService] Initializing iOS notification service...');
      
      // Request notification permissions
      await this.requestPermissions();
      
      // Set up foreground and background notification handling
      this.setupNotificationHandlers();
      
      this.isInitialized = true;
      console.log('[NotificationService] iOS notification service initialized successfully');
    } catch (error) {
      console.error('[NotificationService] Error initializing:', error);
      throw error;
    }
  }

  /**
   * Request notification permissions for iOS
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                     authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('[NotificationService] Notification permissions granted');
        
        // Register for remote notifications
        await messaging().registerDeviceForRemoteMessages();
        console.log('[NotificationService] Device registered for remote messages');
        
        // Get and save FCM token
        await this.getFCMToken();
      } else {
        console.log('[NotificationService] Notification permissions denied');
      }

      return enabled;
    } catch (error) {
      console.error('[NotificationService] Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Set up notification handlers for foreground and background
   */
  private setupNotificationHandlers(): void {
    // Handle foreground notifications with toast display
    messaging().onMessage(async (remoteMessage) => {
      console.log('[NotificationService] Received foreground message:', remoteMessage);

      const title = remoteMessage.notification?.title || 'ClueMe Reminder';
      const body = remoteMessage.notification?.body || '';
      
      // Show as local notification for immediate display
      PushNotification.localNotification({
        title: title,
        message: body,
        playSound: true,
        soundName: 'default',
        userInfo: remoteMessage.data,
      });
    });

    // Handle background notifications
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('[NotificationService] Received background message:', remoteMessage);
      // Background messages are handled automatically by iOS
    });
  }

  /**
   * Format date using UK locale and timezone
   */
  private formatUKDate(date: Date): string {
    return this.ukDateFormatter.format(date);
  }

  /**
   * Format time using UK locale and timezone
   */
  private formatUKTime(date: Date): string {
    return this.ukTimeFormatter.format(date);
  }

  /**
   * Calculate notification time with UK timezone awareness
   */
  private calculateNotificationTime(reminder: ReminderData, timing: NotificationTiming): Date {
    try {
      let baseTime: Date;
      
      if (reminder.dueTime && reminder.dueDate) {
        const timeParts = reminder.dueTime.split(':');
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        
        baseTime = new Date(reminder.dueDate);
        baseTime.setHours(hours, minutes, 0, 0);
      } else {
        baseTime = new Date(reminder.dueDate || Date.now());
      }

      // Apply timing offset
      const notificationTime = new Date(baseTime);
      
      switch (timing.type) {
        case 'before':
          notificationTime.setMinutes(notificationTime.getMinutes() - timing.value);
          break;
        case 'after':
          notificationTime.setMinutes(notificationTime.getMinutes() + timing.value);
          break;
        case 'exact':
        default:
          break;
      }

      return notificationTime;
    } catch (error) {
      console.error('[NotificationService] Error calculating notification time:', error);
      return new Date();
    }
  }

  /**
   * Generate user-friendly notification title
   */
  private getNotificationTitle(reminder: ReminderData, timing: NotificationTiming): string {
    const priorityIcon = reminder.priority === 'high' ? '🔴 ' : reminder.priority === 'medium' ? '🟡 ' : '';
    
    switch (timing.type) {
      case 'before':
        return `${priorityIcon}Reminder: ${reminder.title}`;
      case 'after':
        return `${priorityIcon}Overdue: ${reminder.title}`;
      case 'exact':
      default:
        return `${priorityIcon}Due Now: ${reminder.title}`;
    }
  }

  /**
   * Generate user-friendly notification body with UK formatting
   */
  private getNotificationBody(reminder: ReminderData, timing: NotificationTiming): string {
    const dueTime = reminder.dueTime ? ` at ${reminder.dueTime}` : '';
    const dueDate = reminder.dueDate ? this.formatUKDate(new Date(reminder.dueDate)) : 'today';
    
    let message = '';
    
    switch (timing.type) {
      case 'before':
        if (timing.value === 15) {
          message = `Due in 15 minutes${dueTime ? ` (${dueTime})` : ''}`;
        } else if (timing.value === 30) {
          message = `Due in 30 minutes${dueTime ? ` (${dueTime})` : ''}`;
        } else if (timing.value === 60) {
          message = `Due in 1 hour${dueTime ? ` (${dueTime})` : ''}`;
        } else {
          message = `Due on ${dueDate}${dueTime}`;
        }
        break;
      case 'after':
        message = `Was due on ${dueDate}${dueTime}`;
        break;
      case 'exact':
      default:
        message = `Due now${dueTime ? ` (${dueTime})` : ''}`;
        break;
    }

    // Add description if available
    if (reminder.description) {
      message += `\n${reminder.description}`;
    }

    return message;
  }

  /**
   * Schedule a local notification for iOS
   */
  private scheduleLocalNotification(reminder: ReminderData, timing: NotificationTiming): void {
    try {
      const notificationTime = this.calculateNotificationTime(reminder, timing);
      
      // Only schedule if the notification time is in the future
      if (notificationTime <= new Date()) {
        console.log(`[NotificationService] Skipping past notification time: ${this.formatUKTime(notificationTime)}`);
        return;
      }

      const notificationId = `${reminder.id}-${timing.type}-${timing.value}`;
      
      const userInfo: NotificationUserInfo = {
        reminderId: reminder.id,
        type: 'reminder',
        timing: JSON.stringify(timing),
      };

      PushNotification.localNotificationSchedule({
        id: notificationId,
        title: this.getNotificationTitle(reminder, timing),
        message: this.getNotificationBody(reminder, timing),
        date: notificationTime,
        allowWhileIdle: true,
        playSound: true,
        soundName: 'default',
        userInfo,
      });

      console.log(`[NotificationService] Scheduled notification for ${this.formatUKDate(notificationTime)} at ${this.formatUKTime(notificationTime)}`);
    } catch (error) {
      console.error('[NotificationService] Error scheduling local notification:', error);
    }
  }

  /**
   * Schedule notifications for a reminder
   */
  public async scheduleReminderNotifications(reminder: ReminderData): Promise<void> {
    if (Platform.OS !== 'ios') {
      console.warn('[NotificationService] iOS-only service called on non-iOS platform');
      return;
    }

    try {
      console.log(`[NotificationService] Scheduling notifications for reminder: ${reminder.title}`);

      // Cancel any existing notifications for this reminder
      await this.cancelReminderNotifications(reminder.id);

      // Get notification timings
      const notificationTimings = reminder.notificationTimings || DEFAULT_NOTIFICATION_TIMINGS;

      // Schedule local notifications
      if (reminder.recurring) {
        await this.scheduleRecurringNotifications(reminder, notificationTimings);
      } else {
        notificationTimings.forEach((timing) => {
          this.scheduleLocalNotification(reminder, timing);
        });
      }

      // Schedule cloud notifications for assigned users
      if (reminder.coOwners && reminder.coOwners.length > 0) {
        await this.scheduleCloudNotifications(reminder, notificationTimings);
      }

      console.log(`[NotificationService] Successfully scheduled notifications for: ${reminder.title}`);
    } catch (error) {
      console.error(`[NotificationService] Error scheduling notifications:`, error);
      throw error;
    }
  }

  /**
   * Schedule recurring notifications (simplified)
   */
  private async scheduleRecurringNotifications(reminder: ReminderData, timings: NotificationTiming[]): Promise<void> {
    try {
      const occurrences = this.generateRecurringOccurrences(reminder, 30);
      
      console.log(`[NotificationService] Generated ${occurrences.length} recurring occurrences`);
      
      occurrences.forEach((occurrenceDate) => {
        const reminderWithOccurrence = {
          ...reminder,
          dueDate: occurrenceDate.toISOString(),
        };

        timings.forEach((timing) => {
          this.scheduleLocalNotification(reminderWithOccurrence, timing);
        });
      });
    } catch (error) {
      console.error('[NotificationService] Error scheduling recurring notifications:', error);
    }
  }

  /**
   * Generate recurring occurrences (simplified)
   */
  private generateRecurringOccurrences(reminder: ReminderData, maxOccurrences: number): Date[] {
    const occurrences: Date[] = [];
    const baseDate = new Date(reminder.dueDate || Date.now());
    const pattern = reminder.recurring?.pattern || 'daily';
    const interval = reminder.recurring?.interval || 1;

    for (let i = 0; i < maxOccurrences; i++) {
      const occurrence = new Date(baseDate);
      
      switch (pattern) {
        case 'daily':
          occurrence.setDate(baseDate.getDate() + (i * interval));
          break;
        case 'weekly':
          occurrence.setDate(baseDate.getDate() + (i * interval * 7));
          break;
        case 'monthly':
          occurrence.setMonth(baseDate.getMonth() + (i * interval));
          break;
        default:
          occurrence.setDate(baseDate.getDate() + i);
      }

      if (occurrence > new Date()) {
        occurrences.push(occurrence);
      }
    }

    return occurrences;
  }

  /**
   * Schedule cloud notifications for assigned users
   */
  private async scheduleCloudNotifications(reminder: ReminderData, timings: NotificationTiming[]): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return;

      const assignedUsers = reminder.coOwners?.filter(userId => userId !== currentUser.uid) || [];
      
      if (assignedUsers.length === 0) return;

      console.log(`[NotificationService] Scheduling cloud notifications for ${assignedUsers.length} users`);

      for (const userId of assignedUsers) {
        for (const timing of timings) {
          const notificationTime = this.calculateNotificationTime(reminder, timing);
          
          if (notificationTime <= new Date()) continue;

          await firestore().collection('scheduledNotifications').add({
            reminderId: reminder.id,
            userId: userId,
            scheduledTime: firestore.Timestamp.fromDate(notificationTime),
            notificationType: this.getNotificationTypeFromTiming(timing),
            priority: reminder.priority || 'medium',
            status: 'pending',
            createdAt: firestore.FieldValue.serverTimestamp(),
            familyId: reminder.familyId,
            assignedBy: currentUser.uid,
            reminderTitle: reminder.title,
            platform: 'ios',
            locale: UK_LOCALE,
            timezone: UK_TIMEZONE,
          });
        }
      }
    } catch (error) {
      console.error('[NotificationService] Error scheduling cloud notifications:', error);
    }
  }

  /**
   * Get notification type from timing for cloud functions
   */
  private getNotificationTypeFromTiming(timing: NotificationTiming): string {
    if (timing.type === 'exact') return 'due';
    if (timing.type === 'before') {
      if (timing.value === 15) return '15min';
      if (timing.value === 30) return '30min';
      if (timing.value === 60) return '1hour';
      return 'custom';
    }
    return 'after';
  }

  /**
   * Cancel notifications for a specific reminder
   */
  public async cancelReminderNotifications(reminderId: string): Promise<void> {
    try {
      console.log(`[NotificationService] Cancelling notifications for reminder: ${reminderId}`);
      
      const notifications = await this.getScheduledNotifications();
      let cancelledCount = 0;
      
      for (const notification of notifications) {
        const userInfo = notification.userInfo as NotificationUserInfo;
        if (userInfo?.reminderId === reminderId) {
          PushNotification.cancelLocalNotification(notification.id);
          cancelledCount++;
        }
      }
      
      console.log(`[NotificationService] Cancelled ${cancelledCount} notifications`);
    } catch (error) {
      console.error(`[NotificationService] Error cancelling notifications:`, error);
      throw error;
    }
  }

  /**
   * Get all scheduled notifications
   */
  public getScheduledNotifications(): Promise<any[]> {
    return new Promise((resolve) => {
      PushNotification.getScheduledLocalNotifications((notifications) => {
        resolve(notifications);
      });
    });
  }

  /**
   * Send test notification
   */
  public async sendTestNotification(): Promise<void> {
    try {
      const now = new Date();
      const testTime = new Date(now.getTime() + 5000); // 5 seconds from now
      
      PushNotification.localNotificationSchedule({
        id: 'test-notification',
        title: '🧪 ClueMe Test',
        message: `Test notification sent at ${this.formatUKTime(now)} on ${this.formatUKDate(now)}`,
        date: testTime,
        allowWhileIdle: true,
        playSound: true,
        soundName: 'default',
      });

      console.log(`[NotificationService] Test notification scheduled for ${this.formatUKTime(testTime)}`);
    } catch (error) {
      console.error('[NotificationService] Error sending test notification:', error);
      throw error;
    }
  }

  /**
   * Get FCM token and save to Firestore
   */
  public async getFCMToken(): Promise<string | null> {
    try {
      console.log('[NotificationService] Getting FCM token...');
      
      const token = await messaging().getToken();
      console.log(`[NotificationService] FCM token received: ${token ? token.substring(0, 20) + '...' : 'null'}`);
      
      if (token) {
        const currentUser = auth().currentUser;
        if (currentUser) {
          const firestoreInstance = getFirestoreInstance();
          await firestoreInstance.collection('users').doc(currentUser.uid).update({
            fcmTokens: firestore.FieldValue.arrayUnion(token),
            lastTokenUpdate: firestore.FieldValue.serverTimestamp(),
            platform: 'ios',
            locale: UK_LOCALE,
            timezone: UK_TIMEZONE,
          });
          console.log('[NotificationService] FCM token saved to Firestore');
        }
      }
      
      return token;
    } catch (error) {
      console.error('[NotificationService] Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Check if notifications are enabled
   */
  public async areNotificationsEnabled(): Promise<boolean> {
    try {
      const authStatus = await messaging().hasPermission();
      return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
             authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    } catch (error) {
      console.error('[NotificationService] Error checking notification permissions:', error);
      return false;
    }
  }

  /**
   * Cancel all notifications
   */
  public cancelAllNotifications(): void {
    PushNotification.cancelAllLocalNotifications();
    console.log('[NotificationService] All notifications cancelled');
  }

  /**
   * Check if service is initialized
   */
  public isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.isInitialized = false;
    console.log('[NotificationService] Service cleaned up');
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
