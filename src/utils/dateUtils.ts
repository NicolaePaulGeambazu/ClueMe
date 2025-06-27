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
  static formatDate(date: Date | string, format?: DateFormat): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
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
  static formatTime(date: Date | string, format?: TimeFormat): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
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
  static formatDateTime(date: Date | string, dateFormat?: DateFormat, timeFormat?: TimeFormat): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const dateStr = this.formatDate(dateObj, dateFormat);
    const timeStr = this.formatTime(dateObj, timeFormat);
    return `${dateStr} ${timeStr}`;
  }

  // Check if date is today
  static isToday(date: Date | string): boolean {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isTodayFns(dateObj);
  }

  // Check if date is yesterday
  static isYesterday(date: Date | string): boolean {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isYesterdayFns(dateObj);
  }

  // Get relative date string (Today, Yesterday, or formatted date)
  static getRelativeDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
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
  static getDayOfWeek(date: Date | string): number {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
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
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const locale = this.getCurrentLocale();

    if (isTodayFns(dateObj)) {
      return `Today, ${this.formatTime(dateObj)}`;
    }
    if (isYesterdayFns(dateObj)) {
      return `Yesterday, ${this.formatTime(dateObj)}`;
    }
    if (isThisYear(dateObj)) {
      return `${formatDateFns(dateObj, 'MMM dd', { locale })}, ${this.formatTime(dateObj)}`;
    }
    return `${this.formatDate(dateObj)}, ${this.formatTime(dateObj)}`;
  }

  // Get greeting based on time of day
  static getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) {return 'Good morning';}
    if (hour < 17) {return 'Good afternoon';}
    return 'Good evening';
  }

  // Check if a reminder is overdue
  static isOverdue(dueDate?: string, completed?: boolean): boolean {
    if (!dueDate || completed) {return false;}
    const today = this.getTodayISO();
    return dueDate < today;
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
export const formatDate = (date: Date | string, format?: DateFormat) => DateUtils.formatDate(date, format);
export const formatTime = (date: Date | string, format?: TimeFormat) => DateUtils.formatTime(date, format);
export const formatTimeOnly = (timeString: string, format?: TimeFormat) => DateUtils.formatTimeOnly(timeString, format);
export const formatDateTime = (date: Date | string, dateFormat?: DateFormat, timeFormat?: TimeFormat) =>
  DateUtils.formatDateTime(date, dateFormat, timeFormat);
export const isToday = (date: Date | string) => DateUtils.isToday(date);
export const isYesterday = (date: Date | string) => DateUtils.isYesterday(date);
export const getRelativeDate = (date: Date | string) => DateUtils.getRelativeDate(date);
export const getDayOfWeek = (date: Date | string) => DateUtils.getDayOfWeek(date);
export const getFirstDayOfMonth = (year: number, month: number) => DateUtils.getFirstDayOfMonth(year, month);
export const getDaysInMonth = (year: number, month: number) => DateUtils.getDaysInMonth(year, month);
export const parseDate = (dateString: string) => DateUtils.parseDate(dateString);
export const isValidDate = (dateString: string) => DateUtils.isValidDate(dateString);
export const getCurrentTimestamp = () => DateUtils.getCurrentTimestamp();
export const formatForCalendar = (date: Date | string) => DateUtils.formatForCalendar(date);
export const formatForActivity = (date: Date | string) => DateUtils.formatForActivity(date);
export const getGreeting = () => DateUtils.getGreeting();
export const isOverdue = (dueDate?: string, completed?: boolean) => DateUtils.isOverdue(dueDate, completed);
export const addDaysToDate = (days: number) => DateUtils.addDaysToDate(days);
export const formatRelativeTime = (dateString: string) => DateUtils.formatRelativeTime(dateString);
