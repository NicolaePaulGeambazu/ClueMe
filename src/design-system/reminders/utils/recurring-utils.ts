/**
 * Recurring Utilities for Reminders
 * 
 * Handles all recurring reminder logic with proper edge case handling and timezone support
 */

import { 
  Reminder, 
  RepeatPattern, 
  RecurringOccurrence 
} from '../types';
import {
  normalizeDate,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  getDayOfWeek,
  getFirstMondayOfMonth,
  getLastFridayOfMonth,
  getNextDayOfWeek,
  isPast,
  isFuture,
  getStartOfDay,
  getEndOfDay,
} from './date-utils';
import {
  createTimezoneAwareDate,
  convertToTimezone,
  convertFromTimezone,
  getCurrentTimezone
} from '../../../utils/timezoneUtils';

/**
 * Advanced recurring pattern configuration
 */
export interface AdvancedRecurringConfig {
  type: RepeatPattern;
  interval?: number; // Custom interval (every 3 days, every 2 weeks, etc.)
  repeatDays?: number[]; // Days of week for custom patterns (0=Sunday, 1=Monday, etc.)
  endCondition?: 'never' | 'after_occurrences' | 'until_date';
  endAfterOccurrences?: number;
  endDate?: Date;
  timezone?: string;
}

/**
 * Generate occurrences for a recurring reminder with timezone support
 * This is the main function that handles all recurring patterns
 */
export const generateOccurrences = (
  reminder: Reminder,
  maxOccurrences: number = 50,
  startFromDate?: Date
): RecurringOccurrence[] => {
  if (!reminder.isRecurring || !reminder.repeatPattern || !reminder.dueDate) {
    return [];
  }

  const baseDate = normalizeDate(reminder.dueDate);
  if (!baseDate) {
    return [];
  }

  const timezone = reminder.timezone || getCurrentTimezone();
  const startDate = startFromDate || new Date();
  const occurrences: RecurringOccurrence[] = [];
  let currentDate = new Date(baseDate);
  let occurrenceCount = 0;

  // If the base date is in the past, find the next occurrence
  if (isPast(currentDate)) {
    const nextDate = getNextOccurrenceDate(reminder, startDate, timezone);
    if (!nextDate) {
      return [];
    }
    currentDate = nextDate;
  }

  // Generate occurrences until we reach maxOccurrences or hit the end date
  while (occurrenceCount < maxOccurrences) {
    // Check if we've hit the recurring end date
    if (reminder.recurringEndDate) {
      const endDate = normalizeDate(reminder.recurringEndDate);
      const currentDateNormalized = normalizeDate(currentDate);
      
      if (endDate && currentDateNormalized && currentDateNormalized > endDate) {
        break;
      }
    }

    // Check if we've hit the recurring end after count
    if (reminder.recurringEndAfter && occurrenceCount >= reminder.recurringEndAfter) {
      break;
    }

    // Check if this occurrence is in the future
    if (isFuture(currentDate) || isSameDay(currentDate, new Date())) {
      const occurrence: RecurringOccurrence = {
        date: new Date(currentDate),
        reminder: { 
          ...reminder, 
          dueDate: new Date(currentDate),
          timezone: timezone // Ensure timezone is preserved
        },
        isNext: occurrenceCount === 0
      };
      occurrences.push(occurrence);
    }

    // Get the next occurrence date
    const nextDate = getNextOccurrenceDate(reminder, currentDate, timezone);
    if (!nextDate) {
      break;
    }
    
    if (nextDate <= currentDate) {
      break;
    }

    currentDate = nextDate;
    occurrenceCount++;
  }

  return occurrences;
};

/**
 * Get the next occurrence date for a recurring reminder with timezone support
 */
export const getNextOccurrenceDate = (
  reminder: Reminder,
  fromDate: Date,
  timezone?: string
): Date | null => {
  if (!reminder.repeatPattern) return null;

  const baseDate = normalizeDate(reminder.dueDate);
  if (!baseDate) return null;

  const targetTimezone = timezone || reminder.timezone || getCurrentTimezone();

  switch (reminder.repeatPattern) {
    case RepeatPattern.DAILY:
      return addDays(fromDate, reminder.customInterval || 1);

    case RepeatPattern.WEEKDAYS:
      return getNextWeekday(fromDate, reminder.customInterval);

    case RepeatPattern.WEEKLY:
      return addWeeks(fromDate, reminder.customInterval || 1);

    case RepeatPattern.MONTHLY:
      return addMonths(fromDate, reminder.customInterval || 1);

    case RepeatPattern.YEARLY:
      return addYears(fromDate, reminder.customInterval || 1);

    case RepeatPattern.FIRST_MONDAY:
      return getNextFirstMonday(fromDate);

    case RepeatPattern.LAST_FRIDAY:
      return getNextLastFriday(fromDate);

    case RepeatPattern.CUSTOM:
      return getNextCustomOccurrence(reminder, fromDate, targetTimezone);

    default:
      return null;
  }
};

/**
 * Get the next weekday (Monday-Friday) with custom interval
 */
const getNextWeekday = (fromDate: Date, interval: number = 1): Date => {
  let nextDate = addDays(fromDate, interval);
  const dayOfWeek = getDayOfWeek(nextDate);
  
  // Skip weekends (0 = Sunday, 6 = Saturday)
  if (dayOfWeek === 0) {
    nextDate = addDays(nextDate, 1); // Monday
  } else if (dayOfWeek === 6) {
    nextDate = addDays(nextDate, 2); // Monday
  }
  
  return nextDate;
};

/**
 * Get the next first Monday of the month
 */
const getNextFirstMonday = (fromDate: Date): Date => {
  const firstMonday = getFirstMondayOfMonth(fromDate);
  
  // If the first Monday is in the past or today, get the first Monday of next month
  if (firstMonday <= fromDate) {
    const nextMonth = addMonths(fromDate, 1);
    return getFirstMondayOfMonth(nextMonth);
  }
  
  return firstMonday;
};

/**
 * Get the next last Friday of the month
 */
const getNextLastFriday = (fromDate: Date): Date => {
  const lastFriday = getLastFridayOfMonth(fromDate);
  
  // If the last Friday is in the past or today, get the last Friday of next month
  if (lastFriday <= fromDate) {
    const nextMonth = addMonths(fromDate, 1);
    return getLastFridayOfMonth(nextMonth);
  }
  
  return lastFriday;
};

/**
 * Get the next custom occurrence based on interval and days with timezone support
 */
const getNextCustomOccurrence = (
  reminder: Reminder, 
  fromDate: Date, 
  timezone: string
): Date | null => {
  if (!reminder.customInterval) {
    return null;
  }

  const interval = reminder.customInterval;
  const repeatDays = reminder.repeatDays || [];
  
  // If repeatDays is specified, find the next occurrence on one of those days
  if (repeatDays.length > 0) {
    // Find the next occurrence within the interval
    for (let i = 1; i <= interval; i++) {
      const candidateDate = addDays(fromDate, i);
      const dayOfWeek = getDayOfWeek(candidateDate);
      
      if (repeatDays.includes(dayOfWeek)) {
        // Convert to timezone-aware date if timezone is specified
        if (timezone && timezone !== getCurrentTimezone()) {
          const result = createTimezoneAwareDate(candidateDate, reminder.dueTime, timezone);
          return result;
        }
        return candidateDate;
      }
    }
    
    // If no occurrence found in the interval, move to the next interval
    const nextIntervalStart = addDays(fromDate, interval);
    return getNextCustomOccurrence(reminder, nextIntervalStart, timezone);
  } else {
    // For simple interval patterns (every X days), just add the interval
    const nextDate = addDays(fromDate, interval);
    
    // Convert to timezone-aware date if timezone is specified
    if (timezone && timezone !== getCurrentTimezone()) {
      const result = createTimezoneAwareDate(nextDate, reminder.dueTime, timezone);
      return result;
    }
    return nextDate;
  }
};

/**
 * Check if a date is a valid occurrence for a recurring reminder
 */
export const isValidOccurrence = (reminder: Reminder, date: Date): boolean => {
  if (!reminder.isRecurring || !reminder.repeatPattern) {
    return false;
  }

  const baseDate = normalizeDate(reminder.dueDate);
  if (!baseDate) return false;

  switch (reminder.repeatPattern) {
    case RepeatPattern.DAILY:
      return true; // Any date is valid for daily

    case RepeatPattern.WEEKDAYS:
      const dayOfWeek = getDayOfWeek(date);
      return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday-Friday

    case RepeatPattern.WEEKLY:
      return getDayOfWeek(date) === getDayOfWeek(baseDate);

    case RepeatPattern.MONTHLY:
      return date.getDate() === baseDate.getDate();

    case RepeatPattern.YEARLY:
      return date.getMonth() === baseDate.getMonth() && date.getDate() === baseDate.getDate();

    case RepeatPattern.FIRST_MONDAY:
      const firstMonday = getFirstMondayOfMonth(date);
      return isSameDay(date, firstMonday);

    case RepeatPattern.LAST_FRIDAY:
      const lastFriday = getLastFridayOfMonth(date);
      return isSameDay(date, lastFriday);

    case RepeatPattern.CUSTOM:
      // For custom patterns with specific days, check if the date matches one of those days
      if (reminder.repeatDays && reminder.repeatDays.length > 0) {
        const customDayOfWeek = getDayOfWeek(date);
        return reminder.repeatDays.includes(customDayOfWeek);
      }
      // For custom patterns with intervals (every X days), any date is valid
      // The actual validation happens in the generation logic
      return true;

    default:
      return false;
  }
};

/**
 * Get the next occurrence that matches the recurring pattern
 */
export const getNextMatchingOccurrence = (reminder: Reminder, fromDate: Date = new Date()): Date | null => {
  if (!reminder.isRecurring || !reminder.repeatPattern) {
    return null;
  }

  let currentDate = new Date(fromDate);
  let attempts = 0;
  const maxAttempts = 100; // Prevent infinite loops

  while (attempts < maxAttempts) {
    if (isValidOccurrence(reminder, currentDate)) {
      return currentDate;
    }
    
    currentDate = addDays(currentDate, 1);
    attempts++;
  }

  return null;
};

/**
 * Check if two dates are the same day
 */
const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Get human-readable description of recurring pattern
 */
export const getRecurringDescription = (reminder: Reminder): string => {
  if (!reminder.isRecurring || !reminder.repeatPattern) {
    return 'Not recurring';
  }

  const timezone = reminder.timezone || getCurrentTimezone();
  const timezoneAbbr = getTimezoneAbbreviation(timezone);

  switch (reminder.repeatPattern) {
    case RepeatPattern.DAILY:
      if (reminder.customInterval && reminder.customInterval > 1) {
        return `Every ${reminder.customInterval} days`;
      }
      return 'Daily';

    case RepeatPattern.WEEKDAYS:
      if (reminder.customInterval && reminder.customInterval > 1) {
        return `Every ${reminder.customInterval} weekdays`;
      }
      return 'Weekdays (Mon-Fri)';

    case RepeatPattern.WEEKLY:
      if (reminder.customInterval && reminder.customInterval > 1) {
        return `Every ${reminder.customInterval} weeks`;
      }
      return 'Weekly';

    case RepeatPattern.MONTHLY:
      if (reminder.customInterval && reminder.customInterval > 1) {
        return `Every ${reminder.customInterval} months`;
      }
      return 'Monthly';

    case RepeatPattern.YEARLY:
      if (reminder.customInterval && reminder.customInterval > 1) {
        return `Every ${reminder.customInterval} years`;
      }
      return 'Yearly';

    case RepeatPattern.FIRST_MONDAY:
      return 'First Monday of each month';

    case RepeatPattern.LAST_FRIDAY:
      return 'Last Friday of each month';

    case RepeatPattern.CUSTOM:
      if (reminder.repeatDays && reminder.repeatDays.length > 0) {
        const dayNames = reminder.repeatDays.map(day => getDayName(day)).join(', ');
        if (reminder.customInterval && reminder.customInterval > 1) {
          return `Every ${reminder.customInterval} weeks on ${dayNames}`;
        }
        return `Weekly on ${dayNames}`;
      }
      return 'Custom pattern';

    default:
      return 'Unknown pattern';
  }
};

/**
 * Get timezone abbreviation
 */
const getTimezoneAbbreviation = (timezone: string): string => {
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

/**
 * Get day name from day number
 */
const getDayName = (day: number): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day] || 'Unknown';
};

/**
 * Validate recurring configuration
 */
export const validateRecurringConfig = (reminder: Reminder): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!reminder.isRecurring) {
    return { isValid: true, errors: [] };
  }

  if (!reminder.repeatPattern) {
    errors.push('Repeat pattern is required for recurring reminders');
  }

  if (!reminder.dueDate) {
    errors.push('Due date is required for recurring reminders');
  }

  // Validate custom pattern
  if (reminder.repeatPattern === RepeatPattern.CUSTOM) {
    if (!reminder.repeatDays || reminder.repeatDays.length === 0) {
      errors.push('Repeat days are required for custom patterns');
    } else {
      // Validate day numbers
      const invalidDays = reminder.repeatDays.filter(day => day < 0 || day > 6);
      if (invalidDays.length > 0) {
        errors.push('Invalid day numbers in repeat days');
      }
    }

    if (!reminder.customInterval || reminder.customInterval < 1) {
      errors.push('Custom interval must be at least 1');
    }
  }

  // Validate end conditions
  if (reminder.recurringEndDate && reminder.recurringEndAfter) {
    errors.push('Cannot specify both end date and end after occurrences');
  }

  if (reminder.recurringEndAfter && reminder.recurringEndAfter < 1) {
    errors.push('End after occurrences must be at least 1');
  }

  // Validate timezone
  if (reminder.timezone && !isValidTimezone(reminder.timezone)) {
    errors.push('Invalid timezone specified');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Check if timezone is valid
 */
const isValidTimezone = (timezone: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get the estimated number of occurrences for a recurring reminder
 */
export const getEstimatedOccurrences = (reminder: Reminder, daysAhead: number = 365): number => {
  if (!reminder.isRecurring || !reminder.repeatPattern) {
    return 0;
  }

  const startDate = new Date();
  const endDate = addDays(startDate, daysAhead);
  let count = 0;
  let currentDate = new Date(startDate);

  while (currentDate <= endDate && count < 1000) { // Safety limit
    if (isValidOccurrence(reminder, currentDate)) {
      count++;
    }
    currentDate = addDays(currentDate, 1);
  }

  return count;
};

/**
 * Check if a recurring reminder should end
 */
export const shouldEndRecurring = (reminder: Reminder, occurrenceCount: number): boolean => {
  if (!reminder.isRecurring) {
    return false;
  }

  // Check end after occurrences
  if (reminder.recurringEndAfter && occurrenceCount >= reminder.recurringEndAfter) {
    return true;
  }

  // Check end date
  if (reminder.recurringEndDate && new Date() > reminder.recurringEndDate) {
    return true;
  }

  return false;
};

/**
 * Get advanced recurring configuration
 */
export const getAdvancedRecurringConfig = (reminder: Reminder): AdvancedRecurringConfig => {
  return {
    type: reminder.repeatPattern || RepeatPattern.DAILY,
    interval: reminder.customInterval,
    repeatDays: reminder.repeatDays,
    endCondition: reminder.recurringEndAfter ? 'after_occurrences' : 
                  reminder.recurringEndDate ? 'until_date' : 'never',
    endAfterOccurrences: reminder.recurringEndAfter,
    endDate: reminder.recurringEndDate,
    timezone: reminder.timezone
  };
};

/**
 * Create a recurring reminder with advanced configuration
 */
export const createAdvancedRecurringReminder = (
  baseReminder: Partial<Reminder>,
  config: AdvancedRecurringConfig
): Reminder => {
  return {
    ...baseReminder,
    isRecurring: true,
    repeatPattern: config.type,
    customInterval: config.interval,
    repeatDays: config.repeatDays,
    recurringEndAfter: config.endAfterOccurrences,
    recurringEndDate: config.endDate,
    timezone: config.timezone || getCurrentTimezone(),
  } as Reminder;
}; 