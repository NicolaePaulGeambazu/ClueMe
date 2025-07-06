/**
 * Notification Utilities for Reminders
 * 
 * Handles notification scheduling with timezone support and edge case handling
 */

import { Reminder, NotificationTiming, NotificationType } from '../types';
import { 
  normalizeDate, 
  parseTimeString, 
  toUTCWithLocalTime,
  fromUTCToLocal,
  addDays,
  addHours,
  addMinutes,
  isPast,
  isFuture,
  getStartOfDay,
  getEndOfDay,
} from './date-utils';
import { generateOccurrences } from './recurring-utils';

/**
 * Calculate notification time based on reminder and timing
 */
export const calculateNotificationTime = (
  reminder: Reminder,
  timing: NotificationTiming
): Date | null => {
  if (!reminder.dueDate) {
    return null;
  }

  const dueDate = normalizeDate(reminder.dueDate);
  if (!dueDate) {
    return null;
  }

  // Create the base notification time
  let notificationTime = new Date(dueDate);

  // Apply the due time if specified
  if (reminder.dueTime) {
    const timeParts = parseTimeString(reminder.dueTime);
    if (timeParts) {
      notificationTime.setHours(timeParts.hours, timeParts.minutes, 0, 0);
    }
  }

  // Apply the timing offset
  switch (timing.type) {
    case NotificationType.EXACT:
      // No adjustment needed
      break;

    case NotificationType.BEFORE:
      notificationTime = addMinutes(notificationTime, -timing.value);
      break;

    case NotificationType.AFTER:
      notificationTime = addMinutes(notificationTime, timing.value);
      break;

    default:
      console.error('❌ Unknown notification timing type:', timing.type);
      return null;
  }

  return notificationTime;
};

/**
 * Generate notification times for all occurrences of a recurring reminder
 */
export const generateNotificationTimes = (
  reminder: Reminder,
  maxOccurrences: number = 50
): Array<{ occurrenceDate: Date; notificationTimes: Date[] }> => {
  if (!reminder.isRecurring || !reminder.notificationTimings) {
    return [];
  }

  const occurrences = generateOccurrences(reminder, maxOccurrences);
  const result: Array<{ occurrenceDate: Date; notificationTimes: Date[] }> = [];

  for (const occurrence of occurrences) {
    const notificationTimes: Date[] = [];

    for (const timing of reminder.notificationTimings) {
      const notificationTime = calculateNotificationTime(occurrence.reminder, timing);
      if (notificationTime && isFuture(notificationTime)) {
        notificationTimes.push(notificationTime);
      }
    }

    if (notificationTimes.length > 0) {
      result.push({
        occurrenceDate: occurrence.date,
        notificationTimes: notificationTimes.sort((a, b) => a.getTime() - b.getTime())
      });
    }
  }

  return result;
};

/**
 * Get the next notification time for a reminder
 */
export const getNextNotificationTime = (reminder: Reminder): Date | null => {
  if (!reminder.hasNotification || !reminder.notificationTimings) {
    return null;
  }

  if (reminder.isRecurring) {
    const notificationTimes = generateNotificationTimes(reminder, 10); // Check next 10 occurrences
    const now = new Date();
    
    for (const { notificationTimes: times } of notificationTimes) {
      for (const time of times) {
        if (isFuture(time)) {
          return time;
        }
      }
    }
    
    return null;
  } else {
    // For non-recurring reminders, check all notification timings
    const now = new Date();
    let nextTime: Date | null = null;

    for (const timing of reminder.notificationTimings) {
      const notificationTime = calculateNotificationTime(reminder, timing);
      if (notificationTime && isFuture(notificationTime)) {
        if (!nextTime || notificationTime < nextTime) {
          nextTime = notificationTime;
        }
      }
    }

    return nextTime;
  }
};

/**
 * Check if a reminder has any upcoming notifications
 */
export const hasUpcomingNotifications = (reminder: Reminder): boolean => {
  const nextNotification = getNextNotificationTime(reminder);
  return nextNotification !== null;
};

/**
 * Get notification title based on reminder and timing
 */
export const getNotificationTitle = (reminder: Reminder, timing: NotificationTiming): string => {
  const baseTitle = reminder.title;
  
  switch (timing.type) {
    case NotificationType.EXACT:
      return baseTitle;
    
    case NotificationType.BEFORE:
      if (timing.value >= 60) {
        const hours = Math.floor(timing.value / 60);
        const minutes = timing.value % 60;
        if (minutes === 0) {
          return `${baseTitle} (in ${hours}h)`;
        } else {
          return `${baseTitle} (in ${hours}h ${minutes}m)`;
        }
      } else {
        return `${baseTitle} (in ${timing.value}m)`;
      }
    
    case NotificationType.AFTER:
      if (timing.value >= 60) {
        const hours = Math.floor(timing.value / 60);
        const minutes = timing.value % 60;
        if (minutes === 0) {
          return `${baseTitle} (${hours}h ago)`;
        } else {
          return `${baseTitle} (${hours}h ${minutes}m ago)`;
        }
      } else {
        return `${baseTitle} (${timing.value}m ago)`;
      }
    
    default:
      return baseTitle;
  }
};

/**
 * Get notification message based on reminder and timing
 */
export const getNotificationMessage = (reminder: Reminder, timing: NotificationTiming): string => {
  const now = new Date();
  const dueDate = normalizeDate(reminder.dueDate);
  
  if (!dueDate) {
    return reminder.description || 'No description available';
  }

  const timeString = reminder.dueTime ? ` at ${reminder.dueTime}` : '';
  
  switch (timing.type) {
    case NotificationType.EXACT:
      return `Due now${timeString}`;
    
    case NotificationType.BEFORE:
      return `Due soon${timeString}`;
    
    case NotificationType.AFTER:
      return `Was due${timeString}`;
    
    default:
      return reminder.description || 'No description available';
  }
};

/**
 * Create a unique notification ID
 */
export const createNotificationId = (
  reminderId: string, 
  timing: NotificationTiming,
  occurrenceDate?: Date
): string => {
  const baseId = `${reminderId}-${timing.type}-${timing.value}`;
  
  if (occurrenceDate) {
    const dateString = occurrenceDate.toISOString().split('T')[0];
    return `${baseId}-${dateString}`;
  }
  
  return baseId;
};

/**
 * Validate notification configuration
 */
export const validateNotificationConfig = (reminder: Reminder): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!reminder.hasNotification) {
    return { isValid: true, errors: [] };
  }

  if (!reminder.notificationTimings || reminder.notificationTimings.length === 0) {
    errors.push('At least one notification timing must be specified');
    return { isValid: false, errors };
  }

  for (const timing of reminder.notificationTimings) {
    if (timing.value < 0) {
      errors.push('Notification timing value cannot be negative');
    }

    if (timing.type === NotificationType.BEFORE && timing.value === 0) {
      errors.push('Before notification timing cannot be 0 minutes');
    }

    if (timing.type === NotificationType.AFTER && timing.value === 0) {
      errors.push('After notification timing cannot be 0 minutes');
    }
  }

  // Check for duplicate timings
  const timingKeys = reminder.notificationTimings.map(t => `${t.type}-${t.value}`);
  const uniqueKeys = new Set(timingKeys);
  if (timingKeys.length !== uniqueKeys.size) {
    errors.push('Duplicate notification timings are not allowed');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get default notification timings
 */
export const getDefaultNotificationTimings = (): NotificationTiming[] => {
  return [
    {
      type: NotificationType.BEFORE,
      value: 15,
      label: '15 minutes before'
    }
  ];
};

/**
 * Get common notification timing presets
 */
export const getNotificationTimingPresets = (): Array<{
  label: string;
  timings: NotificationTiming[];
}> => {
  return [
    {
      label: 'Just in time',
      timings: [
        { type: NotificationType.EXACT, value: 0, label: 'Exactly on time' }
      ]
    },
    {
      label: 'Early warning',
      timings: [
        { type: NotificationType.BEFORE, value: 15, label: '15 minutes before' }
      ]
    },
    {
      label: 'Well prepared',
      timings: [
        { type: NotificationType.BEFORE, value: 60, label: '1 hour before' },
        { type: NotificationType.BEFORE, value: 15, label: '15 minutes before' }
      ]
    },
    {
      label: 'Day ahead',
      timings: [
        { type: NotificationType.BEFORE, value: 1440, label: '1 day before' },
        { type: NotificationType.BEFORE, value: 60, label: '1 hour before' }
      ]
    },
    {
      label: 'Custom',
      timings: []
    }
  ];
};

/**
 * Convert notification timing to human-readable string
 */
export const formatNotificationTiming = (timing: NotificationTiming): string => {
  switch (timing.type) {
    case NotificationType.EXACT:
      return 'Exactly on time';
    
    case NotificationType.BEFORE:
      if (timing.value >= 1440) {
        const days = Math.floor(timing.value / 1440);
        return `${days} day${days > 1 ? 's' : ''} before`;
      } else if (timing.value >= 60) {
        const hours = Math.floor(timing.value / 60);
        return `${hours} hour${hours > 1 ? 's' : ''} before`;
      } else {
        return `${timing.value} minute${timing.value > 1 ? 's' : ''} before`;
      }
    
    case NotificationType.AFTER:
      if (timing.value >= 1440) {
        const days = Math.floor(timing.value / 1440);
        return `${days} day${days > 1 ? 's' : ''} after`;
      } else if (timing.value >= 60) {
        const hours = Math.floor(timing.value / 60);
        return `${hours} hour${hours > 1 ? 's' : ''} after`;
      } else {
        return `${timing.value} minute${timing.value > 1 ? 's' : ''} after`;
      }
    
    default:
      return 'Unknown timing';
  }
}; 