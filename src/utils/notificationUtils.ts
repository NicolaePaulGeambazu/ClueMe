
import { Platform } from 'react-native';

// UK-specific constants
export const UK_LOCALE = 'en-GB';
export const UK_TIMEZONE = 'Europe/London';

/**
 * Format date using UK locale and timezone
 */
export const formatUKDate = (date: Date): string => {
  return new Intl.DateTimeFormat(UK_LOCALE, {
    timeZone: UK_TIMEZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

/**
 * Format time using UK locale and timezone
 */
export const formatUKTime = (date: Date): string => {
  return new Intl.DateTimeFormat(UK_LOCALE, {
    timeZone: UK_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
};

/**
 * Format date and time together using UK locale
 */
export const formatUKDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat(UK_LOCALE, {
    timeZone: UK_TIMEZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
};

/**
 * Check if the current platform supports notifications
 */
export const isNotificationPlatformSupported = (): boolean => {
  return Platform.OS === 'ios';
};

/**
 * Get user-friendly timing description
 */
export const getTimingDescription = (type: 'before' | 'exact' | 'after', value: number): string => {
  if (type === 'exact') {
    return 'At due time';
  }

  const timeUnit = value < 60 ? 'minute' : value < 1440 ? 'hour' : 'day';
  const timeValue = value < 60 ? value : value < 1440 ? Math.floor(value / 60) : Math.floor(value / 1440);
  const plural = timeValue !== 1 ? 's' : '';

  return `${timeValue} ${timeUnit}${plural} ${type === 'before' ? 'before' : 'after'}`;
};

/**
 * Get priority emoji for notifications
 */
export const getPriorityEmoji = (priority?: 'low' | 'medium' | 'high'): string => {
  switch (priority) {
    case 'high':
      return '🔴';
    case 'medium':
      return '🟡';
    case 'low':
      return '🟢';
    default:
      return '📋';
  }
};

/**
 * Generate notification ID for a reminder and timing
 */
export const generateNotificationId = (reminderId: string, type: string, value: number): string => {
  return `${reminderId}-${type}-${value}`;
};

/**
 * Check if a date is in the past
 */
export const isDateInPast = (date: Date): boolean => {
  return date <= new Date();
};

/**
 * Calculate notification time based on due date/time and timing offset
 */
export const calculateNotificationTime = (
  dueDate: string,
  dueTime?: string,
  timingType: 'before' | 'exact' | 'after' = 'exact',
  timingValue: number = 0
): Date => {
  let baseTime: Date;
  
  if (dueTime && dueDate) {
    const timeParts = dueTime.split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    
    baseTime = new Date(dueDate);
    baseTime.setHours(hours, minutes, 0, 0);
  } else {
    baseTime = new Date(dueDate);
  }

  const notificationTime = new Date(baseTime);
  
  switch (timingType) {
    case 'before':
      notificationTime.setMinutes(notificationTime.getMinutes() - timingValue);
      break;
    case 'after':
      notificationTime.setMinutes(notificationTime.getMinutes() + timingValue);
      break;
    case 'exact':
    default:
      break;
  }

  return notificationTime;
};

/**
 * Validate notification timing configuration
 */
export const validateNotificationTiming = (timing: {
  type: 'before' | 'exact' | 'after';
  value: number;
}): boolean => {
  if (timing.type === 'exact' && timing.value !== 0) {
    return false;
  }
  
  if ((timing.type === 'before' || timing.type === 'after') && timing.value <= 0) {
    return false;
  }
  
  return true;
};

/**
 * Get default notification timings for reminders
 */
export const getDefaultNotificationTimings = () => [
  { type: 'before' as const, value: 15, label: '15 minutes before' },
  { type: 'before' as const, value: 30, label: '30 minutes before' },
  { type: 'before' as const, value: 60, label: '1 hour before' },
  { type: 'exact' as const, value: 0, label: 'At due time' },
];

/**
 * Convert minutes to human-readable format
 */
export const formatMinutesToReadable = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else {
    const days = Math.floor(minutes / 1440);
    return `${days} day${days !== 1 ? 's' : ''}`;
  }
};
