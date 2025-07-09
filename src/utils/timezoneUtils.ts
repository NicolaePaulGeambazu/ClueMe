/**
 * Timezone Utilities for Reminders
 * 
 * Handles timezone-aware date operations, timezone detection, and proper notification scheduling
 */

import { Platform } from 'react-native';
import { Reminder } from '../design-system/reminders/types';

// Common timezones for better UX
export const COMMON_TIMEZONES = {
  'America/New_York': 'Eastern Time',
  'America/Chicago': 'Central Time',
  'America/Denver': 'Mountain Time',
  'America/Los_Angeles': 'Pacific Time',
  'America/Anchorage': 'Alaska Time',
  'Pacific/Honolulu': 'Hawaii Time',
  'Europe/London': 'London',
  'Europe/Paris': 'Paris',
  'Europe/Berlin': 'Berlin',
  'Europe/Rome': 'Rome',
  'Europe/Moscow': 'Moscow',
  'Asia/Tokyo': 'Tokyo',
  'Asia/Shanghai': 'Shanghai',
  'Asia/Seoul': 'Seoul',
  'Asia/Singapore': 'Singapore',
  'Asia/Dubai': 'Dubai',
  'Asia/Kolkata': 'Mumbai',
  'Australia/Sydney': 'Sydney',
  'Australia/Melbourne': 'Melbourne',
  'Pacific/Auckland': 'Auckland',
} as const;

export type TimezoneId = keyof typeof COMMON_TIMEZONES;

/**
 * Get the current timezone of the device
 */
export const getCurrentTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    // Fallback to UTC if timezone detection fails
    return 'UTC';
  }
};

/**
 * Get timezone from offset in minutes
 */
export const getTimezoneFromOffset = (offsetMinutes: number): string => {
  const offsetHours = offsetMinutes / 60;
  
  // Map common offsets to timezones
  const offsetMap: { [key: number]: string } = {
    '-12': 'Pacific/Kwajalein',
    '-11': 'Pacific/Midway',
    '-10': 'Pacific/Honolulu',
    '-9': 'America/Anchorage',
    '-8': 'America/Los_Angeles',
    '-7': 'America/Denver',
    '-6': 'America/Chicago',
    '-5': 'America/New_York',
    '-4': 'America/Halifax',
    '-3': 'America/Sao_Paulo',
    '-2': 'Atlantic/South_Georgia',
    '-1': 'Atlantic/Azores',
    '0': 'UTC',
    '1': 'Europe/London',
    '2': 'Europe/Paris',
    '3': 'Europe/Moscow',
    '4': 'Asia/Dubai',
    '5': 'Asia/Kolkata',
    '6': 'Asia/Almaty',
    '7': 'Asia/Bangkok',
    '8': 'Asia/Shanghai',
    '9': 'Asia/Tokyo',
    '10': 'Australia/Sydney',
    '11': 'Pacific/Guadalcanal',
    '12': 'Pacific/Auckland',
  };
  
  return offsetMap[offsetHours] || 'UTC';
};

/**
 * Get current timezone offset in minutes
 */
export const getCurrentTimezoneOffset = (): number => {
  return new Date().getTimezoneOffset();
};

/**
 * Convert a date to a specific timezone
 */
export const convertToTimezone = (date: Date, targetTimezone: string): Date => {
  try {
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const targetTime = new Date(utc + (getTimezoneOffset(targetTimezone) * 60000));
    return targetTime;
  } catch (error) {
    return date; // Fallback to original date
  }
};

/**
 * Convert a date from a specific timezone to local time
 */
export const convertFromTimezone = (date: Date, sourceTimezone: string): Date => {
  try {
    const utc = date.getTime() - (getTimezoneOffset(sourceTimezone) * 60000);
    const localTime = new Date(utc - (date.getTimezoneOffset() * 60000));
    return localTime;
  } catch (error) {
    return date; // Fallback to original date
  }
};

/**
 * Get timezone offset in minutes
 */
const getTimezoneOffset = (timezone: string): number => {
  try {
    const now = new Date();
    const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    const target = new Date(utc.toLocaleString('en-US', { timeZone: timezone }));
    return (target.getTime() - utc.getTime()) / 60000;
  } catch (error) {
    return 0; // Fallback to UTC
  }
};

/**
 * Create a timezone-aware date from date and time string
 */
export const createTimezoneAwareDate = (
  date: Date,
  timeString: string | undefined,
  timezone: string
): Date => {
  try {
    const baseDate = new Date(date);
    
    if (timeString) {
      const [hours, minutes] = timeString.split(':').map(Number);
      baseDate.setHours(hours || 0, minutes || 0, 0, 0);
    }
    
    // Convert to the target timezone
    const result = convertToTimezone(baseDate, timezone);
    
    // Validate the result
    if (isNaN(result.getTime())) {
      return baseDate; // Fallback to base date
    }
    
    return result;
  } catch (error) {
    return date; // Fallback to original date
  }
};

/**
 * Calculate notification time with timezone awareness
 */
export const calculateNotificationTimeWithTimezone = (
  reminderDate: Date,
  reminderTime: string | undefined,
  reminderTimezone: string,
  timingOffset: number, // minutes before/after
  timingType: 'before' | 'after' | 'exact'
): Date => {
  try {
    // Create the base notification time in the reminder's timezone
    let notificationTime = createTimezoneAwareDate(reminderDate, reminderTime, reminderTimezone);
    
    // Apply timing offset
    switch (timingType) {
      case 'before':
        notificationTime = new Date(notificationTime.getTime() - timingOffset * 60 * 1000);
        break;
      case 'after':
        notificationTime = new Date(notificationTime.getTime() + timingOffset * 60 * 1000);
        break;
      case 'exact':
        // No adjustment needed
        break;
    }
    
    // Convert to local time for scheduling
    const result = convertFromTimezone(notificationTime, reminderTimezone);
    
    return result;
  } catch (error) {
    // Fallback to simple calculation
    const baseTime = new Date(reminderDate);
    if (reminderTime) {
      const [hours, minutes] = reminderTime.split(':').map(Number);
      baseTime.setHours(hours, minutes, 0, 0);
    }
    
    switch (timingType) {
      case 'before':
        return new Date(baseTime.getTime() - timingOffset * 60 * 1000);
      case 'after':
        return new Date(baseTime.getTime() + timingOffset * 60 * 1000);
      default:
        return baseTime;
    }
  }
};

/**
 * Check if a timezone is valid
 */
export const isValidTimezone = (timezone: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get timezone display name
 */
export const getTimezoneDisplayName = (timezone: string): string => {
  return COMMON_TIMEZONES[timezone as TimezoneId] || timezone;
};

/**
 * Get all available timezones for selection
 */
export const getAvailableTimezones = (): Array<{ id: string; name: string; offset: string }> => {
  const timezones: Array<{ id: string; name: string; offset: string }> = [];
  
  Object.entries(COMMON_TIMEZONES).forEach(([id, name]) => {
    try {
      const now = new Date();
      const offset = now.toLocaleString('en-CA', {
        timeZone: id,
        timeZoneName: 'short',
      }).split(' ').pop() || '';
      
      timezones.push({ id, name, offset });
    } catch (error) {
      // Skip invalid timezones
    }
  });
  
  return timezones.sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Detect if user has traveled to a different timezone
 */
export const detectTimezoneChange = (storedTimezone: string, storedOffset: number): {
  hasChanged: boolean;
  newTimezone: string;
  newOffset: number;
  timeDifference: number; // minutes
} => {
  const currentTimezone = getCurrentTimezone();
  const currentOffset = getCurrentTimezoneOffset();
  
  const hasChanged = storedTimezone !== currentTimezone || storedOffset !== currentOffset;
  const timeDifference = currentOffset - storedOffset;
  
  return {
    hasChanged,
    newTimezone: currentTimezone,
    newOffset: currentOffset,
    timeDifference,
  };
};

interface TimezoneChange {
  hasChanged: boolean;
  timeDifference: number;
}

/**
 * Adjust notification times when timezone changes
 */
export const adjustNotificationsForTimezoneChange = (
  reminder: Reminder,
  timezoneChange: TimezoneChange
): boolean => {
  if (!timezoneChange.hasChanged) {
    return false;
  }
  
  // If timezone changed, we need to reschedule notifications
  // This should be handled by the notification service
  return true;
};

/**
 * Format a date in a specific timezone for display
 */
export const formatDateInTimezone = (
  date: Date,
  timezone: string,
  options?: Intl.DateTimeFormatOptions
): string => {
  try {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone,
    };
    
    return date.toLocaleString('en-US', { ...defaultOptions, ...options });
  } catch (error) {
    return date.toLocaleString(); // Fallback to local formatting
  }
};

/**
 * Get timezone abbreviation (EST, PST, etc.)
 */
export const getTimezoneAbbreviation = (timezone: string): string => {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      timeZoneName: 'short',
    });
    
    const parts = formatter.formatToParts(now);
    const timezonePart = parts.find(part => part.type === 'timeZoneName');
    return timezonePart?.value || timezone;
  } catch (error) {
    return timezone;
  }
}; 