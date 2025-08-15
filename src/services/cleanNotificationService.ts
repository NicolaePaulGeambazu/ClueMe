/**
 * Clean iOS-only Notification Service
 * Replaces the hybrid notification system with a pure iOS implementation
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
 * Clean iOS-only notification service
 * Completely replaces hybrid notification system
 */
class CleanNotificationService {
  private isInitialized = false;
  private ukDateFormatter: Intl.DateTimeFormat;
  private ukTimeFormatter: Intl.DateTimeFormat;
  private ukDateTimeFormatter: Intl.DateTimeFormat;

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
   * Initialize the clean notification system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('[CleanNotificationService] Initializing clean iOS notification system...');
      
      if (Platform.OS === 'ios') {
        // Request notification permissions through iOS bridge
        await iOSNotificationBridge.requestPermissions();
        
        // Set up notification action listeners
        this.setupNotificationActionListeners();
      }
      
      // Set up Firebase messaging handlers
      this.setupFirebaseMessaging();
      
      // Get and save FCM token
      await this.getFCMToken();
      
      this.isInitialized = true;
      console.log('[CleanNotificationService] Clean iOS notification system initialized successfully');
    } catch (error) {
      console.error('[CleanNotificationService] Error initializing:', error);
      throw error;
    }
  }

  /**
   * Set up notification action listeners
   */
  private setupNotificationActionListeners(): void {
    if (Platform.OS !== 'ios') return;

    // Listen for mark complete actions
    iOSNotificationBridge.addNotificationActionListener('markComplete', (event) => {
      console.log('[CleanNotificationService] Mark complete action:', event);
      this.handleMarkCompleteAction(event.reminderId);
    });

    // Listen for snooze actions
    iOSNotificationBridge.addNotificationActionListener('snooze', (event) => {
      console.log('[CleanNotificationService] Snooze action:', event);
      this.handleSnoozeAction(event.reminderId, (event as any).snoozeUntil);
    });

    // Listen for view actions
    iOSNotificationBridge.addNotificationActionListener('view', (event) => {
      console.log('[CleanNotificationService] View action:', event);
      this.handleViewAction(event.reminderId);
    });
  }

  /**
   * Set up Firebase messaging handlers
   */
  private setupFirebaseMessaging(): void {
    // Handle foreground notifications
    messaging().onMessage(async (remoteMessage) => {
      console.log('[CleanNotificationService] Received foreground message:', remoteMessage);
      
      // For iOS, the native notification system will handle display
      // We just log the message here
    });

    // Handle background notifications
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('[CleanNotificationService] Received background message:', remoteMessage);
      // Background messages are handled automatically by iOS
    });

    // Handle notification opened app (from background)
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('[CleanNotificationService] Notification opened app from background:', remoteMessage);
      this.handleNotificationTap(remoteMessage);
    });

    // Handle notification opened app (from quit state)
    messaging().getInitialNotification().then((remoteMessage) => {
      if (remoteMessage) {
        console.log('[CleanNotificationService] Notification opened app from quit state:', remoteMessage);
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
        console.log('[CleanNotificationService] Handling notification tap for reminder:', reminderId);
        this.handleViewAction(reminderId);
      }
    } catch (error) {
      console.error('[CleanNotificationService] Error handling notification tap:', error);
    }
  }

  /**
   * Handle mark complete action
   */
  private async handleMarkCompleteAction(reminderId: string): Promise<void> {
    try {
      console.log('[CleanNotificationService] Marking reminder complete:', reminderId);
      
      // Update reminder in Firestore
      const currentUser = auth().currentUser;
      if (currentUser) {
        const firestoreInstance = getFirestoreInstance();
        await firestoreInstance.collection('reminders').doc(reminderId).update({
          completed: true,
          completedAt: firestore.FieldValue.serverTimestamp(),
          completedBy: currentUser.uid,
        });
        
        // Cancel remaining notifications for this reminder
        await this.cancelReminderNotifications(reminderId);
        
        console.log('[CleanNotificationService] Reminder marked complete:', reminderId);
      }
    } catch (error) {
      console.error('[CleanNotificationService] Error marking reminder complete:', error);
    }
  }

  /**
   * Handle snooze action
   */
  private async handleSnoozeAction(reminderId: string, snoozeUntil: Date): Promise<void> {
    try {
      console.log('[CleanNotificationService] Snoozing reminder:', reminderId, 'until:', snoozeUntil);
      
      // Cancel existing notifications
      await this.cancelReminderNotifications(reminderId);
      
      // Schedule new notification for snooze time
      if (Platform.OS === 'ios') {
        const reminder = await this.getReminderData(reminderId);
        if (reminder) {
          const title = this.getNotificationTitle(reminder, { type: 'exact', value: 0, label: 'Snoozed' });
          const body = this.getNotificationBody(reminder, { type: 'exact', value: 0, label: 'Snoozed' });
          
          await iOSNotificationBridge.scheduleLocalNotification(
            `${reminderId}-snoozed-${Date.now()}`,
            `⏰ ${title}`,
            `Snoozed: ${body}`,
            snoozeUntil,
            {
              reminderId,
              type: 'reminder',
              timing: JSON.stringify({ type: 'exact', value: 0, label: 'Snoozed' }),
            }
          );
        }
      }
      
      console.log('[CleanNotificationService] Reminder snoozed:', reminderId);
    } catch (error) {
      console.error('[CleanNotificationService] Error snoozing reminder:', error);
    }
  }

  /**
   * Handle view action
   */
  private handleViewAction(reminderId: string): void {
    try {
      console.log('[CleanNotificationService] Opening reminder view:', reminderId);
      
      // Emit event for app navigation
      // This can be handled by the app's navigation system
      // For now, we just log it
    } catch (error) {
      console.error('[CleanNotificationService] Error handling view action:', error);
    }
  }

  /**
   * Get reminder data from Firestore
   */
  private async getReminderData(reminderId: string): Promise<ReminderData | null> {
    try {
      const firestoreInstance = getFirestoreInstance();
      const doc = await firestoreInstance.collection('reminders').doc(reminderId).get();
      
      if (doc.exists) {
        return { id: doc.id, ...doc.data() } as ReminderData;
      }
      
      return null;
    } catch (error) {
      console.error('[CleanNotificationService] Error getting reminder data:', error);
      return null;
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
      console.error('[CleanNotificationService] Error calculating notification time:', error);
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
   * Schedule notifications for a reminder
   */
  public async scheduleReminderNotifications(reminder: ReminderData): Promise<void> {
    try {
      console.log(`[CleanNotificationService] Scheduling notifications for reminder: ${reminder.title}`);

      // Cancel any existing notifications for this reminder
      await this.cancelReminderNotifications(reminder.id);

      // Get notification timings
      const notificationTimings = reminder.notificationTimings || DEFAULT_NOTIFICATION_TIMINGS;

      if (Platform.OS === 'ios') {
        // Schedule local notifications using iOS bridge
        if (reminder.recurring) {
          await this.scheduleRecurringLocalNotifications(reminder, notificationTimings);
        } else {
          await this.scheduleLocalNotifications(reminder, notificationTimings);
        }
      }

      // Schedule cloud notifications for assigned users
      if (reminder.coOwners && reminder.coOwners.length > 0) {
        await this.scheduleCloudNotifications(reminder, notificationTimings);
      }

      console.log(`[CleanNotificationService] Successfully scheduled notifications for: ${reminder.title}`);
    } catch (error) {
      console.error(`[CleanNotificationService] Error scheduling notifications:`, error);
      throw error;
    }
  }

  /**
   * Schedule local notifications using iOS bridge
   */
  private async scheduleLocalNotifications(reminder: ReminderData, timings: NotificationTiming[]): Promise<void> {
    if (Platform.OS !== 'ios') return;

    try {
      for (const timing of timings) {
        const notificationTime = this.calculateNotificationTime(reminder, timing);
        
        // Only schedule future notifications
        if (notificationTime > new Date()) {
          const identifier = `${reminder.id}-${timing.type}-${timing.value}`;
          const title = this.getNotificationTitle(reminder, timing);
          const body = this.getNotificationBody(reminder, timing);
          
          const userInfo = {
            reminderId: reminder.id,
            type: 'reminder',
            timing: JSON.stringify(timing),
            title: reminder.title,
            body: body,
          };

          await iOSNotificationBridge.scheduleLocalNotification(
            identifier,
            title,
            body,
            notificationTime,
            userInfo
          );

          console.log(`[CleanNotificationService] Scheduled local notification for ${this.formatUKDateTime(notificationTime)}`);
        }
      }
    } catch (error) {
      console.error('[CleanNotificationService] Error scheduling local notifications:', error);
    }
  }

  /**
   * Schedule recurring local notifications
   */
  private async scheduleRecurringLocalNotifications(reminder: ReminderData, timings: NotificationTiming[]): Promise<void> {
    try {
      const occurrences = this.generateRecurringOccurrences(reminder, 30);
      
      console.log(`[CleanNotificationService] Generated ${occurrences.length} recurring occurrences`);
      
      for (const occurrenceDate of occurrences) {
        const reminderWithOccurrence = {
          ...reminder,
          dueDate: occurrenceDate.toISOString(),
        };

        await this.scheduleLocalNotifications(reminderWithOccurrence, timings);
      }
    } catch (error) {
      console.error('[CleanNotificationService] Error scheduling recurring local notifications:', error);
    }
  }

  /**
   * Schedule cloud notifications using Firestore
   */
  private async scheduleCloudNotifications(reminder: ReminderData, timings: NotificationTiming[]): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return;

      const assignedUsers = reminder.coOwners?.filter(userId => userId !== currentUser.uid) || [];
      
      for (const userId of assignedUsers) {
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

            console.log(`[CleanNotificationService] Scheduled cloud notification for ${this.formatUKDateTime(notificationTime)}`);
          }
        }
      }
    } catch (error) {
      console.error('[CleanNotificationService] Error scheduling cloud notifications:', error);
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
      console.log(`[CleanNotificationService] Cancelling notifications for reminder: ${reminderId}`);
      
      // Cancel local notifications (iOS)
      if (Platform.OS === 'ios') {
        await iOSNotificationBridge.cancelNotificationsForReminder(reminderId);
      }
      
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
        console.log(`[CleanNotificationService] Cancelled ${cancelledCount} cloud notifications for reminder: ${reminderId}`);
      }
    } catch (error) {
      console.error(`[CleanNotificationService] Error cancelling notifications for reminder ${reminderId}:`, error);
      throw error;
    }
  }

  /**
   * Send test notification
   */
  public async sendTestNotification(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await iOSNotificationBridge.sendTestNotification();
        console.log('[CleanNotificationService] Test notification sent via iOS bridge');
      } else {
        console.log('[CleanNotificationService] Test notification not supported on this platform');
      }
    } catch (error) {
      console.error('[CleanNotificationService] Error sending test notification:', error);
      throw error;
    }
  }

  /**
   * Get FCM token and save to Firestore
   */
  public async getFCMToken(): Promise<string | null> {
    try {
      console.log('[CleanNotificationService] Getting FCM token...');
      
      const token = await messaging().getToken();
      console.log(`[CleanNotificationService] FCM token received: ${token ? token.substring(0, 20) + '...' : 'null'}`);
      
      if (token) {
        const currentUser = auth().currentUser;
        if (currentUser) {
          const firestoreInstance = getFirestoreInstance();
          await firestoreInstance.collection('users').doc(currentUser.uid).update({
            fcmTokens: firestore.FieldValue.arrayUnion(token),
            lastTokenUpdate: firestore.FieldValue.serverTimestamp(),
            platform: Platform.OS,
            locale: UK_LOCALE,
            timezone: UK_TIMEZONE,
          });
          console.log('[CleanNotificationService] FCM token saved to Firestore with UK locale');
        }
      }
      
      return token;
    } catch (error) {
      console.error('[CleanNotificationService] Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Check if notifications are enabled
   */
  public async areNotificationsEnabled(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        return await iOSNotificationBridge.checkPermissions();
      } else {
        const authStatus = await messaging().hasPermission();
        return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
               authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      }
    } catch (error) {
      console.error('[CleanNotificationService] Error checking notification permissions:', error);
      return false;
    }
  }

  /**
   * Get pending notification count
   */
  public async getPendingNotificationCount(): Promise<number> {
    try {
      if (Platform.OS === 'ios') {
        return await iOSNotificationBridge.getPendingNotificationCount();
      }
      return 0;
    } catch (error) {
      console.error('[CleanNotificationService] Error getting pending notification count:', error);
      return 0;
    }
  }

  /**
   * Set badge count
   */
  public async setBadgeCount(count: number): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await iOSNotificationBridge.setBadgeCount(count);
      }
    } catch (error) {
      console.error('[CleanNotificationService] Error setting badge count:', error);
    }
  }

  /**
   * Clear badge
   */
  public async clearBadge(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await iOSNotificationBridge.clearBadge();
      }
    } catch (error) {
      console.error('[CleanNotificationService] Error clearing badge:', error);
    }
  }

  /**
   * Cancel all notifications
   */
  public async cancelAllNotifications(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await iOSNotificationBridge.cancelAllNotifications();
      }
      console.log('[CleanNotificationService] All notifications cancelled');
    } catch (error) {
      console.error('[CleanNotificationService] Error cancelling all notifications:', error);
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
    if (Platform.OS === 'ios') {
      iOSNotificationBridge.removeAllListeners();
    }
    this.isInitialized = false;
    console.log('[CleanNotificationService] Service cleaned up');
  }
}

// Create singleton instance
const cleanNotificationService = new CleanNotificationService();

export default cleanNotificationService;
