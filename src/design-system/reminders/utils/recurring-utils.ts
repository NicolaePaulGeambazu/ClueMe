/**
 * Recurring Utilities for Reminders
 *
 * Handles all recurring reminder logic with proper edge case handling (UK timezone only)
 */

import {
  Reminder,
  RepeatPattern,
  RecurringOccurrence,
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
}

/**
 * Generate occurrences for a recurring reminder (UK timezone)
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

  const startDate = startFromDate || new Date();
  const occurrences: RecurringOccurrence[] = [];
  let currentDate = new Date(baseDate);
  let occurrenceCount = 0;

  // If the base date is in the past, find the next occurrence
  if (isPast(currentDate)) {
    const nextDate = getNextOccurrenceDate(reminder, startDate);
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
        },
        isNext: occurrenceCount === 0,
      };
      occurrences.push(occurrence);
    }

    // Get the next occurrence date
    const nextDate = getNextOccurrenceDate(reminder, currentDate);
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
 * Get the next occurrence date for a recurring reminder (UK timezone)
 */
export const getNextOccurrenceDate = (
  reminder: Reminder,
  fromDate: Date
): Date | null => {
  if (!reminder.repeatPattern) {return null;}

  const baseDate = normalizeDate(reminder.dueDate);
  if (!baseDate) {return null;}

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
      return getNextCustomOccurrence(reminder, fromDate);

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
 * Get the next custom occurrence based on repeat days
 */
const getNextCustomOccurrence = (
  reminder: Reminder,
  fromDate: Date
): Date | null => {
  if (!reminder.repeatDays || reminder.repeatDays.length === 0) {
    return null;
  }

  const baseDate = normalizeDate(reminder.dueDate);
  if (!baseDate) {return null;}

  // Create a date with the same time as the base reminder
  const createDateWithTime = (date: Date): Date => {
    const result = new Date(date);
    if (reminder.dueTime) {
      const [hours, minutes] = reminder.dueTime.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        result.setHours(hours, minutes, 0, 0);
      }
    }
    return result;
  };

  // Sort repeat days to ensure we check them in order
  const sortedRepeatDays = [...reminder.repeatDays].sort((a, b) => a - b);

  // Check each repeat day starting from the current date
  for (let i = 0; i < 7; i++) {
    const checkDate = addDays(fromDate, i);
    const dayOfWeek = getDayOfWeek(checkDate);

    if (sortedRepeatDays.includes(dayOfWeek)) {
      const result = createDateWithTime(checkDate);
      if (result > fromDate) {
        return result;
      }
    }
  }

  // If no match found in the next 7 days, look further ahead
  const nextWeekDate = addDays(fromDate, 7);
  for (const dayOfWeek of sortedRepeatDays) {
    const targetDate = getNextDayOfWeek(dayOfWeek, nextWeekDate);
    if (targetDate) {
      return createDateWithTime(targetDate);
    }
  }

  return null;
};

/**
 * Check if a date is a valid occurrence for a recurring reminder
 */
export const isValidOccurrence = (reminder: Reminder, date: Date): boolean => {
  if (!reminder.isRecurring || !reminder.repeatPattern) {
    return false;
  }

  const baseDate = normalizeDate(reminder.dueDate);
  if (!baseDate) {return false;}

  const checkDate = normalizeDate(date);
  if (!checkDate) {return false;}

  // Check if the date is before the recurring start date
  if (reminder.recurringStartDate) {
    const startDate = normalizeDate(reminder.recurringStartDate);
    if (startDate && checkDate < startDate) {
      return false;
    }
  }

  // Check if the date is after the recurring end date
  if (reminder.recurringEndDate) {
    const endDate = normalizeDate(reminder.recurringEndDate);
    if (endDate && checkDate > endDate) {
      return false;
    }
  }

  // Check if the date matches the pattern
  switch (reminder.repeatPattern) {
    case RepeatPattern.DAILY:
      return true; // Any date is valid for daily

    case RepeatPattern.WEEKDAYS:
      const dayOfWeek = getDayOfWeek(checkDate);
      return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday

    case RepeatPattern.WEEKLY:
      return getDayOfWeek(checkDate) === getDayOfWeek(baseDate);

    case RepeatPattern.MONTHLY:
      return checkDate.getDate() === baseDate.getDate();

    case RepeatPattern.YEARLY:
      return checkDate.getMonth() === baseDate.getMonth() &&
             checkDate.getDate() === baseDate.getDate();

    case RepeatPattern.FIRST_MONDAY:
      return getDayOfWeek(checkDate) === 1 && checkDate.getDate() <= 7;

    case RepeatPattern.LAST_FRIDAY:
      const lastFriday = getLastFridayOfMonth(checkDate);
      return isSameDay(checkDate, lastFriday);

    case RepeatPattern.CUSTOM:
      if (!reminder.repeatDays || reminder.repeatDays.length === 0) {
        return false;
      }
      return reminder.repeatDays.includes(getDayOfWeek(checkDate));

    default:
      return false;
  }
};

/**
 * Get the next matching occurrence from a given date
 */
export const getNextMatchingOccurrence = (reminder: Reminder, fromDate: Date = new Date()): Date | null => {
  if (!reminder.isRecurring || !reminder.repeatPattern) {
    return null;
  }

  return getNextOccurrenceDate(reminder, fromDate);
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
 * Get a human-readable description of the recurring pattern
 */
export const getRecurringDescription = (reminder: Reminder): string => {
  if (!reminder.isRecurring || !reminder.repeatPattern) {
    return '';
  }

  const interval = reminder.customInterval || 1;
  const intervalText = interval === 1 ? '' : ` every ${interval}`;

  switch (reminder.repeatPattern) {
    case RepeatPattern.DAILY:
      return `Daily${intervalText}`;

    case RepeatPattern.WEEKDAYS:
      return `Weekdays${intervalText}`;

    case RepeatPattern.WEEKLY:
      return `Weekly${intervalText}`;

    case RepeatPattern.MONTHLY:
      return `Monthly${intervalText}`;

    case RepeatPattern.YEARLY:
      return `Yearly${intervalText}`;

    case RepeatPattern.FIRST_MONDAY:
      return 'First Monday of each month';

    case RepeatPattern.LAST_FRIDAY:
      return 'Last Friday of each month';

    case RepeatPattern.CUSTOM:
      if (!reminder.repeatDays || reminder.repeatDays.length === 0) {
        return 'Custom';
      }
      const dayNames = reminder.repeatDays.map(getDayName);
      return `Every ${dayNames.join(', ')}`;

    default:
      return 'Custom';
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

  if (reminder.repeatPattern === RepeatPattern.CUSTOM) {
    if (!reminder.repeatDays || reminder.repeatDays.length === 0) {
      errors.push('Repeat days are required for custom recurring patterns');
    } else {
      for (const day of reminder.repeatDays) {
        if (day < 0 || day > 6) {
          errors.push(`Invalid day of week: ${day}`);
        }
      }
    }
  }

  if (reminder.customInterval !== undefined && reminder.customInterval < 1) {
    errors.push('Custom interval must be at least 1');
  }

  if (reminder.recurringEndAfter !== undefined && reminder.recurringEndAfter < 1) {
    errors.push('End after occurrences must be at least 1');
  }

  if (reminder.recurringStartDate && reminder.recurringEndDate) {
    const startDate = normalizeDate(reminder.recurringStartDate);
    const endDate = normalizeDate(reminder.recurringEndDate);
    if (startDate && endDate && startDate >= endDate) {
      errors.push('Recurring start date must be before end date');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Estimate the number of occurrences in a given time period
 */
export const getEstimatedOccurrences = (reminder: Reminder, daysAhead: number = 365): number => {
  if (!reminder.isRecurring || !reminder.repeatPattern) {
    return 0;
  }

  const baseDate = normalizeDate(reminder.dueDate);
  if (!baseDate) {return 0;}

  const endDate = addDays(new Date(), daysAhead);
  const occurrences = generateOccurrences(reminder, 1000, new Date());

  return occurrences.filter(occ => occ.date <= endDate).length;
};

/**
 * Check if recurring should end based on conditions
 */
export const shouldEndRecurring = (reminder: Reminder, occurrenceCount: number): boolean => {
  if (!reminder.isRecurring) {
    return true;
  }

  // Check end after occurrences
  if (reminder.recurringEndAfter && occurrenceCount >= reminder.recurringEndAfter) {
    return true;
  }

  // Check end date
  if (reminder.recurringEndDate) {
    const endDate = normalizeDate(reminder.recurringEndDate);
    if (endDate && new Date() > endDate) {
      return true;
    }
  }

  return false;
};

/**
 * Get advanced recurring configuration from a reminder
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
  };
};

/**
 * Create a recurring reminder from base reminder and advanced config
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
  } as Reminder;
};
