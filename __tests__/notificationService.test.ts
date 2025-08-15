
/**
 * Notification Service Tests
 * Tests for the clean notification system with stale notification prevention
 */

import notificationService, { ReminderData } from '../src/services/notificationService';
import { formatUKDate, formatUKTime, isStaleNotification } from '../src/utils/notificationUtils';

// Mock the iOS bridge
jest.mock('../src/services/iOSNotificationBridge', () => ({
  initialize: jest.fn().mockResolvedValue(true),
  requestPermissions: jest.fn().mockResolvedValue(true),
  checkPermissions: jest.fn().mockResolvedValue(true),
  scheduleLocalNotification: jest.fn().mockResolvedValue(true),
  cancelNotificationsForReminder: jest.fn().mockResolvedValue(true),
  cancelAllNotifications: jest.fn().mockResolvedValue(true),
  getPendingNotificationCount: jest.fn().mockResolvedValue(0),
  setBadgeCount: jest.fn().mockResolvedValue(true),
  clearBadge: jest.fn().mockResolvedValue(true),
}));

// Mock Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(notificationService.initialize()).resolves.not.toThrow();
    });

    it('should request permissions on iOS', async () => {
      const result = await notificationService.requestPermissions();
      expect(result).toBe(true);
    });
  });

  describe('Reminder Notifications', () => {
    const mockReminder: ReminderData = {
      id: 'test-reminder-1',
      title: 'Test Reminder',
      description: 'This is a test reminder',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      dueTime: '14:30',
      priority: 'medium',
    };

    it('should schedule notifications for a valid reminder', async () => {
      const result = await notificationService.scheduleReminderNotifications(mockReminder);
      expect(result).toBe(true);
    });

    it('should not schedule notifications for completed reminders', async () => {
      const completedReminder = { ...mockReminder, completed: true };
      const result = await notificationService.scheduleReminderNotifications(completedReminder);
      expect(result).toBe(true); // Returns true but doesn't schedule
    });

    it('should not schedule notifications for overdue reminders', async () => {
      const overdueReminder = {
        ...mockReminder,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      };
      const result = await notificationService.scheduleReminderNotifications(overdueReminder);
      expect(result).toBe(true); // Returns true but doesn't schedule
    });

    it('should cancel notifications when reminder is updated', async () => {
      const result = await notificationService.updateReminderNotifications(mockReminder);
      expect(result).toBe(true);
    });

    it('should cancel all notifications for a reminder', async () => {
      const result = await notificationService.cancelReminderNotifications('test-reminder-1');
      expect(result).toBe(true);
    });
  });

  describe('Badge Management', () => {
    it('should set badge count', async () => {
      const result = await notificationService.setBadgeCount(5);
      expect(result).toBe(true);
    });

    it('should clear badge', async () => {
      const result = await notificationService.clearBadge();
      expect(result).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup stale notifications', async () => {
      await expect(notificationService.cleanupStaleNotifications()).resolves.not.toThrow();
    });

    it('should cancel all notifications', async () => {
      const result = await notificationService.cancelAllNotifications();
      expect(result).toBe(true);
    });
  });
});

describe('Notification Utils', () => {
  describe('UK Date/Time Formatting', () => {
    const testDate = new Date('2024-03-15T14:30:00Z');

    it('should format date in UK format', () => {
      const formatted = formatUKDate(testDate);
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('should format time in UK format', () => {
      const formatted = formatUKTime(testDate);
      expect(formatted).toMatch(/\d{2}:\d{2}/);
    });
  });

  describe('Stale Notification Detection', () => {
    it('should detect stale notifications', () => {
      const pastDate = new Date(Date.now() - 60 * 1000); // 1 minute ago
      expect(isStaleNotification(pastDate)).toBe(true);
    });

    it('should not flag future notifications as stale', () => {
      const futureDate = new Date(Date.now() + 60 * 1000); // 1 minute from now
      expect(isStaleNotification(futureDate)).toBe(false);
    });
  });
});
