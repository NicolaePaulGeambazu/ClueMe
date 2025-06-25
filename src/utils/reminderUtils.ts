import { Reminder } from '../services/mockData';

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
    reminders.filter(r => !r.completed && r.dueDate && r.dueDate < new Date().toISOString().split('T')[0]),
  
  byToday: (reminders: Reminder[]) => 
    reminders.filter(r => r.dueDate === new Date().toISOString().split('T')[0]),
  
  bySearch: (reminders: Reminder[], query: string) => {
    const searchTerm = query.toLowerCase();
    return reminders.filter(reminder =>
      reminder.title.toLowerCase().includes(searchTerm) ||
      reminder.description?.toLowerCase().includes(searchTerm) ||
      reminder.location?.toLowerCase().includes(searchTerm) ||
      reminder.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }
};

export const sortReminders = {
  byDueDate: (reminders: Reminder[], direction: 'asc' | 'desc' = 'asc') => 
    [...reminders].sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      
      return direction === 'asc' 
        ? a.dueDate.localeCompare(b.dueDate)
        : b.dueDate.localeCompare(a.dueDate);
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
    [...reminders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
};

export const getReminderStats = (reminders: Reminder[]) => {
  const today = new Date().toISOString().split('T')[0];
  
  return {
    total: reminders.length,
    completed: reminders.filter(r => r.completed).length,
    pending: reminders.filter(r => !r.completed).length,
    overdue: reminders.filter(r => !r.completed && r.dueDate && r.dueDate < today).length,
    today: reminders.filter(r => r.dueDate === today).length,
    favorites: reminders.filter(r => r.isFavorite).length,
    byType: reminders.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };
};