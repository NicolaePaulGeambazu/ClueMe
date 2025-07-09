import { format as formatDateFns, parseISO, isToday as isTodayFns, isYesterday as isYesterdayFns, isThisWeek, isThisYear, getDay, startOfMonth, getDaysInMonth as getDaysInMonthFns, addDays, addWeeks, addMonths, addYears, addHours, isBefore, isAfter, isEqual, startOfDay, endOfDay, getDate, getMonth, getYear, isValid } from 'date-fns';
import { 
  generateOccurrences,
  getNextOccurrenceDate,
  getRecurringDescription,
  validateRecurringConfig
} from '../design-system/reminders/utils/recurring-utils';
import {
  createTimezoneAwareDate,
  convertToTimezone,
  convertFromTimezone,
  getCurrentTimezone,
  getTimezoneAbbreviation
} from './timezoneUtils';
import { Reminder, ReminderType, ReminderPriority, ReminderStatus, RepeatPattern } from '../design-system/reminders/types';

/**
 * Calendar-specific date utilities that handle timezone and date comparison consistently
 * This fixes the issues where today's reminders don't show correctly in calendar
 */

export interface CalendarDate {
  date: Date;
  dateString: string; // YYYY-MM-DD format
  isToday: boolean;
  isSelected: boolean;
  hasEvents: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  dateString: string;
  time?: string;
  dueTime?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  type: string;
  isRecurring: boolean;
  recurringEndDate?: Date;
  completed?: boolean;
  priority?: string;
  status?: string;
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  timezone?: string;
  notificationCount?: number;
  isNextOccurrence?: boolean;
}

interface ReminderWithDates extends Reminder {
  recurringEndDate?: Date;
}

interface MarkedDateConfig {
  marked: boolean;
  dotColor: string;
  textColor: string;
  selectedColor: string;
  dots?: Array<{
    color: string;
    key: string;
  }>;
}

interface MarkedDates {
  [date: string]: MarkedDateConfig;
}

/**
 * Get today's date in ISO format (YYYY-MM-DD) consistently
 * This ensures all date comparisons use the same format
 */
export function getTodayISO(): string {
  return formatDateFns(new Date(), 'yyyy-MM-dd');
}

/**
 * Parse a date string or Firestore timestamp to a Date object with proper timezone handling
 */
export function parseCalendarDate(dateInput: string | Date | unknown, timeString?: string): Date {
  if (!dateInput) {
    return new Date();
  }

  if (dateInput instanceof Date) {
    return dateInput;
  }

  if (typeof dateInput === 'string') {
    try {
      // Handle ISO date strings
      if (dateInput.includes('T') || dateInput.includes('Z')) {
        return parseISO(dateInput);
      }
      
      // Handle YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        const parsed = parseISO(dateInput);
        if (isValid(parsed)) {
          return parsed;
        }
      }
      
      // Handle other date formats
      const parsed = new Date(dateInput);
      if (isValid(parsed)) {
        return parsed;
      }
    } catch (error) {
      // Fallback to current date
    }
  }

  return new Date();
}

/**
 * Check if a date is today using consistent comparison
 */
export function isDateToday(date: Date | string | unknown): boolean {
  const dateObj = typeof date === 'string' ? parseCalendarDate(date) : date;
  if (!(dateObj instanceof Date)) {
    return false;
  }
  
  const today = new Date();
  return formatDateFns(dateObj, 'yyyy-MM-dd') === formatDateFns(today, 'yyyy-MM-dd');
}

/**
 * Check if a date is in the past (before today)
 */
export function isDateInPast(date: Date | string | unknown): boolean {
  const dateObj = typeof date === 'string' ? parseCalendarDate(date) : date;
  if (!(dateObj instanceof Date)) {
    return false;
  }
  
  const today = startOfDay(new Date());
  return isBefore(dateObj, today);
}

/**
 * Check if a date is in the future (after today)
 */
export function isDateInFuture(date: Date | string | unknown): boolean {
  const dateObj = typeof date === 'string' ? parseCalendarDate(date) : date;
  if (!(dateObj instanceof Date)) {
    return false;
  }
  
  const today = startOfDay(new Date());
  return !isBefore(dateObj, today) && !isDateToday(dateObj);
}

/**
 * Compare two dates consistently
 * Returns: -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export function compareCalendarDates(date1: Date | string | unknown, date2: Date | string | unknown): number {
  const d1 = typeof date1 === 'string' ? parseCalendarDate(date1) : 
             date1 instanceof Date ? date1 :
             parseCalendarDate(date1);
  const d2 = typeof date2 === 'string' ? parseCalendarDate(date2) : 
             date2 instanceof Date ? date2 :
             parseCalendarDate(date2);
  
  if (isBefore(d1, d2)) return -1;
  if (isAfter(d1, d2)) return 1;
  return 0;
}

/**
 * Get events for a specific date with proper date comparison
 * This fixes the issue where events show on wrong dates
 */
export function getEventsForDate(events: CalendarEvent[], targetDate: Date, timezone?: string): CalendarEvent[] {
  const targetDateStr = formatDateFns(targetDate, 'yyyy-MM-dd');
  
  return events.filter(event => {
    const eventDateStr = formatDateFns(event.date, 'yyyy-MM-dd');
    return eventDateStr === targetDateStr;
  });
}

/**
 * Check if a reminder is overdue with proper timezone handling
 */
export function isReminderOverdue(dueDate?: string | Date | unknown, completed?: boolean, dueTime?: string, timezone?: string): boolean {
  if (completed) {
    return false;
  }

  if (!dueDate) {
    return false;
  }

  const dueDateObj = typeof dueDate === 'string' ? parseCalendarDate(dueDate) : dueDate;
  if (!(dueDateObj instanceof Date)) {
    return false;
  }

  const now = new Date();
  return dueDateObj < now;
}

/**
 * Generate recurring occurrences for calendar display with advanced pattern support
 * This uses the new recurring utilities for better pattern handling
 */
export function generateRecurringOccurrences(
  baseReminder: ReminderWithDates,
  startDate: Date = new Date(),
  endDate?: Date,
  maxOccurrences: number = 50
): CalendarEvent[] {
  if (!baseReminder.isRecurring || !baseReminder.repeatPattern || !baseReminder.dueDate) {
    return [];
  }

  // Convert recurringEndDate from ISO string to Date object if needed
  const reminderWithProperDates: ReminderWithDates = {
    ...baseReminder,
    recurringEndDate: baseReminder.recurringEndDate ? 
      (typeof baseReminder.recurringEndDate === 'string' ? new Date(baseReminder.recurringEndDate) : baseReminder.recurringEndDate) : 
      undefined
  };

  // Use the new recurring utilities with properly formatted dates
  const occurrences = generateOccurrences(reminderWithProperDates, maxOccurrences, startDate);
  
  // Convert to CalendarEvent format
  const calendarEvents: CalendarEvent[] = occurrences.map((occurrence) => {
    const timezone = reminderWithProperDates.timezone || getCurrentTimezone();
    const timezoneAbbr = getTimezoneAbbreviation(timezone);
    
    return {
      id: occurrence.reminder.id,
      title: occurrence.reminder.title,
      description: occurrence.reminder.description,
      date: occurrence.date,
      dateString: formatDateFns(occurrence.date, 'yyyy-MM-dd'),
      time: occurrence.reminder.dueTime,
      dueTime: occurrence.reminder.dueTime,
      startTime: occurrence.reminder.startTime,
      endTime: occurrence.reminder.endTime,
      location: occurrence.reminder.location,
      type: occurrence.reminder.type,
      isRecurring: true,
      recurringEndDate: occurrence.reminder.recurringEndDate,
      completed: occurrence.reminder.completed,
      priority: occurrence.reminder.priority,
      status: occurrence.reminder.status,
      userId: occurrence.reminder.userId,
      createdAt: occurrence.reminder.createdAt,
      updatedAt: occurrence.reminder.updatedAt,
      timezone: timezone,
      notificationCount: occurrence.reminder.notificationTimings?.length || 0,
      isNextOccurrence: occurrence.isNext
    };
  });
  
  return calendarEvents;
}

/**
 * Calculate next occurrence using the new recurring utilities
 */
export function calculateNextOccurrence(
  currentDate: Date, 
  repeatPattern: string, 
  customInterval?: number, 
  repeatDays?: number[],
  timezone?: string
): Date {
  const mockReminder: Reminder = {
    id: 'temp',
    userId: 'temp',
    title: 'Temp',
    type: ReminderType.TASK,
    priority: ReminderPriority.MEDIUM,
    status: ReminderStatus.PENDING,
    isRecurring: true,
    repeatPattern: repeatPattern as RepeatPattern,
    customInterval,
    repeatDays,
    dueDate: currentDate,
    timezone,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const nextDate = getNextOccurrenceDate(mockReminder, currentDate, timezone);
  return nextDate || addDays(currentDate, 1); // Fallback
}

/**
 * Get all reminders including recurring occurrences for calendar display
 * This ensures consistent date handling across the app with timezone support
 */
export function getAllCalendarEvents(reminders: Reminder[]): CalendarEvent[] {
  const allEvents: CalendarEvent[] = [];
  const today = startOfDay(new Date());
  
  reminders.forEach((reminder) => {
    if (!reminder.dueDate) {
      return;
    }

    const reminderDate = parseCalendarDate(reminder.dueDate);
    if (isNaN(reminderDate.getTime())) {
      return;
    }
    
    // For recurring reminders, generate all occurrences using new utilities
    if (reminder.isRecurring && reminder.repeatPattern) {
      const occurrences = generateRecurringOccurrences(reminder as ReminderWithDates);
      allEvents.push(...occurrences);
    } else {
      // For non-recurring reminders, only add if they're today or in the future
      if (!isBefore(reminderDate, today)) {
        const timezone = reminder.timezone || getCurrentTimezone();
        const timezoneAbbr = getTimezoneAbbreviation(timezone);
        
        allEvents.push({
          id: reminder.id,
          title: reminder.title,
          description: reminder.description,
          date: reminderDate,
          dateString: formatDateFns(reminderDate, 'yyyy-MM-dd'),
          time: reminder.dueTime,
          dueTime: reminder.dueTime,
          startTime: reminder.startTime,
          endTime: reminder.endTime,
          location: reminder.location,
          type: reminder.type,
          isRecurring: reminder.isRecurring || false,
          recurringEndDate: reminder.recurringEndDate,
          completed: reminder.completed,
          priority: reminder.priority,
          status: reminder.status,
          userId: reminder.userId,
          createdAt: reminder.createdAt,
          updatedAt: reminder.updatedAt,
          timezone: timezone,
          notificationCount: reminder.notificationTimings?.length || 0
        });
      }
    }
  });
  
  return allEvents;
}

/**
 * Create marked dates object for calendar display
 * This ensures consistent marking of dates with events
 */
export function createMarkedDates(events: CalendarEvent[]): MarkedDates {
  const markedDates: MarkedDates = {};
  
  events.forEach(event => {
    const dateStr = event.dateString;
    
    if (!markedDates[dateStr]) {
      markedDates[dateStr] = {
        marked: true,
        dotColor: getPriorityColor(event.priority),
        textColor: event.completed ? '#888' : '#000',
        selectedColor: getPriorityColor(event.priority) + '20'
      };
    } else {
      // Multiple events on same date
      markedDates[dateStr].dots = markedDates[dateStr].dots || [];
      markedDates[dateStr].dots!.push({
        color: getPriorityColor(event.priority),
        key: event.id
      });
    }
  });
  
  return markedDates;
}

/**
 * Get color for event type
 */
export function getEventTypeColor(type: string): string {
  const typeColors: { [key: string]: string } = {
    task: '#007AFF',
    reminder: '#FF9500',
    event: '#34C759',
    appointment: '#AF52DE',
    meeting: '#5856D6',
    deadline: '#FF3B30',
    default: '#8E8E93'
  };
  
  return typeColors[type] || typeColors.default;
}

/**
 * Get priority for event type (higher number = higher priority)
 */
export function getEventTypePriority(type: string): number {
  const typePriorities: { [key: string]: number } = {
    deadline: 1,
    meeting: 2,
    appointment: 3,
    event: 4,
    task: 5,
    reminder: 6,
    default: 7
  };
  
  return typePriorities[type] || typePriorities.default;
}

/**
 * Get priority from color
 */
export function getEventTypePriorityFromColor(color: string): number {
  const colorPriorities: { [key: string]: number } = {
    '#FF3B30': 1, // deadline
    '#5856D6': 2, // meeting
    '#AF52DE': 3, // appointment
    '#34C759': 4, // event
    '#007AFF': 5, // task
    '#FF9500': 6, // reminder
  };
  
  return colorPriorities[color] || 7;
}

/**
 * Format date for display in calendar
 */
export function formatCalendarDate(date: Date, timezone?: string): string {
  try {
    if (timezone && timezone !== getCurrentTimezone()) {
      const convertedDate = convertToTimezone(date, timezone);
      return formatDateFns(convertedDate, 'yyyy-MM-dd');
    }
    return formatDateFns(date, 'yyyy-MM-dd');
  } catch (error) {
    return formatDateFns(date, 'yyyy-MM-dd');
  }
}

/**
 * Format time for display
 */
export function formatCalendarTime(timeString?: string): string {
  if (!timeString) return '';
  
  try {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  } catch (error) {
    return timeString;
  }
}

/**
 * Get time blocks for day view
 */
export function getTimeBlocks(startHour: number = 6, endHour: number = 22) {
  const blocks = [];
  for (let hour = startHour; hour < endHour; hour++) {
    blocks.push({
      hour,
      time: `${hour.toString().padStart(2, '0')}:00`,
      events: [] as CalendarEvent[],
    });
  }
  return blocks;
}

/**
 * Assign events to time blocks for day view
 */
export function assignEventsToTimeBlocks(events: CalendarEvent[], startHour: number = 6, endHour: number = 22) {
  const timeBlocks = getTimeBlocks(startHour, endHour);
  
  events.forEach(event => {
    let eventHour = 9; // Default to 9 AM if no start time
    
    if (event.time && typeof event.time === 'string') {
      const timeParts = event.time.split(':');
      if (timeParts.length > 0) {
        const hours = parseInt(timeParts[0], 10);
        if (!isNaN(hours)) {
          eventHour = hours;
        }
      }
    }
    
    // Assign to time blocks
    if (eventHour >= startHour && eventHour < endHour) {
      const blockIndex = eventHour - startHour;
      if (blockIndex >= 0 && blockIndex < timeBlocks.length) {
        timeBlocks[blockIndex].events.push(event);
      }
    }
  });
  
  return timeBlocks;
}

/**
 * Test function to verify recurring patterns work correctly
 * This helps debug issues with complex patterns like Monday/Tuesday for 4 weeks
 */
export function testRecurringPattern(
  pattern: string,
  repeatDays?: number[],
  customInterval: number = 1,
  startDate: Date = new Date(),
  maxOccurrences: number = 10
): Date[] {
  const mockReminder: Reminder = {
    id: 'test',
    userId: 'test',
    title: 'Test Reminder',
    type: ReminderType.TASK,
    priority: ReminderPriority.MEDIUM,
    status: ReminderStatus.PENDING,
    isRecurring: true,
    repeatPattern: pattern as RepeatPattern,
    customInterval,
    repeatDays,
    dueDate: startDate,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const occurrences = generateOccurrences(mockReminder, maxOccurrences, startDate);
  return occurrences.map(o => o.date);
}

/**
 * Test the Monday/Tuesday for 4 weeks pattern specifically
 */
export function testMondayTuesdayPattern(): void {
  const startDate = new Date('2024-01-01');
  const occurrences = testRecurringPattern('weekly', [1, 2], 1, startDate, 10);
  
  occurrences.forEach((date, index) => {
    const dayName = formatDateFns(date, 'EEEE');
    const dateStr = formatDateFns(date, 'yyyy-MM-dd');
  });
}

/**
 * Get color based on priority
 */
function getPriorityColor(priority?: string): string {
  const priorityColors: { [key: string]: string } = {
    high: '#FF3B30',
    medium: '#FF9500',
    low: '#34C759'
  };
  
  return priorityColors[priority || 'medium'] || priorityColors.medium;
}

/**
 * Get recurring pattern description for calendar display
 */
export function getCalendarRecurringDescription(reminder: Reminder): string {
  if (!reminder.isRecurring || !reminder.repeatPattern) {
    return '';
  }

  const description = getRecurringDescription(reminder);
  const timezone = reminder.timezone || getCurrentTimezone();
  const timezoneAbbr = getTimezoneAbbreviation(timezone);
  
  return `${description} (${timezoneAbbr})`;
}

/**
 * Validate calendar event data
 */
export function validateCalendarEvent(event: CalendarEvent): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!event.id) {
    errors.push('Event ID is required');
  }
  
  if (!event.title || event.title.trim().length === 0) {
    errors.push('Event title is required');
  }
  
  if (!event.date || isNaN(event.date.getTime())) {
    errors.push('Valid event date is required');
  }
  
  if (event.isRecurring && !event.timezone) {
    errors.push('Timezone is required for recurring events');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get timezone-aware event display info
 */
export function getEventDisplayInfo(event: CalendarEvent): {
  dateDisplay: string;
  timeDisplay: string;
  timezoneDisplay: string;
  recurringInfo: string;
} {
  const timezone = event.timezone || getCurrentTimezone();
  const timezoneAbbr = getTimezoneAbbreviation(timezone);
  
  const dateDisplay = formatDateFns(event.date, 'MMM d, yyyy');
  const timeDisplay = event.time ? formatCalendarTime(event.time) : '';
  const timezoneDisplay = timezoneAbbr;
  const recurringInfo = event.isRecurring ? '🔄 Recurring' : '';
  
  return {
    dateDisplay,
    timeDisplay,
    timezoneDisplay,
    recurringInfo
  };
} 