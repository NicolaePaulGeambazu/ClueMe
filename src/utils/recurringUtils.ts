import { RRule } from 'rrule';
import { DateTime } from 'luxon';

export interface RecurringConfig {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number;
  byWeekDay?: number[];
  byMonthDay?: number[];
  until?: Date;
}

/**
 * Generate an RRULE string from configuration
 */
export const generateRRuleString = (config: RecurringConfig): string => {
  const rrule = new RRule({
    freq: RRule[config.frequency],
    interval: config.interval,
    byweekday: config.byWeekDay,
    bymonthday: config.byMonthDay,
    until: config.until,
  });
  
  return rrule.toString();
};

/**
 * Parse an RRULE string to get configuration
 */
export const parseRRuleString = (rruleString: string): RecurringConfig | null => {
  try {
    const rrule = RRule.fromString(rruleString);
    const options = rrule.origOptions;
    
    return {
      frequency: getFrequencyFromRRule(options.freq || RRule.DAILY),
      interval: options.interval || 1,
      byWeekDay: options.byweekday ? (Array.isArray(options.byweekday) ? options.byweekday.map(w => typeof w === 'number' ? w : 0) : [typeof options.byweekday === 'number' ? options.byweekday : 0]) : undefined,
      byMonthDay: options.bymonthday ? (Array.isArray(options.bymonthday) ? options.bymonthday : [options.bymonthday]) : undefined,
      until: options.until || undefined,
    };
  } catch (error) {
    console.error('Error parsing RRULE string:', error);
    return null;
  }
};

/**
 * Get next N occurrences from a base date and RRULE
 */
export const getNextOccurrences = (
  baseDate: DateTime,
  rruleString: string,
  count: number = 10
): DateTime[] => {
  try {
    const rrule = RRule.fromString(rruleString);
    const occurrences = rrule.between(
      baseDate.toJSDate(),
      baseDate.plus({ years: 1 }).toJSDate(),
      true,
      (date, i) => i < count
    );
    
    return occurrences.map(date => DateTime.fromJSDate(date));
  } catch (error) {
    console.error('Error getting next occurrences:', error);
    return [];
  }
};

/**
 * Get the next occurrence after a given date
 */
export const getNextOccurrence = (
  baseDate: DateTime,
  rruleString: string
): DateTime | null => {
  try {
    const rrule = RRule.fromString(rruleString);
    const next = rrule.after(baseDate.toJSDate());
    
    return next ? DateTime.fromJSDate(next) : null;
  } catch (error) {
    console.error('Error getting next occurrence:', error);
    return null;
  }
};

/**
 * Check if a date matches the recurrence rule
 */
export const isDateInRecurrence = (
  date: DateTime,
  rruleString: string
): boolean => {
  try {
    const rrule = RRule.fromString(rruleString);
    const occurrences = rrule.between(
      date.startOf('day').toJSDate(),
      date.endOf('day').toJSDate(),
      true
    );
    
    return occurrences.length > 0;
  } catch (error) {
    console.error('Error checking date in recurrence:', error);
    return false;
  }
};

/**
 * Convert RRule frequency to string
 */
const getFrequencyFromRRule = (freq: number): 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' => {
  switch (freq) {
    case RRule.DAILY:
      return 'DAILY';
    case RRule.WEEKLY:
      return 'WEEKLY';
    case RRule.MONTHLY:
      return 'MONTHLY';
    case RRule.YEARLY:
      return 'YEARLY';
    default:
      return 'DAILY';
  }
};

/**
 * Create a human-readable description of the recurrence
 */
export const getRecurrenceDescription = (rruleString: string): string => {
  const config = parseRRuleString(rruleString);
  if (!config) return 'Custom';

  const { frequency, interval, byWeekDay } = config;

  switch (frequency) {
    case 'DAILY':
      return interval === 1 ? 'Daily' : `Every ${interval} days`;
    case 'WEEKLY':
      if (byWeekDay && byWeekDay.length > 0) {
        const days = byWeekDay.map(day => getDayName(day)).join(', ');
        return `Weekly on ${days}`;
      }
      return interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
    case 'MONTHLY':
      return interval === 1 ? 'Monthly' : `Every ${interval} months`;
    case 'YEARLY':
      return interval === 1 ? 'Yearly' : `Every ${interval} years`;
    default:
      return 'Custom';
  }
};

/**
 * Get day name from RRule weekday number
 */
const getDayName = (weekday: number): string => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days[weekday] || 'Unknown';
};

/**
 * Validate RRULE string
 */
export const isValidRRule = (rruleString: string): boolean => {
  try {
    RRule.fromString(rruleString);
    return true;
  } catch {
    return false;
  }
};

/**
 * Create a simple daily recurrence
 */
export const createDailyRecurrence = (interval: number = 1): string => {
  return generateRRuleString({
    frequency: 'DAILY',
    interval,
  });
};

/**
 * Create a simple weekly recurrence
 */
export const createWeeklyRecurrence = (interval: number = 1): string => {
  return generateRRuleString({
    frequency: 'WEEKLY',
    interval,
  });
};

/**
 * Create a weekly recurrence on specific days
 */
export const createWeeklyRecurrenceOnDays = (days: number[]): string => {
  return generateRRuleString({
    frequency: 'WEEKLY',
    interval: 1,
    byWeekDay: days,
  });
};

/**
 * Create a monthly recurrence
 */
export const createMonthlyRecurrence = (interval: number = 1): string => {
  return generateRRuleString({
    frequency: 'MONTHLY',
    interval,
  });
};

/**
 * Create a yearly recurrence
 */
export const createYearlyRecurrence = (interval: number = 1): string => {
  return generateRRuleString({
    frequency: 'YEARLY',
    interval,
  });
}; 