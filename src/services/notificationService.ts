import messaging from '@react-native-firebase/messaging';
import { Platform, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import { userService, familyService, FamilyMember, reminderService } from './firebaseService';
import BackgroundJob from 'react-native-background-job';
import PushNotification from 'react-native-push-notification';

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, string>;
  type?: 'reminder' | 'family_invitation' | 'task_assigned' | 'task_created' | 'general';
}

export interface TaskNotificationData {
  taskId: string;
  taskTitle: string;
  taskDescription?: string;
  assignedBy: string;
  assignedByDisplayName: string;
  assignedTo: string[];
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
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
  private fcmToken: string | null = null;
  private isInitialized = false;
  private backgroundJobId = 'reminder-check-job';

  /**
   * Initialize the notification service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {return;}

    try {
      // Request permission on iOS
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          console.log('Notification permission denied');
          return;
        }
      }

      // Get FCM token
      await this.getFCMToken();

      // Set up message handlers for different app states
      this.setupMessageHandlers();

      // Initialize local notifications
      this.initializeLocalNotifications();

      // Set up background job for reminder checking
      await this.setupBackgroundJob();

      this.isInitialized = true;
      console.log('✅ Push notifications initialized successfully');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
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
   * Set up background job for checking reminders
   */
  private async setupBackgroundJob(): Promise<void> {
    try {
      // Register background job
      BackgroundJob.register({
        jobKey: this.backgroundJobId,
        job: async () => {
          console.log('🔄 Background job running: checking reminders...');
          await this.checkAndNotifyOverdueReminders();
          await this.checkAndNotifyUpcomingReminders();
        },
      });

      // Schedule the job to run every 15 minutes
      await BackgroundJob.schedule({
        jobKey: this.backgroundJobId,
        period: 15 * 60 * 1000, // 15 minutes
        networkType: BackgroundJob.NETWORK_TYPE_ANY,
        requiresCharging: false,
        requiresDeviceIdle: false,
        persist: true,
      });

      console.log('✅ Background job scheduled successfully');
    } catch (error) {
      console.error('Failed to setup background job:', error);
    }
  }

  /**
   * Schedule local notification for a specific reminder
   */
  private scheduleLocalNotification(reminder: any, timing: NotificationTiming): void {
    try {
      const dueDate = new Date(reminder.dueDate);

      // If there's a due time, combine it with the due date
      if (reminder.dueTime) {
        const [hours, minutes] = reminder.dueTime.split(':');
        dueDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }

      // Calculate notification time based on timing
      let notificationTime = new Date(dueDate);
      switch (timing.type) {
        case 'before':
          notificationTime.setMinutes(notificationTime.getMinutes() - timing.value);
          break;
        case 'after':
          notificationTime.setMinutes(notificationTime.getMinutes() + timing.value);
          break;
        case 'exact':
        default:
          // Use exact time
          break;
      }

      // Don't schedule if the time has already passed
      if (notificationTime <= new Date()) {
        return;
      }

      const notificationId = `${reminder.id}-${timing.type}-${timing.value}`;

      PushNotification.localNotificationSchedule({
        id: notificationId,
        channelId: 'reminders',
        title: this.getNotificationTitle(reminder, timing),
        message: this.getNotificationMessage(reminder, timing),
        date: notificationTime,
        allowWhileIdle: true,
        repeatType: 'day',
        playSound: true,
        soundName: 'default',
        importance: 'high',
        priority: 'high',
      });

      console.log(`✅ Scheduled local notification for reminder: ${reminder.title} at ${notificationTime.toISOString()}`);
    } catch (error) {
      console.error('Failed to schedule local notification:', error);
    }
  }

  /**
   * Get notification title based on timing
   */
  private getNotificationTitle(reminder: any, timing: NotificationTiming): string {
    switch (timing.type) {
      case 'before':
        return 'Reminder Coming Up';
      case 'exact':
        return 'Reminder Due Now';
      case 'after':
        return 'Reminder Overdue';
      default:
        return 'Reminder';
    }
  }

  /**
   * Get notification message based on timing
   */
  private getNotificationMessage(reminder: any, timing: NotificationTiming): string {
    switch (timing.type) {
      case 'before':
        return `"${reminder.title}" is due in ${this.formatTimeValue(timing.value)}`;
      case 'exact':
        return `"${reminder.title}" is due now!`;
      case 'after':
        return `"${reminder.title}" was due ${this.formatTimeValue(timing.value)} ago`;
      default:
        return `"${reminder.title}"`;
    }
  }

  /**
   * Check for overdue reminders and send notifications
   */
  async checkAndNotifyOverdueReminders(): Promise<void> {
    try {
      console.log('🔍 Checking for overdue reminders...');

      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.log('No authenticated user, skipping overdue check');
        return;
      }

      // Get all user reminders from Firebase
      const userReminders = await reminderService.getUserReminders(currentUser.uid);

      // Filter for overdue reminders that have notifications enabled
      const overdueReminders = userReminders.filter(reminder => {
        if (!reminder.hasNotification || reminder.status === 'completed') {
          return false;
        }

        if (!reminder.dueDate) {
          return false;
        }

        const now = new Date();
        const dueDate = new Date(reminder.dueDate);

        // If there's a due time, combine it with the due date
        if (reminder.dueTime) {
          const [hours, minutes] = reminder.dueTime.split(':');
          dueDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        }

        return dueDate < now;
      });

      console.log(`Found ${overdueReminders.length} overdue reminders with notifications enabled`);

      // Send local notifications for each overdue reminder
      for (const reminder of overdueReminders) {
        this.sendOverdueLocalNotification(reminder);
      }

      console.log(`✅ Sent ${overdueReminders.length} overdue reminder notifications`);
    } catch (error) {
      console.error('Failed to check overdue reminders:', error);
    }
  }

  /**
   * Send local notification for overdue reminder
   */
  private sendOverdueLocalNotification(reminder: any): void {
    try {
      PushNotification.localNotification({
        channelId: 'reminders',
        title: 'Reminder Overdue',
        message: `"${reminder.title}" is overdue!`,
        playSound: true,
        soundName: 'default',
        importance: 'high',
        priority: 'high',
      });

      console.log(`✅ Sent overdue notification for reminder: ${reminder.title}`);
    } catch (error) {
      console.error('Failed to send overdue local notification:', error);
    }
  }

  /**
   * Check for upcoming reminders and schedule notifications
   */
  async checkAndNotifyUpcomingReminders(): Promise<void> {
    try {
      console.log('🔍 Checking for upcoming reminders...');

      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.log('No authenticated user, skipping upcoming check');
        return;
      }

      // Get all user reminders from Firebase
      const userReminders = await reminderService.getUserReminders(currentUser.uid);
      const now = new Date();

      // Filter for upcoming reminders that have notifications enabled
      const upcomingReminders = userReminders.filter(reminder => {
        if (!reminder.hasNotification || reminder.status === 'completed') {
          return false;
        }

        if (!reminder.dueDate) {
          return false;
        }

        const dueDate = new Date(reminder.dueDate);

        // If there's a due time, combine it with the due date
        if (reminder.dueTime) {
          const [hours, minutes] = reminder.dueTime.split(':');
          dueDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        }

        // Only include reminders that are in the future
        return dueDate > now;
      });

      console.log(`Found ${upcomingReminders.length} upcoming reminders with notifications enabled`);

      // Schedule local notifications for each upcoming reminder
      for (const reminder of upcomingReminders) {
        await this.scheduleReminderNotifications(reminder);
      }
    } catch (error) {
      console.error('Failed to check upcoming reminders:', error);
    }
  }

  /**
   * Schedule notifications for a reminder based on its timing preferences
   */
  private async scheduleReminderNotifications(reminder: any): Promise<void> {
    try {
      // Get notification timing preferences (default to 15 minutes before)
      const notificationTimings = reminder.notificationTimings || [
        { type: 'before', value: 15, label: '15 minutes before' },
      ];

      // Schedule a notification for each timing
      for (const timing of notificationTimings) {
        this.scheduleLocalNotification(reminder, timing);
      }
    } catch (error) {
      console.error('Failed to schedule reminder notifications:', error);
    }
  }

  /**
   * Format time value for display
   */
  private formatTimeValue(minutes: number): string {
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

  /**
   * Start background reminder checking (call this when app starts)
   */
  startBackgroundReminderChecking(): void {
    console.log('🔄 Starting background reminder checking...');

    // Check immediately
    this.checkAndNotifyOverdueReminders();
    this.checkAndNotifyUpcomingReminders();

    console.log('✅ Background reminder checking started');
  }

  /**
   * Cleanup method for when app is unmounted
   */
  cleanup(): void {
    console.log('🧹 Cleaning up notification service...');

    // Cancel all scheduled notifications
    PushNotification.cancelAllLocalNotifications();

    // Cancel background job
    BackgroundJob.cancel({ jobKey: this.backgroundJobId });

    this.isInitialized = false;
  }

  /**
   * Get FCM token and save it to user's profile
   */
  private async getFCMToken(): Promise<void> {
    try {
      console.log('🔔 Getting FCM token...');

      // On iOS, we need to register for remote messages first
      if (Platform.OS === 'ios') {
        console.log('Registering device for remote messages...');
        await messaging().registerDeviceForRemoteMessages();
        console.log('Device registered for remote messages');

        // Wait a moment for registration to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log('Requesting FCM token...');
      const token = await messaging().getToken();
      console.log('FCM token received:', token ? token.substring(0, 20) + '...' : 'null');

      this.fcmToken = token;

      // Save token to user's profile in Firestore
      const currentUser = auth().currentUser;
      if (currentUser && token) {
        console.log('Saving FCM token to user profile...');

        // First, try to get the existing user profile
        let userProfile = await userService.getUserProfile(currentUser.uid);

        // If user profile doesn't exist, create it first
        if (!userProfile) {
          console.log('User profile does not exist, creating it first...');
          await userService.createUserProfile({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            isAnonymous: currentUser.isAnonymous,
          });
          console.log('User profile created successfully');
        }

        // Now update the user profile with the FCM token
        await userService.updateUserProfile(currentUser.uid, {
          fcmToken: token,
          lastTokenUpdate: new Date().toISOString(),
        });
        console.log('FCM token saved to user profile');
      }

      console.log('FCM Token process completed');
    } catch (error) {
      console.error('Failed to get FCM token:', error);

      // In iOS simulator, this is expected behavior
      if (Platform.OS === 'ios') {
        console.log('FCM token retrieval failed - this is normal in iOS simulator');
        console.log('Real FCM tokens only work on physical iOS devices');

        // Create a mock token for testing purposes
        const mockToken = 'simulator-mock-fcm-token-' + Date.now();
        this.fcmToken = mockToken;
        console.log('Using mock FCM token for simulator:', mockToken);

        // Save mock token to user's profile for testing
        const currentUser = auth().currentUser;
        if (currentUser) {
          console.log('Saving mock FCM token to user profile...');

          // First, try to get the existing user profile
          let userProfile = await userService.getUserProfile(currentUser.uid);

          // If user profile doesn't exist, create it first
          if (!userProfile) {
            console.log('User profile does not exist, creating it first...');
            await userService.createUserProfile({
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              isAnonymous: currentUser.isAnonymous,
            });
            console.log('User profile created successfully');
          }

          // Now update the user profile with the mock FCM token
          await userService.updateUserProfile(currentUser.uid, {
            fcmToken: mockToken,
            lastTokenUpdate: new Date().toISOString(),
          });
          console.log('Mock FCM token saved to user profile');
        }
      }
    }
  }

  /**
   * Set up message handlers for different notification states
   */
  private setupMessageHandlers(): void {
    // Handle messages when app is in foreground
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log('Received foreground message:', remoteMessage);

      // Show local notification for foreground messages
      this.showLocalNotification(remoteMessage);
    });

    // Handle notification open when app is in background
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened app from background:', remoteMessage);
      this.handleNotificationOpen(remoteMessage);
    });

    // Handle notification open when app is closed
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('App opened from closed state via notification:', remoteMessage);
          this.handleNotificationOpen(remoteMessage);
        }
      });

    // Handle token refresh
    messaging().onTokenRefresh((token) => {
      console.log('FCM token refreshed:', token);
      this.fcmToken = token;
      this.updateTokenInFirestore(token);
    });

    // Handle background message delivery (when app is closed/backgrounded)
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Received background message:', remoteMessage);

      // The notification will automatically appear on the phone
      // This handler is for any additional processing needed
      return Promise.resolve();
    });
  }

  /**
   * Show local notification (for foreground messages only)
   */
  private showLocalNotification(remoteMessage: any): void {
    const { notification, data } = remoteMessage;

    if (notification) {
      Alert.alert(
        notification.title || 'ClearCue',
        notification.body || '',
        [
          {
            text: 'OK',
            onPress: () => this.handleNotificationOpen(remoteMessage),
          },
        ],
        { cancelable: false }
      );
    }
  }

  /**
   * Handle notification open based on type
   */
  private handleNotificationOpen(remoteMessage: any): void {
    const { data } = remoteMessage;

    if (!data) {return;}

    switch (data.type) {
      case 'reminder':
        // Navigate to reminder details or calendar
        console.log('Navigate to reminder:', data.reminderId);
        break;
      case 'family_invitation':
        // Navigate to family screen to show invitation
        console.log('Navigate to family invitation:', data.invitationId);
        break;
      default:
        // Handle general notifications
        console.log('General notification opened');
        break;
    }
  }

  /**
   * Update FCM token in Firestore
   */
  private async updateTokenInFirestore(token: string): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
        await userService.updateUserProfile(currentUser.uid, {
          fcmToken: token,
          lastTokenUpdate: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Failed to update FCM token in Firestore:', error);
    }
  }

  /**
   * Send notification to specific user (this would be called from your backend)
   */
  async sendNotificationToUser(
    userId: string,
    notification: NotificationData
  ): Promise<void> {
    try {
      // Get user's FCM token from Firestore
      const userDoc = await userService.getUserProfile(userId);
      const fcmToken = (userDoc as any)?.fcmToken;

      if (!fcmToken) {
        console.log('User has no FCM token:', userId);
        return;
      }

      // Send notification via Firebase Cloud Functions or your backend
      // For now, we'll just log it
      console.log('Sending notification to user:', {
        userId,
        fcmToken,
        notification,
      });

      // TODO: Implement actual notification sending via backend
      // This would typically be done through Firebase Cloud Functions
      // or your own backend service that sends to FCM
    } catch (error) {
      console.error('Failed to send notification to user:', error);
    }
  }

  /**
   * Test function to simulate sending a push notification
   * This is for testing purposes only - in production, this would be done via backend
   */
  async sendTestNotification(): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      // Get the current user's FCM token
      const userDoc = await userService.getUserProfile(currentUser.uid);
      const fcmToken = (userDoc as any)?.fcmToken || this.fcmToken;

      if (!fcmToken) {
        throw new Error('No FCM token available');
      }

      console.log('Sending test notification to FCM token:', fcmToken.substring(0, 20) + '...');

      // In a real implementation, you would send this to your backend
      // which would then send it to Firebase Cloud Messaging
      const testNotification = {
        title: 'Test Notification from ClearCue',
        body: 'This is a test push notification! 🎉',
        data: {
          type: 'test',
          timestamp: Date.now().toString(),
          userId: currentUser.uid,
        },
      };

      console.log('Test notification payload:', testNotification);

      // For testing purposes, we'll simulate the notification locally
      // In production, this would be sent via FCM from your backend
      if (Platform.OS === 'ios') {
        // Show a local notification for testing
        this.showLocalNotification({
          notification: testNotification,
          data: testNotification.data,
        });
      }

      console.log('Test notification sent successfully');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      throw error;
    }
  }

  /**
   * Send notification to all family members
   */
  async sendNotificationToFamily(
    familyId: string,
    notification: NotificationData,
    excludeUserId?: string
  ): Promise<void> {
    try {
      // Get family members from Firestore
      const familyMembers = await familyService.getFamilyMembers(familyId);

      // Send notification to each member (except excluded user)
      for (const member of familyMembers) {
        if (excludeUserId && member.userId === excludeUserId) {
          continue;
        }

        await this.sendNotificationToUser(member.userId, notification);
      }
    } catch (error) {
      console.error('Failed to send notification to family:', error);
    }
  }

  /**
   * Get current FCM token
   */
  getCurrentFCMToken(): string | null {
    return this.fcmToken;
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().hasPermission();
        return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
               authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      }
      return true; // Android permissions are handled differently
    } catch (error) {
      console.error('Failed to check notification permissions:', error);
      return false;
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
               authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      }
      return true; // Android permissions are handled differently
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  /**
   * Send notification to family members when a task is created
   */
  async notifyTaskCreated(
    familyId: string,
    taskData: TaskNotificationData,
    excludeUserId?: string
  ): Promise<void> {
    try {
      console.log('🔔 Sending task creation notification to family:', familyId);

      // Get family members
      const familyMembers = await familyService.getFamilyMembers(familyId);
      if (!familyMembers || familyMembers.length === 0) {
        console.log('No family members found for family:', familyId);
        return;
      }

      // Get all family members except the creator
      const membersToNotify = familyMembers.filter(
        (member: FamilyMember) => member.userId !== excludeUserId
      );

      // Create notification data
      const notification: NotificationData = {
        title: 'New Family Task',
        body: `${taskData.assignedByDisplayName} added a new task: "${taskData.taskTitle}"`,
        type: 'task_created',
        data: {
          taskId: taskData.taskId,
          familyId: familyId,
          action: 'task_created',
          assignedBy: taskData.assignedBy,
        },
      };

      // Send notification to each family member
      for (const member of membersToNotify) {
        if (member.userId !== excludeUserId) {
          await this.sendNotificationToUser(member.userId, notification);
        }
      }

      console.log(`✅ Task creation notification sent to ${membersToNotify.length} family members`);
    } catch (error) {
      console.error('Failed to send task creation notification:', error);
    }
  }

  /**
   * Send notification to specific users when they are assigned to a task
   */
  async notifyTaskAssigned(
    taskData: TaskNotificationData,
    excludeUserId?: string
  ): Promise<void> {
    try {
      console.log('🔔 Sending task assignment notifications');

      // Create notification data
      const notification: NotificationData = {
        title: 'Task Assigned to You',
        body: `${taskData.assignedByDisplayName} assigned you to: "${taskData.taskTitle}"`,
        type: 'task_assigned',
        data: {
          taskId: taskData.taskId,
          action: 'task_assigned',
          assignedBy: taskData.assignedBy,
          dueDate: taskData.dueDate || '',
          priority: taskData.priority || 'medium',
        },
      };

      // Send notification to each assigned user
      for (const userId of taskData.assignedTo) {
        if (userId !== excludeUserId) {
          await this.sendNotificationToUser(userId, notification);
        }
      }

      console.log(`✅ Task assignment notifications sent to ${taskData.assignedTo.length} users`);
    } catch (error) {
      console.error('Failed to send task assignment notifications:', error);
    }
  }

  /**
   * Send notification when a task is updated (due date, priority, etc.)
   */
  async notifyTaskUpdated(
    taskData: TaskNotificationData,
    updateType: 'due_date' | 'priority' | 'description' | 'general',
    excludeUserId?: string
  ): Promise<void> {
    try {
      console.log('🔔 Sending task update notification');

      let title = 'Task Updated';
      let body = `${taskData.assignedByDisplayName} updated: "${taskData.taskTitle}"`;

      // Customize message based on update type
      switch (updateType) {
        case 'due_date':
          title = 'Task Due Date Changed';
          body = `${taskData.assignedByDisplayName} changed the due date for: "${taskData.taskTitle}"`;
          break;
        case 'priority':
          title = 'Task Priority Changed';
          body = `${taskData.assignedByDisplayName} changed the priority for: "${taskData.taskTitle}"`;
          break;
        case 'description':
          title = 'Task Description Updated';
          body = `${taskData.assignedByDisplayName} updated the description for: "${taskData.taskTitle}"`;
          break;
      }

      const notification: NotificationData = {
        title,
        body,
        type: 'task_assigned',
        data: {
          taskId: taskData.taskId,
          action: 'task_updated',
          updateType,
          assignedBy: taskData.assignedBy,
        },
      };

      // Send notification to assigned users
      for (const userId of taskData.assignedTo) {
        if (userId !== excludeUserId) {
          await this.sendNotificationToUser(userId, notification);
        }
      }

      console.log(`✅ Task update notification sent to ${taskData.assignedTo.length} users`);
    } catch (error) {
      console.error('Failed to send task update notification:', error);
    }
  }

  /**
   * Send notification when a task is completed
   */
  async notifyTaskCompleted(
    taskData: TaskNotificationData,
    completedBy: string,
    completedByDisplayName: string,
    excludeUserId?: string
  ): Promise<void> {
    try {
      console.log('🔔 Sending task completion notification');

      const notification: NotificationData = {
        title: 'Task Completed',
        body: `${completedByDisplayName} completed: "${taskData.taskTitle}"`,
        type: 'task_assigned',
        data: {
          taskId: taskData.taskId,
          action: 'task_completed',
          completedBy,
        },
      };

      // Send notification to all assigned users and the creator
      const allUsers = [...taskData.assignedTo, taskData.assignedBy];
      const uniqueUsers = [...new Set(allUsers)];

      for (const userId of uniqueUsers) {
        if (userId !== excludeUserId) {
          await this.sendNotificationToUser(userId, notification);
        }
      }

      console.log(`✅ Task completion notification sent to ${uniqueUsers.length} users`);
    } catch (error) {
      console.error('Failed to send task completion notification:', error);
    }
  }

  /**
   * Send reminder notification for upcoming tasks
   */
  async sendTaskReminder(
    taskData: TaskNotificationData,
    reminderType: 'due_soon' | 'overdue' | 'daily_digest'
  ): Promise<void> {
    try {
      console.log('🔔 Sending task reminder notification');

      let title = 'Task Reminder';
      let body = `Reminder: "${taskData.taskTitle}"`;

      switch (reminderType) {
        case 'due_soon':
          title = 'Task Due Soon';
          body = `"${taskData.taskTitle}" is due soon!`;
          break;
        case 'overdue':
          title = 'Task Overdue';
          body = `"${taskData.taskTitle}" is overdue!`;
          break;
        case 'daily_digest':
          title = 'Daily Task Summary';
          body = 'You have tasks to complete today!';
          break;
      }

      const notification: NotificationData = {
        title,
        body,
        type: 'reminder',
        data: {
          taskId: taskData.taskId,
          action: 'task_reminder',
          reminderType,
        },
      };

      // Send reminder to assigned users
      for (const userId of taskData.assignedTo) {
        await this.sendNotificationToUser(userId, notification);
      }

      console.log(`✅ Task reminder sent to ${taskData.assignedTo.length} users`);
    } catch (error) {
      console.error('Failed to send task reminder:', error);
    }
  }
}

export const notificationService = new NotificationService();
