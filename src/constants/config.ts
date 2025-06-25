export const APP_CONFIG = {
  name: 'ClearCue',
  version: '1.0.0',
  description: 'Beautiful, intuitive reminder app',
  support: {
    email: 'support@clearcue.app',
    website: 'https://clearcue.app'
  }
};

export const REMINDER_TYPES = [
  { id: 'task', label: 'Task', color: '#3B82F6', icon: '✓', description: 'General tasks' },
  { id: 'bill', label: 'Bill', color: '#EF4444', icon: '💳', description: 'Bills & payments' },
  { id: 'med', label: 'Medicine', color: '#10B981', icon: '💊', description: 'Health & meds' },
  { id: 'event', label: 'Event', color: '#8B5CF6', icon: '📅', description: 'Meetings & events' },
  { id: 'note', label: 'Note', color: '#F59E0B', icon: '📝', description: 'Notes & ideas' },
] as const;

export const PRIORITIES = [
  { id: 'low', label: 'Low', color: '#6B7280' },
  { id: 'medium', label: 'Medium', color: '#F59E0B' },
  { id: 'high', label: 'High', color: '#EF4444' },
] as const;

export const RECURRENCE_TYPES = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
] as const;

export const QUICK_TIMES = [
  { label: 'Morning', value: '09:00' },
  { label: 'Afternoon', value: '14:00' },
  { label: 'Evening', value: '18:00' },
  { label: 'Night', value: '21:00' },
] as const;

export const QUICK_DATES = [
  { label: 'Today', value: 0 },
  { label: 'Tomorrow', value: 1 },
  { label: 'This Weekend', value: 6 },
  { label: 'Next Week', value: 7 },
] as const;

export const NOTIFICATION_TIMES = [
  { label: 'At time of event', value: 0 },
  { label: '5 minutes before', value: 5 },
  { label: '15 minutes before', value: 15 },
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '1 day before', value: 1440 },
] as const;