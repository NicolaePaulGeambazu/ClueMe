import { format as formatDateFns, parseISO, isToday as isTodayFns, isYesterday as isYesterdayFns, isThisWeek, isThisYear, getDay, startOfMonth, getDaysInMonth as getDaysInMonthFns, isValid as isValidDateFns } from 'date-fns';
import { enUS, es, fr } from 'date-fns/locale';
import i18n from '../i18n';

// Date format preferences
export type DateFormat = 'european' | 'american' | 'iso';

// Time format preferences
export type TimeFormat = '12h' | '24h';

// Locale mapping
const localeMap = {
  en: enUS,
  es: es,
  fr: fr,
};

// Default settings (can be overridden by user preferences)
const DEFAULT_DATE_FORMAT: DateFormat = 'european';
const DEFAULT_TIME_FORMAT: TimeFormat = '24h';
const DEFAULT_LOCALE = 'en';

interface ReminderData {
  isRecurring?: boolean;
  recurringEndDate?: string;
  dueDate?: string;
  dueTime?: string;
  completed?: boolean;
}

export class DateUtils {
  private static dateFormat: DateFormat = DEFAULT_DATE_FORMAT;
  private static timeFormat: TimeFormat = DEFAULT_TIME_FORMAT;
  private static locale: string = DEFAULT_LOCALE;

  // Get current locale from i18n
  private static getCurrentLocale() {
    const currentLang = i18n.language;
    return localeMap[currentLang as keyof typeof localeMap] || enUS;
  }

  // Configure date/time preferences
  static configure(options: {
    dateFormat?: DateFormat;
    timeFormat?: TimeFormat;
    locale?: string;
  }) {
    if (options.dateFormat) {this.dateFormat = options.dateFormat;}
    if (options.timeFormat) {this.timeFormat = options.timeFormat;}
    if (options.locale) {this.locale = options.locale;}
  }

  // Get current date in ISO format (YYYY-MM-DD)
  static getTodayISO(): string {
    const locale = this.getCurrentLocale();
    return formatDateFns(new Date(), 'yyyy-MM-dd', { locale });
  }

  // Get current date in configured format
  static getTodayFormatted(): string {
    const locale = this.getCurrentLocale();
    return formatDateFns(new Date(), 'EEEE, MMMM d', { locale });
  }

  // Format date based on user preference
  static formatDate(date: Date | string | unknown, format?: DateFormat): string {
    if (!date) {return '';}

    try {
      let dateObj: Date;

      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else if (date && typeof date === 'object' && 'toDate' in date) {
        // Handle Firestore Timestamp
        dateObj = (date as { toDate(): Date }).toDate();
      } else {
        return '';
      }

      if (isNaN(dateObj.getTime())) {return '';}

      const locale = this.getCurrentLocale();
      const useFormat = format || this.dateFormat;

      switch (useFormat) {
        case 'european':
          return formatDateFns(dateObj, 'dd/MM/yyyy', { locale });
        case 'american':
          return formatDateFns(dateObj, 'MM/dd/yyyy', { locale });
        case 'iso':
        default:
          return formatDateFns(dateObj, 'yyyy-MM-dd', { locale });
      }
    } catch (error) {
      return '';
    }
  }

  // Format time based on user preference
  static formatTime(date: Date | string | unknown, format?: TimeFormat): string {
    if (!date) {return '';}

    try {
      let dateObj: Date;

      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else if (date && typeof date === 'object' && 'toDate' in date) {
        // Handle Firestore Timestamp
        dateObj = (date as { toDate(): Date }).toDate();
      } else {
        return '';
      }

      if (isNaN(dateObj.getTime())) {return '';}

      const useFormat = format || this.timeFormat;

      switch (useFormat) {
        case '12h':
          return formatDateFns(dateObj, 'h:mm a', { locale: this.getCurrentLocale() });
        case '24h':
          return formatDateFns(dateObj, 'HH:mm', { locale: this.getCurrentLocale() });
        default:
          return formatDateFns(dateObj, 'HH:mm', { locale: this.getCurrentLocale() });
      }
    } catch (error) {
      return '';
    }
  }

  // Format date and time together
  static formatDateTime(date: Date | string | unknown, dateFormat?: DateFormat, timeFormat?: TimeFormat): string {
    if (!date) {return '';}

    try {
      let dateObj: Date;

      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else if (date && typeof date === 'object' && 'toDate' in date) {
        // Handle Firestore Timestamp
        dateObj = (date as { toDate(): Date }).toDate();
      } else {
        return '';
      }

      if (isNaN(dateObj.getTime())) {return '';}

      const locale = this.getCurrentLocale();
      const useDateFormat = dateFormat || this.dateFormat;
      const useTimeFormat = timeFormat || this.timeFormat;

      let dateStr: string;
      let timeStr: string;

      switch (useDateFormat) {
        case 'european':
          dateStr = formatDateFns(dateObj, 'dd/MM/yyyy', { locale });
          break;
        case 'american':
          dateStr = formatDateFns(dateObj, 'MM/dd/yyyy', { locale });
          break;
        case 'iso':
        default:
          dateStr = formatDateFns(dateObj, 'yyyy-MM-dd', { locale });
          break;
      }

      switch (useTimeFormat) {
        case '12h':
          timeStr = formatDateFns(dateObj, 'h:mm a', { locale });
          break;
        case '24h':
          timeStr = formatDateFns(dateObj, 'HH:mm', { locale });
          break;
        default:
          timeStr = formatDateFns(dateObj, 'HH:mm', { locale });
          break;
      }

      return `${dateStr} ${timeStr}`;
    } catch (error) {
      return '';
    }
  }

  // Check if date is today
  static isToday(date: Date | string | unknown): boolean {
    if (!date) {return false;}

    try {
      let dateObj: Date;

      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else if (date && typeof date === 'object' && 'toDate' in date) {
        // Handle Firestore Timestamp
        dateObj = (date as { toDate(): Date }).toDate();
      } else {
        return false;
      }

      if (isNaN(dateObj.getTime())) {return false;}

      const today = new Date();
      const locale = this.getCurrentLocale();

      const todayStr = formatDateFns(today, 'yyyy-MM-dd', { locale });
      const dateStr = formatDateFns(dateObj, 'yyyy-MM-dd', { locale });

      return todayStr === dateStr;
    } catch (error) {
      return false;
    }
  }

  // Check if date is yesterday
  static isYesterday(date: Date | string | unknown): boolean {
    if (!date) {return false;}

    try {
      let dateObj: Date;

      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else if (date && typeof date === 'object' && 'toDate' in date) {
        // Handle Firestore Timestamp
        dateObj = (date as { toDate(): Date }).toDate();
      } else {
        return false;
      }

      if (isNaN(dateObj.getTime())) {return false;}

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const locale = this.getCurrentLocale();

      const yesterdayStr = formatDateFns(yesterday, 'yyyy-MM-dd', { locale });
      const dateStr = formatDateFns(dateObj, 'yyyy-MM-dd', { locale });

      return yesterdayStr === dateStr;
    } catch (error) {
      return false;
    }
  }

  // Get relative date string (Today, Yesterday, or formatted date)
  static getRelativeDate(date: Date | string | unknown): string {
    if (!date) {return '';}

    try {
      let dateObj: Date;

      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else if (date && typeof date === 'object' && 'toDate' in date) {
        // Handle Firestore Timestamp
        dateObj = (date as { toDate(): Date }).toDate();
      } else {
        return '';
      }

      if (isNaN(dateObj.getTime())) {return '';}

      if (this.isToday(dateObj)) {
        return 'Today';
      }

      if (this.isYesterday(dateObj)) {
        return 'Yesterday';
      }

      const locale = this.getCurrentLocale();
      return formatDateFns(dateObj, 'EEEE, MMMM d', { locale });
    } catch (error) {
      return '';
    }
  }

  // Get day of week (0 = Sunday, 1 = Monday, etc.)
  static getDayOfWeek(date: Date | string | unknown): number {
    if (!date) {return 0;}

    try {
      let dateObj: Date;

      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else if (date && typeof date === 'object' && 'toDate' in date) {
        // Handle Firestore Timestamp
        dateObj = (date as { toDate(): Date }).toDate();
      } else {
        return 0;
      }

      if (isNaN(dateObj.getTime())) {return 0;}

      return dateObj.getDay();
    } catch (error) {
      return 0;
    }
  }

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  static getFirstDayOfMonth(year: number, month: number): number {
    return new Date(year, month - 1, 1).getDay();
  }

  // Get days in month
  static getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
  }

  // Parse date string to Date object
  static parseDate(dateString: string): Date {
    return new Date(dateString);
  }

  // Validate date string
  static isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && isValidDateFns(date);
  }

  // Get current timestamp
  static getCurrentTimestamp(): number {
    return Date.now();
  }

  // Format for display in calendar
  static formatForCalendar(date: Date | string): string {
    const locale = this.getCurrentLocale();
    return formatDateFns(new Date(date), 'yyyy-MM-dd', { locale });
  }

  // Format for activity feed
  static formatForActivity(date: Date | string): string {
    const locale = this.getCurrentLocale();
    return formatDateFns(new Date(date), 'MMM d, yyyy', { locale });
  }

  // Get greeting based on time of day
  static getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) {return 'Good morning';}
    if (hour < 17) {return 'Good afternoon';}
    return 'Good evening';
  }

  // Check if a reminder is overdue
  static isOverdue(dueDate?: string, completed?: boolean, dueTime?: string, reminder?: ReminderData): boolean {
    if (!dueDate || completed) {return false;}

    try {
      const dueDateTime = this.parseDateWithTimezone(dueDate, dueTime);
      const now = new Date();

      // Debug logging for overdue check
      console.log('[DateUtils] Overdue check:', {
        dueDate,
        dueTime,
        parsedDueDateTime: dueDateTime.toISOString(),
        now: now.toISOString(),
        isOverdue: dueDateTime.getTime() < (now.getTime() - 1000)
      });

      // For recurring reminders, only mark as overdue if the series has ended
      if (reminder && reminder.isRecurring) {
        // If the recurring series has ended and the last occurrence is overdue, mark as overdue
        if (reminder.recurringEndDate) {
          const endDate = this.parseDateWithTimezone(reminder.recurringEndDate);
          if (endDate < now && dueDateTime < now) {
            return true;
          }
        }

        // For active recurring reminders (without end date or end date in future),
        // they're not overdue because the next occurrence will be generated
        return false;
      }

      // For non-recurring reminders, use simple comparison
      // Add a small buffer to prevent rapid state changes
      const bufferMs = 1000; // 1 second buffer
      return dueDateTime.getTime() < (now.getTime() - bufferMs);
    } catch (error) {
      console.error('[DateUtils] Error in isOverdue:', error);
      // Fallback to date-only comparison
      const today = this.getTodayISO();
      return dueDate < today;
    }
  }

  // Parse date with proper timezone handling
  static parseDateWithTimezone(dateString: string, timeString?: string): Date {
    // Create a date object from the date string
    const date = new Date(dateString);

    // If the dateString is already an ISO string with time (contains 'T'), 
    // we should use it as-is since it already contains the correct time
    if (dateString.includes('T')) {
      // The dateString already contains time information, so we don't need to apply timeString
      // However, we need to ensure it's interpreted as local time, not UTC
      if (!dateString.includes('Z') && !dateString.includes('+')) {
        // This is a local date string, so we need to create a proper Date object
        // that preserves the local time
        const [datePart, timePart] = dateString.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes, seconds] = timePart.split(':').map(Number);
        
        // Create a new Date object with the local components
        const localDate = new Date(year, month - 1, day, hours, minutes, seconds || 0);
        return localDate;
      }
      return date;
    }

    // If we have a timeString and the dateString doesn't contain time, apply the time
    if (timeString) {
      const [hours, minutes] = timeString.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        // Set the time in the user's local timezone
        date.setHours(hours, minutes, 0, 0);
      }
    }

    return date;
  }

  // Get current date in user's timezone
  static getCurrentDateInTimezone(): Date {
    return new Date();
  }

  // Compare dates considering timezone
  static compareDates(date1: Date | string, date2: Date | string): number {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;

    return d1.getTime() - d2.getTime();
  }

  // Check if a date is in the past (considering timezone)
  static isDateInPast(date: Date | string): boolean {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();

    return targetDate < now;
  }

  // Check if a date is today (considering timezone)
  static isDateToday(date: Date | string): boolean {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();

    return targetDate.toDateString() === today.toDateString();
  }

  // Add days to current date
  static addDaysToDate(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const locale = this.getCurrentLocale();
    return formatDateFns(date, 'yyyy-MM-dd', { locale });
  }

  // Format relative time (e.g., "2 hours ago")
  static formatRelativeTime(dateString: string): string {
    const date = parseISO(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {return 'Just now';}
    if (diffInMinutes < 60) {return `${diffInMinutes}m ago`;}
    if (diffInHours < 24) {return `${diffInHours}h ago`;}
    if (diffInDays < 7) {return `${diffInDays}d ago`;}

    return this.formatDate(date);
  }

  // Format time-only string (e.g., "14:30" -> "2:30 PM")
  static formatTimeOnly(timeString: string, format?: TimeFormat): string {
    if (!timeString) {return '';}

    try {
      // If it's already a time string like "14:30", parse it directly
      if (timeString.includes(':') && !timeString.includes('T')) {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        const minute = parseInt(minutes, 10);

        if (isNaN(hour) || isNaN(minute)) {
          return timeString; // Return original if parsing fails
        }

        const useFormat = format || this.timeFormat;
        const locale = this.getCurrentLocale();

        switch (useFormat) {
          case '12h':
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${minutes.padStart(2, '0')} ${ampm}`;
          case '24h':
            return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
          default:
            return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
        }
      } else {
        // If it's a full date string, use the existing formatTime
        return this.formatTime(timeString, format);
      }
    } catch (error) {
      return timeString; // Return original if formatting fails
    }
  }
}

// Export convenience functions
export const getTodayISO = () => DateUtils.getTodayISO();
export const formatDate = (date: Date | string | any, format?: DateFormat) => DateUtils.formatDate(date, format);
export const formatTime = (date: Date | string | any, format?: TimeFormat) => DateUtils.formatTime(date, format);
export const formatTimeOnly = (timeString: string, format?: TimeFormat) => DateUtils.formatTimeOnly(timeString, format);
export const isToday = (date: Date | string | any) => DateUtils.isToday(date);
export const getDayOfWeek = (date: Date | string | any) => DateUtils.getDayOfWeek(date);
export const getFirstDayOfMonth = (year: number, month: number) => DateUtils.getFirstDayOfMonth(year, month);
export const getDaysInMonth = (year: number, month: number) => DateUtils.getDaysInMonth(year, month);
export const parseDate = (dateString: string) => DateUtils.parseDate(dateString);
export const isValidDate = (dateString: string) => DateUtils.isValidDate(dateString);
export const formatForActivity = (date: Date | string) => DateUtils.formatForActivity(date);
export const getGreeting = () => DateUtils.getGreeting();
export const isOverdue = (dueDate?: string, completed?: boolean, dueTime?: string, reminder?: ReminderData) => DateUtils.isOverdue(dueDate, completed, dueTime, reminder);
export const parseDateWithTimezone = (dateString: string, timeString?: string) => DateUtils.parseDateWithTimezone(dateString, timeString);
export const getCurrentDateInTimezone = () => DateUtils.getCurrentDateInTimezone();
export const compareDates = (date1: Date | string, date2: Date | string) => DateUtils.compareDates(date1, date2);
export const isDateInPast = (date: Date | string) => DateUtils.isDateInPast(date);
export const isDateToday = (date: Date | string) => DateUtils.isDateToday(date);

/**
 * Date and Timezone Utilities for Recurring Reminders
 */

/**
 * Normalize a date to ensure it's a valid Date object
 */
export const normalizeDate = (date: Date | string | undefined | null | any): Date | undefined => {
  if (!date) {return undefined;}

  if (date instanceof Date) {
    return isNaN(date.getTime()) ? undefined : date;
  }

  if (typeof date === 'string') {
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }

  if (date && typeof date === 'object') {
    // Handle Firestore Timestamp objects
    if ('toDate' in date && typeof date.toDate === 'function') {
      try {
        const converted = date.toDate();
        return isNaN(converted.getTime()) ? undefined : converted;
      } catch (error) {
        return undefined;
      }
    }
    // Handle Firestore timestamp objects with seconds/nanoseconds
    else if ('seconds' in date) {
      try {
        const seconds = date.seconds || 0;
        const nanoseconds = date.nanoseconds || 0;
        const converted = new Date(seconds * 1000 + nanoseconds / 1000000);
        return isNaN(converted.getTime()) ? undefined : converted;
      } catch (error) {
        return undefined;
      }
    }
  }

  return undefined;
};

/**
 * Get user's current timezone offset in minutes
 */
export const getUserTimezoneOffset = (): number => {
  return new Date().getTimezoneOffset();
};

/**
 * Convert a UTC date back to local time for display
 */
export const fromUTCToLocal = (utcDate: Date): Date => {
  return new Date(utcDate.getTime() + (utcDate.getTimezoneOffset() * 60000));
};

/**
 * Calculate the next occurrence of a recurring reminder
 */
export const getNextOccurrence = (
  baseDate: Date,
  repeatPattern: string,
  customInterval?: number,
  repeatDays?: number[],
  startDate?: Date,
  endDate?: Date
): Date | null => {
  const now = new Date();
  const start = startDate || baseDate;
  let current = new Date(start);

  // If we're before the start date, return the start date
  if (current < now) {
    current = new Date(now);
  }

  // Generate occurrences until we find one in the future
  for (let i = 0; i < 365; i++) { // Limit to 1 year to prevent infinite loops
    let nextDate = new Date(current);

    switch (repeatPattern) {
      case 'daily':
        nextDate.setDate(current.getDate() + (customInterval || 1));
        break;

      case 'weekly':
        if (repeatDays && repeatDays.length > 0) {
          // Find the next occurrence on one of the specified days
          let found = false;
          for (let j = 1; j <= 7; j++) {
            const testDate = new Date(current);
            testDate.setDate(current.getDate() + j);
            if (repeatDays.includes(testDate.getDay())) {
              nextDate = testDate;
              found = true;
              break;
            }
          }
          if (!found) {
            // If no day found in next 7 days, look further ahead
            nextDate.setDate(current.getDate() + 7);
          }
        } else {
          nextDate.setDate(current.getDate() + 7);
        }
        break;

      case 'monthly':
        nextDate.setMonth(current.getMonth() + (customInterval || 1));
        break;

      case 'yearly':
        nextDate.setFullYear(current.getFullYear() + (customInterval || 1));
        break;

      case 'weekdays':
        // Skip weekends
        do {
          nextDate.setDate(current.getDate() + 1);
        } while (nextDate.getDay() === 0 || nextDate.getDay() === 6);
        break;

      case 'first_monday':
        // Find the first Monday of the next month
        nextDate.setDate(1);
        nextDate.setMonth(current.getMonth() + 1);
        while (nextDate.getDay() !== 1) {
          nextDate.setDate(nextDate.getDate() + 1);
        }
        break;

      case 'last_friday':
        // Find the last Friday of the next month
        nextDate.setDate(1);
        nextDate.setMonth(current.getMonth() + 2);
        nextDate.setDate(0); // Last day of previous month
        while (nextDate.getDay() !== 5) {
          nextDate.setDate(nextDate.getDate() - 1);
        }
        break;

      case 'custom':
        nextDate.setDate(current.getDate() + (customInterval || 1));
        break;

      default:
        return null;
    }

    // Check if this occurrence is within the end date
    if (endDate && nextDate > endDate) {
      return null;
    }

    // If this occurrence is in the future, return it
    if (nextDate > now) {
      return nextDate;
    }

    current = nextDate;
  }

  return null;
};

/**
 * Generate all occurrences of a recurring reminder within a date range
 */
export const generateOccurrences = (
  baseDate: Date,
  repeatPattern: string,
  customInterval?: number,
  repeatDays?: number[],
  startDate?: Date,
  endDate?: Date,
  maxOccurrences: number = 30
): Date[] => {
  const occurrences: Date[] = [];
  const start = startDate || baseDate;
  let current = new Date(start);
  const end = endDate || new Date(start.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year default

  for (let i = 0; i < maxOccurrences && current <= end; i++) {
    if (current >= start) {
      occurrences.push(new Date(current));
    }

    const next = getNextOccurrence(current, repeatPattern, customInterval, repeatDays);
    if (!next || next <= current) {
      break;
    }
    current = next;
  }

  return occurrences;
};

/**
 * Format a date for display in the user's locale
 */
export const formatDateForDisplay = (date: Date | undefined | null): string => {
  if (!date) {return '';}

  const normalized = normalizeDate(date);
  if (!normalized) {return '';}

  return normalized.toLocaleDateString();
};


