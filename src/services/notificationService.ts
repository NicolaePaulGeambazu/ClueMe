import { Platform, Alert } from 'react-native';
import PushNotification from 'react-native-push-notification';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import { userService, getFirestoreInstance } from './firebaseService';
import { generateRecurringOccurrences } from '../utils/calendarUtils';

import type { ReminderType, ReminderPriority, ReminderStatus, NotificationType, NotificationTiming as DesignSystemNotificationTiming } from '../design-system/reminders/types';

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
  type: NotificationType;
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
  priority?: ReminderPriority;
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
  type?: ReminderType;
  status?: ReminderStatus;
  coOwners?: string[]; // Array of user IDs who can manage this reminder
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationUserInfo {
  reminderId: string;
  timing: string;
  type: 'reminder' | 'recurring' | 'assigned';
  occurrenceIndex?: number;
  assignedUserId?: string;
  escalationTier?: 'gentle' | 'medium' | 'urgent' | 'normal';
}

export interface ScheduledNotification {
  id: string;
  title: string;
  message: string;
  date: Date;
  userInfo: NotificationUserInfo;
}

export const DEFAULT_NOTIFICATION_TIMINGS: NotificationTiming[] = [
  { type: 'before' as NotificationType, value: 15, label: 'reminders.notificationTiming.15minBefore' },
  { type: 'before' as NotificationType, value: 30, label: 'reminders.notificationTiming.30minBefore' },
  { type: 'before' as NotificationType, value: 60, label: 'reminders.notificationTiming.1hrBefore' },
  { type: 'before' as NotificationType, value: 1440, label: 'reminders.notificationTiming.1dayBefore' },
  { type: 'exact' as NotificationType, value: 0, label: 'reminders.notificationTiming.atDueTime' },
  { type: 'after' as NotificationType, value: 15, label: 'reminders.notificationTiming.15minAfter' },
  { type: 'after' as NotificationType, value: 30, label: 'reminders.notificationTiming.30minAfter' },
  { type: 'after' as NotificationType, value: 60, label: 'reminders.notificationTiming.1hrAfter' },
];

class NotificationService {
  private isInitialized = false;

  /**
   * Initialize the notification service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize local notifications
      await this.initializeLocalNotifications();
      
      this.isInitialized = true;
    } catch (error) {
      // Handle initialization error silently
    }
  }

  /**
   * Initialize local notifications
   */
  private async initializeLocalNotifications(): Promise<void> {
    try {
      // Configure notification channels (Android)
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
          (created: boolean) => {
            // Channel created callback
          }
        );
      }
    } catch (error) {
      // Handle local notification initialization error silently
    }
  }

  /**
   * Send immediate test notification
   */
  public async sendTestNotification(immediate: boolean = true): Promise<void> {
    try {
      if (immediate) {
        await this.sendImmediateNotification();
      } else {
        const secondsFromNow = 5;
        const scheduledTime = new Date(Date.now() + secondsFromNow * 1000);
        
        await PushNotification.localNotificationSchedule({
          channelId: 'reminders',
          title: 'Test Notification',
          message: `This is a test notification scheduled for ${scheduledTime.toLocaleString()}`,
          date: scheduledTime,
          allowWhileIdle: true,
        });
      }
    } catch (error) {
      // Handle test notification error silently
    }
  }

  private async sendImmediateNotification(): Promise<void> {
    try {
      await PushNotification.localNotification({
        channelId: 'reminders',
        title: 'Test Notification',
        message: 'This is an immediate test notification',
        playSound: true,
        soundName: 'default',
        importance: 'high',
        priority: 'high',
      });
    } catch (error) {
      // Handle immediate notification error silently
    }
  }

  /**
   * Calculate notification time based on reminder and timing with proper timezone handling
   */
  private calculateNotificationTime(reminder: ReminderData, timing: NotificationTiming): Date {
    try {
      // Parse the base time from reminder
      let baseTime: Date;
      
      if (reminder.dueTime) {
        // If dueTime is provided, combine it with dueDate
        const timeParts = reminder.dueTime.split(':');
        if (timeParts.length >= 2) {
          const hours = parseInt(timeParts[0], 10);
          const minutes = parseInt(timeParts[1], 10);
          
          if (reminder.dueDate) {
            const baseDate = new Date(reminder.dueDate);
            baseTime = new Date(baseDate);
            baseTime.setHours(hours, minutes, 0, 0);
          } else {
            baseTime = new Date();
            baseTime.setHours(hours, minutes, 0, 0);
          }
        } else {
          baseTime = new Date(reminder.dueDate || Date.now());
        }
      } else {
        // Use dueDate as the base time
        baseTime = new Date(reminder.dueDate || Date.now());
      }

      // Apply timing offset - FIXED: Remove the * 60 multiplication
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
      // Return current time as fallback
      return new Date();
    }
  }

  /**
   * Get notification title
   */
  private getNotificationTitle(reminder: ReminderData, timing: NotificationTiming): string {
    const timingText = timing.type === 'exact' ? 'Due now' : timing.label;
    return `${reminder.title} - ${timingText}`;
  }

  /**
   * Get notification message
   */
  private getNotificationMessage(reminder: ReminderData, timing: NotificationTiming): string {
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
   * Get escalation tier for notification timing
   */
  private getEscalationTier(timing: NotificationTiming): 'gentle' | 'medium' | 'urgent' | 'normal' {
    if (timing.type === 'before') {
      if (timing.value === 30) return 'gentle';
      if (timing.value === 15) return 'medium';
      if (timing.value === 5) return 'urgent';
    }
    return 'normal';
  }

  /**
   * Get notification configuration based on escalation tier
   */
  private getNotificationConfig(tier: 'gentle' | 'medium' | 'urgent' | 'normal') {
    switch (tier) {
      case 'gentle':
        return {
          soundName: 'default',
          vibration: 200,
          importance: 'default' as const,
          priority: 'default' as const,
        };
      case 'medium':
        return {
          soundName: 'default',
          vibration: 400,
          importance: 'high' as const,
          priority: 'high' as const,
        };
      case 'urgent':
        return {
          soundName: 'default',
          vibration: 600,
          importance: 'high' as const,
          priority: 'high' as const,
        };
      default:
        return {
          soundName: 'default',
          vibration: 300,
          importance: 'high' as const,
          priority: 'high' as const,
        };
    }
  }

  /**
   * Schedule a local notification for a reminder with timezone awareness and escalation support
   */
  private scheduleLocalNotification(reminder: ReminderData, timing: NotificationTiming): void {
    try {
      const notificationTime = this.calculateNotificationTime(reminder, timing);
      
      // Only schedule if the notification time is in the future
      if (notificationTime > new Date()) {
        const notificationId = `${reminder.id}-${timing.type}-${timing.value}-${notificationTime.getTime()}`;
        
        // Determine escalation tier
        const escalationTier = this.getEscalationTier(timing);
        const config = this.getNotificationConfig(escalationTier);
        
        // Add timezone information to userInfo for debugging
        const userInfo: NotificationUserInfo = {
          reminderId: reminder.id,
          type: 'reminder',
          timing: JSON.stringify(timing),
          escalationTier,
        };
        

        
        PushNotification.localNotificationSchedule({
          id: notificationId,
          channelId: 'reminders',
          title: this.getNotificationTitle(reminder, timing),
          message: this.getNotificationMessage(reminder, timing),
          date: notificationTime,
          allowWhileIdle: true,
          playSound: true,
          soundName: config.soundName,
          importance: config.importance,
          priority: config.priority,
          vibrate: true,
          vibration: config.vibration,
          userInfo,
        });

        // Notification scheduled successfully
      } else {
        // Time has passed, skip notification
      }
    } catch (error) {
      // Handle notification scheduling error silently
    }
  }

  /**
   * Schedule notifications for a reminder
   */
  public async scheduleReminderNotifications(reminder: ReminderData): Promise<void> {
    try {

      // Cancel any existing notifications for this reminder
      this.cancelReminderNotifications(reminder.id);

      // Get notification timings from reminder or use defaults
      const notificationTimings = reminder.notificationTimings || DEFAULT_NOTIFICATION_TIMINGS;

      // Schedule notifications for the reminder creator (always client-side)
      if (reminder.recurring) {
        await this.scheduleRecurringReminderNotifications(reminder, notificationTimings);
      } else {
        // Creator notifications always use client-side scheduling
        notificationTimings.forEach((timing: NotificationTiming) => {
          this.scheduleLocalNotification(reminder, timing);
        });
      }

      // Schedule notifications for all co-owners (creator + assigned users)
      // Each co-owner will receive notifications about the reminder
      if (reminder.coOwners && reminder.coOwners.length > 0) {
        console.log(`[NotificationService] Reminder ${reminder.id} has ${reminder.coOwners.length} co-owners: ${reminder.coOwners.join(', ')}`);
        
        // Schedule notifications for each co-owner
        for (const coOwnerId of reminder.coOwners) {
          if (coOwnerId === reminder.userId) {
            // Creator notifications are already scheduled above (client-side)
            continue;
          }
          
          // Schedule notifications for assigned users (co-owners)
          await this.scheduleCoOwnerNotifications(reminder, coOwnerId, notificationTimings);
        }
      } else if (reminder.assignedTo && reminder.assignedTo.length > 0) {
        // Fallback for backward compatibility
        console.log(`[NotificationService] Reminder ${reminder.id} has ${reminder.assignedTo.length} assigned users (legacy mode)`);
        await this.scheduleAssignedUserCloudNotifications(reminder, notificationTimings);
      }
    } catch (error) {
    }
  }

  /**
   * Schedule notifications for co-owners (assigned users who can manage the reminder)
   * This creates scheduled notification records in Firestore for each co-owner
   */
  private async scheduleCoOwnerNotifications(reminder: ReminderData, coOwnerId: string, notificationTimings: NotificationTiming[]): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.log(`[NotificationService] No authenticated user for co-owner notifications`);
        return;
      }

      console.log(`[NotificationService] Scheduling notifications for co-owner: ${coOwnerId} of reminder: ${reminder.id}`);

      // Create scheduled notifications for each timing
      const notificationPromises = notificationTimings.map(async (timing: NotificationTiming) => {
        try {
          // Calculate notification time
          const notificationTime = this.calculateNotificationTime(reminder, timing);
          
          // Skip if notification time is in the past
          if (notificationTime <= new Date()) {
            console.log(`[NotificationService] Skipping past notification time for co-owner ${coOwnerId}: ${notificationTime.toISOString()}`);
            return;
          }

          // Determine notification type based on timing
          let notificationType: string;
          if (timing.type === 'exact') {
            notificationType = 'due';
          } else if (timing.type === 'before') {
            if (timing.value === 15) notificationType = '15min';
            else if (timing.value === 30) notificationType = '30min';
            else if (timing.value === 60) notificationType = '1hour';
            else notificationType = 'custom';
          } else {
            notificationType = 'after';
          }

          // Create scheduled notification in Firestore for co-owner
          const scheduledNotificationData = {
            reminderId: reminder.id,
            userId: coOwnerId,
            scheduledTime: firestore.Timestamp.fromDate(notificationTime),
            notificationType: notificationType,
            priority: reminder.priority || 'medium',
            status: 'pending',
            createdAt: firestore.FieldValue.serverTimestamp(),
            familyId: reminder.familyId,
            assignedBy: currentUser.uid,
            isCoOwner: true, // Flag to identify co-owner notifications
            reminderTitle: reminder.title,
          };

          await firestore()
            .collection('scheduledNotifications')
            .add(scheduledNotificationData);

          console.log(`[NotificationService] Co-owner notification scheduled for user ${coOwnerId} at ${notificationTime.toISOString()}`);

        } catch (error) {
          console.error(`[NotificationService] Error scheduling co-owner notification for user ${coOwnerId}:`, error);
        }
      });

      await Promise.all(notificationPromises);

    } catch (error) {
      console.error(`[NotificationService] Error in scheduleCoOwnerNotifications:`, error);
    }
  }

  /**
   * Schedule cloud-based notifications for assigned users (all priority levels)
   * This method creates scheduled notification records in Firestore for each assigned user
   * that will be processed by Cloud Functions
   */
  private async scheduleAssignedUserCloudNotifications(reminder: ReminderData, notificationTimings: NotificationTiming[]): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.log(`[NotificationService] No authenticated user for assigned user notifications`);
        return;
      }

      console.log(`[NotificationService] Scheduling cloud notifications for assigned users of reminder: ${reminder.id}`);

      // Get assigned users (exclude the creator)
      const assignedUserIds = reminder.assignedTo?.filter(userId => userId !== currentUser.uid) || [];
      
      if (assignedUserIds.length === 0) {
        console.log(`[NotificationService] No assigned users to notify (excluding creator)`);
        return;
      }

      console.log(`[NotificationService] Scheduling notifications for ${assignedUserIds.length} assigned users`);

      // Create scheduled notifications for each assigned user and each timing
      const cloudNotificationPromises = assignedUserIds.flatMap(assignedUserId => 
        notificationTimings.map(async (timing: NotificationTiming) => {
          try {
            // Calculate notification time
            const notificationTime = this.calculateNotificationTime(reminder, timing);
            
            // Skip if notification time is in the past
            if (notificationTime <= new Date()) {
              console.log(`[NotificationService] Skipping past notification time for user ${assignedUserId}: ${notificationTime.toISOString()}`);
              return;
            }

            // Determine notification type based on timing
            let notificationType: string;
            if (timing.type === 'exact') {
              notificationType = 'due';
            } else if (timing.type === 'before') {
              if (timing.value === 15) notificationType = '15min';
              else if (timing.value === 30) notificationType = '30min';
              else if (timing.value === 60) notificationType = '1hour';
              else notificationType = 'custom';
            } else {
              notificationType = 'after';
            }

            // Create scheduled notification in Firestore for assigned user
            const scheduledNotificationData = {
              reminderId: reminder.id,
              userId: assignedUserId,
              scheduledTime: firestore.Timestamp.fromDate(notificationTime),
              notificationType: notificationType,
              priority: reminder.priority || 'medium',
              status: 'pending',
              createdAt: firestore.FieldValue.serverTimestamp(),
              familyId: reminder.familyId,
              assignedBy: currentUser.uid,
              isAssignedUser: true, // Flag to identify assigned user notifications
            };

            await firestore()
              .collection('scheduledNotifications')
              .add(scheduledNotificationData);

            console.log(`[NotificationService] Cloud notification scheduled for assigned user ${assignedUserId} at ${notificationTime.toISOString()}`);

          } catch (error) {
            console.error(`[NotificationService] Error scheduling cloud notification for user ${assignedUserId}:`, error);
          }
        })
      );

      await Promise.all(cloudNotificationPromises);

    } catch (error) {
      console.error(`[NotificationService] Error in scheduleAssignedUserCloudNotifications:`, error);
    }
  }

  /**
   * Schedule recurring reminder notifications with improved timezone handling
   */
  private async scheduleRecurringReminderNotifications(reminder: ReminderData, notificationTimings: NotificationTiming[]): Promise<void> {
    try {
      // Convert to design system format for consistent handling
      const designSystemReminder = {
        ...reminder,
        userId: reminder.userId || '',
        type: (reminder.type || 'task') as ReminderType,
        priority: (reminder.priority || 'medium') as ReminderPriority,
        status: (reminder.status || 'pending') as ReminderStatus,
        dueDate: reminder.dueDate ? new Date(reminder.dueDate) : undefined,
        notificationTimings: reminder.notificationTimings as DesignSystemNotificationTiming[] | undefined,
        createdAt: reminder.createdAt ? new Date(reminder.createdAt) : new Date(),
        updatedAt: reminder.updatedAt ? new Date(reminder.updatedAt) : new Date(),
        isRecurring: true,
        repeatPattern: reminder.recurring?.pattern || 'daily',
        customInterval: reminder.recurring?.interval || 1,
        recurringEndDate: reminder.recurring?.endDate ? new Date(reminder.recurring.endDate) : undefined,
        recurringEndAfter: reminder.recurring?.maxOccurrences,
      };

      // Use design system utility for consistent recurring logic
      const { generateOccurrences } = require('../design-system/reminders/utils/recurring-utils');
      const occurrences = generateOccurrences(designSystemReminder, 30); // Generate up to 30 occurrences
      
      console.log(`[NotificationService] Generated ${occurrences.length} recurring occurrences for reminder ${reminder.id}`);
      
      // Schedule notifications for each occurrence
      occurrences.forEach((occurrence: any, index: number) => {
        const reminderWithOccurrence = {
          ...reminder,
          dueDate: occurrence.date ? occurrence.date.toISOString() : (occurrence instanceof Date ? occurrence.toISOString() : ''),
        };

        notificationTimings.forEach((timing: NotificationTiming) => {
          // Schedule local notification for the creator
          this.scheduleLocalNotification(reminderWithOccurrence, timing);
        });
      });

      // Schedule notifications for assigned users (handled by each user's device)
      if (reminder.assignedTo && reminder.assignedTo.length > 0 && reminder.userId) {
        console.log(`[NotificationService] Recurring reminder ${reminder.id} has ${reminder.assignedTo.length} assigned users`);
        console.log(`[NotificationService] Each assigned user's device will schedule their own notifications when they load this task`);
      }

      console.log(`[NotificationService] Successfully scheduled recurring notifications for ${occurrences.length} occurrences`);
    } catch (error) {
      console.error('[NotificationService] Error scheduling recurring notifications:', error);
      // Error handled by caller
    }
  }

  /**
   * Schedule notifications for assigned users
   * NOTE: This method is now deprecated. Each user's device should schedule their own notifications
   * when they load their assigned tasks. This method is kept for backward compatibility.
   */
  private async scheduleAssignedUserNotifications(reminder: ReminderData, notificationTimings: NotificationTiming[]): Promise<void> {
    try {
      console.log(`[NotificationService] DEPRECATED: scheduleAssignedUserNotifications called for reminder: ${reminder.id}`);
      console.log(`[NotificationService] This method should not be used anymore. Each user's device schedules their own notifications.`);
      
      // This method is deprecated because cross-device notification scheduling doesn't work
      // Each user's device should schedule notifications for their assigned tasks when they load them
      
    } catch (error) {
      console.error('[NotificationService] Error in deprecated scheduleAssignedUserNotifications:', error);
      // Error handled by caller
    }
  }

  /**
   * Schedule a push notification for an assigned user
   * This method creates a scheduled notification request in Firestore
   * that will be processed by a Cloud Function or background service
   */
  public async scheduleAssignedUserPushNotification(
    reminder: ReminderData, 
    assignedUserId: string, 
    timing: NotificationTiming, 
    notificationTime: Date
  ): Promise<void> {
    try {
      console.log(`[NotificationService] Scheduling push notification for assigned user: ${assignedUserId} at ${notificationTime.toISOString()}`);
      
      // Calculate notification time based on timing
      const notificationTimeDate = this.calculateNotificationTime(reminder, timing);
      
      // Determine notification type based on timing
      let notificationType: string;
      if (timing.type === 'exact') {
        notificationType = 'due';
      } else if (timing.type === 'before') {
        if (timing.value === 15) notificationType = '15min';
        else if (timing.value === 30) notificationType = '30min';
        else if (timing.value === 60) notificationType = '1hour';
        else notificationType = 'custom';
      } else {
        notificationType = 'after';
      }

      // Create scheduled notification in Firestore for Cloud Functions processing
      const scheduledNotificationData = {
        reminderId: reminder.id,
        userId: assignedUserId,
        scheduledTime: firestore.Timestamp.fromDate(notificationTimeDate),
        notificationType: notificationType,
        status: 'pending',
        createdAt: firestore.FieldValue.serverTimestamp(),
        assignedBy: reminder.createdBy,
        familyId: reminder.familyId,
      };

      await firestore()
        .collection('scheduledNotifications')
        .add(scheduledNotificationData);

      console.log(`[NotificationService] Scheduled push notification for user ${assignedUserId} at ${notificationTimeDate.toISOString()} via Cloud Functions`);
      
    } catch (error) {
      console.error('[NotificationService] Error scheduling assigned user push notification:', error);
      // Error handled by caller
    }
  }

  /**
   * Cancel notifications for a specific reminder
   */
  public async cancelReminderNotifications(reminderId: string): Promise<void> {
    try {
      console.log(`[NotificationService] Cancelling notifications for reminder: ${reminderId}`);
      
      // Get all scheduled notifications and wait for the result
      const notifications = await this.getScheduledNotifications();
      
      let cancelledCount = 0;
      for (const notification of notifications) {
        const notifId = notification.id;
        const notifReminderId = notification.userInfo?.reminderId;
        
        if (notifReminderId === reminderId) {
          console.log(`[NotificationService] Cancelling notification: ${notifId} for reminder: ${reminderId}`);
          PushNotification.cancelLocalNotification(notifId);
          cancelledCount++;
        }
      }
      
      console.log(`[NotificationService] Successfully cancelled ${cancelledCount} notifications for reminder: ${reminderId}`);
    } catch (error) {
      console.error(`[NotificationService] Error cancelling notifications for reminder ${reminderId}:`, error);
      throw error;
    }
  }

  /**
   * Update notifications for a reminder
   */
  public async updateReminderNotifications(reminder: ReminderData): Promise<void> {
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
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      return new Promise((resolve) => {
        PushNotification.checkPermissions((permissions) => {
          resolve(permissions.alert === true || permissions.badge === true || permissions.sound === true);
        });
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      return new Promise((resolve) => {
        PushNotification.requestPermissions(['alert', 'badge', 'sound']).then((permissions) => {
          resolve(permissions.alert === true || permissions.badge === true || permissions.sound === true);
        });
      });
    } catch (error) {
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
    this.isInitialized = false;
  }

  /**
   * Get FCM token for current user and save to Firestore
   */
  public async getFCMToken(): Promise<string | null> {
    try {
      console.log(`[NotificationService] Getting FCM token for current user...`);
      
      // Note: We'll attempt FCM token generation even on iOS simulator
      // as modern simulators can generate tokens, and we want to test the full flow
      
      // Register device for remote messages (iOS)
      if (Platform.OS === 'ios') {
        try {
          const isRegistered = await messaging().isDeviceRegisteredForRemoteMessages;
          console.log(`[NotificationService] iOS device registration status: ${isRegistered}`);
          
          if (!isRegistered) {
            console.log(`[NotificationService] Registering iOS device for remote messages...`);
            await messaging().registerDeviceForRemoteMessages();
            
            // Wait longer for registration to complete and retry
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Check registration status again
            const registrationStatus = await messaging().isDeviceRegisteredForRemoteMessages;
            console.log(`[NotificationService] iOS device registration status after retry: ${registrationStatus}`);
            
            if (!registrationStatus) {
              console.log(`[NotificationService] iOS device registration still failed, waiting more...`);
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        } catch (registrationError) {
          console.error(`[NotificationService] iOS device registration error:`, registrationError);
          // Continue anyway, as this might be expected in some environments
        }
      }
      
      // Add a small delay before getting token to ensure registration is complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`[NotificationService] Requesting FCM token...`);
      const token = await messaging().getToken();
      console.log(`[NotificationService] FCM token received: ${token ? token.substring(0, 20) + '...' : 'null'}`);
      
      // Save token to user's document
      const currentUser = auth().currentUser;
      if (token && currentUser) {
        try {
          console.log(`[NotificationService] Saving FCM token to Firestore for user: ${currentUser.uid}`);
          const firestoreInstance = getFirestoreInstance();
          
          // Get current user data to check existing tokens
          const userDoc = await firestoreInstance.collection('users').doc(currentUser.uid).get();
          const userData = userDoc.data();
          const existingTokens = userData?.fcmTokens || [];
          
          console.log(`[NotificationService] User currently has ${existingTokens.length} FCM tokens`);
          
          // Add new token if it doesn't exist
          if (!existingTokens.includes(token)) {
            await firestoreInstance.collection('users').doc(currentUser.uid).update({
              fcmTokens: firestore.FieldValue.arrayUnion(token),
              lastTokenUpdate: firestore.FieldValue.serverTimestamp(),
            });
            console.log(`[NotificationService] Successfully saved new FCM token to Firestore`);
          } else {
            console.log(`[NotificationService] FCM token already exists in Firestore`);
          }
        } catch (firestoreError) {
          console.error(`[NotificationService] Error saving FCM token to Firestore:`, firestoreError);
          // Don't fail the entire operation if Firestore save fails
          // The token is still valid for this session
        }
      } else {
        console.log(`[NotificationService] No token or current user, skipping Firestore save`);
      }
      
      return token;
    } catch (error) {
      console.error(`[NotificationService] Error getting FCM token:`, error);
      
      // Provide more specific error information
      if (error instanceof Error) {
        if (error.message.includes('aps-environment')) {
          console.error(`[NotificationService] APS environment error - check iOS provisioning profile`);
        } else if (error.message.includes('entitlements')) {
          console.error(`[NotificationService] Entitlements error - check iOS push notification entitlements`);
        } else {
          console.error(`[NotificationService] General FCM token error: ${error.message}`);
        }
      }
      
      return null;
    }
  }

  /**
   * Send push notification via Firebase Cloud Functions
   */
  public async sendPushNotification(
    fcmToken: string, 
    notification: {
      title: string;
      body: string;
      type: string;
      data?: Record<string, string>;
    }
  ): Promise<void> {
    try {
      console.log(`[NotificationService] Sending FCM notification to token: ${fcmToken.substring(0, 20)}...`);
      
      // Send to Cloud Function via Firestore
      const firestoreInstance = getFirestoreInstance();
      await firestoreInstance.collection('fcmNotifications').add({
        fcmToken: fcmToken,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: {
          ...notification.data,
          type: notification.type,
        },
        type: notification.type,
        userId: auth().currentUser?.uid, // Include userId for language detection
        timestamp: firestore.FieldValue.serverTimestamp(),
        status: 'pending',
        attempts: 0,
        maxAttempts: 3,
      });
      
      console.log(`[NotificationService] FCM notification request created in Firestore`);
      
    } catch (error) {
      console.error(`[NotificationService] Error sending FCM notification:`, error);
      throw error;
    }
  }

  /**
   * Send notification to a specific user via FCM
   */
  public async sendNotificationToUser(userId: string, notification: NotificationData): Promise<void> {
    try {
      console.log(`[NotificationService] sendNotificationToUser called for user: ${userId}`);
      
      // Get user's FCM tokens
      const firestoreInstance = getFirestoreInstance();
      const userDoc = await firestoreInstance.collection('users').doc(userId).get();
      const userData = userDoc.data();
      
      // Support both old fcmToken and new fcmTokens array
      const fcmTokens = userData?.fcmTokens || (userData?.fcmToken ? [userData.fcmToken] : []);
      
      console.log(`[NotificationService] Found ${fcmTokens.length} FCM tokens for user ${userId}`);
      
      if (fcmTokens.length === 0) {
        console.log(`[NotificationService] No FCM tokens available for user: ${userId}`);
        return;
      }
      
      // Send push notification to all user's devices
      let successCount = 0;
      for (const fcmToken of fcmTokens) {
        try {
          console.log(`[NotificationService] Sending push notification to token: ${fcmToken.substring(0, 20)}...`);
          
          await this.sendPushNotification(fcmToken, {
            title: notification.title,
            body: notification.body,
            type: notification.type || 'general',
            data: notification.data,
          });
          
          successCount++;
          console.log(`[NotificationService] Successfully sent notification to token: ${fcmToken.substring(0, 20)}...`);
          
        } catch (error) {
          console.error(`[NotificationService] Failed to send notification to token ${fcmToken.substring(0, 20)}...:`, error);
          // Continue with other tokens even if one fails
        }
      }
      
      console.log(`[NotificationService] Sent notifications to ${successCount}/${fcmTokens.length} devices for user ${userId}`);
      
    } catch (error) {
      console.error(`[NotificationService] Error in sendNotificationToUser for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Force refresh FCM token and save to user document
   */
  public async forceRefreshFCMToken(): Promise<string | null> {
    try {
      
      // Force unregister and re-register for remote messages (iOS)
      if (Platform.OS === 'ios') {
        try {
          await messaging().unregisterDeviceForRemoteMessages();
          
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          await messaging().registerDeviceForRemoteMessages();
          
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          const isRegistered = await messaging().isDeviceRegisteredForRemoteMessages;
        } catch (registrationError) {
        }
      }
      
      // Get fresh token
      const token = await messaging().getToken();
      
      if (token) {
        // Save to user document
        const currentUser = auth().currentUser;
        if (currentUser) {
          const firestoreInstance = getFirestoreInstance();
          await firestoreInstance.collection('users').doc(currentUser.uid).update({
            fcmTokens: firestore.FieldValue.arrayUnion(token),
            lastTokenUpdate: firestore.FieldValue.serverTimestamp(),
          });
        }
      }
      
      return token;
    } catch (error) {
      return null;
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
      
      // Get family members from familyMembers collection
      const firestoreInstance = getFirestoreInstance();
      const membersQuery = await firestoreInstance
        .collection('familyMembers')
        .where('familyId', '==', familyId)
        .get();
      
      if (membersQuery.empty) {
        return;
      }
      
      const members = membersQuery.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      } as { id: string; userId: string; name: string; email: string; role: string }));
      
      
      // Send to each family member
      for (const member of members) {
        if (excludeUserId && member.userId === excludeUserId) {
          continue; // Skip excluded user
        }
        
        try {
          await this.sendNotificationToUser(member.userId, notification);
        } catch (error) {
        }
      }
      
    } catch (error) {
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
    try {
      
      // Get the creator's profile for display name
      const firestoreInstance = getFirestoreInstance();
      const creatorUserDoc = await firestoreInstance.collection('users').doc(taskData.createdBy || '').get();
      const creatorUserData = creatorUserDoc.data();
      const creatorName = creatorUserData?.displayName || 'A family member';
      
      // Send notification to family members
      await this.sendNotificationToFamily(familyId, {
        title: '🎯 New Family Task Created!',
        body: `${creatorName} added "${taskData.title}" to your family's tasks`,
        type: 'task_created',
        data: {
          reminderId: taskData.id,
          createdBy: taskData.createdBy || '',
          createdByDisplayName: creatorName,
          reminderTitle: taskData.title,
          familyId: familyId,
        },
      }, excludeUserId);
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Notify task assigned (placeholder for task notifications)
   */
  public async notifyTaskAssigned(
    taskData: TaskNotificationData,
    excludeUserId?: string
  ): Promise<void> {
    try {
      
      if (!taskData.assignedTo) {
        return;
      }
      
      // Parse assignedTo string back to array
      const assignedUserIds = taskData.assignedTo.split(',').filter(id => id.trim());
      
      // Get the assigned by user's profile for display name
      const firestoreInstance = getFirestoreInstance();
      const assignedByUserDoc = await firestoreInstance.collection('users').doc(taskData.createdBy || '').get();
      const assignedByUserData = assignedByUserDoc.data();
      const assignedByName = assignedByUserData?.displayName || 'A family member';
      
      // Send notification to each assigned user
      for (const assignedUserId of assignedUserIds) {
        if (excludeUserId && assignedUserId === excludeUserId) {
          continue; // Skip excluded user
        }
        
        try {
          await this.sendNotificationToUser(assignedUserId, {
            title: '📋 New Task Assigned!',
            body: `${assignedByName} assigned you: "${taskData.title}"`,
            type: 'task_assigned',
            data: {
              reminderId: taskData.id,
              assignedBy: taskData.createdBy || '',
              assignedByDisplayName: assignedByName,
              reminderTitle: taskData.title,
            },
          });
          
        } catch (error) {
        }
      }
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Notify task updated (placeholder for task notifications)
   */
  public async notifyTaskUpdated(
    taskData: TaskNotificationData,
    updateType: 'due_date' | 'priority' | 'description' | 'general',
    excludeUserId?: string
  ): Promise<void> {
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
    // This would send a notification about a task being completed
  }

  /**
   * Send task reminder (placeholder for task reminders)
   */
  public async sendTaskReminder(
    taskData: TaskNotificationData,
    reminderType: 'due_soon' | 'overdue' | 'daily_digest'
  ): Promise<void> {
    // This would send a reminder notification for a task
  }

  /**
   * Send due date notification to assigned family members
   */
  public async sendDueDateNotification(
    reminderId: string,
    reminderTitle: string,
    assignedToUserIds: string[],
    dueDate: Date,
    timeLeft?: string
  ): Promise<void> {
    try {
      
      // Send push notification to each assigned user
      for (const userId of assignedToUserIds) {
        try {
          await this.sendNotificationToUser(userId, {
            title: '⏰ Task Due Soon!',
            body: `"${reminderTitle}" is due ${timeLeft ? `in ${timeLeft}` : 'soon'}!`,
            type: 'reminder',
            data: {
              reminderId: reminderId,
              reminderTitle: reminderTitle,
              dueDate: dueDate ? dueDate.toISOString() : '',
              type: 'due_soon',
            },
          });
          
        } catch (error) {
        }
      }
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send overdue notification to assigned family members
   */
  public async sendOverdueNotification(
    reminderId: string,
    reminderTitle: string,
    assignedToUserIds: string[],
    daysOverdue: number
  ): Promise<void> {
    try {
      
      // Send push notification to each assigned user
      for (const userId of assignedToUserIds) {
        try {
          await this.sendNotificationToUser(userId, {
            title: '🚨 Task Overdue!',
            body: `"${reminderTitle}" is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue!`,
            type: 'reminder',
            data: {
              reminderId: reminderId,
              reminderTitle: reminderTitle,
              daysOverdue: daysOverdue.toString(),
              type: 'overdue',
            },
          });
          
        } catch (error) {
        }
      }
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Start background reminder checking
   */
  public startBackgroundReminderChecking(): void {
    console.log('[NotificationService] Background reminder checking is deprecated - using Cloud Functions instead');
    // This method is deprecated as we now use Cloud Functions for scheduled notifications
    // Cloud Functions handle all scheduled notifications automatically
    
    // Only keep the assigned task sync for offline users
    setInterval(async () => {
      try {
        await this.syncAssignedTaskNotifications();
      } catch (error) {
        console.error('[NotificationService] Error in periodic assigned task sync:', error);
      }
    }, 15 * 60 * 1000); // Check every 15 minutes
  }

  /**
   * Check for due and overdue reminders and send notifications to assigned family members
   */
  private async checkForDueAndOverdueReminders(): Promise<void> {
    try {
      
      const firestoreInstance = getFirestoreInstance();
      const now = new Date();
      
      // Get all active reminders with assignments
      const remindersQuery = await firestoreInstance
        .collection('reminders')
        .where('status', '==', 'pending')
        .where('assignedTo', '!=', null)
        .get();
      
      if (remindersQuery.empty) {
        return;
      }
      
      const reminders = remindersQuery.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      } as { id: string; title: string; dueDate: any; assignedTo: string[]; status: string }));
      
      
      for (const reminder of reminders) {
        const dueDate = reminder.dueDate?.toDate ? reminder.dueDate.toDate() : new Date(reminder.dueDate);
        const timeDiff = dueDate.getTime() - now.getTime();
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        
        // Check if due soon (within 1 hour)
        if (timeDiff > 0 && timeDiff <= 60 * 60 * 1000) {
          const minutesLeft = Math.floor(timeDiff / (1000 * 60));
          await this.sendDueDateNotification(
            reminder.id,
            reminder.title,
            reminder.assignedTo,
            dueDate,
            `${minutesLeft} minutes`
          );
        }
        // Check if overdue
        else if (timeDiff < 0 && daysDiff >= -1) {
          await this.sendOverdueNotification(
            reminder.id,
            reminder.title,
            reminder.assignedTo,
            Math.abs(daysDiff)
          );
        }
      }
      
    } catch (error) {
    }
  }

  /**
   * Initialize local notifications only (without FCM)
   */
  public initializeLocalNotificationsOnly(): void {
    this.initializeLocalNotifications();
    this.isInitialized = true;
  }

  /**
   * Send assignment notification to users when they are assigned to a reminder
   * This method creates task assignment records that trigger Cloud Functions
   * for reliable cross-device notifications
   */
  public async sendAssignmentNotification(
    reminderId: string,
    reminderTitle: string,
    assignedByUserId: string,
    assignedByDisplayName: string,
    assignedToUserIds: string[]
  ): Promise<void> {
    try {
      console.log(`[NotificationService] Sending assignment notification for reminder: ${reminderId}`);
      console.log(`[NotificationService] Assigned to users: ${assignedToUserIds.join(', ')}`);
      
      // Get the assigned by user's profile for display name
      const firestoreInstance = getFirestoreInstance();
      const assignedByUserDoc = await firestoreInstance.collection('users').doc(assignedByUserId).get();
      const assignedByUserData = assignedByUserDoc.data();
      const assignedByName = assignedByUserData?.displayName || assignedByDisplayName || 'Someone';
      
      // Get family ID for assignment records
      const currentUser = auth().currentUser;
      const familyId = currentUser ? (await firestoreInstance.collection('users').doc(currentUser.uid).get()).data()?.familyId : null;
      
      // Create task assignment records for each assigned user
      // This will trigger the Cloud Function for reliable cross-device notifications
      for (const assignedUserId of assignedToUserIds) {
        if (assignedUserId === assignedByUserId) {
          console.log(`[NotificationService] Skipping self-assignment for user: ${assignedUserId}`);
          continue; // Skip if user assigned to themselves
        }
        
        try {
          // Check if assigned user exists
          const assignedUserDoc = await firestoreInstance.collection('users').doc(assignedUserId).get();
          if (!assignedUserDoc.exists) {
            console.warn(`[NotificationService] Assigned user does not exist: ${assignedUserId}. Skipping assignment.`);
            continue;
          }
          console.log(`[NotificationService] Creating assignment record for user: ${assignedUserId}`);
          
          // Create assignment record that triggers Cloud Function
          // Filter out undefined values to prevent Firestore errors
          const assignmentData: any = {
            reminderId: reminderId,
            assignedByUserId: assignedByUserId,
            assignedToUserId: assignedUserId,
            reminderTitle: reminderTitle,
            assignedByDisplayName: assignedByName,
            createdAt: firestore.FieldValue.serverTimestamp(),
            status: 'pending',
          };
          
          // Only add familyId if it's not null or undefined
          if (familyId) {
            assignmentData.familyId = familyId;
          }
          
          // Filter out any undefined values to prevent Firestore errors
          const cleanAssignmentData: any = {};
          Object.entries(assignmentData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              cleanAssignmentData[key] = value;
            }
          });
          
          // Debug: Log the assignment data being written
          console.log(`[NotificationService] Writing assignment data:`, JSON.stringify(cleanAssignmentData, null, 2));
          
          // Try to create the assignment record
          await firestoreInstance.collection('taskAssignments').add(cleanAssignmentData);
          
          console.log(`[NotificationService] Assignment record created for user: ${assignedUserId}`);
          
        } catch (error) {
          console.error(`[NotificationService] Failed to create assignment record for user ${assignedUserId}:`, error);
          
          // Fallback: Try to send direct FCM notification
          try {
            const assignedUserDoc = await firestoreInstance.collection('users').doc(assignedUserId).get();
            if (assignedUserDoc.exists) {
              const assignedUserData = assignedUserDoc.data();
              const fcmTokens = assignedUserData?.fcmTokens || [];
              const fcmToken = assignedUserData?.fcmToken || (fcmTokens.length > 0 ? fcmTokens[0] : null);
              
              if (fcmToken) {
                // Send direct FCM notification as fallback
                await firestoreInstance.collection('fcmNotifications').add({
                  fcmToken: fcmToken,
                  notification: {
                    title: '📋 New Task Assigned!',
                    body: `${assignedByName} assigned you: ${reminderTitle}`,
                  },
                  data: {
                    type: 'task_assigned',
                    reminderId: reminderId,
                    assignedByUserId: assignedByUserId,
                    assignedToUserId: assignedUserId,
                    familyId: familyId,
                  },
                  userId: assignedUserId,
                  timestamp: firestore.FieldValue.serverTimestamp(),
                  status: 'pending',
                  attempts: 0,
                  maxAttempts: 3,
                });
                
                console.log(`[NotificationService] Fallback FCM notification sent for user: ${assignedUserId}`);
              }
            }
          } catch (fallbackError) {
            console.error(`[NotificationService] Fallback notification also failed for user ${assignedUserId}:`, fallbackError);
          }
          
          // Fallback to local notification for current user in simulator
          const currentUser = auth().currentUser;
          if (currentUser && assignedUserId === currentUser.uid) {
            console.log(`[NotificationService] Falling back to local notification for current user`);
            this.sendLocalAssignmentNotification(reminderId, reminderTitle, assignedByName);
          }
        }
      }
      
      console.log(`[NotificationService] Assignment notification process completed`);
      
    } catch (error) {
      console.error(`[NotificationService] Error in sendAssignmentNotification:`, error);
      throw error;
    }
  }

  /**
   * Send local assignment notification (for simulator testing)
   */
  private sendLocalAssignmentNotification(
    reminderId: string,
    reminderTitle: string,
    assignedByName: string
  ): void {
    try {
      const notificationId = `assignment-${reminderId}-${Date.now()}`;
      
      PushNotification.localNotification({
        id: notificationId,
        channelId: 'reminders',
        title: '📋 New Task Assigned!',
        message: `${assignedByName} assigned you: ${reminderTitle}`,
        playSound: true,
        soundName: 'default',
        importance: 'high',
        priority: 'high',
        vibrate: true,
        vibration: 300,
        userInfo: {
          reminderId,
          type: 'task_assigned',
          assignedByDisplayName: assignedByName,
          reminderTitle,
        },
      });
      
      console.log(`[NotificationService] Local assignment notification sent with ID: ${notificationId}`);
    } catch (error) {
      console.error(`[NotificationService] Error sending local assignment notification:`, error);
    }
  }



  /**
   * Get active reminders (placeholder - implement based on your storage)
   */
  private async getActiveReminders(): Promise<any[]> {
    // This should be implemented based on your storage solution
    // For now, return empty array
    return [];
  }

  /**
   * Update reminder in storage (placeholder - implement based on your storage)
   */
  private async updateReminder(reminder: any): Promise<void> {
    // This should be implemented based on your storage solution
  }

  /**
   * Cancel notification for a specific occurrence of a recurring reminder
   */
  public cancelOccurrenceNotification(reminderId: string, occurrenceDate: Date): void {
    try {
      const occurrenceId = `${reminderId}-occurrence-${occurrenceDate.getTime()}`;
      PushNotification.cancelLocalNotification(occurrenceId);
    } catch (error) {
    }
  }

  /**
   * Schedule notification for a specific occurrence of a recurring reminder
   */
  public scheduleOccurrenceNotification(reminder: any, occurrenceDate: Date): void {
    try {
      // Use the first notification timing or default
      const timing = (reminder.notificationTimings && reminder.notificationTimings[0]) || DEFAULT_NOTIFICATION_TIMINGS[0];
      const notificationTime = this.calculateNotificationTime(
        { ...reminder, dueDate: occurrenceDate },
        timing
      );
      if (notificationTime > new Date()) {
        const occurrenceId = `${reminder.id}-occurrence-${occurrenceDate.getTime()}`;
        PushNotification.localNotificationSchedule({
          id: occurrenceId,
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
            occurrenceDate: occurrenceDate.toISOString(),
            type: 'reminder',
            timing: JSON.stringify(timing),
          },
        });
      } else {
      }
    } catch (error) {
    }
  }

  /**
   * Send a test notification 30 seconds from now
   */
  public sendTestNotification30Seconds(): void {
    try {
      const notificationTime = new Date(Date.now() + 30 * 1000); // 30 seconds from now
      const notificationId = `test-30sec-${Date.now()}`;
      
      PushNotification.localNotificationSchedule({
        id: notificationId,
        channelId: 'reminders',
        title: 'Test Notification (30s)',
        message: 'This is a test notification scheduled 30 seconds from now',
        date: notificationTime,
        allowWhileIdle: true,
        playSound: true,
        soundName: 'default',
        importance: 'high',
        priority: 'high',
        vibrate: true,
        vibration: 300,
        userInfo: {
          type: 'test',
          testType: '30seconds'
        },
      });

    } catch (error) {
    }
  }

  /**
   * Test assignment notification specifically for simulator
   * This ensures notifications work even without FCM tokens
   */
  public testAssignmentNotificationSimulator(
    reminderTitle: string = 'Test Task Assignment',
    assignedByName: string = 'Test User'
  ): void {
    try {
      console.log(`[NotificationService] Testing assignment notification in simulator mode`);
      
      const notificationId = `simulator-test-${Date.now()}`;
      
      PushNotification.localNotification({
        id: notificationId,
        channelId: 'reminders',
        title: '📋 New Task Assigned! (Simulator Test)',
        message: `${assignedByName} assigned you: ${reminderTitle}`,
        playSound: true,
        soundName: 'default',
        importance: 'high',
        priority: 'high',
        vibrate: true,
        vibration: 300,
        userInfo: {
          type: 'task_assigned',
          testType: 'simulator',
          assignedByDisplayName: assignedByName,
          reminderTitle,
        },
      });
      
      console.log(`[NotificationService] Simulator assignment notification sent with ID: ${notificationId}`);
    } catch (error) {
      console.error(`[NotificationService] Error sending simulator assignment notification:`, error);
    }
  }

  /**
   * Comprehensive simulator test - tests all notification types
   */
  public runSimulatorNotificationTests(): void {
    try {
      console.log(`[NotificationService] Running comprehensive simulator notification tests`);
      
      // Test 1: Immediate notification
      this.sendTestNotification(true);
      
      // Test 2: Assignment notification
      setTimeout(() => {
        this.testAssignmentNotificationSimulator('Simulator Test Task', 'Test User');
      }, 2000);
      
      // Test 3: Scheduled notification
      setTimeout(() => {
        this.sendTestNotification30Seconds();
      }, 4000);
      
      console.log(`[NotificationService] All simulator tests scheduled`);
    } catch (error) {
      console.error(`[NotificationService] Error running simulator tests:`, error);
    }
  }

  /**
   * Debug method to check scheduled notifications for assigned users
   */
  public async debugScheduledNotifications(reminderId?: string): Promise<void> {
    try {
      const notifications = await this.getScheduledNotifications();
      console.log(`[NotificationService] Total scheduled notifications: ${notifications.length}`);
      
      notifications.forEach((notification: any, index: number) => {
        const notifId = notification.id;
        const notifReminderId = notification.userInfo?.reminderId;
        const notifType = notification.userInfo?.type;
        const assignedUserId = notification.userInfo?.assignedUserId;
        const date = new Date(notification.date);
        
        if (!reminderId || notifReminderId === reminderId) {
          console.log(`[NotificationService] Notification ${index + 1}:`, {
            id: notifId,
            reminderId: notifReminderId,
            type: notifType,
            assignedUserId: assignedUserId,
            title: notification.title,
            message: notification.message,
            scheduledFor: date.toISOString(),
            timeUntil: Math.round((date.getTime() - Date.now()) / 1000 / 60) + ' minutes',
          });
        }
      });
    } catch (error) {
      console.error('[NotificationService] Error debugging scheduled notifications:', error);
    }
  }

  /**
   * Sync notifications for assigned tasks when app starts
   * This ensures that if the user was assigned tasks while the app was closed,
   * notifications are properly scheduled when they open the app
   */
  public async syncAssignedTaskNotifications(): Promise<void> {
    try {
      console.log(`[NotificationService] Syncing assigned task notifications`);
      
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.log(`[NotificationService] No authenticated user, skipping sync`);
        return;
      }

      // Get all reminders assigned to the current user
      const firestoreInstance = getFirestoreInstance();
      const assignedQuery = await firestoreInstance
        .collection('reminders')
        .where('assignedTo', 'array-contains', currentUser.uid)
        .where('userId', '!=', currentUser.uid) // Exclude user's own reminders
        .get();

      if (assignedQuery.empty) {
        console.log(`[NotificationService] No assigned tasks found for sync`);
        return;
      }

      console.log(`[NotificationService] Found ${assignedQuery.docs.length} assigned tasks to sync`);

      // Track which tasks we've already synced to avoid duplicates
      const syncedTaskIds = new Set();

      for (const doc of assignedQuery.docs) {
        const reminder = doc.data();
        
        // Skip if we've already synced this task
        if (syncedTaskIds.has(doc.id)) {
          continue;
        }

        try {
          // Convert to notification service format
          const notificationReminder = {
            id: doc.id,
            title: reminder.title,
            description: reminder.description,
            dueDate: reminder.dueDate?.toDate ? reminder.dueDate.toDate().toISOString() : reminder.dueDate,
            dueTime: reminder.dueTime,
            completed: reminder.completed,
            priority: reminder.priority,
            assignedTo: reminder.assignedTo,
            createdBy: reminder.userId, // Original creator
            userId: reminder.userId, // Original creator
            familyId: reminder.familyId,
            type: reminder.type,
            status: reminder.status,
            createdAt: reminder.createdAt?.toDate ? reminder.createdAt.toDate().toISOString() : reminder.createdAt,
            updatedAt: reminder.updatedAt?.toDate ? reminder.updatedAt.toDate().toISOString() : reminder.updatedAt,
            notificationTimings: reminder.notificationTimings || [
              { type: 'before', value: 15, label: '15 minutes before' }
            ],
            isRecurring: reminder.isRecurring,
            repeatPattern: reminder.repeatPattern,
            recurringStartDate: reminder.recurringStartDate?.toDate ? reminder.recurringStartDate.toDate().toISOString() : reminder.recurringStartDate,
            recurringEndDate: reminder.recurringEndDate?.toDate ? reminder.recurringEndDate.toDate().toISOString() : reminder.recurringEndDate,
          };

          // Schedule notifications for this assigned task
          await this.scheduleReminderNotifications(notificationReminder);
          
          // Mark as synced
          syncedTaskIds.add(doc.id);
          
          console.log(`[NotificationService] Synced notifications for assigned task: ${doc.id}`);
        } catch (error) {
          console.error(`[NotificationService] Error syncing notifications for assigned task ${doc.id}:`, error);
        }
      }

      console.log(`[NotificationService] Completed syncing assigned task notifications`);
    } catch (error) {
      console.error('[NotificationService] Error in syncAssignedTaskNotifications:', error);
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

// Export singleton instance and utility functions
export default notificationService;

// Export utility functions
export const getScheduledNotifications = () => notificationService.getScheduledNotifications();
export const cancelAllNotifications = () => notificationService.cancelAllNotifications();
