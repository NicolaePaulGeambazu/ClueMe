/**
 * React Native bridge interface for iOS NotificationManager
 * Provides TypeScript interface for the native iOS notification system
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

interface NotificationManagerBridgeInterface {
  // Permission methods
  requestPermissions(): Promise<boolean>;
  checkPermissions(): Promise<boolean>;
  
  // Notification scheduling methods
  scheduleLocalNotification(
    identifier: string,
    title: string,
    body: string,
    scheduledDate: Date,
    userInfo: Record<string, any>
  ): Promise<boolean>;
  
  // Notification management methods
  cancelNotification(identifier: string): Promise<boolean>;
  cancelNotificationsForReminder(reminderId: string): Promise<boolean>;
  cancelAllNotifications(): Promise<boolean>;
  getPendingNotificationCount(): Promise<number>;
  
  // Badge management methods
  setBadgeCount(count: number): Promise<boolean>;
  clearBadge(): Promise<boolean>;
  
  // Test methods
  sendTestNotification(): Promise<boolean>;
  
  // Date formatting methods
  formatUKDate(date: Date): Promise<string>;
  formatUKTime(date: Date): Promise<string>;
  formatUKDateTime(date: Date): Promise<string>;
}

// Event types
export interface NotificationActionEvent {
  reminderId: string;
  [key: string]: any;
}

export interface NotificationSnoozeEvent extends NotificationActionEvent {
  snoozeUntil: Date;
}

// Native module interface
const NotificationManagerBridge = NativeModules.NotificationManagerBridge as NotificationManagerBridgeInterface;

// Event emitter for notification events
let eventEmitter: NativeEventEmitter | null = null;

if (Platform.OS === 'ios' && NotificationManagerBridge) {
  eventEmitter = new NativeEventEmitter(NotificationManagerBridge as any);
}

/**
 * iOS Notification Bridge - TypeScript interface for native iOS notifications
 */
class iOSNotificationBridge {
  private eventEmitter: NativeEventEmitter | null;
  private eventListeners: Map<string, any> = new Map();

  constructor() {
    this.eventEmitter = eventEmitter;
  }

  // MARK: - Permission Methods

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'ios' || !NotificationManagerBridge) {
      console.warn('[iOSNotificationBridge] iOS-only feature called on non-iOS platform');
      return false;
    }

    try {
      const granted = await NotificationManagerBridge.requestPermissions();
      console.log(`[iOSNotificationBridge] Permissions granted: ${granted}`);
      return granted;
    } catch (error) {
      console.error('[iOSNotificationBridge] Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Check current notification permissions
   */
  async checkPermissions(): Promise<boolean> {
    if (Platform.OS !== 'ios' || !NotificationManagerBridge) {
      return false;
    }

    try {
      const authorized = await NotificationManagerBridge.checkPermissions();
      return authorized;
    } catch (error) {
      console.error('[iOSNotificationBridge] Error checking permissions:', error);
      return false;
    }
  }

  // MARK: - Notification Scheduling Methods

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(
    identifier: string,
    title: string,
    body: string,
    scheduledDate: Date,
    userInfo: Record<string, any> = {}
  ): Promise<boolean> {
    if (Platform.OS !== 'ios' || !NotificationManagerBridge) {
      console.warn('[iOSNotificationBridge] iOS-only feature called on non-iOS platform');
      return false;
    }

    try {
      const success = await NotificationManagerBridge.scheduleLocalNotification(
        identifier,
        title,
        body,
        scheduledDate,
        userInfo
      );
      console.log(`[iOSNotificationBridge] Scheduled notification: ${identifier}`);
      return success;
    } catch (error) {
      console.error('[iOSNotificationBridge] Error scheduling notification:', error);
      return false;
    }
  }

  // MARK: - Notification Management Methods

  /**
   * Cancel a specific notification
   */
  async cancelNotification(identifier: string): Promise<boolean> {
    if (Platform.OS !== 'ios' || !NotificationManagerBridge) {
      return false;
    }

    try {
      const success = await NotificationManagerBridge.cancelNotification(identifier);
      console.log(`[iOSNotificationBridge] Cancelled notification: ${identifier}`);
      return success;
    } catch (error) {
      console.error('[iOSNotificationBridge] Error cancelling notification:', error);
      return false;
    }
  }

  /**
   * Cancel all notifications for a specific reminder
   */
  async cancelNotificationsForReminder(reminderId: string): Promise<boolean> {
    if (Platform.OS !== 'ios' || !NotificationManagerBridge) {
      return false;
    }

    try {
      const success = await NotificationManagerBridge.cancelNotificationsForReminder(reminderId);
      console.log(`[iOSNotificationBridge] Cancelled notifications for reminder: ${reminderId}`);
      return success;
    } catch (error) {
      console.error('[iOSNotificationBridge] Error cancelling reminder notifications:', error);
      return false;
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<boolean> {
    if (Platform.OS !== 'ios' || !NotificationManagerBridge) {
      return false;
    }

    try {
      const success = await NotificationManagerBridge.cancelAllNotifications();
      console.log('[iOSNotificationBridge] Cancelled all notifications');
      return success;
    } catch (error) {
      console.error('[iOSNotificationBridge] Error cancelling all notifications:', error);
      return false;
    }
  }

  /**
   * Get count of pending notifications
   */
  async getPendingNotificationCount(): Promise<number> {
    if (Platform.OS !== 'ios' || !NotificationManagerBridge) {
      return 0;
    }

    try {
      const count = await NotificationManagerBridge.getPendingNotificationCount();
      return count;
    } catch (error) {
      console.error('[iOSNotificationBridge] Error getting pending notification count:', error);
      return 0;
    }
  }

  // MARK: - Badge Management Methods

  /**
   * Set app badge count
   */
  async setBadgeCount(count: number): Promise<boolean> {
    if (Platform.OS !== 'ios' || !NotificationManagerBridge) {
      return false;
    }

    try {
      const success = await NotificationManagerBridge.setBadgeCount(count);
      return success;
    } catch (error) {
      console.error('[iOSNotificationBridge] Error setting badge count:', error);
      return false;
    }
  }

  /**
   * Clear app badge
   */
  async clearBadge(): Promise<boolean> {
    if (Platform.OS !== 'ios' || !NotificationManagerBridge) {
      return false;
    }

    try {
      const success = await NotificationManagerBridge.clearBadge();
      return success;
    } catch (error) {
      console.error('[iOSNotificationBridge] Error clearing badge:', error);
      return false;
    }
  }

  // MARK: - Test Methods

  /**
   * Send a test notification
   */
  async sendTestNotification(): Promise<boolean> {
    if (Platform.OS !== 'ios' || !NotificationManagerBridge) {
      console.warn('[iOSNotificationBridge] iOS-only feature called on non-iOS platform');
      return false;
    }

    try {
      const success = await NotificationManagerBridge.sendTestNotification();
      console.log('[iOSNotificationBridge] Test notification sent');
      return success;
    } catch (error) {
      console.error('[iOSNotificationBridge] Error sending test notification:', error);
      return false;
    }
  }

  // MARK: - Date Formatting Methods

  /**
   * Format date using UK locale
   */
  async formatUKDate(date: Date): Promise<string> {
    if (Platform.OS !== 'ios' || !NotificationManagerBridge) {
      // Fallback to JavaScript formatting
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(date);
    }

    try {
      const formattedDate = await NotificationManagerBridge.formatUKDate(date);
      return formattedDate;
    } catch (error) {
      console.error('[iOSNotificationBridge] Error formatting UK date:', error);
      return date.toLocaleDateString('en-GB');
    }
  }

  /**
   * Format time using UK locale
   */
  async formatUKTime(date: Date): Promise<string> {
    if (Platform.OS !== 'ios' || !NotificationManagerBridge) {
      // Fallback to JavaScript formatting
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(date);
    }

    try {
      const formattedTime = await NotificationManagerBridge.formatUKTime(date);
      return formattedTime;
    } catch (error) {
      console.error('[iOSNotificationBridge] Error formatting UK time:', error);
      return date.toLocaleTimeString('en-GB', { hour12: false });
    }
  }

  /**
   * Format date and time using UK locale
   */
  async formatUKDateTime(date: Date): Promise<string> {
    if (Platform.OS !== 'ios' || !NotificationManagerBridge) {
      // Fallback to JavaScript formatting
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(date);
    }

    try {
      const formattedDateTime = await NotificationManagerBridge.formatUKDateTime(date);
      return formattedDateTime;
    } catch (error) {
      console.error('[iOSNotificationBridge] Error formatting UK date time:', error);
      return date.toLocaleString('en-GB', { hour12: false });
    }
  }

  // MARK: - Event Listeners

  /**
   * Add event listener for notification actions
   */
  addNotificationActionListener(
    eventType: 'markComplete' | 'snooze' | 'view',
    listener: (event: NotificationActionEvent | NotificationSnoozeEvent) => void
  ): void {
    if (!this.eventEmitter) return;

    const eventName = `NotificationAction${eventType.charAt(0).toUpperCase() + eventType.slice(1)}`;
    const subscription = this.eventEmitter.addListener(eventName, listener);
    this.eventListeners.set(`${eventType}_${Date.now()}`, subscription);
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    this.eventListeners.forEach((subscription) => {
      subscription.remove();
    });
    this.eventListeners.clear();
  }

  /**
   * Check if the bridge is available
   */
  isAvailable(): boolean {
    return Platform.OS === 'ios' && !!NotificationManagerBridge;
  }
}

// Create singleton instance
const iOSNotificationBridgeInstance = new iOSNotificationBridge();

export default iOSNotificationBridgeInstance;
