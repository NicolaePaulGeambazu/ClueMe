/**
 * Pure iOS UNUserNotificationCenter-based Notification Manager
 * Replaces hybrid notification system with clean iOS-only implementation
 * UK formatting and timezone support built-in
 */

import { Platform, NativeModules, NativeEventEmitter } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { getFirestoreInstance } from './firebaseService';

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
  type: 'reminder' | 'recurring' | 'assigned';
  occurrenceIndex?: number;
  assignedUserId?: string;
}

// Default notification timings with UK-friendly labels
export const DEFAULT_NOTIFICATION_TIMINGS: NotificationTiming[] = [
  { type: 'before', value: 15, label: '15 minutes before' },
  { type: 'before', value: 30, label: '30 minutes before' },
  { type: 'before', value: 60, label: '1 hour before' },
  { type: 'exact', value: 0, label: 'At due time' },
];

/**
 * iOS-only notification manager using UNUserNotificationCenter
 * Completely replaces hybrid notification system
 */
class iOSNotificationManager {
  private isInitialized = false;
  private ukDateFormatter: Intl.DateTimeFormat;
  private ukTimeFormatter: Intl.DateTimeFormat;
  private ukDateTimeFormatter: Intl.DateTimeFormat;
  private notificationEventEmitter?: NativeEventEmitter;

  constructor() {
    // Initialize UK formatters for proper localization
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

    this.ukDateTimeFormatter = new Intl.DateTimeFormat(UK_LOCALE, {
      timeZone: UK_TIMEZONE,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  /**
   * Initialize the iOS notification system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (Platform.OS !== 'ios') {
      console.warn('[iOSNotificationManager] This manager is iOS-only');
      return;
    }

    try {
      console.log('[iOSNotificationManager] Initializing pure iOS notification system...');
      
      // Request notification permissions using Firebase (which uses UNUserNotificationCenter)
      await this.requestPermissions();
      
      // Set up notification handlers
      this.setupNotificationHandlers();
      
      // Register notification categories
      await this.registerNotificationCategories();
      
      this.isInitialized = true;
      console.log('[iOSNotificationManager] iOS notification system initialized successfully');
    } catch (error) {
      console.error('[iOSNotificationManager] Error initializing:', error);
      throw error;
    }
  }

  /**
   * Request notification permissions using Firebase messaging
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission({
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
        announcement: false,
      });

      const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                     authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('[iOSNotificationManager] Notification permissions granted');
        
        // Register for remote notifications
        await messaging().registerDeviceForRemoteMessages();
        console.log('[iOSNotificationManager] Device registered for remote messages');
        
        // Get and save FCM token
        await this.getFCMToken();
      } else {
        console.log('[iOSNotificationManager] Notification permissions denied');
      }

      return enabled;
    } catch (error) {
      console.error('[iOSNotificationManager] Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Register notification categories for interactive notifications
   */
  private async registerNotificationCategories(): Promise<void> {
    try {
      // Categories will be registered via native iOS code in AppDelegate
      console.log('[iOSNotificationManager] Notification categories will be registered natively');
    } catch (error) {
      console.error('[iOSNotificationManager] Error registering categories:', error);
    }
  }

  /**
   * Set up notification handlers for foreground and background
   */
  private setupNotificationHandlers(): void {
    // Handle foreground notifications
    messaging().onMessage(async (remoteMessage) => {
      console.log('[iOSNotificationManager] Received foreground message:', remoteMessage);
      
      // For foreground notifications, we'll let the native iOS code handle display
      // This ensures proper UNUserNotificationCenter integration
    });

    // Handle background notifications
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('[iOSNotificationManager] Received background message:', remoteMessage);
      // Background messages are handled automatically by iOS UNUserNotificationCenter
    });

    // Handle notification opened app (from background)
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('[iOSNotificationManager] Notification opened app from background:', remoteMessage);
      this.handleNotificationTap(remoteMessage);
    });

    // Handle notification opened app (from quit state)
    messaging().getInitialNotification().then((remoteMessage) => {
      if (remoteMessage) {
        console.log('[iOSNotificationManager] Notification opened app from quit state:', remoteMessage);
        this.handleNotificationTap(remoteMessage);
      }
    });
  }

  /**
   * Handle notification tap events
   */
  private handleNotificationTap(remoteMessage: any): void {
    try {
      const data = remoteMessage.data;
      const reminderId = data?.reminderId;
      
      if (reminderId) {
        console.log('[iOSNotificationManager] Handling notification tap for reminder:', reminderId);
        // Emit event for app navigation
        // This can be handled by the app's navigation system
      }
    } catch (error) {
      console.error('[iOSNotificationManager] Error handling notification tap:', error);
    }
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
   * Format date and time using UK locale and timezone
   */
  private formatUKDateTime(date: Date): string {
    return this.ukDateTimeFormatter.format(date);
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
      console.error('[iOSNotificationManager] Error calculating notification time:', error);
      return new Date();
    }
  }

  /**
   * Generate notification title with UK formatting
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
   * Generate notification body with UK formatting
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
   * Schedule notifications for a reminder using Firebase Cloud Messaging
   */
  public async scheduleReminderNotifications(reminder: ReminderData): Promise<void> {
    try {
      console.log(`[iOSNotificationManager] Scheduling notifications for reminder: ${reminder.title}`);

      // Cancel any existing notifications for this reminder
      await this.cancelReminderNotifications(reminder.id);

      // Get notification timings
      const notificationTimings = reminder.notificationTimings || DEFAULT_NOTIFICATION_TIMINGS;

      // Schedule cloud notifications for the current user
      const currentUser = auth().currentUser;
      if (currentUser) {
        if (reminder.recurring) {
          await this.scheduleRecurringCloudNotifications(reminder, notificationTimings);
        } else {
          await this.scheduleCloudNotifications(reminder, notificationTimings, [currentUser.uid]);
        }
      }

      // Schedule cloud notifications for assigned users
      if (reminder.coOwners && reminder.coOwners.length > 0) {
        const assignedUsers = reminder.coOwners.filter(userId => userId !== currentUser?.uid);
        if (assignedUsers.length > 0) {
          await this.scheduleCloudNotifications(reminder, notificationTimings, assignedUsers);
        }
      }

      console.log(`[iOSNotificationManager] Successfully scheduled notifications for: ${reminder.title}`);
    } catch (error) {
      console.error(`[iOSNotificationManager] Error scheduling notifications:`, error);
      throw error;
    }
  }

  /**
   * Schedule cloud notifications using Firestore
   */
  private async scheduleCloudNotifications(
    reminder: ReminderData, 
    timings: NotificationTiming[], 
    userIds: string[]
  ): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return;

      for (const userId of userIds) {
        for (const timing of timings) {
          const notificationTime = this.calculateNotificationTime(reminder, timing);
          
          // Only schedule future notifications
          if (notificationTime > new Date()) {
            await firestore().collection('scheduledNotifications').add({
              reminderId: reminder.id,
              userId: userId,
              scheduledTime: firestore.Timestamp.fromDate(notificationTime),
              title: this.getNotificationTitle(reminder, timing),
              body: this.getNotificationBody(reminder, timing),
              notificationType: timing.type,
              priority: reminder.priority || 'medium',
              status: 'pending',
              createdAt: firestore.FieldValue.serverTimestamp(),
              familyId: reminder.familyId,
              assignedBy: currentUser.uid,
              platform: 'ios',
              locale: UK_LOCALE,
              timezone: UK_TIMEZONE,
            });

            console.log(`[iOSNotificationManager] Scheduled cloud notification for ${this.formatUKDateTime(notificationTime)}`);
          }
        }
      }
    } catch (error) {
      console.error('[iOSNotificationManager] Error scheduling cloud notifications:', error);
    }
  }

  /**
   * Schedule recurring cloud notifications
   */
  private async scheduleRecurringCloudNotifications(
    reminder: ReminderData, 
    timings: NotificationTiming[]
  ): Promise<void> {
    try {
      const occurrences = this.generateRecurringOccurrences(reminder, 30);
      
      console.log(`[iOSNotificationManager] Generated ${occurrences.length} recurring occurrences`);
      
      const currentUser = auth().currentUser;
      if (!currentUser) return;

      for (const occurrenceDate of occurrences) {
        const reminderWithOccurrence = {
          ...reminder,
          dueDate: occurrenceDate.toISOString(),
        };

        await this.scheduleCloudNotifications(reminderWithOccurrence, timings, [currentUser.uid]);
      }
    } catch (error) {
      console.error('[iOSNotificationManager] Error scheduling recurring notifications:', error);
    }
  }

  /**
   * Generate recurring occurrences
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
          occurrence.setDate(occurrence.getDate() + (i * interval));
          break;
        case 'weekly':
          occurrence.setDate(occurrence.getDate() + (i * interval * 7));
          break;
        case 'monthly':
          occurrence.setMonth(occurrence.getMonth() + (i * interval));
          break;
        case 'yearly':
          occurrence.setFullYear(occurrence.getFullYear() + (i * interval));
          break;
      }

      // Stop if we've reached the end date
      if (reminder.recurring?.endDate && occurrence > new Date(reminder.recurring.endDate)) {
        break;
      }

      occurrences.push(occurrence);
    }

    return occurrences;
  }

  /**
   * Cancel notifications for a specific reminder
   */
  public async cancelReminderNotifications(reminderId: string): Promise<void> {
    try {
      console.log(`[iOSNotificationManager] Cancelling notifications for reminder: ${reminderId}`);
      
      // Cancel scheduled cloud notifications
      const scheduledNotifications = await firestore()
        .collection('scheduledNotifications')
        .where('reminderId', '==', reminderId)
        .where('status', '==', 'pending')
        .get();

      const batch = firestore().batch();
      let cancelledCount = 0;

      scheduledNotifications.forEach((doc) => {
        batch.update(doc.ref, { status: 'cancelled' });
        cancelledCount++;
      });

      if (cancelledCount > 0) {
        await batch.commit();
        console.log(`[iOSNotificationManager] Cancelled ${cancelledCount} cloud notifications for reminder: ${reminderId}`);
      }
    } catch (error) {
      console.error(`[iOSNotificationManager] Error cancelling notifications for reminder ${reminderId}:`, error);
      throw error;
    }
  }

  /**
   * Send test notification
   */
  public async sendTestNotification(): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      const now = new Date();
      const testTime = new Date(now.getTime() + 5000); // 5 seconds from now
      
      await firestore().collection('scheduledNotifications').add({
        reminderId: 'test-notification',
        userId: currentUser.uid,
        scheduledTime: firestore.Timestamp.fromDate(testTime),
        title: '🧪 ClueMe Test',
        body: `Test notification sent at ${this.formatUKDateTime(now)}`,
        notificationType: 'exact',
        priority: 'medium',
        status: 'pending',
        createdAt: firestore.FieldValue.serverTimestamp(),
        platform: 'ios',
        locale: UK_LOCALE,
        timezone: UK_TIMEZONE,
      });

      console.log(`[iOSNotificationManager] Test notification scheduled for ${this.formatUKDateTime(testTime)}`);
    } catch (error) {
      console.error('[iOSNotificationManager] Error sending test notification:', error);
      throw error;
    }
  }

  /**
   * Get FCM token and save to Firestore
   */
  public async getFCMToken(): Promise<string | null> {
    try {
      console.log('[iOSNotificationManager] Getting FCM token...');
      
      const token = await messaging().getToken();
      console.log(`[iOSNotificationManager] FCM token received: ${token ? token.substring(0, 20) + '...' : 'null'}`);
      
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
          console.log('[iOSNotificationManager] FCM token saved to Firestore with UK locale');
        }
      }
      
      return token;
    } catch (error) {
      console.error('[iOSNotificationManager] Error getting FCM token:', error);
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
      console.error('[iOSNotificationManager] Error checking notification permissions:', error);
      return false;
    }
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
    console.log('[iOSNotificationManager] Service cleaned up');
  }
}

// Create singleton instance
const iOSNotificationManager = new iOSNotificationManager();

export default iOSNotificationManager;
