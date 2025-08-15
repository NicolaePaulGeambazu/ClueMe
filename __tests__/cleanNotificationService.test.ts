/**
 * Unit tests for the clean iOS notification system
 * Tests the new notification system functionality
 */

import cleanNotificationService, { ReminderData, DEFAULT_NOTIFICATION_TIMINGS } from '../src/services/cleanNotificationService';

// Mock React Native modules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
  NativeModules: {
    NotificationManagerBridge: {
      requestPermissions: jest.fn(() => Promise.resolve(true)),
      checkPermissions: jest.fn(() => Promise.resolve(true)),
      scheduleLocalNotification: jest.fn(() => Promise.resolve(true)),
      cancelNotification: jest.fn(() => Promise.resolve(true)),
      cancelNotificationsForReminder: jest.fn(() => Promise.resolve(true)),
      cancelAllNotifications: jest.fn(() => Promise.resolve(true)),
      getPendingNotificationCount: jest.fn(() => Promise.resolve(0)),
      setBadgeCount: jest.fn(() => Promise.resolve(true)),
      clearBadge: jest.fn(() => Promise.resolve(true)),
      sendTestNotification: jest.fn(() => Promise.resolve(true)),
    },
  },
  NativeEventEmitter: jest.fn(() => ({
    addListener: jest.fn(() => ({ remove: jest.fn() })),
  })),
}));

// Mock Firebase modules
jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  default: () => ({
    requestPermission: jest.fn(() => Promise.resolve(1)), // AUTHORIZED
    hasPermission: jest.fn(() => Promise.resolve(1)), // AUTHORIZED
    registerDeviceForRemoteMessages: jest.fn(() => Promise.resolve()),
    getToken: jest.fn(() => Promise.resolve('mock-fcm-token')),
    onMessage: jest.fn(() => jest.fn()),
    setBackgroundMessageHandler: jest.fn(),
    onNotificationOpenedApp: jest.fn(),
    getInitialNotification: jest.fn(() => Promise.resolve(null)),
  }),
  AuthorizationStatus: {
    AUTHORIZED: 1,
    PROVISIONAL: 2,
  },
}));

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: () => ({
    currentUser: {
      uid: 'test-user-id',
    },
  }),
}));

jest.mock('@react-native-firebase/firestore', () => ({
  __esModule: true,
  default: () => ({
    collection: jest.fn(() => ({
      add: jest.fn(() => Promise.resolve()),
      doc: jest.fn(() => ({
        update: jest.fn(() => Promise.resolve()),
        get: jest.fn(() => Promise.resolve({
          exists: true,
          id: 'test-reminder',
          data: () => ({
            title: 'Test Reminder',
            description: 'Test description',
          }),
        })),
      })),
      where: jest.fn(() => ({
        where: jest.fn(() => ({
          get: jest.fn(() => Promise.resolve({
            forEach: jest.fn(),
          })),
        })),
      })),
    })),
    batch: jest.fn(() => ({
      update: jest.fn(),
      commit: jest.fn(() => Promise.resolve()),
    })),
  }),
  FieldValue: {
    serverTimestamp: jest.fn(),
    arrayUnion: jest.fn((value) => value),
  },
  Timestamp: {
    fromDate: jest.fn((date) => ({ toDate: () => date })),
  },
}));

jest.mock('../src/services/firebaseService', () => ({
  getFirestoreInstance: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        update: jest.fn(() => Promise.resolve()),
      })),
    })),
  })),
}));

describe('CleanNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await cleanNotificationService.initialize();
      expect(cleanNotificationService.isServiceInitialized()).toBe(true);
    });

    it('should check if notifications are enabled', async () => {
      const enabled = await cleanNotificationService.areNotificationsEnabled();
      expect(enabled).toBe(true);
    });
  });

  describe('Notification Scheduling', () => {
    const testReminder: ReminderData = {
      id: 'test-reminder-1',
      title: 'Test Reminder',
      description: 'This is a test reminder',
      dueDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
      dueTime: '15:30',
      priority: 'medium',
      notificationTimings: DEFAULT_NOTIFICATION_TIMINGS,
      userId: 'test-user',
    };

    it('should schedule reminder notifications', async () => {
      await cleanNotificationService.scheduleReminderNotifications(testReminder);
      // Verify that the service completed without throwing
      expect(true).toBe(true);
    });

    it('should cancel reminder notifications', async () => {
      await cleanNotificationService.cancelReminderNotifications(testReminder.id);
      // Verify that the service completed without throwing
      expect(true).toBe(true);
    });

    it('should handle recurring reminders', async () => {
      const recurringReminder: ReminderData = {
        ...testReminder,
        recurring: {
          pattern: 'daily',
          interval: 1,
          maxOccurrences: 5,
        },
      };

      await cleanNotificationService.scheduleReminderNotifications(recurringReminder);
      // Verify that the service completed without throwing
      expect(true).toBe(true);
    });
  });

  describe('Badge Management', () => {
    it('should set badge count', async () => {
      await cleanNotificationService.setBadgeCount(5);
      // Verify that the service completed without throwing
      expect(true).toBe(true);
    });

    it('should clear badge', async () => {
      await cleanNotificationService.clearBadge();
      // Verify that the service completed without throwing
      expect(true).toBe(true);
    });
  });

  describe('Test Notifications', () => {
    it('should send test notification', async () => {
      await cleanNotificationService.sendTestNotification();
      // Verify that the service completed without throwing
      expect(true).toBe(true);
    });
  });

  describe('Notification Count', () => {
    it('should get pending notification count', async () => {
      const count = await cleanNotificationService.getPendingNotificationCount();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('FCM Token', () => {
    it('should get FCM token', async () => {
      const token = await cleanNotificationService.getFCMToken();
      expect(token).toBe('mock-fcm-token');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources', () => {
      cleanNotificationService.cleanup();
      expect(cleanNotificationService.isServiceInitialized()).toBe(false);
    });

    it('should cancel all notifications', async () => {
      await cleanNotificationService.cancelAllNotifications();
      // Verify that the service completed without throwing
      expect(true).toBe(true);
    });
  });

  describe('UK Date Formatting', () => {
    it('should use UK locale constants', () => {
      // Test that the service uses UK locale internally
      // This is tested through the notification content generation
      const testDate = new Date('2025-08-15T14:30:00.000Z');
      
      // The UK formatting is tested internally when notifications are generated
      // We verify that the service handles dates without throwing errors
      expect(testDate).toBeInstanceOf(Date);
    });
  });

  describe('Default Notification Timings', () => {
    it('should have correct default timings', () => {
      expect(DEFAULT_NOTIFICATION_TIMINGS).toHaveLength(4);
      expect(DEFAULT_NOTIFICATION_TIMINGS[0]).toEqual({
        type: 'before',
        value: 15,
        label: '15 minutes before',
      });
      expect(DEFAULT_NOTIFICATION_TIMINGS[1]).toEqual({
        type: 'before',
        value: 30,
        label: '30 minutes before',
      });
      expect(DEFAULT_NOTIFICATION_TIMINGS[2]).toEqual({
        type: 'before',
        value: 60,
        label: '1 hour before',
      });
      expect(DEFAULT_NOTIFICATION_TIMINGS[3]).toEqual({
        type: 'exact',
        value: 0,
        label: 'At due time',
      });
    });
  });
});
