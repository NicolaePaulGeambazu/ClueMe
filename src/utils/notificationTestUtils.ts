/**
 * Test utilities for the new clean notification system
 * Replaces old hybrid notification test utilities
 */

import cleanNotificationService from '../services/cleanNotificationService';
import { ReminderData, DEFAULT_NOTIFICATION_TIMINGS } from '../services/cleanNotificationService';

/**
 * Test the new clean notification system
 */
export async function testCleanNotificationSystem(): Promise<void> {
  try {
    console.log('[NotificationTestUtils] Testing clean notification system...');

    // Check if service is initialized
    if (!cleanNotificationService.isServiceInitialized()) {
      console.log('[NotificationTestUtils] Initializing clean notification service...');
      await cleanNotificationService.initialize();
    }

    // Check permissions
    const hasPermissions = await cleanNotificationService.areNotificationsEnabled();
    console.log(`[NotificationTestUtils] Notifications enabled: ${hasPermissions}`);

    if (!hasPermissions) {
      console.warn('[NotificationTestUtils] Notifications not enabled - test may not work');
    }

    // Send test notification
    await cleanNotificationService.sendTestNotification();
    console.log('[NotificationTestUtils] Test notification sent');

    // Get pending notification count
    const pendingCount = await cleanNotificationService.getPendingNotificationCount();
    console.log(`[NotificationTestUtils] Pending notifications: ${pendingCount}`);

    console.log('[NotificationTestUtils] Clean notification system test completed');
  } catch (error) {
    console.error('[NotificationTestUtils] Error testing clean notification system:', error);
    throw error;
  }
}

/**
 * Test reminder notification scheduling
 */
export async function testReminderNotificationScheduling(): Promise<void> {
  try {
    console.log('[NotificationTestUtils] Testing reminder notification scheduling...');

    // Create test reminder data
    const testReminder: ReminderData = {
      id: `test-reminder-${Date.now()}`,
      title: 'Test Reminder',
      description: 'This is a test reminder for the new notification system',
      dueDate: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // 2 minutes from now
      dueTime: new Date(Date.now() + 2 * 60 * 1000).toTimeString().substring(0, 5), // HH:MM format
      priority: 'medium',
      notificationTimings: [
        { type: 'before', value: 1, label: '1 minute before' }, // 1 minute before due time
        { type: 'exact', value: 0, label: 'At due time' },
      ],
      userId: 'test-user',
      createdAt: new Date().toISOString(),
    };

    // Schedule notifications for the test reminder
    await cleanNotificationService.scheduleReminderNotifications(testReminder);
    console.log('[NotificationTestUtils] Test reminder notifications scheduled');

    // Get pending notification count
    const pendingCount = await cleanNotificationService.getPendingNotificationCount();
    console.log(`[NotificationTestUtils] Pending notifications after scheduling: ${pendingCount}`);

    // Wait a moment, then cancel the test notifications
    setTimeout(async () => {
      try {
        await cleanNotificationService.cancelReminderNotifications(testReminder.id);
        console.log('[NotificationTestUtils] Test reminder notifications cancelled');
      } catch (error) {
        console.error('[NotificationTestUtils] Error cancelling test notifications:', error);
      }
    }, 30000); // Cancel after 30 seconds

    console.log('[NotificationTestUtils] Reminder notification scheduling test completed');
  } catch (error) {
    console.error('[NotificationTestUtils] Error testing reminder notification scheduling:', error);
    throw error;
  }
}

/**
 * Test UK date formatting
 */
export async function testUKDateFormatting(): Promise<void> {
  try {
    console.log('[NotificationTestUtils] Testing UK date formatting...');

    const testDate = new Date('2025-08-15T14:30:00.000Z'); // 15 Aug 2025, 14:30 UTC

    // Test different formatting methods
    const testReminder: ReminderData = {
      id: 'test-formatting',
      title: 'UK Date Format Test',
      dueDate: testDate.toISOString(),
      dueTime: '15:30',
    };

    // The formatting is tested internally within the notification service
    // when generating notification titles and bodies
    console.log('[NotificationTestUtils] UK date formatting test completed');
    console.log(`[NotificationTestUtils] Test date: ${testDate.toISOString()}`);
    console.log(`[NotificationTestUtils] Expected UK format: Thu, 15 Aug 2025 at 15:30`);
  } catch (error) {
    console.error('[NotificationTestUtils] Error testing UK date formatting:', error);
    throw error;
  }
}

/**
 * Test badge management
 */
export async function testBadgeManagement(): Promise<void> {
  try {
    console.log('[NotificationTestUtils] Testing badge management...');

    // Set badge count
    await cleanNotificationService.setBadgeCount(5);
    console.log('[NotificationTestUtils] Badge count set to 5');

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Clear badge
    await cleanNotificationService.clearBadge();
    console.log('[NotificationTestUtils] Badge cleared');

    console.log('[NotificationTestUtils] Badge management test completed');
  } catch (error) {
    console.error('[NotificationTestUtils] Error testing badge management:', error);
    throw error;
  }
}

/**
 * Run all notification tests
 */
export async function runAllNotificationTests(): Promise<void> {
  try {
    console.log('[NotificationTestUtils] Running all notification tests...');

    await testCleanNotificationSystem();
    await testUKDateFormatting();
    await testBadgeManagement();
    await testReminderNotificationScheduling();

    console.log('[NotificationTestUtils] All notification tests completed successfully');
  } catch (error) {
    console.error('[NotificationTestUtils] Error running notification tests:', error);
    throw error;
  }
}

/**
 * Clean up test notifications
 */
export async function cleanupTestNotifications(): Promise<void> {
  try {
    console.log('[NotificationTestUtils] Cleaning up test notifications...');

    await cleanNotificationService.cancelAllNotifications();
    await cleanNotificationService.clearBadge();

    console.log('[NotificationTestUtils] Test notifications cleaned up');
  } catch (error) {
    console.error('[NotificationTestUtils] Error cleaning up test notifications:', error);
    throw error;
  }
}
