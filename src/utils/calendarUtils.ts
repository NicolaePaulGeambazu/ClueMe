import { format as formatDateFns, parseISO, isToday as isTodayFns, isYesterday as isYesterdayFns, isThisWeek, isThisYear, getDay, startOfMonth, getDaysInMonth as getDaysInMonthFns, addDays, addWeeks, addMonths, addYears, addHours, isBefore, isAfter, isEqual, startOfDay, endOfDay } from 'date-fns';

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
  recurringEndDate?: string;
  completed?: boolean;
  priority?: string;
  status?: string;
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Get today's date in ISO format (YYYY-MM-DD) consistently
 * This ensures all date comparisons use the same format
 */
export function getTodayISO(): string {
  const today = new Date();
  return formatDateFns(today, 'yyyy-MM-dd');
}

/**
 * Parse a date string or Firestore timestamp to a Date object with proper timezone handling
 */
export function parseCalendarDate(dateInput: string | Date | any, timeString?: string): Date {
  // Handle Firestore Timestamp objects
  if (dateInput && typeof dateInput === 'object' && 'toDate' in dateInput && typeof dateInput.toDate === 'function') {
    try {
      const date = dateInput.toDate();
      if (timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          date.setHours(hours, minutes, 0, 0);
        }
      } else {
        date.setHours(0, 0, 0, 0);
      }
      return date;
    } catch (error) {
      console.warn('parseCalendarDate: Error converting Firestore timestamp:', error);
      return new Date(NaN);
    }
  }
  
  // Handle Firestore timestamp objects with seconds/nanoseconds
  if (dateInput && typeof dateInput === 'object' && 'seconds' in dateInput) {
    try {
      const seconds = dateInput.seconds || 0;
      const nanoseconds = dateInput.nanoseconds || 0;
      const date = new Date(seconds * 1000 + nanoseconds / 1000000);
      if (timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          date.setHours(hours, minutes, 0, 0);
        }
      } else {
        date.setHours(0, 0, 0, 0);
      }
      return date;
    } catch (error) {
      console.warn('parseCalendarDate: Error converting Firestore timestamp object:', error);
      return new Date(NaN);
    }
  }

  // Handle Date objects
  if (dateInput instanceof Date) {
    const date = new Date(dateInput);
    if (timeString) {
      const [hours, minutes] = timeString.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        date.setHours(hours, minutes, 0, 0);
      }
    } else {
      date.setHours(0, 0, 0, 0);
    }
    return date;
  }

  // Handle string dates (original logic)
  if (!dateInput || typeof dateInput !== 'string' || dateInput.length < 8) {
    console.warn('parseCalendarDate: Invalid or missing dateString:', dateInput);
    return new Date(NaN);
  }

  let date: Date;
  try {
    date = parseISO(dateInput);
  } catch (e) {
    console.warn('parseCalendarDate: Failed to parse dateString:', dateInput, e);
    return new Date(NaN);
  }
  
  if (timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    if (!isNaN(hours) && !isNaN(minutes)) {
      date.setHours(hours, minutes, 0, 0);
    }
  } else {
    date.setHours(0, 0, 0, 0);
  }

  return date;
}

/**
 * Check if a date is today using consistent comparison
 */
export function isDateToday(date: Date | string | any): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : 
                 date instanceof Date ? date :
                 parseCalendarDate(date);
  return isTodayFns(dateObj);
}

/**
 * Check if a date is in the past (before today)
 */
export function isDateInPast(date: Date | string | any): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : 
                 date instanceof Date ? date :
                 parseCalendarDate(date);
  const today = startOfDay(new Date());
  return isBefore(dateObj, today);
}

/**
 * Check if a date is in the future (after today)
 */
export function isDateInFuture(date: Date | string | any): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : 
                 date instanceof Date ? date :
                 parseCalendarDate(date);
  const today = startOfDay(new Date());
  return isAfter(dateObj, today);
}

/**
 * Compare two dates consistently
 * Returns: -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export function compareCalendarDates(date1: Date | string | any, date2: Date | string | any): number {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : 
             date1 instanceof Date ? date1 :
             parseCalendarDate(date1);
  const d2 = typeof date2 === 'string' ? parseISO(date2) : 
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
export function getEventsForDate(events: CalendarEvent[], dateString: string): CalendarEvent[] {
  return events.filter(event => {
    // Use consistent date string comparison with safety check
    return event.dateString && typeof event.dateString === 'string' && event.dateString === dateString;
  });
}

/**
 * Check if a reminder is overdue with proper timezone handling
 */
export function isReminderOverdue(dueDate?: string | Date | any, completed?: boolean, dueTime?: string): boolean {
  if (!dueDate || completed) {
    return false;
  }

  try {
    const dueDateTime = parseCalendarDate(dueDate, dueTime);
    const now = new Date();
    
    return dueDateTime < now;
  } catch (error) {
    console.warn('Error checking if reminder is overdue:', error);
    // Fallback to date-only comparison
    const today = getTodayISO();
    // Convert dueDate to string for comparison if it's not already a string
    const dueDateStr = typeof dueDate === 'string' ? dueDate : 
                      dueDate instanceof Date ? dueDate.toISOString().split('T')[0] :
                      dueDate && typeof dueDate === 'object' && 'toDate' in dueDate ? dueDate.toDate().toISOString().split('T')[0] :
                      dueDate && typeof dueDate === 'object' && 'seconds' in dueDate ? new Date(dueDate.seconds * 1000).toISOString().split('T')[0] :
                      '';
    return dueDateStr < today;
  }
}

/**
 * Generate recurring occurrences for calendar display
 * This fixes the infinite loop and end date issues
 */
export function generateRecurringOccurrences(
  baseReminder: any,
  startDate: Date = new Date(),
  endDate?: Date,
  maxOccurrences: number = 50
): CalendarEvent[] {
  if (!baseReminder.isRecurring || !baseReminder.repeatPattern || !baseReminder.dueDate) {
    if (!baseReminder.dueDate) {
      console.warn('generateRecurringOccurrences: Reminder missing dueDate:', baseReminder);
    }
    return [];
  }

  console.log('🔄 Generating recurring occurrences for:', {
    id: baseReminder.id,
    title: baseReminder.title,
    pattern: baseReminder.repeatPattern,
    repeatDays: baseReminder.repeatDays,
    endDate: baseReminder.recurringEndDate,
    recurringEndAfter: baseReminder.recurringEndAfter
  });

  const occurrences: CalendarEvent[] = [];
  const baseDate = parseCalendarDate(baseReminder.dueDate);
  if (isNaN(baseDate.getTime())) {
    console.warn('generateRecurringOccurrences: Invalid baseDate for reminder:', baseReminder);
    return [];
  }
  
  // If base date is in the past, start from today
  let currentDate = isBefore(baseDate, startOfDay(new Date())) 
    ? startOfDay(new Date()) 
    : baseDate;

  // Set end date to 6 months from now if not specified
  const defaultEndDate = addMonths(new Date(), 6);
  const finalEndDate = endDate || defaultEndDate;

  let iterationCount = 0;
  let occurrenceCount = 0;
  
  while (
    currentDate <= finalEndDate && 
    iterationCount < maxOccurrences &&
    occurrences.length < maxOccurrences
  ) {
    // Check if we've reached the recurring end date
    if (baseReminder.recurringEndDate) {
      const recurringEnd = parseCalendarDate(baseReminder.recurringEndDate);
      if (isAfter(currentDate, recurringEnd)) {
        console.log('🔄 Reached recurring end date:', formatDateFns(recurringEnd, 'yyyy-MM-dd'));
        break;
      }
    }

    // Check if we've reached the recurring end after count
    if (baseReminder.recurringEndAfter && occurrenceCount >= baseReminder.recurringEndAfter) {
      console.log('🔄 Reached recurring end after count:', baseReminder.recurringEndAfter);
      break;
    }

    const occurrence: CalendarEvent = {
      id: `${baseReminder.id}_${formatDateFns(currentDate, 'yyyy-MM-dd')}`,
      title: baseReminder.title,
      description: baseReminder.description,
      date: new Date(currentDate),
      dateString: formatDateFns(currentDate, 'yyyy-MM-dd'),
      time: baseReminder.dueTime,
      dueTime: baseReminder.dueTime,
      startTime: baseReminder.startTime,
      endTime: baseReminder.endTime,
      location: baseReminder.location,
      type: baseReminder.type,
      isRecurring: true,
      recurringEndDate: baseReminder.recurringEndDate,
      completed: baseReminder.completed,
      priority: baseReminder.priority,
      status: baseReminder.status,
      userId: baseReminder.userId,
      createdAt: baseReminder.createdAt,
      updatedAt: baseReminder.updatedAt,
    };

    occurrences.push(occurrence);
    occurrenceCount++;

    // Calculate next occurrence
    const nextDate = calculateNextOccurrence(currentDate, baseReminder.repeatPattern, baseReminder.customInterval, baseReminder.repeatDays);
    
    // Safety check to prevent infinite loops
    if (nextDate <= currentDate) {
      console.warn('🔄 Next occurrence date is not in the future, stopping generation:', {
        currentDate: formatDateFns(currentDate, 'yyyy-MM-dd'),
        nextDate: formatDateFns(nextDate, 'yyyy-MM-dd'),
        pattern: baseReminder.repeatPattern,
        repeatDays: baseReminder.repeatDays
      });
      break;
    }
    
    currentDate = nextDate;
    iterationCount++;
  }

  console.log('🔄 Generated', occurrences.length, 'occurrences for reminder:', baseReminder.id, {
    pattern: baseReminder.repeatPattern,
    repeatDays: baseReminder.repeatDays,
    iterations: iterationCount
  });
  
  return occurrences;
}

/**
 * Calculate the next occurrence date for recurring reminders
 * This fixes the Monday/Tuesday for 4 weeks pattern issue
 */
export function calculateNextOccurrence(
  currentDate: Date,
  repeatPattern: string,
  customInterval: number = 1,
  repeatDays?: number[]
): Date {
  switch (repeatPattern) {
    case 'hour':
    case 'hourly':
      return addHours(currentDate, customInterval);
      
    case 'daily':
      return addDays(currentDate, customInterval);
      
    case 'weekly':
      if (repeatDays && repeatDays.length > 0) {
        // Enhanced logic for multiple days per week (e.g., Monday/Tuesday)
        let nextDate = new Date(currentDate);
        let found = false;
        
        // First, try to find the next occurrence in the current week
        for (let i = 1; i <= 7; i++) {
          const testDate = addDays(currentDate, i);
          if (repeatDays.includes(testDate.getDay())) {
            nextDate = testDate;
            found = true;
            break;
          }
        }
        
        // If not found in current week, move to next week and find first occurrence
        if (!found) {
          // Move to next week based on customInterval
          nextDate = addWeeks(currentDate, customInterval);
          
          // Find the first occurrence on a specified day in the new week
          for (let i = 0; i < 7; i++) {
            const testDate = addDays(nextDate, i);
            if (repeatDays.includes(testDate.getDay())) {
              nextDate = testDate;
              found = true;
              break;
            }
          }
        }
        
        // If still not found, this shouldn't happen but add safety
        if (!found) {
          console.warn('Could not find next occurrence for repeatDays:', repeatDays);
          nextDate = addWeeks(currentDate, customInterval);
        }
        
        return nextDate;
      } else {
        // Standard weekly pattern
        return addWeeks(currentDate, customInterval);
      }
      
    case 'monthly':
      return addMonths(currentDate, customInterval);
      
    case 'yearly':
      return addYears(currentDate, customInterval);
      
    case 'weekdays':
      // Skip weekends
      let nextDate = new Date(currentDate);
      do {
        nextDate = addDays(nextDate, 1);
      } while (nextDate.getDay() === 0 || nextDate.getDay() === 6);
      return nextDate;
      
    case 'weekends':
      // Only weekends
      let weekendDate = new Date(currentDate);
      do {
        weekendDate = addDays(weekendDate, 1);
      } while (weekendDate.getDay() !== 0 && weekendDate.getDay() !== 6);
      return weekendDate;
      
    default:
      return addDays(currentDate, 1); // Default to daily
  }
}

/**
 * Get all reminders including recurring occurrences for calendar display
 * This ensures consistent date handling across the app
 */
export function getAllCalendarEvents(reminders: any[]): CalendarEvent[] {
  const allEvents: CalendarEvent[] = [];
  const today = startOfDay(new Date());
  
  reminders.forEach((reminder) => {
    if (!reminder.dueDate) {
      console.warn('getAllCalendarEvents: Reminder missing dueDate:', reminder);
      return;
    }

    const reminderDate = parseCalendarDate(reminder.dueDate);
    if (isNaN(reminderDate.getTime())) {
      console.warn('getAllCalendarEvents: Invalid reminderDate for reminder:', reminder);
      return;
    }
    
    // For recurring reminders, generate all occurrences and let the calendar show them
    if (reminder.isRecurring && reminder.repeatPattern) {
      const occurrences = generateRecurringOccurrences(reminder);
      allEvents.push(...occurrences);
    } else {
      // For non-recurring reminders, only add if they're today or in the future
      if (!isBefore(reminderDate, today)) {
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
          isRecurring: reminder.isRecurring,
          recurringEndDate: reminder.recurringEndDate,
          completed: reminder.completed,
          priority: reminder.priority,
          status: reminder.status,
          userId: reminder.userId,
          createdAt: reminder.createdAt,
          updatedAt: reminder.updatedAt,
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
export function createMarkedDates(events: CalendarEvent[], selectedDate?: string): Record<string, any> {
  const marked: Record<string, any> = {};
  const today = getTodayISO();

  // Mark today
  marked[today] = {
    selected: true,
    selectedColor: '#007AFF', // Primary color
    textColor: '#FFFFFF',
    selectedTextColor: '#FFFFFF',
  };

  // Mark dates with events
  events.forEach(event => {
    if (event.dateString && typeof event.dateString === 'string' && event.dateString !== today) {
      if (!marked[event.dateString]) {
        marked[event.dateString] = {
          marked: true,
          dotColor: getEventTypeColor(event.type),
          dotStyle: {
            width: 6,
            height: 6,
            borderRadius: 3,
          },
        };
      } else {
        // If multiple events on same date, use the most important type
        const currentColor = marked[event.dateString].dotColor;
        const newColor = getEventTypeColor(event.type);
        if (getEventTypePriority(event.type) > getEventTypePriorityFromColor(currentColor)) {
          marked[event.dateString].dotColor = newColor;
        }
      }
    }
  });

  // Mark selected date if different from today
  if (selectedDate && selectedDate !== today) {
    if (marked[selectedDate]) {
      marked[selectedDate].selected = true;
      marked[selectedDate].selectedColor = '#007AFF';
    } else {
      marked[selectedDate] = {
        selected: true,
        selectedColor: '#007AFF',
        textColor: '#FFFFFF',
        selectedTextColor: '#FFFFFF',
      };
    }
  }

  return marked;
}

/**
 * Get color for event type
 */
export function getEventTypeColor(type: string): string {
  switch (type) {
    case 'event': return '#007AFF'; // Primary blue
    case 'task': return '#FF9500'; // Warning orange
    case 'bill': return '#FF3B30'; // Error red
    case 'med': return '#34C759'; // Success green
    case 'note': return '#8E8E93'; // Secondary gray
    default: return '#8E8E93';
  }
}

/**
 * Get priority for event type (higher number = higher priority)
 */
export function getEventTypePriority(type: string): number {
  switch (type) {
    case 'bill': return 4;
    case 'med': return 3;
    case 'event': return 2;
    case 'task': return 1;
    case 'note': return 0;
    default: return 0;
  }
}

/**
 * Get priority from color
 */
export function getEventTypePriorityFromColor(color: string): number {
  if (color === '#FF3B30') return 4; // Error red
  if (color === '#34C759') return 3; // Success green
  if (color === '#007AFF') return 2; // Primary blue
  if (color === '#FF9500') return 1; // Warning orange
  return 0;
}

/**
 * Format date for display in calendar
 */
export function formatCalendarDate(date: Date | string | any): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : 
                 date instanceof Date ? date :
                 parseCalendarDate(date);
  return formatDateFns(dateObj, 'd'); // Just the day number
}

/**
 * Format time for display
 */
export function formatCalendarTime(timeString?: string): string {
  if (!timeString) return '';
  return timeString; // HH:MM format
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
  console.log('🧪 Testing recurring pattern:', {
    pattern,
    repeatDays,
    customInterval,
    startDate: formatDateFns(startDate, 'yyyy-MM-dd')
  });

  const occurrences: Date[] = [];
  let currentDate = new Date(startDate);

  for (let i = 0; i < maxOccurrences; i++) {
    occurrences.push(new Date(currentDate));
    
    const nextDate = calculateNextOccurrence(currentDate, pattern, customInterval, repeatDays);
    if (nextDate <= currentDate) {
      console.warn('🧪 Pattern stopped generating future dates at iteration', i);
      break;
    }
    
    currentDate = nextDate;
  }

  console.log('🧪 Generated occurrences:', occurrences.map(date => formatDateFns(date, 'yyyy-MM-dd')));
  return occurrences;
}

/**
 * Test the Monday/Tuesday for 4 weeks pattern specifically
 */
export function testMondayTuesdayPattern(): void {
  console.log('🧪 Testing Monday/Tuesday for 4 weeks pattern...');
  
  // Test with Monday (1) and Tuesday (2)
  const mondayTuesdayPattern = testRecurringPattern(
    'weekly',
    [1, 2], // Monday and Tuesday
    1, // Every week
    new Date(), // Start from today
    8 // Generate 8 occurrences (4 weeks * 2 days per week)
  );
  
  console.log('🧪 Monday/Tuesday pattern result:', mondayTuesdayPattern.length, 'occurrences');
  
  // Verify the pattern
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  mondayTuesdayPattern.forEach((date, index) => {
    const dayName = dayNames[date.getDay()];
    console.log(`🧪 Occurrence ${index + 1}: ${formatDateFns(date, 'yyyy-MM-dd')} (${dayName})`);
  });
} 