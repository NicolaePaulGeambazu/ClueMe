
import { Platform, Alert } from 'react-native';
import PushNotification from 'react-native-push-notification';
import { format } from 'date-fns';
import { enGB } from 'date-fns/locale';

export interface NotificationPayload {
  id: string;
  title: string;
  body: string;
  data?: any;
  scheduledDate?: Date;
  repeatType?: 'none' | 'daily' | 'weekly' | 'monthly';
}

class NotificationService {
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (this.initialized) return;

    PushNotification.configure({
      onRegister: (token) => {
        console.log('Notification token:', token);
      },
      
      onNotification: (notification: any) => {
        console.log('Notification received:', notification);
        
        // Handle foreground notifications
        if (notification.foreground && Platform.OS === 'ios') {
          Alert.alert(
            notification.title || 'ClueMe Reminder',
            notification.message || notification.body || '',
            [{ text: 'OK', style: 'default' }]
          );
        }
        
        // Required on iOS only for local notifications
        if (Platform.OS === 'ios' && notification.finish) {
          notification.finish('noData');
        }
      },
      
      onAction: (notification) => {
        console.log('Notification action:', notification.action);
      },
      
      onRegistrationError: (err) => {
        console.error('Notification registration error:', err.message);
      },
      
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    this.initialized = true;
  }

  // UK date formatting helper
  private formatDateUK(date: Date): string {
    return format(date, 'dd/MM/yyyy', { locale: enGB });
  }

  // UK time formatting helper
  private formatTimeUK(date: Date): string {
    return format(date, 'HH:mm', { locale: enGB });
  }

  // UK datetime formatting helper
  private formatDateTimeUK(date: Date): string {
    return format(date, 'dd/MM/yyyy \'at\' HH:mm', { locale: enGB });
  }

  // Generate UK-formatted notification titles and bodies
  private generateUKNotificationContent(
    reminderTitle: string,
    scheduledDate: Date,
    type: 'reminder' | 'overdue' | 'upcoming' = 'reminder'
  ): { title: string; body: string } {
    const formattedDate = this.formatDateUK(scheduledDate);
    const formattedTime = this.formatTimeUK(scheduledDate);
    const formattedDateTime = this.formatDateTimeUK(scheduledDate);

    switch (type) {
      case 'overdue':
        return {
          title: 'Overdue Reminder',
          body: `"${reminderTitle}" was due on ${formattedDateTime}. Don't forget to complete it!`
        };
      
      case 'upcoming':
        return {
          title: 'Upcoming Reminder',
          body: `"${reminderTitle}" is scheduled for ${formattedDateTime}. Get ready!`
        };
      
      default:
        return {
          title: 'ClueMe Reminder',
          body: `Time for "${reminderTitle}" - scheduled for ${formattedTime} today (${formattedDate})`
        };
    }
  }

  async requestPermissions(): Promise<boolean> {
    return new Promise((resolve) => {
      PushNotification.requestPermissions(['alert', 'badge', 'sound']).then((permissions: any) => {
        const granted = permissions.alert && permissions.badge && permissions.sound;
        resolve(granted);
      });
    });
  }

  async scheduleNotification(payload: NotificationPayload): Promise<void> {
    if (!payload.scheduledDate) {
      // Immediate notification
      const content = this.generateUKNotificationContent(payload.title, new Date());
      
      PushNotification.localNotification({
        id: payload.id,
        title: content.title,
        message: content.body,
        userInfo: payload.data || {},
        playSound: true,
        soundName: 'default',
      });
    } else {
      // Scheduled notification
      const content = this.generateUKNotificationContent(payload.title, payload.scheduledDate);
      
      PushNotification.localNotificationSchedule({
        id: payload.id,
        title: content.title,
        message: content.body,
        date: payload.scheduledDate,
        userInfo: payload.data || {},
        playSound: true,
        soundName: 'default',
        allowWhileIdle: true, // Ensures delivery even in background
        repeatType: payload.repeatType === 'daily' ? 'day' : payload.repeatType === 'weekly' ? 'week' : undefined,
      });
    }
  }

  async scheduleReminderNotifications(
    reminderId: string,
    reminderTitle: string,
    scheduledDate: Date,
    enableUpcoming: boolean = true
  ): Promise<void> {
    // Main reminder notification
    await this.scheduleNotification({
      id: `reminder_${reminderId}`,
      title: reminderTitle,
      body: '',
      scheduledDate,
      data: { reminderId, type: 'reminder' }
    });

    // Optional upcoming notification (15 minutes before)
    if (enableUpcoming) {
      const upcomingDate = new Date(scheduledDate.getTime() - 15 * 60 * 1000);
      if (upcomingDate > new Date()) {
        const upcomingContent = this.generateUKNotificationContent(
          reminderTitle, 
          scheduledDate, 
          'upcoming'
        );
        
        await this.scheduleNotification({
          id: `upcoming_${reminderId}`,
          title: upcomingContent.title,
          body: upcomingContent.body,
          scheduledDate: upcomingDate,
          data: { reminderId, type: 'upcoming' }
        });
      }
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    PushNotification.cancelLocalNotification(notificationId);
  }

  async cancelAllNotifications(): Promise<void> {
    PushNotification.cancelAllLocalNotifications();
  }

  async getScheduledNotifications(): Promise<any[]> {
    return new Promise((resolve) => {
      PushNotification.getScheduledLocalNotifications((notifications) => {
        resolve(notifications);
      });
    });
  }

  // Schedule overdue check notifications
  async scheduleOverdueCheck(
    reminderId: string,
    reminderTitle: string,
    originalDate: Date
  ): Promise<void> {
    // Check 1 hour after due time
    const overdueDate = new Date(originalDate.getTime() + 60 * 60 * 1000);
    
    if (overdueDate > new Date()) {
      const overdueContent = this.generateUKNotificationContent(
        reminderTitle,
        originalDate,
        'overdue'
      );
      
      await this.scheduleNotification({
        id: `overdue_${reminderId}`,
        title: overdueContent.title,
        body: overdueContent.body,
        scheduledDate: overdueDate,
        data: { reminderId, type: 'overdue' }
      });
    }
  }

  // Utility method to format any date for UK display
  formatDateForDisplay(date: Date): string {
    return this.formatDateTimeUK(date);
  }

  // Test notification for debugging
  async sendTestNotification(): Promise<void> {
    const testContent = this.generateUKNotificationContent(
      'Test Reminder',
      new Date()
    );
    
    PushNotification.localNotification({
      id: 'test_notification',
      title: testContent.title,
      message: testContent.body,
      playSound: true,
      soundName: 'default',
    });
  }
}

export default new NotificationService();
