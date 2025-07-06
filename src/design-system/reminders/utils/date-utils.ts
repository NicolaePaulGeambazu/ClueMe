/**
 * Date Utilities for Reminders
 * 
 * Centralized date handling with timezone support and edge case handling
 */

import { Reminder, RepeatPattern } from '../types';

/**
 * Normalize a date to ensure it's a valid Date object
 */
export const normalizeDate = (date: Date | string | undefined | null): Date | undefined => {
  if (!date) return undefined;
  
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? undefined : date;
  }
  
  if (typeof date === 'string') {
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? undefined : parsed;
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
export const toUTCWithLocalTime = (date: Date, timeString?: string): Date => {
  const utcDate = new Date(date);
  
  if (timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    if (!isNaN(hours) && !isNaN(minutes)) {
      // Set the time in local timezone, then convert to UTC
      utcDate.setHours(hours, minutes, 0, 0);
      const localOffset = utcDate.getTimezoneOffset();
      utcDate.setMinutes(utcDate.getMinutes() - localOffset);
    }
  }
  
  return utcDate;
};

/**
 * Convert UTC date back to local time for display
 */
export const fromUTCToLocal = (utcDate: Date): Date => {
  const localDate = new Date(utcDate);
  const localOffset = localDate.getTimezoneOffset();
  localDate.setMinutes(localDate.getMinutes() + localOffset);
  return localDate;
};

/**
 * Format a date for display with proper timezone handling
 */
export const formatDateForDisplay = (date: Date | undefined | null): string => {
  if (!date) return '';
  
  const normalizedDate = normalizeDate(date);
  if (!normalizedDate) return '';
  
  return normalizedDate.toLocaleDateString();
};

/**
 * Format a time for display
 */
export const formatTimeForDisplay = (timeString: string | undefined): string => {
  if (!timeString) return '';
  
  const [hours, minutes] = timeString.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return '';
  
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

/**
 * Get the start of a day in local timezone
 */
export const getStartOfDay = (date: Date): Date => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
};

/**
 * Get the end of a day in local timezone
 */
export const getEndOfDay = (date: Date): Date => {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
};

/**
 * Check if two dates are the same day
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Check if a date is today
 */
export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};

/**
 * Check if a date is tomorrow
 */
export const isTomorrow = (date: Date): boolean => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isSameDay(date, tomorrow);
};

/**
 * Check if a date is in the past
 */
export const isPast = (date: Date): boolean => {
  return date < new Date();
};

/**
 * Check if a date is in the future
 */
export const isFuture = (date: Date): boolean => {
  return date > new Date();
};

/**
 * Get relative date string (Today, Tomorrow, Yesterday, or date)
 */
export const getRelativeDateString = (date: Date): string => {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) return 'Yesterday';
  
  return formatDateForDisplay(date);
};

/**
 * Add days to a date
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Add weeks to a date
 */
export const addWeeks = (date: Date, weeks: number): Date => {
  return addDays(date, weeks * 7);
};

/**
 * Add months to a date
 */
export const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

/**
 * Add years to a date
 */
export const addYears = (date: Date, years: number): Date => {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
};

/**
 * Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
export const getDayOfWeek = (date: Date): number => {
  return date.getDay();
};

/**
 * Get the first day of the month
 */
export const getFirstDayOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

/**
 * Get the last day of the month
 */
export const getLastDayOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

/**
 * Get the first Monday of the month
 */
export const getFirstMondayOfMonth = (date: Date): Date => {
  const firstDay = getFirstDayOfMonth(date);
  const dayOfWeek = getDayOfWeek(firstDay);
  const daysToAdd = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
  return addDays(firstDay, daysToAdd);
};

/**
 * Get the last Friday of the month
 */
export const getLastFridayOfMonth = (date: Date): Date => {
  const lastDay = getLastDayOfMonth(date);
  const dayOfWeek = getDayOfWeek(lastDay);
  const daysToSubtract = dayOfWeek === 5 ? 0 : (dayOfWeek < 5 ? dayOfWeek + 2 : dayOfWeek - 5);
  return addDays(lastDay, -daysToSubtract);
};

/**
 * Parse time string to hours and minutes
 */
export const parseTimeString = (timeString: string): { hours: number; minutes: number } | null => {
  const match = timeString.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  
  return { hours, minutes };
};

/**
 * Create time string from hours and minutes
 */
export const createTimeString = (hours: number, minutes: number): string => {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Get current time as string
 */
export const getCurrentTimeString = (): string => {
  const now = new Date();
  return createTimeString(now.getHours(), now.getMinutes());
};

/**
 * Get current date as ISO string
 */
export const getCurrentDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Validate date string format (YYYY-MM-DD)
 */
export const isValidDateString = (dateString: string): boolean => {
  const match = dateString.match(/^\d{4}-\d{2}-\d{2}$/);
  if (!match) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * Validate time string format (HH:MM)
 */
export const isValidTimeString = (timeString: string): boolean => {
  return parseTimeString(timeString) !== null;
};

/**
 * Get the next occurrence of a specific day of week
 */
export const getNextDayOfWeek = (targetDay: number, fromDate: Date = new Date()): Date => {
  const currentDay = getDayOfWeek(fromDate);
  const daysToAdd = targetDay > currentDay ? targetDay - currentDay : 7 - (currentDay - targetDay);
  return addDays(fromDate, daysToAdd);
};

/**
 * Get the previous occurrence of a specific day of week
 */
export const getPreviousDayOfWeek = (targetDay: number, fromDate: Date = new Date()): Date => {
  const currentDay = getDayOfWeek(fromDate);
  const daysToSubtract = targetDay < currentDay ? currentDay - targetDay : 7 - (targetDay - currentDay);
  return addDays(fromDate, -daysToSubtract);
};

/**
 * Add hours to a date
 */
export const addHours = (date: Date, hours: number): Date => {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
};

/**
 * Add minutes to a date
 */
export const addMinutes = (date: Date, minutes: number): Date => {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}; 