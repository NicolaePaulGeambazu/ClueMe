import { AppState, AppStateStatus } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import notificationService from './notificationService';
import auth from '@react-native-firebase/auth';

export interface GlobalNotificationData {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'assignment';
  data?: Record<string, any>;
  reminderId?: string;
  assignedBy?: string;
  assignedByDisplayName?: string;
}

class GlobalNotificationService {
  private isInitialized = false;
  private appState: AppStateStatus = 'active';
  private toastCallbacks: Array<(notification: GlobalNotificationData) => void> = [];

  async initialize(): Promise<void> {
    if (this.isInitialized) {return;}

    try {
      console.log('[GlobalNotificationService] Initializing global notification service...');

      // Initialize the underlying notification service
      await notificationService.initialize();

      // Set up app state listener
      AppState.addEventListener('change', this.handleAppStateChange);

      // Set up Firebase messaging listeners
      this.setupFirebaseMessaging();

      // Set up push notification listeners
      this.setupPushNotificationListeners();

      this.isInitialized = true;
      console.log('[GlobalNotificationService] Global notification service initialized successfully');
    } catch (error) {
      console.error('[GlobalNotificationService] Error initializing:', error);
    }
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    console.log(`[GlobalNotificationService] App state changed from ${this.appState} to ${nextAppState}`);
    this.appState = nextAppState;

    // When app comes to foreground, sync assigned task notifications
    if (nextAppState === 'active' && this.appState !== 'active') {
      console.log('[GlobalNotificationService] App came to foreground, syncing assigned task notifications');
      setTimeout(async () => {
        try {
          await notificationService.syncAssignedTaskNotifications();
        } catch (error) {
          console.error('[GlobalNotificationService] Error syncing assigned tasks on app foreground:', error);
        }
      }, 2000); // Small delay to ensure Firebase is ready
    }
  };

  private setupFirebaseMessaging(): void {
    // Handle foreground messages (when app is open)
    messaging().onMessage(async (remoteMessage) => {
      console.log('[GlobalNotificationService] Received foreground message:', remoteMessage);

      if (this.appState === 'active') {
        // Show toast notification for foreground
        this.showToastNotification({
          title: remoteMessage.notification?.title || 'New Notification',
          message: remoteMessage.notification?.body || '',
          type: this.getNotificationType(remoteMessage.data?.type as string),
          data: remoteMessage.data,
          reminderId: remoteMessage.data?.reminderId as string,
          assignedBy: remoteMessage.data?.assignedBy as string,
          assignedByDisplayName: remoteMessage.data?.assignedByDisplayName as string,
        });
      }
    });

    // Handle background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('[GlobalNotificationService] Received background message:', remoteMessage);

      // For background messages, we rely on the system push notification
      // The notification will be shown by the OS
    });
  }

  private setupPushNotificationListeners(): void {
    // Note: PushNotification event listeners are not available in this version
    // We'll rely on Firebase messaging for cross-platform notification handling
    console.log('[GlobalNotificationService] Push notification listeners setup skipped');
  }

  private getNotificationType(type?: string): 'success' | 'error' | 'warning' | 'info' | 'assignment' {
    switch (type) {
      case 'task_assigned':
      case 'assignment':
        return 'assignment';
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  }

  private handleNotificationOpen(notification: any): void {
    // Handle navigation based on notification type
    const reminderId = notification.userInfo?.reminderId || notification.data?.reminderId;

    if (reminderId) {
      // Navigate to reminder detail
      console.log('[GlobalNotificationService] Navigating to reminder:', reminderId);
      // You can implement navigation logic here
    }
  }

  // Register callback for toast notifications
  registerToastCallback(callback: (notification: GlobalNotificationData) => void): void {
    this.toastCallbacks.push(callback);
  }

  // Unregister callback for toast notifications
  unregisterToastCallback(callback: (notification: GlobalNotificationData) => void): void {
    const index = this.toastCallbacks.indexOf(callback);
    if (index > -1) {
      this.toastCallbacks.splice(index, 1);
    }
  }

  // Show toast notification (for foreground)
  private showToastNotification(notification: GlobalNotificationData): void {
    console.log('[GlobalNotificationService] Showing toast notification:', notification);

    // Notify all registered callbacks
    this.toastCallbacks.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('[GlobalNotificationService] Error in toast callback:', error);
      }
    });
  }

  // Send assignment notification (handles both foreground and background)
  async sendAssignmentNotification(
    reminderId: string,
    reminderTitle: string,
    assignedByUserId: string,
    assignedByDisplayName: string,
    assignedToUserIds: string[]
  ): Promise<void> {
    try {
      console.log('[GlobalNotificationService] Sending assignment notification');

      const currentUser = auth().currentUser;

      // Send to assigned users via the notification service
      await notificationService.sendAssignmentNotification(
        reminderId,
        reminderTitle,
        assignedByUserId,
        assignedByDisplayName,
        assignedToUserIds
      );

      // If current user is assigned, show immediate toast if app is active
      if (currentUser && assignedToUserIds.includes(currentUser.uid) && this.appState === 'active') {
        this.showToastNotification({
          title: '📋 New Task Assigned!',
          message: `${assignedByDisplayName} assigned you: ${reminderTitle}`,
          type: 'assignment',
          reminderId,
          assignedBy: assignedByUserId,
          assignedByDisplayName,
        });
      }

    } catch (error) {
      console.error('[GlobalNotificationService] Error sending assignment notification:', error);
    }
  }

  // Send general notification
  async sendNotification(notification: GlobalNotificationData, userIds?: string[]): Promise<void> {
    try {
      console.log('[GlobalNotificationService] Sending general notification');

      if (userIds && userIds.length > 0) {
        // Send to specific users
        for (const userId of userIds) {
                  await notificationService.sendNotificationToUser(userId, {
          title: notification.title,
          body: notification.message,
          type: 'general',
          data: notification.data,
        });
        }
      } else {
        // Send to current user if app is active
        const currentUser = auth().currentUser;
        if (currentUser && this.appState === 'active') {
          this.showToastNotification(notification);
        }
      }

    } catch (error) {
      console.error('[GlobalNotificationService] Error sending notification:', error);
    }
  }

  // Schedule reminder notifications (delegates to notificationService)
  async scheduleReminderNotifications(reminderData: any): Promise<void> {
    try {
      console.log('[GlobalNotificationService] Scheduling reminder notifications');
      await notificationService.scheduleReminderNotifications(reminderData);
    } catch (error) {
      console.error('[GlobalNotificationService] Error scheduling reminder notifications:', error);
      throw error;
    }
  }

  // Update reminder notifications (delegates to notificationService)
  async updateReminderNotifications(reminderData: any): Promise<void> {
    try {
      console.log('[GlobalNotificationService] Updating reminder notifications');
      await notificationService.updateReminderNotifications(reminderData);
    } catch (error) {
      console.error('[GlobalNotificationService] Error updating reminder notifications:', error);
      throw error;
    }
  }

  // Cancel reminder notifications (delegates to notificationService)
  async cancelReminderNotifications(reminderId: string): Promise<void> {
    try {
      console.log('[GlobalNotificationService] Cancelling reminder notifications');
      await notificationService.cancelReminderNotifications(reminderId);
    } catch (error) {
      console.error('[GlobalNotificationService] Error cancelling reminder notifications:', error);
      throw error;
    }
  }

  // Cancel occurrence notification (delegates to notificationService)
  cancelOccurrenceNotification(reminderId: string, occurrenceDate: Date): void {
    try {
      console.log('[GlobalNotificationService] Cancelling occurrence notification');
      notificationService.cancelOccurrenceNotification(reminderId, occurrenceDate);
    } catch (error) {
      console.error('[GlobalNotificationService] Error cancelling occurrence notification:', error);
    }
  }

  // Schedule occurrence notification (delegates to notificationService)
  scheduleOccurrenceNotification(reminder: any, occurrenceDate: Date): void {
    try {
      console.log('[GlobalNotificationService] Scheduling occurrence notification');
      notificationService.scheduleOccurrenceNotification(reminder, occurrenceDate);
    } catch (error) {
      console.error('[GlobalNotificationService] Error scheduling occurrence notification:', error);
    }
  }

  // Test notification system
  async testNotificationSystem(): Promise<void> {
    try {
      console.log('[GlobalNotificationService] Testing notification system...');

      const testNotification: GlobalNotificationData = {
        title: '🧪 Test Notification',
        message: 'This is a test notification from the global notification service',
        type: 'info',
      };

      if (this.appState === 'active') {
        // Show toast for foreground
        this.showToastNotification(testNotification);
      } else {
        // Send push notification for background
        const currentUser = auth().currentUser;
        if (currentUser) {
          await notificationService.sendNotificationToUser(currentUser.uid, {
            title: testNotification.title,
            body: testNotification.message,
            type: 'general',
          });
        }
      }

    } catch (error) {
      console.error('[GlobalNotificationService] Error testing notification system:', error);
    }
  }

  // Cleanup
  cleanup(): void {
    console.log('[GlobalNotificationService] Cleaning up...');
    // Note: AppState.removeEventListener is not available in this version
    this.toastCallbacks = [];
    this.isInitialized = false;
  }
}

// Create singleton instance
const globalNotificationService = new GlobalNotificationService();

export default globalNotificationService;
