import { Reminder } from '../design-system/reminders/types';
import type { ReminderStatus, RepeatPattern } from '../design-system/reminders/types';

interface ReminderData {
  [key: string]: unknown;
}

interface CleanedReminderData {
  [key: string]: unknown;
}

// Extended Reminder interface for internal use with missing properties
interface ExtendedReminder extends Reminder {
  customFrequencyType?: string;
  occurrenceCount?: number;
}

// Helper function to safely convert dueDate to Date object
const safeDueDate = (dueDate: Date | string | undefined | unknown): Date | null => {
  if (!dueDate) {return null;}

  if (dueDate instanceof Date) {
    return isNaN(dueDate.getTime()) ? null : dueDate;
  }

  if (typeof dueDate === 'string') {
    const parsed = new Date(dueDate);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
};

// Helper function to get date string from dueDate
const getDateString = (dueDate: Date | string | undefined | unknown): string | null => {
  const date = safeDueDate(dueDate);
  return date ? date.toISOString().split('T')[0] : null;
};

// Calculate the next occurrence date based on repeat pattern
export const calculateNextOccurrence = (currentDueDate: Date, repeatPattern: string, customInterval?: number, repeatDays?: number[]): Date => {
  const nextDate = new Date(currentDueDate);
  const interval = customInterval || 1;

  switch (repeatPattern) {
    case 'hour':
    case 'hourly':
      nextDate.setHours(nextDate.getHours() + interval);
      break;

    case 'daily':
      nextDate.setDate(nextDate.getDate() + interval);
      break;

    case 'weekdays':
      // Move to next weekday (skip weekends)
      do {
        nextDate.setDate(nextDate.getDate() + 1);
      } while (nextDate.getDay() === 0 || nextDate.getDay() === 6);
      break;

    case 'weekly':
      if (repeatDays && repeatDays.length > 0) {
        // Find the next occurrence based on repeat days
        const currentDay = nextDate.getDay();
        const sortedRepeatDays = [...repeatDays].sort((a, b) => a - b);

        // Find the next day in the sequence
        let nextDay = sortedRepeatDays.find(day => day > currentDay);

        if (nextDay === undefined) {
          // If no day found this week, go to next week
          nextDay = sortedRepeatDays[0];
          nextDate.setDate(nextDate.getDate() + 7);
        }

        // Calculate days to add
        const daysToAdd = nextDay - currentDay;
        nextDate.setDate(nextDate.getDate() + daysToAdd);
      } else {
        // Default weekly behavior
        nextDate.setDate(nextDate.getDate() + (7 * interval));
      }
      break;

    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + interval);
      break;

    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + interval);
      break;

    case 'first_monday':
      // Move to first Monday of next month
      nextDate.setDate(1);
      nextDate.setMonth(nextDate.getMonth() + 1);
      while (nextDate.getDay() !== 1) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
      break;

    case 'last_friday':
      // Move to last Friday of next month
      nextDate.setDate(1);
      nextDate.setMonth(nextDate.getMonth() + 2);
      nextDate.setDate(0); // Last day of previous month
      while (nextDate.getDay() !== 5) {
        nextDate.setDate(nextDate.getDate() - 1);
      }
      break;

    case 'custom':
      // Handle custom patterns
      if (customInterval) {
        // Default to daily for custom patterns
        nextDate.setDate(nextDate.getDate() + customInterval);
      } else {
        // Default to daily if no interval specified
        nextDate.setDate(nextDate.getDate() + 1);
      }
      break;

    default:
      // Default to daily
      nextDate.setDate(nextDate.getDate() + 1);
  }

  return nextDate;
};

// Check if a reminder should generate the next occurrence
export const shouldGenerateNextOccurrence = (reminder: ExtendedReminder): boolean => {
  if (!reminder.isRecurring || !reminder.repeatPattern) {
    return false;
  }

  const dueDate = safeDueDate(reminder.dueDate);
  if (!dueDate) {
    return false;
  }

  const now = new Date();

  // Check if we're past the due date
  if (dueDate > now) {
    return false;
  }

  // Check if we're within the recurring date range
  if (reminder.recurringStartDate) {
    const startDate = safeDueDate(reminder.recurringStartDate);
    if (startDate && now < startDate) {
      return false; // Haven't reached start date yet
    }
  }

  if (reminder.recurringEndDate) {
    const endDate = safeDueDate(reminder.recurringEndDate);
    if (endDate && now > endDate) {
      return false; // Past the end date
    }
  }

  return true; // Generate next occurrence if due date has passed and within range
};

// Generate the next occurrence of a recurring reminder
export const generateNextOccurrence = (reminder: ExtendedReminder): Partial<ExtendedReminder> | null => {

  if (!shouldGenerateNextOccurrence(reminder)) {
    return null;
  }

  const currentDueDate = safeDueDate(reminder.dueDate);
  if (!currentDueDate || !reminder.repeatPattern) {
    return null;
  }

  // Calculate next occurrence based on pattern type
  let nextDueDate: Date;

  if (reminder.repeatPattern === 'custom' && reminder.customFrequencyType) {
    // Handle custom patterns with specific frequency types
    nextDueDate = calculateNextOccurrence(currentDueDate, reminder.customFrequencyType, reminder.customInterval, reminder.repeatDays);
  } else {
    // Handle standard patterns
    nextDueDate = calculateNextOccurrence(currentDueDate, reminder.repeatPattern, reminder.customInterval, reminder.repeatDays);
  }

  // Check if the next occurrence would be past the end date
  if (reminder.recurringEndDate) {
    const endDate = safeDueDate(reminder.recurringEndDate);
    if (endDate && nextDueDate > endDate) {
      return null; // Don't generate if it would be past the end date
    }
  }

  const nextOccurrence: Partial<ExtendedReminder> = {
    ...reminder,
    id: `${reminder.id}_${Date.now()}`, // Generate unique ID
    dueDate: nextDueDate,
    status: 'pending' as ReminderStatus,
    createdAt: new Date(),
    updatedAt: new Date(),
    occurrenceCount: (reminder.occurrenceCount || 0) + 1,
  };

  // Remove fields that shouldn't be copied
  delete nextOccurrence.id;
  delete nextOccurrence.createdAt;
  delete nextOccurrence.updatedAt;

  return nextOccurrence;
};

export const filterReminders = {
  byType: (reminders: Reminder[], type: string) =>
    reminders.filter(r => r.type === type),

  byPriority: (reminders: Reminder[], priority: string) =>
    reminders.filter(r => r.priority === priority),

  byCompleted: (reminders: Reminder[], completed: boolean) =>
    reminders.filter(r => r.completed === completed),

  byFavorite: (reminders: Reminder[]) =>
    reminders.filter(r => r.isFavorite),

  byOverdue: (reminders: Reminder[]) => {
    // Cache current time to prevent rapid fluctuations
    const now = new Date();
    const nowTime = now.getTime();

    return reminders.filter(r => {
      if (r.completed) {return false;}

      try {
        // Use the timezone-aware overdue check with reminder object for recurring logic
        const { isOverdue } = require('./dateUtils');
        return isOverdue(r.dueDate, r.completed, r.dueTime, r);
      } catch (error) {
        // Fallback to date-only comparison with cached time
        const dueDate = safeDueDate(r.dueDate);
        if (!dueDate) {return false;}

        // Add a small buffer to prevent rapid state changes
        const bufferMs = 1000; // 1 second buffer
        return dueDate.getTime() < (nowTime - bufferMs);
      }
    });
  },

  byToday: (reminders: Reminder[]) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    return reminders.filter(r => {
      const dueDateStr = getDateString(r.dueDate);
      return dueDateStr === todayStr;
    });
  },

  bySearch: (reminders: Reminder[], query: string) => {
    const searchTerm = query.toLowerCase();
    return reminders.filter(reminder =>
      reminder.title.toLowerCase().includes(searchTerm) ||
      reminder.description?.toLowerCase().includes(searchTerm) ||
      reminder.location?.toLowerCase().includes(searchTerm) ||
      reminder.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  },
};

export const sortReminders = {
  byDueDate: (reminders: Reminder[], direction: 'asc' | 'desc' = 'asc') =>
    [...reminders].sort((a, b) => {
      const aDate = safeDueDate(a.dueDate);
      const bDate = safeDueDate(b.dueDate);

      if (!aDate && !bDate) {return 0;}
      if (!aDate) {return 1;}
      if (!bDate) {return -1;}

      return direction === 'asc'
        ? aDate.getTime() - bDate.getTime()
        : bDate.getTime() - aDate.getTime();
    }),

  byPriority: (reminders: Reminder[]) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return [...reminders].sort((a, b) =>
      priorityOrder[b.priority] - priorityOrder[a.priority]
    );
  },

  byTitle: (reminders: Reminder[], direction: 'asc' | 'desc' = 'asc') =>
    [...reminders].sort((a, b) => {
      const comparison = a.title.localeCompare(b.title);
      return direction === 'asc' ? comparison : -comparison;
    }),

  byCreated: (reminders: Reminder[], direction: 'asc' | 'desc' = 'desc') =>
    [...reminders].sort((a, b) => {
      try {
        const aDate = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const bDate = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        const comparison = bDate.getTime() - aDate.getTime();
        return direction === 'desc' ? comparison : -comparison;
      } catch (error) {
        return 0;
      }
    }),

  // Chronological sorting by due date and time
  chronological: (reminders: Reminder[], direction: 'asc' | 'desc' = 'asc') =>
    [...reminders].sort((a, b) => {
      const aDate = safeDueDate(a.dueDate);
      const bDate = safeDueDate(b.dueDate);

      // If both have dates, compare them
      if (aDate && bDate) {
        const dateComparison = aDate.getTime() - bDate.getTime();
        if (dateComparison !== 0) {
          return direction === 'asc' ? dateComparison : -dateComparison;
        }

        // If dates are the same, compare times
        if (a.dueTime && b.dueTime) {
          const aTime = a.dueTime.split(':').map(Number);
          const bTime = b.dueTime.split(':').map(Number);
          const aMinutes = aTime[0] * 60 + aTime[1];
          const bMinutes = bTime[0] * 60 + bTime[1];
          const timeComparison = aMinutes - bMinutes;
          return direction === 'asc' ? timeComparison : -timeComparison;
        }

        // If one has time and the other doesn't, the one with time comes first
        if (a.dueTime && !b.dueTime) {return direction === 'asc' ? -1 : 1;}
        if (!a.dueTime && b.dueTime) {return direction === 'asc' ? 1 : -1;}
      }

      // If one has date and the other doesn't
      if (aDate && !bDate) {return direction === 'asc' ? -1 : 1;}
      if (!aDate && bDate) {return direction === 'asc' ? 1 : -1;}

      // If neither has date, sort by creation date
      try {
        const aCreated = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const bCreated = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        const createdComparison = aCreated.getTime() - bCreated.getTime();
        return direction === 'asc' ? createdComparison : -createdComparison;
      } catch (error) {
        return 0;
      }
    }),
};

export const getReminderStats = (reminders: Reminder[]) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  // Cache current time to prevent rapid fluctuations
  const nowTime = today.getTime();

  return {
    total: reminders.length,
    completed: reminders.filter(r => r.completed).length,
    pending: reminders.filter(r => !r.completed).length,
    overdue: reminders.filter(r => {
      if (r.completed) {return false;}

      try {
        // Use the timezone-aware overdue check with reminder object for recurring logic
        const { isOverdue } = require('./dateUtils');
        return isOverdue(r.dueDate, r.completed, r.dueTime, r);
      } catch (error) {
        // Fallback to date-only comparison with cached time
        const dueDate = safeDueDate(r.dueDate);
        if (!dueDate) {return false;}

        // Add a small buffer to prevent rapid state changes
        const bufferMs = 1000; // 1 second buffer
        return dueDate.getTime() < (nowTime - bufferMs);
      }
    }).length,
    today: reminders.filter(r => {
      const dueDateStr = getDateString(r.dueDate);
      return dueDateStr === todayStr;
    }).length,
    favorites: reminders.filter(r => r.isFavorite).length,
    byType: reminders.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
};

/**
 * Get delete confirmation modal props for recurring reminders
 */
export const getRecurringDeleteConfirmationProps = (
  reminder: Reminder,
  onDeleteSingle: () => void,
  onDeleteAll: () => void
): {
  visible: boolean;
  onClose: () => void;
  onConfirmRecurring: (deleteAll: boolean) => void;
  title: string;
  message: string;
  itemName: string;
  isRecurring: boolean;
  reminder: Reminder;
} => {
  return {
    visible: true,
    onClose: () => {}, // This will be handled by the component
    onConfirmRecurring: (deleteAll: boolean) => {
      if (deleteAll) {
        onDeleteAll();
      } else {
        onDeleteSingle();
      }
    },
    title: 'Delete Recurring Reminder',
    message: 'This is a recurring reminder. What would you like to delete?',
    itemName: reminder.title,
    isRecurring: true,
    reminder,
  };
};

/**
 * Check if a reminder is part of a recurring series
 */
export const isRecurringReminder = (reminder: Reminder): boolean => {
  return !!(reminder.isRecurring && reminder.recurringGroupId);
};

/**
 * Get the recurring pattern description for display
 */
export const getRecurringPatternDescription = (reminder: ExtendedReminder): string => {
  if (!reminder.isRecurring || !reminder.repeatPattern) {
    return '';
  }

  let description = '';

  switch (reminder.repeatPattern as RepeatPattern) {
    case 'daily':
      description = 'Daily';
      if (reminder.customInterval && reminder.customInterval > 1) {
        description = `Every ${reminder.customInterval} days`;
      }
      break;
    case 'weekdays':
      description = 'Weekdays (Mon-Fri)';
      break;
    case 'weekly':
      if (reminder.repeatDays && reminder.repeatDays.length > 0) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const selectedDays = reminder.repeatDays.map(day => dayNames[day]).join(', ');
        description = `Weekly on ${selectedDays}`;
      } else {
        description = 'Weekly';
      }
      if (reminder.customInterval && reminder.customInterval > 1) {
        description = `Every ${reminder.customInterval} weeks`;
      }
      break;
    case 'monthly':
      description = 'Monthly';
      if (reminder.customInterval && reminder.customInterval > 1) {
        description = `Every ${reminder.customInterval} months`;
      }
      break;
    case 'yearly':
      description = 'Yearly';
      if (reminder.customInterval && reminder.customInterval > 1) {
        description = `Every ${reminder.customInterval} years`;
      }
      break;
    case 'first_monday':
      description = 'First Monday of month';
      break;
    case 'last_friday':
      description = 'Last Friday of month';
      break;
    case 'custom':
      // Handle custom patterns with more detailed information
      if (reminder.customInterval) {
        const interval = reminder.customInterval;
        const frequencyType = reminder.customFrequencyType || 'daily'; // Default to daily if not specified

        // Check if it's a weekly pattern with specific days
        if (frequencyType === 'weekly' && reminder.repeatDays && reminder.repeatDays.length > 0) {
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const selectedDays = reminder.repeatDays.map(day => dayNames[day]).join(', ');

          if (interval === 1) {
            description = `Weekly on ${selectedDays}`;
          } else {
            description = `Every ${interval} weeks on ${selectedDays}`;
          }
        }
        // Check if it's a monthly pattern
        else if (frequencyType === 'monthly') {
          if (interval === 1) {
            description = 'Monthly';
          } else {
            description = `Every ${interval} months`;
          }
        }
        // Check if it's a yearly pattern
        else if (frequencyType === 'yearly') {
          if (interval === 1) {
            description = 'Yearly';
          } else {
            description = `Every ${interval} years`;
          }
        }
        // Default to daily pattern
        else {
          if (interval === 1) {
            description = 'Daily';
          } else {
            description = `Every ${interval} days`;
          }
        }
      } else {
        description = 'Custom';
      }
      break;
    default:
      // Handle legacy patterns that might not be in RepeatPattern type
      if ((reminder.repeatPattern as string) === 'hour' || (reminder.repeatPattern as string) === 'hourly') {
        description = 'Hourly';
        if (reminder.customInterval && reminder.customInterval > 1) {
          description = `Every ${reminder.customInterval} hours`;
        }
      } else {
        description = 'Recurring';
      }
  }

  // Add end date information if available
  if (reminder.recurringEndDate) {
    const endDate = safeDueDate(reminder.recurringEndDate);
    if (endDate) {
      const endDateStr = endDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: endDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      });
      description += ` until ${endDateStr}`;
    }
  }

  // Add start date information if it's different from creation
  if (reminder.recurringStartDate) {
    const startDate = safeDueDate(reminder.recurringStartDate);
    const createdDate = reminder.createdAt instanceof Date ? reminder.createdAt : new Date(reminder.createdAt);

    if (startDate && Math.abs(startDate.getTime() - createdDate.getTime()) > 24 * 60 * 60 * 1000) { // More than 1 day difference
      const startDateStr = startDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: startDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      });
      description += ` from ${startDateStr}`;
    }
  }

  return description;
};

/**
 * Clean reminder object by removing undefined values
 * This prevents Firestore errors when saving reminders
 */
export const cleanReminderForFirestore = (reminder: ReminderData): CleanedReminderData => {
  if (!reminder || typeof reminder !== 'object') {
    return reminder as CleanedReminderData;
  }

  const cleaned: CleanedReminderData = {};

  for (const [key, value] of Object.entries(reminder)) {
    // Skip undefined values
    if (value === undefined) {
      continue;
    }

    // Handle nested objects
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      const cleanedNested = cleanReminderForFirestore(value as ReminderData);
      // Only add if the nested object has properties
      if (Object.keys(cleanedNested).length > 0) {
        cleaned[key] = cleanedNested;
      }
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
};
