import { Reminder } from '../services/firebaseService';
import { isOverdue } from './dateUtils';

// Helper function to safely convert dueDate to Date object
const safeDueDate = (dueDate: Date | string | undefined | any): Date | null => {
  if (!dueDate) {return null;}
  if (dueDate instanceof Date) {return dueDate;}
  
  // Handle Firestore Timestamp objects
  if (dueDate && typeof dueDate === 'object' && 'toDate' in dueDate && typeof dueDate.toDate === 'function') {
    try {
      return dueDate.toDate();
    } catch (error) {
      console.warn('Error converting Firestore timestamp:', error);
      return null;
    }
  }
  
  // Handle Firestore timestamp objects with seconds/nanoseconds
  if (dueDate && typeof dueDate === 'object' && 'seconds' in dueDate) {
    try {
      const seconds = dueDate.seconds || 0;
      const nanoseconds = dueDate.nanoseconds || 0;
      return new Date(seconds * 1000 + nanoseconds / 1000000);
    } catch (error) {
      console.warn('Error converting Firestore timestamp object:', error);
      return null;
    }
  }
  
  try {
    return new Date(dueDate);
  } catch (error) {
    console.warn('Invalid dueDate format:', dueDate);
    return null;
  }
};

// Helper function to get date string from dueDate
const getDateString = (dueDate: Date | string | undefined | any): string | null => {
  const date = safeDueDate(dueDate);
  if (!date) {return null;}
  try {
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.warn('Error converting date to string:', error);
    return null;
  }
};

// Calculate the next occurrence date based on repeat pattern
export const calculateNextOccurrence = (currentDueDate: Date, repeatPattern: string, customInterval?: number, repeatDays?: number[]): Date => {
  const nextDate = new Date(currentDueDate);
  
  switch (repeatPattern) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
      
    case 'weekdays':
      // Skip to next weekday (Monday-Friday)
      do {
        nextDate.setDate(nextDate.getDate() + 1);
      } while (nextDate.getDay() === 0 || nextDate.getDay() === 6); // Skip weekends
      break;
      
    case 'weekly':
      if (repeatDays && repeatDays.length > 0) {
        // Find the next date that matches one of the repeatDays
        let found = false;
        for (let i = 1; i <= 7; i++) {
          nextDate.setDate(currentDueDate.getDate() + i);
          if (repeatDays.includes(nextDate.getDay())) {
            found = true;
            break;
          }
        }
        if (!found) {
          // Fallback: add 7 days
          nextDate.setDate(currentDueDate.getDate() + 7);
        }
      } else {
        nextDate.setDate(nextDate.getDate() + 7);
      }
      break;
      
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
      
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
      
    case 'first_monday':
      // Move to first Monday of next month
      nextDate.setMonth(nextDate.getMonth() + 1);
      nextDate.setDate(1);
      while (nextDate.getDay() !== 1) { // 1 = Monday
        nextDate.setDate(nextDate.getDate() + 1);
      }
      break;
      
    case 'last_friday':
      // Move to last Friday of next month
      nextDate.setMonth(nextDate.getMonth() + 1);
      nextDate.setDate(1);
      // Go to last day of month
      nextDate.setMonth(nextDate.getMonth() + 1, 0);
      // Go back to last Friday
      while (nextDate.getDay() !== 5) { // 5 = Friday
        nextDate.setDate(nextDate.getDate() - 1);
      }
      break;
      
    case 'custom':
      // For custom patterns, we need to use the customFrequencyType to determine the interval
      // This will be handled by the calling function that passes the frequency type
      if (customInterval && customInterval > 0) {
        // Default to daily if no frequency type is specified
        nextDate.setDate(nextDate.getDate() + customInterval);
      } else {
        nextDate.setDate(nextDate.getDate() + 1); // Default to daily
      }
      break;
      
    default:
      nextDate.setDate(nextDate.getDate() + 1); // Default to daily
  }
  
  return nextDate;
};

// Check if a reminder should generate the next occurrence
export const shouldGenerateNextOccurrence = (reminder: Reminder): boolean => {
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
export const generateNextOccurrence = (reminder: Reminder): Partial<Reminder> | null => {
  console.log('🔄 Checking if should generate next occurrence for:', reminder.title);
  console.log('📅 Current due date:', reminder.dueDate);
  console.log('📅 End date:', reminder.recurringEndDate);
  console.log('🔄 Pattern:', reminder.repeatPattern);
  console.log('🔄 Custom frequency type:', reminder.customFrequencyType);
  
  if (!shouldGenerateNextOccurrence(reminder)) {
    console.log('❌ Should not generate next occurrence');
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
    const tempReminder = { ...reminder, repeatPattern: reminder.customFrequencyType };
    nextDueDate = calculateNextOccurrence(currentDueDate, reminder.customFrequencyType, reminder.customInterval, reminder.repeatDays);
  } else {
    // Handle standard patterns
    nextDueDate = calculateNextOccurrence(currentDueDate, reminder.repeatPattern, reminder.customInterval, reminder.repeatDays);
  }
  
  // Check if the next occurrence would be past the end date
  if (reminder.recurringEndDate) {
    const endDate = safeDueDate(reminder.recurringEndDate);
    console.log('📅 Next due date would be:', nextDueDate);
    console.log('📅 End date is:', endDate);
    if (endDate && nextDueDate > endDate) {
      console.log('❌ Next occurrence would be past end date, stopping generation');
      return null; // Don't generate if it would be past the end date
    }
  }
  
  return {
    title: reminder.title,
    description: reminder.description,
    type: reminder.type,
    priority: reminder.priority,
    dueDate: nextDueDate,
    dueTime: reminder.dueTime,
    location: reminder.location,
    isFavorite: reminder.isFavorite,
    isRecurring: reminder.isRecurring,
    repeatPattern: reminder.repeatPattern,
    customInterval: reminder.customInterval,
    hasNotification: reminder.hasNotification,
    notificationTimings: reminder.notificationTimings,
    assignedTo: reminder.assignedTo,
    tags: reminder.tags,
    completed: false,
    status: 'pending',
    userId: reminder.userId,
    repeatDays: (reminder as any).repeatDays,
    recurringStartDate: reminder.recurringStartDate,
    recurringEndDate: reminder.recurringEndDate,
  };
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

  byOverdue: (reminders: Reminder[]) =>
    reminders.filter(r => {
      if (r.completed) {return false;}
      
      try {
        // Use the timezone-aware overdue check with reminder object for recurring logic
        const { isOverdue } = require('./dateUtils');
        return isOverdue(r.dueDate, r.completed, r.dueTime, r);
      } catch (error) {
        console.warn('Error checking if reminder is overdue:', error);
        // Fallback to date-only comparison
        const dueDate = safeDueDate(r.dueDate);
        return dueDate && dueDate < new Date();
      }
    }),

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
        console.warn('Invalid createdAt for sorting:', { a: a.id, b: b.id, aDate: a.createdAt, bDate: b.createdAt });
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
        if (a.dueTime && !b.dueTime) return direction === 'asc' ? -1 : 1;
        if (!a.dueTime && b.dueTime) return direction === 'asc' ? 1 : -1;
      }

      // If one has date and the other doesn't
      if (aDate && !bDate) return direction === 'asc' ? -1 : 1;
      if (!aDate && bDate) return direction === 'asc' ? 1 : -1;

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
        console.warn('Error checking if reminder is overdue:', error);
        // Fallback to date-only comparison
        const dueDate = safeDueDate(r.dueDate);
        return dueDate && dueDate < today;
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
 * Show confirmation dialog for deleting recurring reminders
 */
export const showRecurringDeleteConfirmation = (
  reminder: Reminder,
  onDeleteSingle: () => void,
  onDeleteAll: () => void
): void => {
  const { Alert } = require('react-native');
  
  Alert.alert(
    'Delete Recurring Reminder',
    `"${reminder.title}" is a recurring reminder. What would you like to delete?`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'This Occurrence Only',
        onPress: onDeleteSingle,
      },
      {
        text: 'Delete All Future',
        style: 'destructive',
        onPress: onDeleteAll,
      },
    ]
  );
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
export const getRecurringPatternDescription = (reminder: Reminder): string => {
  console.log('🔍 getRecurringPatternDescription called with:', {
    id: reminder.id,
    isRecurring: reminder.isRecurring,
    repeatPattern: reminder.repeatPattern,
    customInterval: reminder.customInterval,
    recurringEndDate: reminder.recurringEndDate,
    recurringEndAfter: reminder.recurringEndAfter
  });
  
  if (!reminder.isRecurring || !reminder.repeatPattern) {
    console.log('❌ Not recurring or no pattern');
    return '';
  }

  let description = '';

  switch (reminder.repeatPattern) {
    case 'hour':
    case 'hourly':
      description = 'Hourly';
      if (reminder.customInterval && reminder.customInterval > 1) {
        description = `Every ${reminder.customInterval} hours`;
      }
      break;
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
      description = 'Recurring';
  }

  // Add end date information if available
  if (reminder.recurringEndDate) {
    const endDate = safeDueDate(reminder.recurringEndDate);
    if (endDate) {
      const endDateStr = endDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: endDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
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
        year: startDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      });
      description += ` from ${startDateStr}`;
    }
  }

  return description;
};
