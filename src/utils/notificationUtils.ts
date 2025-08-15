
/**
 * UK Date/Time Formatting Utilities for Notifications
 * Provides consistent UK formatting across the notification system
 */

// UK-specific constants
const UK_LOCALE = 'en-GB';
const UK_TIMEZONE = 'Europe/London';

/**
 * Format date in UK format (DD/MM/YYYY)
 */
export const formatUKDate = (date: Date): string => {
  try {
    return date.toLocaleDateString(UK_LOCALE, {
      timeZone: UK_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (error) {
    console.error('[NotificationUtils] Error formatting UK date:', error);
    return date.toLocaleDateString();
  }
};

/**
 * Format time in UK format (HH:MM)
 */
export const formatUKTime = (date: Date): string => {
  try {
    return date.toLocaleTimeString(UK_LOCALE, {
      timeZone: UK_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch (error) {
    console.error('[NotificationUtils] Error formatting UK time:', error);
    return date.toLocaleTimeString();
  }
};

/**
 * Format date and time in UK format
 */
export const formatUKDateTime = (date: Date): string => {
  try {
    return date.toLocaleString(UK_LOCALE, {
      timeZone: UK_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch (error) {
    console.error('[NotificationUtils] Error formatting UK date/time:', error);
    return date.toLocaleString();
  }
};

/**
 * Check if a date/time is in the past (stale)
 */
export const isStaleNotification = (scheduledTime: Date): boolean => {
  return scheduledTime <= new Date();
};

/**
 * Validate notification timing configuration
 */
export const validateNotificationTiming = (timing: {
  type: 'before' | 'exact' | 'after';
  value: number;
}): boolean => {
  if (!timing.type || !['before', 'exact', 'after'].includes(timing.type)) {
    return false;
  }
  
  if (typeof timing.value !== 'number' || timing.value < 0) {
    return false;
  }
  
  return true;
};

/**
 * Generate a unique notification identifier
 */
export const generateNotificationId = (reminderId: string, timing: string): string => {
  return `${reminderId}_${timing}_${Date.now()}`;
};
