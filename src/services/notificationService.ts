import messaging from '@react-native-firebase/messaging';
import { Platform, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import { userService, familyService } from './firebaseService';

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, string>;
  type?: 'reminder' | 'family_invitation' | 'general';
}

class NotificationService {
  private fcmToken: string | null = null;
  private isInitialized = false;

  /**
   * Initialize the notification service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

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

      // Set up message handlers
      this.setupMessageHandlers();

      this.isInitialized = true;
      console.log('Notification service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  /**
   * Get FCM token and save it to user's profile
   */
  private async getFCMToken(): Promise<void> {
    try {
      const token = await messaging().getToken();
      this.fcmToken = token;
      
      // Save token to user's profile in Firestore
      const currentUser = auth().currentUser;
      if (currentUser) {
        await userService.updateUserProfile(currentUser.uid, {
          fcmToken: token,
          lastTokenUpdate: new Date().toISOString(),
        });
      }

      console.log('FCM Token:', token);
    } catch (error) {
      console.error('Failed to get FCM token:', error);
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
      console.log('Notification opened app:', remoteMessage);
      this.handleNotificationOpen(remoteMessage);
    });

    // Handle notification open when app is closed
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('Initial notification:', remoteMessage);
          this.handleNotificationOpen(remoteMessage);
        }
      });

    // Handle token refresh
    messaging().onTokenRefresh((token) => {
      console.log('FCM token refreshed:', token);
      this.fcmToken = token;
      this.updateTokenInFirestore(token);
    });
  }

  /**
   * Show local notification (for foreground messages)
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
    
    if (!data) return;

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
   * Send notification to specific user
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
      // or your own backend service
    } catch (error) {
      console.error('Failed to send notification to user:', error);
    }
  }

  /**
   * Send notification to family members
   */
  async sendNotificationToFamily(
    familyId: string,
    notification: NotificationData,
    excludeUserId?: string
  ): Promise<void> {
    try {
      // Get family members
      const familyMembers = await familyService.getFamilyMembers(familyId);
      
      // Send notification to each member (except excluded user)
      const promises = familyMembers
        .filter((member: any) => member.userId !== excludeUserId)
        .map((member: any) => this.sendNotificationToUser(member.userId, notification));

      await Promise.all(promises);
      console.log('Sent notification to family members');
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
        return authStatus === messaging.AuthorizationStatus.AUTHORIZED;
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
        return authStatus === messaging.AuthorizationStatus.AUTHORIZED;
      }
      return true;
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  /**
   * Clean up notification service
   */
  cleanup(): void {
    this.isInitialized = false;
    this.fcmToken = null;
  }
}

export const notificationService = new NotificationService(); 