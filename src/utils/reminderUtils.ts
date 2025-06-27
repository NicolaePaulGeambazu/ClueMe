import { Reminder } from '../services/firebaseService';

// Helper function to safely convert dueDate to Date object
const safeDueDate = (dueDate: Date | string | undefined): Date | null => {
  if (!dueDate) {return null;}
  if (dueDate instanceof Date) {return dueDate;}
  try {
    return new Date(dueDate);
  } catch (error) {
    console.warn('Invalid dueDate format:', dueDate);
    return null;
  }
};

// Helper function to get date string from dueDate
const getDateString = (dueDate: Date | string | undefined): string | null => {
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
export const calculateNextOccurrence = (currentDueDate: Date, repeatPattern: string, customInterval?: number): Date => {
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
      nextDate.setDate(nextDate.getDate() + 7);
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
      if (customInterval && customInterval > 0) {
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
  return dueDate <= now; // Generate next occurrence if due date has passed
};

// Generate the next occurrence of a recurring reminder
export const generateNextOccurrence = (reminder: Reminder): Partial<Reminder> | null => {
  if (!shouldGenerateNextOccurrence(reminder)) {
    return null;
  }
  
  const currentDueDate = safeDueDate(reminder.dueDate);
  if (!currentDueDate || !reminder.repeatPattern) {
    return null;
  }
  
  const nextDueDate = calculateNextOccurrence(currentDueDate, reminder.repeatPattern, reminder.customInterval);
  
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
      const dueDate = safeDueDate(r.dueDate);
      return dueDate && dueDate < new Date();
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

  byTitle: (reminders: Reminder[]) =>
    [...reminders].sort((a, b) => a.title.localeCompare(b.title)),

  byCreated: (reminders: Reminder[]) =>
    [...reminders].sort((a, b) => {
      try {
        return b.createdAt.getTime() - a.createdAt.getTime();
      } catch (error) {
        console.warn('Invalid createdAt for sorting:', { a: a.id, b: b.id, aDate: a.createdAt, bDate: b.createdAt });
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
      const dueDate = safeDueDate(r.dueDate);
      return dueDate && dueDate < today;
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
