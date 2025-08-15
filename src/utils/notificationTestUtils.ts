/**
 * Notification Testing Utilities
 *
 * Comprehensive testing tools for debugging notification timing issues
 */

import notificationService from '../services/notificationService';
import type { NotificationTiming as ServiceNotificationTiming } from '../services/notificationService';

export interface NotificationTestResult {
  reminderId: string;
  title: string;
  dueDate: string;
  dueTime?: string;
  notificationTimings: Array<{
    type: 'before' | 'after' | 'exact';
    value: number;
    label: string;
    calculatedTime: string;
    isInFuture: boolean;
    timeUntilNotification: string;
  }>;
  testPassed: boolean;
  errors: string[];
}

/**
 * Test notification timing calculation for a specific reminder
 */
export const testNotificationTiming = async (
  reminder: {
    id: string;
    title: string;
    dueDate: string;
    dueTime?: string;
    notificationTimings?: Array<{
      type: 'before' | 'after' | 'exact';
      value: number;
      label: string;
    }>;
  }
): Promise<NotificationTestResult> => {
  const result: NotificationTestResult = {
    reminderId: reminder.id,
    title: reminder.title,
    dueDate: reminder.dueDate,
    dueTime: reminder.dueTime,
    notificationTimings: [],
    testPassed: true,
    errors: [],
  };

  try {
    const defaultTimings = [
      { type: 'before' as const, value: 15, label: '15 minutes before' },
      { type: 'exact' as const, value: 0, label: 'At due time' },
    ];

    const timings = reminder.notificationTimings || defaultTimings;
    const now = new Date();

    for (const timing of timings) {
      try {
        // Calculate notification time in UK time (no timezone logic)
        const notificationTime = calculateNotificationTimeUK(
          new Date(reminder.dueDate),
          reminder.dueTime,
          timing.value,
          timing.type
        );

        const isInFuture = notificationTime > now;
        const timeUntilNotification = isInFuture
          ? formatTimeDifference(notificationTime, now)
          : 'Already passed';

        result.notificationTimings.push({
          type: timing.type,
          value: timing.value,
          label: timing.label,
          calculatedTime: notificationTime.toISOString(),
          isInFuture,
          timeUntilNotification,
        });

        // Validate the calculation
        if (timing.type === 'before' && timing.value === 15) {
          const expectedTime = new Date(reminder.dueDate);
          if (reminder.dueTime) {
            const [hours, minutes] = reminder.dueTime.split(':').map(Number);
            expectedTime.setHours(hours, minutes, 0, 0);
          }
          expectedTime.setMinutes(expectedTime.getMinutes() - 15);

          const timeDiff = Math.abs(notificationTime.getTime() - expectedTime.getTime());
          if (timeDiff > 60000) { // More than 1 minute difference
            result.errors.push(`Timing calculation error: Expected ~${expectedTime.toISOString()}, got ${notificationTime.toISOString()}`);
            result.testPassed = false;
          }
        }
      } catch (error) {
        result.errors.push(`Error calculating timing for ${timing.label}: ${error}`);
        result.testPassed = false;
      }
    }
  } catch (error) {
    result.errors.push(`General test error: ${error}`);
    result.testPassed = false;
  }

  return result;
};

/**
 * Test recurring notification scheduling
 */
export const testRecurringNotifications = async (
  reminder: {
    id: string;
    title: string;
    dueDate: string;
    dueTime?: string;
    repeatPattern: string;
    customInterval?: number;
    notificationTimings?: Array<{
      type: 'before' | 'after' | 'exact';
      value: number;
      label: string;
    }>;
  }
): Promise<{
  testPassed: boolean;
  occurrencesGenerated: number;
  notificationsScheduled: number;
  errors: string[];
  details: string[];
}> => {
  const result = {
    testPassed: true,
    occurrencesGenerated: 0,
    notificationsScheduled: 0,
    errors: [] as string[],
    details: [] as string[],
  };

  try {
    // Convert to notification service format
    const notificationReminder = {
      id: reminder.id,
      title: reminder.title,
      dueDate: reminder.dueDate,
      dueTime: reminder.dueTime,
      recurring: {
        pattern: reminder.repeatPattern,
        interval: reminder.customInterval || 1,
      },
      notificationTimings: reminder.notificationTimings || [
        { type: 'before', value: 15, label: '15 minutes before' },
      ],
      userId: 'test-user',
      familyId: 'test-family',
    } as any; // Type assertion to avoid complex type matching

    // Schedule notifications
    await notificationService.scheduleReminderNotifications(notificationReminder);

    // Get scheduled notifications to verify
    const scheduledNotifications = await notificationService.getScheduledNotifications();
    const reminderNotifications = scheduledNotifications.filter((n: any) =>
      n.userInfo?.reminderId === reminder.id
    );

    result.notificationsScheduled = reminderNotifications.length;
    result.details.push(`Scheduled ${result.notificationsScheduled} notifications for recurring reminder`);

    // Validate that we have notifications for multiple occurrences
    if (result.notificationsScheduled < 2) {
      result.errors.push(`Expected multiple notifications for recurring reminder, got ${result.notificationsScheduled}`);
      result.testPassed = false;
    }

    // Check that notifications are properly spaced
    const notificationTimes = reminderNotifications
      .map((n: any) => new Date(n.date))
      .sort((a: Date, b: Date) => a.getTime() - b.getTime());

    if (notificationTimes.length >= 2) {
      const timeSpacing = notificationTimes[1].getTime() - notificationTimes[0].getTime();
      const expectedSpacing = reminder.customInterval || 1;

      // For daily reminders, expect ~24 hours between notifications
      if (reminder.repeatPattern === 'daily') {
        const hoursDiff = timeSpacing / (1000 * 60 * 60);
        if (Math.abs(hoursDiff - 24) > 2) { // Allow 2 hour tolerance
          result.errors.push(`Incorrect spacing for daily reminder: ${hoursDiff.toFixed(1)} hours between notifications`);
          result.testPassed = false;
        }
      }
    }

  } catch (error) {
    result.errors.push(`Recurring notification test error: ${error}`);
    result.testPassed = false;
  }

  return result;
};

/**
 * Run comprehensive notification tests
 */
export const runNotificationTests = async (): Promise<{
  overallPassed: boolean;
  results: Array<{
    testName: string;
    passed: boolean;
    details: string[];
    errors: string[];
  }>;
}> => {
  const results = [];
  let overallPassed = true;

  // Test 1: Basic notification timing
  console.log('[NotificationTest] Running basic timing test...');
  const basicTest = await testNotificationTiming({
    id: 'test-basic',
    title: 'Test Reminder',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    dueTime: '09:15',
  });

  results.push({
    testName: 'Basic Notification Timing',
    passed: basicTest.testPassed,
    details: basicTest.notificationTimings.map(t =>
      `${t.label}: ${t.calculatedTime} (${t.timeUntilNotification})`
    ),
    errors: basicTest.errors,
  });

  if (!basicTest.testPassed) {overallPassed = false;}

  // Test 2: Recurring notifications
  console.log('[NotificationTest] Running recurring notification test...');
  const recurringTest = await testRecurringNotifications({
    id: 'test-recurring',
    title: 'Test Recurring Reminder',
    dueDate: new Date().toISOString(),
    dueTime: '09:15',
    repeatPattern: 'daily',
    customInterval: 1,
  });

  results.push({
    testName: 'Recurring Notifications',
    passed: recurringTest.testPassed,
    details: recurringTest.details,
    errors: recurringTest.errors,
  });

  if (!recurringTest.testPassed) {overallPassed = false;}

  return { overallPassed, results };
};

/**
 * Format time difference in a human-readable way
 */
const formatTimeDifference = (future: Date, now: Date): string => {
  const diffMs = future.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ${diffHours % 24} hour${diffHours % 24 !== 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ${diffMinutes % 60} minute${diffMinutes % 60 !== 1 ? 's' : ''}`;
  } else {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
  }
};

/**
 * Calculate notification time in UK time (no timezone logic)
 */
function calculateNotificationTimeUK(
  dueDate: Date,
  dueTime: string | undefined,
  value: number,
  type: 'before' | 'after' | 'exact'
): Date {
  const date = new Date(dueDate);
  if (dueTime) {
    const [hours, minutes] = dueTime.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
  }
  if (type === 'before') {
    date.setMinutes(date.getMinutes() - value);
  } else if (type === 'after') {
    date.setMinutes(date.getMinutes() + value);
  }
  // 'exact' means no change
  return date;
}

/**
 * Debug helper to log notification timing details (UK time only)
 */
export const debugNotificationTiming = (
  reminder: {
    dueDate: string;
    dueTime?: string;
  },
  timing: {
    type: 'before' | 'after' | 'exact';
    value: number;
    label: string;
  }
): void => {
  console.log('[NotificationDebug] === Timing Debug ===');
  console.log('[NotificationDebug] Reminder due date:', reminder.dueDate);
  console.log('[NotificationDebug] Reminder due time:', reminder.dueTime);
  console.log('[NotificationDebug] Timing:', timing);

  try {
    const notificationTime = calculateNotificationTimeUK(
      new Date(reminder.dueDate),
      reminder.dueTime,
      timing.value,
      timing.type
    );

    console.log('[NotificationDebug] Calculated notification time:', notificationTime.toISOString());
    console.log('[NotificationDebug] Is in future:', notificationTime > new Date());
    console.log('[NotificationDebug] Time until notification:', formatTimeDifference(notificationTime, new Date()));
  } catch (error) {
    console.error('[NotificationDebug] Error calculating timing:', error);
  }

  console.log('[NotificationDebug] === End Debug ===');
};
