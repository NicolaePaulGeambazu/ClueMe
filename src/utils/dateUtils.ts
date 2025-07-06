import { format as formatDateFns, parseISO, isToday as isTodayFns, isYesterday as isYesterdayFns, isThisWeek, isThisYear, getDay, startOfMonth, getDaysInMonth as getDaysInMonthFns } from 'date-fns';
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
    return formatDateFns(new Date(), 'yyyy-MM-dd');
  }

  // Get current date in configured format
  static getTodayFormatted(): string {
    return this.formatDate(new Date());
  }

  // Format date based on user preference
  static formatDate(date: Date | string | any, format?: DateFormat): string {
    let dateObj: Date;
    
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else if (date && typeof date === 'object') {
      // Handle Firestore Timestamp objects
      if ('toDate' in date && typeof date.toDate === 'function') {
        try {
          dateObj = date.toDate();
        } catch (error) {
          console.warn('Error converting Firestore timestamp:', error);
          return 'Invalid date';
        }
      }
      // Handle Firestore timestamp objects with seconds/nanoseconds
      else if ('seconds' in date) {
        try {
          const seconds = date.seconds || 0;
          const nanoseconds = date.nanoseconds || 0;
          dateObj = new Date(seconds * 1000 + nanoseconds / 1000000);
        } catch (error) {
          console.warn('Error converting Firestore timestamp object:', error);
          return 'Invalid date';
        }
      } else {
        console.warn('Unknown date object format:', date);
        return 'Invalid date';
      }
    } else {
      console.warn('Invalid date format:', date);
      return 'Invalid date';
    }
    
    // Validate the date object
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date after conversion:', date);
      return 'Invalid date';
    }
    
    const useFormat = format || this.dateFormat;
    const locale = this.getCurrentLocale();

    switch (useFormat) {
      case 'european':
        return formatDateFns(dateObj, 'dd/MM/yyyy', { locale });
      case 'american':
        return formatDateFns(dateObj, 'MM/dd/yyyy', { locale });
      case 'iso':
        return formatDateFns(dateObj, 'yyyy-MM-dd', { locale });
      default:
        return formatDateFns(dateObj, 'dd/MM/yyyy', { locale });
    }
  }

  // Format time based on user preference
  static formatTime(date: Date | string | any, format?: TimeFormat): string {
    let dateObj: Date;
    
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else if (date && typeof date === 'object') {
      // Handle Firestore Timestamp objects
      if ('toDate' in date && typeof date.toDate === 'function') {
        try {
          dateObj = date.toDate();
        } catch (error) {
          console.warn('Error converting Firestore timestamp:', error);
          return 'Invalid time';
        }
      }
      // Handle Firestore timestamp objects with seconds/nanoseconds
      else if ('seconds' in date) {
        try {
          const seconds = date.seconds || 0;
          const nanoseconds = date.nanoseconds || 0;
          dateObj = new Date(seconds * 1000 + nanoseconds / 1000000);
        } catch (error) {
          console.warn('Error converting Firestore timestamp object:', error);
          return 'Invalid time';
        }
      } else {
        console.warn('Unknown date object format:', date);
        return 'Invalid time';
      }
    } else {
      console.warn('Invalid date format:', date);
      return 'Invalid time';
    }
    
    // Validate the date object
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date after conversion:', date);
      return 'Invalid time';
    }
    
    const useFormat = format || this.timeFormat;
    const locale = this.getCurrentLocale();

    switch (useFormat) {
      case '12h':
        return formatDateFns(dateObj, 'hh:mm a', { locale });
      case '24h':
        return formatDateFns(dateObj, 'HH:mm', { locale });
      default:
        return formatDateFns(dateObj, 'HH:mm', { locale });
    }
  }

  // Format date and time together
  static formatDateTime(date: Date | string | any, dateFormat?: DateFormat, timeFormat?: TimeFormat): string {
    let dateObj: Date;
    
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else if (date && typeof date === 'object') {
      // Handle Firestore Timestamp objects
      if ('toDate' in date && typeof date.toDate === 'function') {
        try {
          dateObj = date.toDate();
        } catch (error) {
          console.warn('Error converting Firestore timestamp:', error);
          return 'Invalid date/time';
        }
      }
      // Handle Firestore timestamp objects with seconds/nanoseconds
      else if ('seconds' in date) {
        try {
          const seconds = date.seconds || 0;
          const nanoseconds = date.nanoseconds || 0;
          dateObj = new Date(seconds * 1000 + nanoseconds / 1000000);
        } catch (error) {
          console.warn('Error converting Firestore timestamp object:', error);
          return 'Invalid date/time';
        }
      } else {
        console.warn('Unknown date object format:', date);
        return 'Invalid date/time';
      }
    } else {
      console.warn('Invalid date format:', date);
      return 'Invalid date/time';
    }
    
    // Validate the date object
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date after conversion:', date);
      return 'Invalid date/time';
    }
    
    const dateStr = this.formatDate(dateObj, dateFormat);
    const timeStr = this.formatTime(dateObj, timeFormat);
    return `${dateStr} ${timeStr}`;
  }

  // Check if date is today
  static isToday(date: Date | string | any): boolean {
    let dateObj: Date;
    
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else if (date && typeof date === 'object') {
      // Handle Firestore Timestamp objects
      if ('toDate' in date && typeof date.toDate === 'function') {
        try {
          dateObj = date.toDate();
        } catch (error) {
          console.warn('Error converting Firestore timestamp:', error);
          return false;
        }
      }
      // Handle Firestore timestamp objects with seconds/nanoseconds
      else if ('seconds' in date) {
        try {
          const seconds = date.seconds || 0;
          const nanoseconds = date.nanoseconds || 0;
          dateObj = new Date(seconds * 1000 + nanoseconds / 1000000);
        } catch (error) {
          console.warn('Error converting Firestore timestamp object:', error);
          return false;
        }
      } else {
        console.warn('Unknown date object format:', date);
        return false;
      }
    } else {
      console.warn('Invalid date format:', date);
      return false;
    }
    
    // Validate the date object
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date after conversion:', date);
      return false;
    }
    
    return isTodayFns(dateObj);
  }

  // Check if date is yesterday
  static isYesterday(date: Date | string | any): boolean {
    let dateObj: Date;
    
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else if (date && typeof date === 'object') {
      // Handle Firestore Timestamp objects
      if ('toDate' in date && typeof date.toDate === 'function') {
        try {
          dateObj = date.toDate();
        } catch (error) {
          console.warn('Error converting Firestore timestamp:', error);
          return false;
        }
      }
      // Handle Firestore timestamp objects with seconds/nanoseconds
      else if ('seconds' in date) {
        try {
          const seconds = date.seconds || 0;
          const nanoseconds = date.nanoseconds || 0;
          dateObj = new Date(seconds * 1000 + nanoseconds / 1000000);
        } catch (error) {
          console.warn('Error converting Firestore timestamp object:', error);
          return false;
        }
      } else {
        console.warn('Unknown date object format:', date);
        return false;
      }
    } else {
      console.warn('Invalid date format:', date);
      return false;
    }
    
    // Validate the date object
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date after conversion:', date);
      return false;
    }
    
    return isYesterdayFns(dateObj);
  }

  // Get relative date string (Today, Yesterday, or formatted date)
  static getRelativeDate(date: Date | string | any): string {
    let dateObj: Date;
    
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else if (date && typeof date === 'object') {
      // Handle Firestore Timestamp objects
      if ('toDate' in date && typeof date.toDate === 'function') {
        try {
          dateObj = date.toDate();
        } catch (error) {
          console.warn('Error converting Firestore timestamp:', error);
          return 'Invalid date';
        }
      }
      // Handle Firestore timestamp objects with seconds/nanoseconds
      else if ('seconds' in date) {
        try {
          const seconds = date.seconds || 0;
          const nanoseconds = date.nanoseconds || 0;
          dateObj = new Date(seconds * 1000 + nanoseconds / 1000000);
        } catch (error) {
          console.warn('Error converting Firestore timestamp object:', error);
          return 'Invalid date';
        }
      } else {
        console.warn('Unknown date object format:', date);
        return 'Invalid date';
      }
    } else {
      console.warn('Invalid date format:', date);
      return 'Invalid date';
    }
    
    // Validate the date object
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date after conversion:', date);
      return 'Invalid date';
    }
    
    const locale = this.getCurrentLocale();

    if (isTodayFns(dateObj)) {
      return 'Today';
    }
    if (isYesterdayFns(dateObj)) {
      return 'Yesterday';
    }
    if (isThisWeek(dateObj)) {
      return formatDateFns(dateObj, 'EEEE', { locale }); // Day name
    }
    if (isThisYear(dateObj)) {
      return formatDateFns(dateObj, 'MMM dd', { locale }); // Month day
    }
    return this.formatDate(dateObj);
  }

  // Get day of week (0 = Sunday, 1 = Monday, etc.)
  static getDayOfWeek(date: Date | string | any): number {
    let dateObj: Date;
    
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else if (date && typeof date === 'object') {
      // Handle Firestore Timestamp objects
      if ('toDate' in date && typeof date.toDate === 'function') {
        try {
          dateObj = date.toDate();
        } catch (error) {
          console.warn('Error converting Firestore timestamp:', error);
          return 0; // Default to Sunday
        }
      }
      // Handle Firestore timestamp objects with seconds/nanoseconds
      else if ('seconds' in date) {
        try {
          const seconds = date.seconds || 0;
          const nanoseconds = date.nanoseconds || 0;
          dateObj = new Date(seconds * 1000 + nanoseconds / 1000000);
        } catch (error) {
          console.warn('Error converting Firestore timestamp object:', error);
          return 0; // Default to Sunday
        }
      } else {
        console.warn('Unknown date object format:', date);
        return 0; // Default to Sunday
      }
    } else {
      console.warn('Invalid date format:', date);
      return 0; // Default to Sunday
    }
    
    // Validate the date object
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date after conversion:', date);
      return 0; // Default to Sunday
    }
    
    return getDay(dateObj);
  }

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  static getFirstDayOfMonth(year: number, month: number): number {
    return getDay(startOfMonth(new Date(year, month, 1)));
  }

  // Get days in month
  static getDaysInMonth(year: number, month: number): number {
    return getDaysInMonthFns(new Date(year, month, 1));
  }

  // Parse date string to Date object
  static parseDate(dateString: string): Date {
    return parseISO(dateString);
  }

  // Validate date string
  static isValidDate(dateString: string): boolean {
    try {
      parseISO(dateString);
      return true;
    } catch {
      return false;
    }
  }

  // Get current timestamp
  static getCurrentTimestamp(): number {
    return Date.now();
  }

  // Format for display in calendar
  static formatForCalendar(date: Date | string): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const locale = this.getCurrentLocale();
    return formatDateFns(dateObj, 'd', { locale }); // Just the day number
  }

  // Format for activity feed
  static formatForActivity(date: Date | string): string {
    try {
      let dateObj: Date;
      
      if (typeof date === 'string') {
        // Handle string dates more safely
        if (!date || date.trim() === '') {
          return 'Unknown time';
        }
        dateObj = parseISO(date);
        // Check if the parsed date is valid
        if (isNaN(dateObj.getTime())) {
          console.warn('Invalid date string in formatForActivity:', date);
          return 'Unknown time';
        }
      } else {
        // Handle Date objects
        if (!date || isNaN(date.getTime())) {
          console.warn('Invalid Date object in formatForActivity:', date);
          return 'Unknown time';
        }
        dateObj = date;
      }

      const locale = this.getCurrentLocale();
      const currentLang = i18n.language;

      if (isTodayFns(dateObj)) {
        return `${i18n.t('activity.today')}, ${this.formatTime(dateObj)}`;
      }
      if (isYesterdayFns(dateObj)) {
        return `${i18n.t('activity.yesterday')}, ${this.formatTime(dateObj)}`;
      }
      if (isThisYear(dateObj)) {
        return `${formatDateFns(dateObj, 'MMM dd', { locale })}, ${this.formatTime(dateObj)}`;
      }
      return `${this.formatDate(dateObj)}, ${this.formatTime(dateObj)}`;
    } catch (error) {
      console.error('Error formatting activity date:', error, 'Date value:', date);
      return 'Unknown time';
    }
  }

  // Get greeting based on time of day
  static getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) {return 'Good morning';}
    if (hour < 17) {return 'Good afternoon';}
    return 'Good evening';
  }

  // Check if a reminder is overdue
  static isOverdue(dueDate?: string, completed?: boolean, dueTime?: string, reminder?: any): boolean {
    if (!dueDate || completed) {return false;}
    
    try {
      const dueDateTime = this.parseDateWithTimezone(dueDate, dueTime);
      const now = new Date();
      
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
      return dueDateTime < now;
    } catch (error) {
      console.warn('Error checking if reminder is overdue:', error);
      // Fallback to date-only comparison
      const today = this.getTodayISO();
      return dueDate < today;
    }
  }

  // Parse date with proper timezone handling
  static parseDateWithTimezone(dateString: string, timeString?: string): Date {
    // Create a date object from the date string
    const date = new Date(dateString);
    
    // If there's a time string, combine it with the date
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
      console.warn('Error formatting time:', timeString, error);
      return timeString; // Return original if formatting fails
    }
  }
}

// Export convenience functions
export const getTodayISO = () => DateUtils.getTodayISO();
export const getTodayFormatted = () => DateUtils.getTodayFormatted();
export const formatDate = (date: Date | string | any, format?: DateFormat) => DateUtils.formatDate(date, format);
export const formatTime = (date: Date | string | any, format?: TimeFormat) => DateUtils.formatTime(date, format);
export const formatTimeOnly = (timeString: string, format?: TimeFormat) => DateUtils.formatTimeOnly(timeString, format);
export const formatDateTime = (date: Date | string | any, dateFormat?: DateFormat, timeFormat?: TimeFormat) =>
  DateUtils.formatDateTime(date, dateFormat, timeFormat);
export const isToday = (date: Date | string | any) => DateUtils.isToday(date);
export const isYesterday = (date: Date | string | any) => DateUtils.isYesterday(date);
export const getRelativeDate = (date: Date | string | any) => DateUtils.getRelativeDate(date);
export const getDayOfWeek = (date: Date | string | any) => DateUtils.getDayOfWeek(date);
export const getFirstDayOfMonth = (year: number, month: number) => DateUtils.getFirstDayOfMonth(year, month);
export const getDaysInMonth = (year: number, month: number) => DateUtils.getDaysInMonth(year, month);
export const parseDate = (dateString: string) => DateUtils.parseDate(dateString);
export const isValidDate = (dateString: string) => DateUtils.isValidDate(dateString);
export const getCurrentTimestamp = () => DateUtils.getCurrentTimestamp();
export const formatForCalendar = (date: Date | string) => DateUtils.formatForCalendar(date);
export const formatForActivity = (date: Date | string) => DateUtils.formatForActivity(date);
export const getGreeting = () => DateUtils.getGreeting();
export const isOverdue = (dueDate?: string, completed?: boolean, dueTime?: string, reminder?: any) => DateUtils.isOverdue(dueDate, completed, dueTime, reminder);
export const parseDateWithTimezone = (dateString: string, timeString?: string) => DateUtils.parseDateWithTimezone(dateString, timeString);
export const getCurrentDateInTimezone = () => DateUtils.getCurrentDateInTimezone();
export const compareDates = (date1: Date | string, date2: Date | string) => DateUtils.compareDates(date1, date2);
export const isDateInPast = (date: Date | string) => DateUtils.isDateInPast(date);
export const isDateToday = (date: Date | string) => DateUtils.isDateToday(date);
export const addDaysToDate = (days: number) => DateUtils.addDaysToDate(days);
export const formatRelativeTime = (dateString: string) => DateUtils.formatRelativeTime(dateString);

/**
 * Date and Timezone Utilities for Recurring Reminders
 */

/**
 * Normalize a date to ensure it's a valid Date object
 */
export const normalizeDate = (date: Date | string | undefined | null | any): Date | undefined => {
  if (!date) return undefined;
  
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
        console.warn('Error converting Firestore timestamp:', error);
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
        console.warn('Error converting Firestore timestamp object:', error);
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
 * Convert a date to UTC while preserving the intended local time
 * This is useful for storing dates that should fire at a specific local time
 */
export const toUTCPreservingLocalTime = (date: Date, timeString?: string): Date => {
  const result = new Date(date);
  
  if (timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    result.setHours(hours, minutes, 0, 0);
  }
  
  // Convert to UTC while preserving the local time
  const utcDate = new Date(result.getTime() - (result.getTimezoneOffset() * 60000));
  return utcDate;
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
  if (!date) return '';
  
  const normalized = normalizeDate(date);
  if (!normalized) return '';
  
  return normalized.toLocaleDateString();
};

/**
 * Format a time for display
 */
export const formatTimeForDisplay = (timeString: string | undefined): string => {
  if (!timeString) return '';
  
  try {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return timeString;
  }
};
