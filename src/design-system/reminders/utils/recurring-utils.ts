/**
 * Recurring Utilities for Reminders
 * 
 * Handles all recurring reminder logic with proper edge case handling
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

/**
 * Generate occurrences for a recurring reminder
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
    console.error('❌ Invalid base date for recurring reminder:', reminder.id);
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
      console.error('❌ Could not find next occurrence for past recurring reminder:', reminder.id);
      return [];
    }
    currentDate = nextDate;
  }

  // Generate occurrences until we reach maxOccurrences or hit the end date
  while (occurrenceCount < maxOccurrences) {
    // Check if we've hit the recurring end date
    if (reminder.recurringEndDate && currentDate > reminder.recurringEndDate) {
      break;
    }

    // Check if this occurrence is in the future
    if (isFuture(currentDate) || isSameDay(currentDate, new Date())) {
      const occurrence: RecurringOccurrence = {
        date: new Date(currentDate),
        reminder: { ...reminder, dueDate: new Date(currentDate) },
        isNext: occurrenceCount === 0
      };
      occurrences.push(occurrence);
    }

    // Get the next occurrence date
    const nextDate = getNextOccurrenceDate(reminder, currentDate);
    if (!nextDate || nextDate <= currentDate) {
      console.error('❌ Could not generate next occurrence date:', reminder.id);
      break;
    }

    currentDate = nextDate;
    occurrenceCount++;
  }

  console.log(`📅 Generated ${occurrences.length} occurrences for recurring reminder ${reminder.id}`);
  return occurrences;
};

/**
 * Get the next occurrence date for a recurring reminder
 */
export const getNextOccurrenceDate = (
  reminder: Reminder,
  fromDate: Date
): Date | null => {
  if (!reminder.repeatPattern) return null;

  const baseDate = normalizeDate(reminder.dueDate);
  if (!baseDate) return null;

  switch (reminder.repeatPattern) {
    case RepeatPattern.DAILY:
      return addDays(fromDate, 1);

    case RepeatPattern.WEEKDAYS:
      return getNextWeekday(fromDate);

    case RepeatPattern.WEEKLY:
      return addWeeks(fromDate, 1);

    case RepeatPattern.MONTHLY:
      return addMonths(fromDate, 1);

    case RepeatPattern.YEARLY:
      return addYears(fromDate, 1);

    case RepeatPattern.FIRST_MONDAY:
      return getNextFirstMonday(fromDate);

    case RepeatPattern.LAST_FRIDAY:
      return getNextLastFriday(fromDate);

    case RepeatPattern.CUSTOM:
      return getNextCustomOccurrence(reminder, fromDate);

    default:
      console.error('❌ Unknown repeat pattern:', reminder.repeatPattern);
      return null;
  }
};

/**
 * Get the next weekday (Monday-Friday)
 */
const getNextWeekday = (fromDate: Date): Date => {
  let nextDate = addDays(fromDate, 1);
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
 * Get the next custom occurrence based on interval and days
 */
const getNextCustomOccurrence = (reminder: Reminder, fromDate: Date): Date | null => {
  if (!reminder.customInterval || !reminder.repeatDays || reminder.repeatDays.length === 0) {
    return null;
  }

  const interval = reminder.customInterval;
  const repeatDays = reminder.repeatDays;
  
  // Find the next occurrence within the interval
  for (let i = 1; i <= interval; i++) {
    const candidateDate = addDays(fromDate, i);
    const dayOfWeek = getDayOfWeek(candidateDate);
    
    if (repeatDays.includes(dayOfWeek)) {
      return candidateDate;
    }
  }
  
  // If no occurrence found in the interval, move to the next interval
  const nextIntervalStart = addDays(fromDate, interval);
  return getNextCustomOccurrence(reminder, nextIntervalStart);
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
      if (!reminder.repeatDays || reminder.repeatDays.length === 0) return false;
      const customDayOfWeek = getDayOfWeek(date);
      return reminder.repeatDays.includes(customDayOfWeek);

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

  console.error('❌ Could not find next matching occurrence after', maxAttempts, 'attempts');
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
 * Get the human-readable description of a recurring pattern
 */
export const getRecurringDescription = (reminder: Reminder): string => {
  if (!reminder.isRecurring || !reminder.repeatPattern) {
    return 'No repeat';
  }

  switch (reminder.repeatPattern) {
    case RepeatPattern.DAILY:
      return 'Daily';

    case RepeatPattern.WEEKDAYS:
      return 'Weekdays';

    case RepeatPattern.WEEKLY:
      return 'Weekly';

    case RepeatPattern.MONTHLY:
      return 'Monthly';

    case RepeatPattern.YEARLY:
      return 'Yearly';

    case RepeatPattern.FIRST_MONDAY:
      return 'First Monday of month';

    case RepeatPattern.LAST_FRIDAY:
      return 'Last Friday of month';

    case RepeatPattern.CUSTOM:
      if (reminder.customInterval && reminder.repeatDays) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const selectedDays = reminder.repeatDays.map(day => dayNames[day]).join(', ');
        return `Every ${reminder.customInterval} days on ${selectedDays}`;
      }
      return 'Custom';

    default:
      return 'Unknown pattern';
  }
};

/**
 * Validate recurring reminder configuration
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
    if (!reminder.customInterval || reminder.customInterval < 1) {
      errors.push('Custom interval must be at least 1 day');
    }
    
    if (!reminder.repeatDays || reminder.repeatDays.length === 0) {
      errors.push('At least one day must be selected for custom recurring pattern');
    }
  }

  if (reminder.recurringEndDate && reminder.recurringStartDate) {
    if (reminder.recurringEndDate <= reminder.recurringStartDate) {
      errors.push('End date must be after start date');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
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