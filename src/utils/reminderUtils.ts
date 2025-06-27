import { Reminder } from '../services/firebaseService';

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
    reminders.filter(r => !r.completed && r.dueDate && r.dueDate < new Date()),
  
  byToday: (reminders: Reminder[]) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    return reminders.filter(r => {
      if (!r.dueDate) return false;
      try {
        return r.dueDate.toISOString().split('T')[0] === todayStr;
      } catch (error) {
        console.warn('Invalid dueDate for reminder:', r.id, r.dueDate);
        return false;
      }
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
  }
};

export const sortReminders = {
  byDueDate: (reminders: Reminder[], direction: 'asc' | 'desc' = 'asc') => 
    [...reminders].sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      
      try {
        return direction === 'asc' 
          ? a.dueDate.getTime() - b.dueDate.getTime()
          : b.dueDate.getTime() - a.dueDate.getTime();
      } catch (error) {
        console.warn('Invalid dueDate for sorting:', { a: a.id, b: b.id, aDate: a.dueDate, bDate: b.dueDate });
        return 0;
      }
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
    })
};

export const getReminderStats = (reminders: Reminder[]) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  return {
    total: reminders.length,
    completed: reminders.filter(r => r.completed).length,
    pending: reminders.filter(r => !r.completed).length,
    overdue: reminders.filter(r => !r.completed && r.dueDate && r.dueDate < today).length,
    today: reminders.filter(r => {
      if (!r.dueDate) return false;
      try {
        return r.dueDate.toISOString().split('T')[0] === todayStr;
      } catch (error) {
        console.warn('Invalid dueDate for stats:', r.id, r.dueDate);
        return false;
      }
    }).length,
    favorites: reminders.filter(r => r.isFavorite).length,
    byType: reminders.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };
};