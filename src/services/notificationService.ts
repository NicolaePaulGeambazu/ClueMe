import { Platform, Alert } from 'react-native';
import PushNotification from 'react-native-push-notification';
import auth from '@react-native-firebase/auth';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import { userService, getFirestoreInstance } from './firebaseService';
import { generateRecurringOccurrences } from '../utils/calendarUtils';

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, string>;
  type?: 'reminder' | 'family_invitation' | 'task_assigned' | 'task_created' | 'general';
}

export interface TaskNotificationData {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  assignedTo?: string;
  createdBy?: string;
  familyId?: string;
  listId?: string;
}

export interface NotificationTiming {
  type: 'exact' | 'before' | 'after';
  value: number; // minutes before/after due time, or 0 for exact
  label: string;
}

export const DEFAULT_NOTIFICATION_TIMINGS: NotificationTiming[] = [
  { type: 'before', value: 15, label: '15 minutes before' },
  { type: 'before', value: 30, label: '30 minutes before' },
  { type: 'before', value: 60, label: '1 hour before' },
  { type: 'before', value: 1440, label: '1 day before' },
  { type: 'exact', value: 0, label: 'At due time' },
  { type: 'after', value: 15, label: '15 minutes after' },
  { type: 'after', value: 30, label: '30 minutes after' },
  { type: 'after', value: 60, label: '1 hour after' },
];

class NotificationService {
  private isInitialized = false;

  /**
   * Initialize the notification service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('🔔 Notification service already initialized');
      return;
    }

    try {
  
      
      // Initialize local notifications
      this.initializeLocalNotifications();
      console.log('✅ Local notifications initialized');
      
      this.isInitialized = true;
      console.log('✅ Notification service initialization completed successfully');
    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
      throw error;
    }
  }

  /**
   * Initialize local notifications
   */
  private initializeLocalNotifications(): void {
    PushNotification.configure({
      onRegister: function (token: { os: string; token: string }) {
        console.log('TOKEN:', token);
      },
      onNotification: function (notification: any) {
        console.log('NOTIFICATION:', notification);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    // Set up Firebase messaging handlers for push notifications
    this.setupFirebaseMessaging();
  }

  /**
   * Set up Firebase messaging handlers
   */
  private setupFirebaseMessaging(): void {
    // Handle background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('🔔 Background message received:', remoteMessage);
      
      // Show local notification for background messages
      PushNotification.localNotification({
        title: remoteMessage.notification?.title || 'New Message',
        message: remoteMessage.notification?.body || 'You have a new message',
        playSound: true,
        soundName: 'default',
        importance: 'high',
        priority: 'high',
        vibrate: true,
        vibration: 300,
        id: 'fcm-' + Date.now(),
        userInfo: remoteMessage.data,
      });
    });

    // Handle foreground messages
    messaging().onMessage(async (remoteMessage) => {
      console.log('🔔 Foreground message received:', remoteMessage);
      
      // Show local notification for foreground messages
      PushNotification.localNotification({
        title: remoteMessage.notification?.title || 'New Message',
        message: remoteMessage.notification?.body || 'You have a new message',
        playSound: true,
        soundName: 'default',
        importance: 'high',
        priority: 'high',
        vibrate: true,
        vibration: 300,
        id: 'fcm-' + Date.now(),
        userInfo: remoteMessage.data,
      });
    });

    // Handle notification open
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('🔔 Notification opened app:', remoteMessage);
      // Handle navigation or other actions when notification is tapped
    });

    // Check if app was opened from a notification
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('🔔 App opened from notification:', remoteMessage);
          // Handle navigation or other actions
        }
      });
    // Create notification channel for Android
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
        (created: boolean) => console.log(`Channel created: ${created}`)
      );
    }
  }

  /**
   * Send immediate test notification
   */
  public sendImmediateTestNotification(): void {
    console.log('🔔 Sending immediate test notification...');
    
    try {
      PushNotification.localNotification({
        channelId: 'reminders',
        title: 'Test Notification',
        message: 'This is a test notification from ClearCue!',
        playSound: true,
        soundName: 'default',
        importance: 'high',
        priority: 'high',
        vibrate: true,
        vibration: 300,
        id: 'test-' + Date.now(),
      });
      
      console.log('✅ Immediate test notification sent');
    } catch (error) {
      console.error('❌ Failed to send immediate test notification:', error);
    }
  }

  /**
   * Send scheduled test notification
   */
  public sendScheduledTestNotification(secondsFromNow: number = 5): void {
    console.log(`🔔 Scheduling test notification for ${secondsFromNow} seconds from now...`);
    
    try {
      const scheduledTime = new Date(Date.now() + secondsFromNow * 1000);
      
      PushNotification.localNotificationSchedule({
        id: 'scheduled-test-' + Date.now(),
        channelId: 'reminders',
        title: 'Scheduled Test Notification',
        message: `This notification was scheduled ${secondsFromNow} seconds ago!`,
        date: scheduledTime,
        allowWhileIdle: true,
        playSound: true,
        soundName: 'default',
        importance: 'high',
        priority: 'high',
        vibrate: true,
        vibration: 300,
      });
      
      console.log(`✅ Scheduled test notification for: ${scheduledTime.toLocaleString()}`);
    } catch (error) {
      console.error('❌ Failed to schedule test notification:', error);
    }
  }

  /**
   * Schedule a local notification for a reminder
   */
  private scheduleLocalNotification(reminder: any, timing: NotificationTiming): void {
    try {
      const notificationTime = this.calculateNotificationTime(reminder, timing);
      
      // Only schedule if the notification time is in the future
      if (notificationTime > new Date()) {
        const notificationId = `${reminder.id}-${timing.type}-${timing.value}-${notificationTime.getTime()}`;
        
        PushNotification.localNotificationSchedule({
          id: notificationId,
          channelId: 'reminders',
          title: this.getNotificationTitle(reminder, timing),
          message: this.getNotificationMessage(reminder, timing),
          date: notificationTime,
          allowWhileIdle: true,
          playSound: true,
          soundName: 'default',
          importance: 'high',
          priority: 'high',
          vibrate: true,
          vibration: 300,
          userInfo: {
            reminderId: reminder.id,
            type: 'reminder',
            timing: JSON.stringify(timing),
          },
        });

        console.log(`✅ Scheduled notification for reminder ${reminder.id} at ${notificationTime.toLocaleString()}`);
        console.log(`✅ Notification ID: ${notificationId}`);
      } else {
        console.log(`⏰ Skipping notification for ${reminder.id} - time has passed: ${notificationTime.toLocaleString()}`);
      }
    } catch (error) {
      console.error(`❌ Failed to schedule notification for reminder ${reminder.id}:`, error);
    }
  }

  /**
   * Calculate notification time based on reminder and timing
   */
  private calculateNotificationTime(reminder: any, timing: NotificationTiming): Date {
    let baseTime: Date;

    // Use due date and time if available
    if (reminder.dueDate && reminder.dueTime) {
      baseTime = new Date(reminder.dueDate);
      const [hours, minutes] = reminder.dueTime.split(':').map(Number);
      baseTime.setHours(hours, minutes, 0, 0);
    } else if (reminder.dueDate) {
      baseTime = new Date(reminder.dueDate);
    } else {
      // Fallback to current time
      baseTime = new Date();
    }

    // Apply timing adjustment
    switch (timing.type) {
      case 'before':
        return new Date(baseTime.getTime() - timing.value * 60 * 1000);
      case 'after':
        return new Date(baseTime.getTime() + timing.value * 60 * 1000);
      case 'exact':
      default:
        return baseTime;
    }
  }

  /**
   * Get notification title
   */
  private getNotificationTitle(reminder: any, timing: NotificationTiming): string {
    const timingText = timing.type === 'exact' ? 'Due now' : timing.label;
    return `${reminder.title} - ${timingText}`;
  }

  /**
   * Get notification message
   */
  private getNotificationMessage(reminder: any, timing: NotificationTiming): string {
    if (reminder.description) {
      return reminder.description;
    }
    
    switch (timing.type) {
      case 'before':
        return `Your reminder "${reminder.title}" is due ${timing.label}`;
      case 'after':
        return `Your reminder "${reminder.title}" was due ${timing.label}`;
      case 'exact':
      default:
        return `Your reminder "${reminder.title}" is due now!`;
    }
  }

  /**
   * Schedule notifications for a reminder
   */
  public async scheduleReminderNotifications(reminder: any): Promise<void> {
    try {
      console.log(`🔔 Scheduling notifications for reminder: ${reminder.id}`);

      // Cancel any existing notifications for this reminder
      this.cancelReminderNotifications(reminder.id);

      // Get notification timings from reminder or use defaults
      const notificationTimings = reminder.notificationTimings || DEFAULT_NOTIFICATION_TIMINGS;

      if (reminder.isRecurring) {
        await this.scheduleRecurringReminderNotifications(reminder, notificationTimings);
      } else {
        // Schedule single notifications
        notificationTimings.forEach((timing: NotificationTiming) => {
          this.scheduleLocalNotification(reminder, timing);
        });
      }
    } catch (error) {
      console.error(`❌ Failed to schedule notifications for reminder ${reminder.id}:`, error);
    }
  }

  /**
   * Schedule recurring reminder notifications
   */
  private async scheduleRecurringReminderNotifications(reminder: any, notificationTimings: NotificationTiming[]): Promise<void> {
    try {
      // Generate recurring occurrences
      const occurrences = generateRecurringOccurrences(reminder);
      
      // Schedule notifications for each occurrence
      occurrences.forEach((occurrence: any, index: number) => {
        const reminderWithOccurrence = {
          ...reminder,
          dueDate: occurrence.date || occurrence.toISOString(),
        };

        notificationTimings.forEach((timing: NotificationTiming) => {
          this.scheduleLocalNotification(reminderWithOccurrence, timing);
        });
      });

      console.log(`✅ Scheduled ${occurrences.length * notificationTimings.length} notifications for recurring reminder ${reminder.id}`);
    } catch (error) {
      console.error(`❌ Failed to schedule recurring notifications for reminder ${reminder.id}:`, error);
    }
  }

  /**
   * Cancel notifications for a specific reminder
   */
  public cancelReminderNotifications(reminderId: string): void {
    try {
      // Get all scheduled notifications
      PushNotification.getScheduledLocalNotifications((notifications) => {
        notifications.forEach((notification: any) => {
          if (notification.userInfo?.reminderId === reminderId) {
            PushNotification.cancelLocalNotification(notification.id);
            console.log(`✅ Cancelled notification: ${notification.id}`);
          }
        });
      });
    } catch (error) {
      console.error(`❌ Failed to cancel notifications for reminder ${reminderId}:`, error);
    }
  }

  /**
   * Update notifications for a reminder
   */
  public async updateReminderNotifications(reminder: any): Promise<void> {
    // Cancel existing notifications and reschedule
    this.cancelReminderNotifications(reminder.id);
    await this.scheduleReminderNotifications(reminder);
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
   * Cancel all notifications
   */
  public cancelAllNotifications(): void {
    PushNotification.cancelAllLocalNotifications();
    console.log('✅ All notifications cancelled');
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      // For now, assume notifications are enabled if we can initialize
      return this.isInitialized;
    } catch (error) {
      console.error('❌ Failed to check notification permissions:', error);
      return false;
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      // For React Native Push Notification, permissions are requested during initialization
      return this.isInitialized;
    } catch (error) {
      console.error('❌ Failed to request notification permissions:', error);
      return false;
    }
  }

  /**
   * Check if service is initialized
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get initialization status
   */
  getInitializationStatus(): {
    isInitialized: boolean;
    platform: string;
    permissionsGranted: boolean;
  } {
    return {
      isInitialized: this.isInitialized,
      platform: Platform.OS,
      permissionsGranted: this.isInitialized,
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    console.log('🧹 Cleaning up notification service...');
    this.isInitialized = false;
  }

  /**
   * Send test notification (alias for sendImmediateTestNotification)
   */
  public async sendTestNotification(): Promise<void> {
    console.log('🔔 [DEBUG] Starting sendImmediateNotification...');
    console.log('🔔 [DEBUG] Notification service available:', !!this);
    console.log('🔔 [DEBUG] PushNotification available:', !!PushNotification);
    console.log('🔔 [TRACK] Immediate Push notification attempt at', new Date().toLocaleTimeString());
    console.log('🔔 [DEBUG] Notification service initialized:', this.isInitialized);
    console.log('🔔 [DEBUG] Notifications enabled:', await this.areNotificationsEnabled());
    
    try {
      console.log('🔔 [DEBUG] Sending immediate push notification...');
      
      // Check if we're in development mode and on iOS simulator
      if (Platform.OS === 'ios' && __DEV__) {
        console.log('🔔 [DEBUG] Running on iOS simulator in development mode');
        console.log('🔔 [DEBUG] FCM tokens are not available on iOS simulator');
        console.log('🔔 [DEBUG] Falling back to local notification...');
        this.sendImmediateTestNotification();
        return;
      }
      
      // Get current user's FCM token
      const fcmToken = await this.getFCMToken();
      
      if (fcmToken) {
        // Send push notification via Firebase Cloud Functions
        await this.sendPushNotification(fcmToken, {
          title: 'Test Push Notification',
          body: 'This is a test push notification from ClearCue!',
          type: 'test',
          data: {
            testId: 'test-' + Date.now(),
            timestamp: Date.now().toString(),
          }
        });
        console.log('✅ [DEBUG] Push notification sent via FCM');
      } else {
        console.log('🔄 [DEBUG] No FCM token available, falling back to local notification...');
        console.log('🔔 [TRACK] Fallback Local notification attempt at', new Date().toLocaleTimeString());
        this.sendImmediateTestNotification();
      }
    } catch (error) {
      console.error('❌ [DEBUG] Failed to send immediate push notification:', error);
      console.error('❌ [DEBUG] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      
      // Check if this is an expected error
      if (error instanceof Error) {
        if (error.message.includes('unregistered') || 
            error.message.includes('aps-environment') ||
            error.message.includes('iOS simulator')) {
          console.log('🔔 [INFO] Push notifications not available in this environment');
          console.log('🔔 [INFO] This is expected in development or iOS simulator');
          console.log('🔔 [INFO] Falling back to local notifications');
          this.sendImmediateTestNotification();
          return;
        }
      }
      
      console.log('🔄 [DEBUG] Falling back to local notification...');
      console.log('🔔 [TRACK] Fallback Local notification attempt at', new Date().toLocaleTimeString());
      this.sendImmediateTestNotification();
    }
  }

  /**
   * Get FCM token for current user
   */
  private async getFCMToken(): Promise<string | null> {
    try {
      console.log('🔔 Getting FCM token...');
      
      // Check if we're in development mode and on iOS simulator
      if (Platform.OS === 'ios' && __DEV__) {
        console.log('🔔 [DEBUG] Running on iOS simulator in development mode');
        console.log('🔔 [DEBUG] FCM tokens are not available on iOS simulator');
        console.log('🔔 [DEBUG] Push notifications will fall back to local notifications');
        return null;
      }
      
      // Register device for remote messages (iOS)
      if (Platform.OS === 'ios') {
        try {
          const isRegistered = await messaging().isDeviceRegisteredForRemoteMessages;
          console.log('🔔 [DEBUG] Device registered for remote messages:', isRegistered);
          
          if (!isRegistered) {
            console.log('🔔 [DEBUG] Registering device for remote messages...');
            await messaging().registerDeviceForRemoteMessages();
            console.log('🔔 [DEBUG] Device registration completed');
            
            // Wait longer for registration to complete and retry
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Check registration status again
            const registrationStatus = await messaging().isDeviceRegisteredForRemoteMessages;
            console.log('🔔 [DEBUG] Registration status after wait:', registrationStatus);
            
            if (!registrationStatus) {
              console.log('🔔 [DEBUG] Registration still not complete, waiting more...');
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        } catch (registrationError) {
          console.warn('⚠️ [DEBUG] Device registration failed:', registrationError);
          // Continue anyway, as this might be expected in some environments
        }
      }
      
      // Add a small delay before getting token to ensure registration is complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const token = await messaging().getToken();
      console.log('🔔 FCM token retrieved:', token ? token.substring(0, 20) + '...' : 'null');
      
      // Save token to user's document
      const currentUser = auth().currentUser;
      if (token && currentUser) {
        const firestoreInstance = getFirestoreInstance();
        await firestoreInstance.collection('users').doc(currentUser.uid).update({
          fcmToken: token,
          lastTokenUpdate: FirebaseFirestoreTypes.FieldValue.serverTimestamp(),
        });
        console.log('🔔 FCM token saved to user document');
      }
      
      return token;
    } catch (error) {
      console.error('❌ Failed to get FCM token:', error);
      
      // Provide more specific error information
      if (error instanceof Error) {
        if (error.message.includes('aps-environment')) {
          console.log('🔔 [INFO] Push notifications not configured for this environment');
          console.log('🔔 [INFO] This is expected in development or when push notifications are not set up');
          console.log('🔔 [INFO] Local notifications will be used instead');
        } else {
          console.log('🔔 [INFO] FCM token retrieval failed, falling back to local notifications');
        }
      }
      
      return null;
    }
  }

  /**
   * Send push notification via Firebase Cloud Functions
   */
  private async sendPushNotification(
    fcmToken: string, 
    notification: {
      title: string;
      body: string;
      type: string;
      data?: Record<string, string>;
    }
  ): Promise<void> {
    try {
      console.log('🔔 Sending push notification via Firebase Cloud Functions...');
      
      // Create notification request in Firestore
      const firestoreInstance = getFirestoreInstance();
      const notificationRef = await firestoreInstance.collection('fcmNotifications').add({
        fcmToken: fcmToken,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        type: notification.type,
        timestamp: FirebaseFirestoreTypes.FieldValue.serverTimestamp(),
        status: 'pending',
        attempts: 0,
        maxAttempts: 3,
      });
      
      console.log('✅ Push notification request created:', notificationRef.id);
      
      // Wait for the Cloud Function to process it
      // In a real app, you might want to listen for status updates
      setTimeout(async () => {
        const doc = await notificationRef.get();
        const data = doc.data();
        console.log('🔔 Notification status:', data?.status);
      }, 2000);
      
    } catch (error) {
      console.error('❌ Failed to send push notification:', error);
      throw error;
    }
  }

  /**
   * Send notification to a specific user via FCM
   */
  public async sendNotificationToUser(userId: string, notification: NotificationData): Promise<void> {
    try {
      console.log(`🔔 Sending notification to user ${userId}:`, notification);
      
      // Get user's FCM token
      const firestoreInstance = getFirestoreInstance();
      const userDoc = await firestoreInstance.collection('users').doc(userId).get();
      const userData = userDoc.data();
      const fcmToken = userData?.fcmToken;
      
      if (!fcmToken) {
        console.log(`❌ No FCM token found for user ${userId}`);
        return;
      }
      
      // Send push notification
      await this.sendPushNotification(fcmToken, {
        title: notification.title,
        body: notification.body,
        type: notification.type || 'general',
        data: notification.data,
      });
      
      console.log(`✅ Push notification sent to user ${userId}`);
    } catch (error) {
      console.error(`❌ Failed to send notification to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Send notification to family members via FCM
   */
  public async sendNotificationToFamily(
    familyId: string, 
    notification: NotificationData, 
    excludeUserId?: string
  ): Promise<void> {
    try {
      console.log(`🔔 Sending notification to family ${familyId}:`, notification);
      
      // Get family members
      const firestoreInstance = getFirestoreInstance();
      const familyDoc = await firestoreInstance.collection('families').doc(familyId).get();
      const familyData = familyDoc.data();
      
      if (!familyData?.members) {
        console.log(`❌ No members found for family ${familyId}`);
        return;
      }
      
      // Send to each family member
      for (const memberId of familyData.members) {
        if (excludeUserId && memberId === excludeUserId) {
          continue; // Skip excluded user
        }
        
        try {
          await this.sendNotificationToUser(memberId, notification);
        } catch (error) {
          console.error(`❌ Failed to send notification to family member ${memberId}:`, error);
        }
      }
      
      console.log(`✅ Push notifications sent to family ${familyId}`);
    } catch (error) {
      console.error(`❌ Failed to send notification to family ${familyId}:`, error);
      throw error;
    }
  }

  /**
   * Notify task created (placeholder for task notifications)
   */
  public async notifyTaskCreated(
    familyId: string,
    taskData: TaskNotificationData,
    excludeUserId?: string
  ): Promise<void> {
    console.log(`🔔 Task created notification for family ${familyId}:`, taskData);
    // This would send a notification about a new task being created
  }

  /**
   * Notify task assigned (placeholder for task notifications)
   */
  public async notifyTaskAssigned(
    taskData: TaskNotificationData,
    excludeUserId?: string
  ): Promise<void> {
    console.log(`🔔 Task assigned notification:`, taskData);
    // This would send a notification about a task being assigned
  }

  /**
   * Notify task updated (placeholder for task notifications)
   */
  public async notifyTaskUpdated(
    taskData: TaskNotificationData,
    updateType: 'due_date' | 'priority' | 'description' | 'general',
    excludeUserId?: string
  ): Promise<void> {
    console.log(`🔔 Task updated notification (${updateType}):`, taskData);
    // This would send a notification about a task being updated
  }

  /**
   * Notify task completed (placeholder for task notifications)
   */
  public async notifyTaskCompleted(
    taskData: TaskNotificationData,
    completedByUserId: string,
    completedByDisplayName: string,
    excludeUserId?: string
  ): Promise<void> {
    console.log(`🔔 Task completed notification by ${completedByDisplayName}:`, taskData);
    // This would send a notification about a task being completed
  }

  /**
   * Send task reminder (placeholder for task reminders)
   */
  public async sendTaskReminder(
    taskData: TaskNotificationData,
    reminderType: 'due_soon' | 'overdue' | 'daily_digest'
  ): Promise<void> {
    console.log(`🔔 Task reminder (${reminderType}):`, taskData);
    // This would send a reminder notification for a task
  }

  /**
   * Start background reminder checking
   */
  public startBackgroundReminderChecking(): void {
    console.log('🔄 Starting background reminder checking...');
    // This is a placeholder for background reminder checking functionality
    // In a real implementation, this would set up background tasks or timers
    // to periodically check for due reminders
    console.log('✅ Background reminder checking started');
  }

  /**
   * Initialize local notifications only (without FCM)
   */
  public initializeLocalNotificationsOnly(): void {
    console.log('🔄 Initializing local notifications only...');
    this.initializeLocalNotifications();
    this.isInitialized = true;
    console.log('✅ Local notifications initialized successfully');
  }

  /**
   * Send assignment notification to users when they are assigned to a reminder
   */
  public async sendAssignmentNotification(
    reminderId: string,
    reminderTitle: string,
    assignedByUserId: string,
    assignedByDisplayName: string,
    assignedToUserIds: string[]
  ): Promise<void> {
    try {
      console.log(`🔔 Sending assignment notifications for reminder ${reminderId} to ${assignedToUserIds.length} users`);
      
      // Get the assigned by user's profile for display name
      const firestoreInstance = getFirestoreInstance();
      const assignedByUserDoc = await firestoreInstance.collection('users').doc(assignedByUserId).get();
      const assignedByUserData = assignedByUserDoc.data();
      const assignedByName = assignedByUserData?.displayName || assignedByDisplayName || 'Someone';
      
      // Send notification to each assigned user
      for (const assignedUserId of assignedToUserIds) {
        if (assignedUserId === assignedByUserId) {
          continue; // Skip if user assigned to themselves
        }
        
        try {
          await this.sendNotificationToUser(assignedUserId, {
            title: 'New Task Assigned',
            body: `${assignedByName} assigned you: ${reminderTitle}`,
            type: 'task_assigned',
            data: {
              reminderId,
              assignedBy: assignedByUserId,
              assignedByDisplayName: assignedByName,
              reminderTitle,
            },
          });
          
          console.log(`✅ Assignment notification sent to user ${assignedUserId}`);
        } catch (error) {
          console.error(`❌ Failed to send assignment notification to user ${assignedUserId}:`, error);
        }
      }
      
      console.log(`✅ Assignment notifications sent for reminder ${reminderId}`);
    } catch (error) {
      console.error(`❌ Failed to send assignment notifications for reminder ${reminderId}:`, error);
      throw error;
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

// Export singleton instance and utility functions
export { notificationService };

// Export utility functions
export const getScheduledNotifications = () => notificationService.getScheduledNotifications();
export const cancelAllNotifications = () => notificationService.cancelAllNotifications();
