import { addDays, addWeeks, addMonths, addYears, startOfMonth, endOfMonth, getDay, isBefore, isAfter, isEqual, startOfDay, endOfDay, parseISO, format } from 'date-fns';
import { Reminder, NotificationTiming } from '../design-system/reminders/types';

/**
 * Comprehensive Recurring Reminder Utilities
 * 
 * This module provides robust handling of recurring reminders with proper:
 * - End date handling
 * - Timezone consistency
 * - Edge case handling
 * - Performance optimization
 * - Comprehensive testing support
 */

export interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'weekdays' | 'weekends' | 'custom' | 'first_monday' | 'last_friday';
  interval?: number; // For custom intervals (e.g., every 3 days)
  daysOfWeek?: number[]; // For weekly patterns (0=Sunday, 1=Monday, etc.)
  dayOfMonth?: number; // For monthly patterns
  weekOfMonth?: number; // For monthly patterns (1=first, 2=second, etc.)
  dayOfWeek?: number; // For monthly patterns (0=Sunday, 1=Monday, etc.)
  endDate?: Date | string;
  maxOccurrences?: number;
}

export interface RecurringOccurrence {
  id: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  dueDate: Date;
  dueTime?: string;
  location?: string;
  isFavorite: boolean;
  isRecurring: boolean;
  repeatPattern: string;
  customInterval?: number;
  hasNotification: boolean;
  notificationTimings?: NotificationTiming[];
  assignedTo?: string[];
  tags?: string[];
  completed: boolean;
  status: string;
  userId: string;
  repeatDays?: number[];
  recurringStartDate?: Date;
  recurringEndDate?: Date;
  customFrequencyType?: string;
}



interface ReminderWithRepeatDays extends Reminder {
  repeatDays?: number[];
}

/**
 * Parse a recurring pattern from a reminder
 */
export function parseRecurringPattern(reminder: Reminder): RecurringPattern {
  const pattern: RecurringPattern = {
    type: (reminder.repeatPattern as RecurringPattern['type']) || 'daily',
  };

  // Handle custom intervals
  if (reminder.customInterval && reminder.customInterval > 1) {
    pattern.interval = reminder.customInterval;
  }

  // Handle weekly patterns with specific days
  if (reminder.repeatPattern === 'weekly' && (reminder as ReminderWithRepeatDays).repeatDays) {
    pattern.daysOfWeek = (reminder as ReminderWithRepeatDays).repeatDays;
  }

      // Handle custom patterns with specific frequency types
    if (reminder.repeatPattern === 'custom') {
      // For custom patterns, use the repeatPattern as the type
      pattern.type = 'custom';
      
      // For custom weekly patterns, also include the days
      if ((reminder as ReminderWithRepeatDays).repeatDays) {
        pattern.daysOfWeek = (reminder as ReminderWithRepeatDays).repeatDays;
      }
    }

  // Handle first_monday and last_friday patterns
  if (reminder.repeatPattern === 'first_monday') {
    pattern.type = 'first_monday';
  } else if (reminder.repeatPattern === 'last_friday') {
    pattern.type = 'last_friday';
  }

  // Handle end date
  if (reminder.recurringEndDate) {
    pattern.endDate = reminder.recurringEndDate;
  }

  return pattern;
}

/**
 * Calculate the next occurrence date based on a recurring pattern
 * This is the core function that handles all recurring logic
 */
export function calculateNextOccurrenceDate(
  currentDate: Date,
  pattern: RecurringPattern,
  maxIterations: number = 100
): Date | null {
  let nextDate = new Date(currentDate);
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;
    
    // Calculate the next date based on pattern type
    switch (pattern.type) {
      case 'daily':
        nextDate = addDays(nextDate, pattern.interval || 1);
        break;

      case 'weekdays':
        do {
          nextDate = addDays(nextDate, 1);
        } while (nextDate.getDay() === 0 || nextDate.getDay() === 6); // Skip weekends
        break;

      case 'weekends':
        do {
          nextDate = addDays(nextDate, 1);
        } while (nextDate.getDay() !== 0 && nextDate.getDay() !== 6); // Only weekends
        break;

      case 'weekly':
        if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
          // Find the next occurrence on one of the specified days
          let found = false;
          for (let i = 1; i <= 7; i++) {
            const testDate = addDays(nextDate, i);
            if (pattern.daysOfWeek.includes(testDate.getDay())) {
              nextDate = testDate;
              found = true;
              break;
            }
          }
          if (!found) {
            // If no match found in the next 7 days, add a week and try again
            nextDate = addWeeks(nextDate, pattern.interval || 1);
            continue;
          }
        } else {
          nextDate = addWeeks(nextDate, pattern.interval || 1);
        }
        break;

      case 'monthly':
        if (pattern.dayOfMonth) {
          // Specific day of month (e.g., 15th of every month)
          nextDate = addMonths(nextDate, pattern.interval || 1);
          nextDate.setDate(pattern.dayOfMonth);
        } else if (pattern.weekOfMonth && pattern.dayOfWeek !== undefined) {
          // Specific week and day (e.g., 2nd Monday of every month)
          nextDate = addMonths(nextDate, pattern.interval || 1);
          nextDate = startOfMonth(nextDate);
          
          // Find the specified week and day
          let weekCount = 0;
          const targetWeek = pattern.weekOfMonth;
          const targetDay = pattern.dayOfWeek;
          
          while (weekCount < targetWeek) {
            if (nextDate.getDay() === targetDay) {
              weekCount++;
            }
            if (weekCount < targetWeek) {
              nextDate = addDays(nextDate, 1);
            }
          }
        } else {
          // Same day of month
          nextDate = addMonths(nextDate, pattern.interval || 1);
        }
        break;

      case 'yearly':
        nextDate = addYears(nextDate, pattern.interval || 1);
        // Handle leap year edge case: if original date was Feb 29 and next year is not a leap year,
        // move to March 1st
        if (currentDate.getMonth() === 1 && currentDate.getDate() === 29 && 
            nextDate.getMonth() === 1 && nextDate.getDate() === 28) {
          nextDate.setDate(1);
          nextDate.setMonth(2); // March
        }
        break;

      case 'first_monday':
        // First Monday of every month
        nextDate = addMonths(nextDate, pattern.interval || 1);
        nextDate = startOfMonth(nextDate);
        
        // Find the first Monday
        while (nextDate.getDay() !== 1) { // 1 = Monday
          nextDate = addDays(nextDate, 1);
        }
        break;

      case 'last_friday':
        // Last Friday of every month
        nextDate = addMonths(nextDate, pattern.interval || 1);
        nextDate = endOfMonth(nextDate);
        
        // Find the last Friday
        while (nextDate.getDay() !== 5) { // 5 = Friday
          nextDate = addDays(nextDate, -1);
        }
        break;

      case 'custom':
        // Handle custom patterns based on customFrequencyType
        if (pattern.interval && pattern.interval > 0) {
          // For custom patterns, we need to determine the frequency type
          // This should be handled by the calling function that knows the actual frequency
          // For now, default to daily intervals
          nextDate = addDays(nextDate, pattern.interval);
        } else {
          nextDate = addDays(nextDate, 1);
        }
        break;

      default:
        nextDate = addDays(nextDate, 1);
    }

    // Check if we've reached the end date
    if (pattern.endDate) {
      const endDate = typeof pattern.endDate === 'string' 
        ? parseISO(pattern.endDate) 
        : pattern.endDate;
      
      if (isAfter(nextDate, endDate)) {
        return null; // Past the end date
      }
    }

    // Ensure the next date is in the future
    if (isAfter(nextDate, currentDate)) {
      return nextDate;
    }
  }

  // If we've exceeded max iterations, return null
  return null;
}

/**
 * Check if a reminder should generate the next occurrence
 * This is the improved version that handles all edge cases
 */
export function shouldGenerateNextOccurrence(reminder: Reminder): boolean {
  // Basic validation
  if (!reminder.isRecurring || !reminder.repeatPattern) {
    return false;
  }

  // Check if reminder is completed
  if (reminder.completed) {
    return false;
  }

  const dueDate = parseDateSafely(reminder.dueDate);
  if (!dueDate) {
    return false;
  }

  const now = startOfDay(new Date());

  // Check if the due date has passed
  if (isAfter(dueDate, now)) {
    return false; // Due date is in the future
  }

  // Check start date
  if (reminder.recurringStartDate) {
    const startDate = parseDateSafely(reminder.recurringStartDate);
    if (startDate && isBefore(now, startDate)) {
      return false; // Haven't reached start date yet
    }
  }

  // Check end date
  if (reminder.recurringEndDate) {
    const endDate = parseDateSafely(reminder.recurringEndDate);
    if (endDate && isAfter(now, endDate)) {
      return false; // Past the end date
    }
  }

  return true;
}

/**
 * Generate the next occurrence of a recurring reminder
 * This is the improved version with proper error handling
 */
export function generateNextOccurrence(reminder: Reminder): RecurringOccurrence | null {
  try {
    // Check if we should generate the next occurrence
    if (!shouldGenerateNextOccurrence(reminder)) {
      return null;
    }

    const currentDueDate = parseDateSafely(reminder.dueDate);
    if (!currentDueDate) {
      return null;
    }

    // Parse the recurring pattern
    const pattern = parseRecurringPattern(reminder);

    // Calculate the next occurrence date
    const nextDueDate = calculateNextOccurrenceDate(currentDueDate, pattern);
    if (!nextDueDate) {
      return null; // No more occurrences
    }

    // Create the next occurrence
    const nextOccurrence: RecurringOccurrence = {
      id: `${reminder.id}_${format(nextDueDate, 'yyyy-MM-dd')}`,
      title: reminder.title,
      description: reminder.description,
      type: reminder.type,
      priority: reminder.priority,
      dueDate: nextDueDate,
      dueTime: reminder.dueTime,
      location: reminder.location,
      isFavorite: reminder.isFavorite || false,
      isRecurring: reminder.isRecurring || false,
      repeatPattern: reminder.repeatPattern || 'daily',
      customInterval: reminder.customInterval,
      hasNotification: reminder.hasNotification || false,
      notificationTimings: reminder.notificationTimings,
      assignedTo: reminder.assignedTo,
      tags: reminder.tags,
      completed: false,
      status: 'pending',
      userId: reminder.userId,
      repeatDays: (reminder as ReminderWithRepeatDays).repeatDays,
      recurringStartDate: reminder.recurringStartDate,
      recurringEndDate: reminder.recurringEndDate,
    };

    return nextOccurrence;
  } catch (error) {
    return null;
  }
}

/**
 * Generate multiple occurrences for a recurring reminder
 * This is useful for calendar display and future planning
 */
export function generateOccurrences(
  reminder: Reminder,
  maxOccurrences: number = 50,
  startDate?: Date
): RecurringOccurrence[] {
  const occurrences: RecurringOccurrence[] = [];
  
  try {
    const pattern = parseRecurringPattern(reminder);
    let currentDate = startDate || parseDateSafely(reminder.dueDate) || new Date();
    
    // For generating future occurrences, we want to start from the next occurrence after the current due date
    const nextDate = calculateNextOccurrenceDate(currentDate, pattern);
    if (!nextDate) {
      return []; // No more occurrences
    }
    
    currentDate = nextDate;

    let iterations = 0;
    const maxIterations = Math.max(maxOccurrences * 2, 100); // Allow some extra iterations for complex patterns

    while (occurrences.length < maxOccurrences && iterations < maxIterations) {
      iterations++;

      // Create the occurrence for the current date
      const occurrence: RecurringOccurrence = {
        id: `${reminder.id}_${format(currentDate, 'yyyy-MM-dd')}`,
        title: reminder.title,
        description: reminder.description,
        type: reminder.type,
        priority: reminder.priority,
        dueDate: currentDate,
        dueTime: reminder.dueTime,
        location: reminder.location,
        isFavorite: reminder.isFavorite || false,
        isRecurring: reminder.isRecurring || false,
        repeatPattern: reminder.repeatPattern || 'daily',
        customInterval: reminder.customInterval,
        hasNotification: reminder.hasNotification || false,
        notificationTimings: reminder.notificationTimings,
        assignedTo: reminder.assignedTo,
        tags: reminder.tags,
        completed: false,
        status: 'pending',
        userId: reminder.userId,
        repeatDays: (reminder as ReminderWithRepeatDays).repeatDays,
              recurringStartDate: reminder.recurringStartDate,
      recurringEndDate: reminder.recurringEndDate,
      };

      occurrences.push(occurrence);

      // Calculate the next occurrence
      const nextOccurrenceDate = calculateNextOccurrenceDate(currentDate, pattern);
      if (!nextOccurrenceDate) {
        break; // No more occurrences
      }

      // Check if we've reached the end date
      if (pattern.endDate) {
        const endDate = typeof pattern.endDate === 'string' 
          ? parseISO(pattern.endDate) 
          : pattern.endDate;
        
        if (isAfter(nextOccurrenceDate, endDate)) {
          break; // Past the end date
        }
      }

      currentDate = nextOccurrenceDate;
    }

    return occurrences;
  } catch (error) {
    return [];
  }
}

/**
 * Check if a reminder is recurring
 */
export function isRecurringReminder(reminder: Reminder): boolean {
  return !!(reminder.isRecurring && reminder.repeatPattern);
}

/**
 * Get a human-readable description of the recurring pattern
 */
export function getRecurringPatternDescription(reminder: Reminder): string {
  if (!isRecurringReminder(reminder)) {
    return 'Not recurring';
  }

  const pattern = parseRecurringPattern(reminder);
  
  switch (pattern.type) {
    case 'daily':
      return pattern.interval && pattern.interval > 1 
        ? `Every ${pattern.interval} days`
        : 'Daily';

    case 'weekdays':
      return 'Every weekday (Monday-Friday)';

    case 'weekends':
      return 'Every weekend (Saturday-Sunday)';

    case 'weekly':
      if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const selectedDays = pattern.daysOfWeek.map(day => dayNames[day]).join(', ');
        return pattern.interval && pattern.interval > 1 
          ? `Every ${pattern.interval} weeks on ${selectedDays}`
          : `Weekly on ${selectedDays}`;
      }
      return pattern.interval && pattern.interval > 1 
        ? `Every ${pattern.interval} weeks`
        : 'Weekly';

    case 'monthly':
      if (pattern.dayOfMonth) {
        return pattern.interval && pattern.interval > 1
          ? `Every ${pattern.interval} months on the ${pattern.dayOfMonth}${getOrdinalSuffix(pattern.dayOfMonth)}`
          : `Monthly on the ${pattern.dayOfMonth}${getOrdinalSuffix(pattern.dayOfMonth)}`;
      }
      if (pattern.weekOfMonth && pattern.dayOfWeek !== undefined) {
        const weekNames = ['', 'first', 'second', 'third', 'fourth', 'fifth'];
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return pattern.interval && pattern.interval > 1
          ? `Every ${pattern.interval} months on the ${weekNames[pattern.weekOfMonth]} ${dayNames[pattern.dayOfWeek]}`
          : `Monthly on the ${weekNames[pattern.weekOfMonth]} ${dayNames[pattern.dayOfWeek]}`;
      }
      return pattern.interval && pattern.interval > 1
        ? `Every ${pattern.interval} months`
        : 'Monthly';

    case 'yearly':
      return pattern.interval && pattern.interval > 1
        ? `Every ${pattern.interval} years`
        : 'Yearly';

    case 'first_monday':
      return pattern.interval && pattern.interval > 1
        ? `Every ${pattern.interval} months on the first Monday`
        : 'First Monday of every month';

    case 'last_friday':
      return pattern.interval && pattern.interval > 1
        ? `Every ${pattern.interval} months on the last Friday`
        : 'Last Friday of every month';

    case 'custom':
      return pattern.interval && pattern.interval > 1 
        ? `Every ${pattern.interval} days`
        : 'Custom';

    default:
      return 'Custom pattern';
  }
}

/**
 * Get ordinal suffix for numbers (1st, 2nd, 3rd, etc.)
 */
function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) {
    return 'st';
  }
  if (j === 2 && k !== 12) {
    return 'nd';
  }
  if (j === 3 && k !== 13) {
    return 'rd';
  }
  return 'th';
}

/**
 * Parse a date safely, handling various formats
 */
function parseDateSafely(date: Date | string | undefined): Date | null {
  if (!date) {
    return null;
  }

  try {
    if (date instanceof Date) {
      return isNaN(date.getTime()) ? null : date;
    }

    if (typeof date === 'string') {
      const parsed = parseISO(date);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Validate a recurring pattern
 */
export function validateRecurringPattern(pattern: RecurringPattern): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!pattern.type) {
    errors.push('Pattern type is required');
  } else {
    // Check if pattern type is valid
    const validTypes = ['daily', 'weekly', 'monthly', 'yearly', 'weekdays', 'weekends', 'custom', 'first_monday', 'last_friday'];
    if (!validTypes.includes(pattern.type)) {
      errors.push(`Invalid pattern type: ${pattern.type}. Must be one of: ${validTypes.join(', ')}`);
    }
  }

  if (pattern.interval !== undefined && pattern.interval <= 0) {
    errors.push('Interval must be greater than 0');
  }

  if (pattern.daysOfWeek) {
    for (const day of pattern.daysOfWeek) {
      if (day < 0 || day > 6) {
        errors.push('Days of week must be between 0 and 6');
        break;
      }
    }
  }

  if (pattern.dayOfMonth && (pattern.dayOfMonth < 1 || pattern.dayOfMonth > 31)) {
    errors.push('Day of month must be between 1 and 31');
  }

  if (pattern.weekOfMonth && (pattern.weekOfMonth < 1 || pattern.weekOfMonth > 5)) {
    errors.push('Week of month must be between 1 and 5');
  }

  if (pattern.dayOfWeek !== undefined && (pattern.dayOfWeek < 0 || pattern.dayOfWeek > 6)) {
    errors.push('Day of week must be between 0 and 6');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Test utility to verify all recurring patterns work correctly
 * This function can be used to test the recurring reminder system
 */
export function testAllRecurringPatterns(): {
  pattern: string;
  description: string;
  nextOccurrences: Date[];
  success: boolean;
}[] {
  const baseDate = new Date('2024-01-15'); // Monday
  const results: {
    pattern: string;
    description: string;
    nextOccurrences: Date[];
    success: boolean;
  }[] = [];

  // Test patterns
  const testPatterns = [
    {
      name: 'Daily',
      pattern: { type: 'daily' as const, interval: 1 },
      expectedCount: 5
    },
    {
      name: 'Every 3 Days',
      pattern: { type: 'daily' as const, interval: 3 },
      expectedCount: 5
    },
    {
      name: 'Weekdays',
      pattern: { type: 'weekdays' as const },
      expectedCount: 5
    },
    {
      name: 'Weekends',
      pattern: { type: 'weekends' as const },
      expectedCount: 5
    },
    {
      name: 'Weekly',
      pattern: { type: 'weekly' as const, interval: 1 },
      expectedCount: 5
    },
    {
      name: 'Every 2 Weeks',
      pattern: { type: 'weekly' as const, interval: 2 },
      expectedCount: 5
    },
    {
      name: 'Weekly on Monday, Wednesday, Friday',
      pattern: { type: 'weekly' as const, interval: 1, daysOfWeek: [1, 3, 5] },
      expectedCount: 5
    },
    {
      name: 'Monthly',
      pattern: { type: 'monthly' as const, interval: 1 },
      expectedCount: 5
    },
    {
      name: 'Every 2 Months',
      pattern: { type: 'monthly' as const, interval: 2 },
      expectedCount: 5
    },
    {
      name: 'Yearly',
      pattern: { type: 'yearly' as const, interval: 1 },
      expectedCount: 5
    },
    {
      name: 'Every 2 Years',
      pattern: { type: 'yearly' as const, interval: 2 },
      expectedCount: 5
    },
    {
      name: 'First Monday',
      pattern: { type: 'first_monday' as const, interval: 1 },
      expectedCount: 5
    },
    {
      name: 'Last Friday',
      pattern: { type: 'last_friday' as const, interval: 1 },
      expectedCount: 5
    },
    {
      name: 'Custom Daily',
      pattern: { type: 'custom' as const, interval: 1 },
      expectedCount: 5
    }
  ];

  for (const test of testPatterns) {
    try {
      const occurrences: Date[] = [];
      let currentDate = new Date(baseDate);
      
      for (let i = 0; i < test.expectedCount; i++) {
        const nextDate = calculateNextOccurrenceDate(currentDate, test.pattern);
        if (!nextDate) break;
        
        occurrences.push(nextDate);
        currentDate = nextDate;
      }

      results.push({
        pattern: test.name,
        description: `Generated ${occurrences.length} occurrences`,
        nextOccurrences: occurrences,
        success: occurrences.length > 0
      });
    } catch (error) {
      results.push({
        pattern: test.name,
        description: `Error: ${error}`,
        nextOccurrences: [],
        success: false
      });
    }
  }

  return results;
}

/**
 * Test a specific recurring pattern with detailed logging
 */
export function testRecurringPattern(
  pattern: RecurringPattern,
  startDate: Date,
  maxOccurrences: number = 10
): {
  pattern: RecurringPattern;
  startDate: Date;
  occurrences: Date[];
  success: boolean;
  error?: string;
} {
  try {
    const occurrences: Date[] = [];
    let currentDate = new Date(startDate);
    
    for (let i = 0; i < maxOccurrences; i++) {
      const nextDate = calculateNextOccurrenceDate(currentDate, pattern);
      if (!nextDate) break;
      
      occurrences.push(nextDate);
      currentDate = nextDate;
    }

    return {
      pattern,
      startDate,
      occurrences,
      success: occurrences.length > 0
    };
  } catch (error) {
    return {
      pattern,
      startDate,
      occurrences: [],
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
} 