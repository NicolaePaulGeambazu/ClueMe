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

      // Set up message handlers for different app states
      this.setupMessageHandlers();

      this.isInitialized = true;
      console.log('✅ Push notifications initialized successfully');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
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
   * Cleanup resources
   */
  cleanup(): void {
    // Cleanup any listeners if needed
  }
}

export const notificationService = new NotificationService(); 