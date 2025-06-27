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

// Helper function to get date string for comparison
const getDateString = (dueDate: Date | string | undefined): string | null => {
  const date = safeDueDate(dueDate);
  if (!date) {return null;}
  try {
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.warn('Invalid dueDate for date string:', dueDate);
    return null;
  }
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
