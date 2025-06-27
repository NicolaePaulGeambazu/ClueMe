import { Colors } from './Colors';

export const APP_NAME = 'ClearCue';
export const APP_VERSION = '1.0.0';

// Default task types will now be loaded from Firebase
// These are fallback values in case Firebase is not available
export const FALLBACK_TASK_TYPES = [
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

export const NOTIFICATION_TYPES = [
  { id: 'push', label: 'Push Notification' },
  { id: 'email', label: 'Email' },
  { id: 'sms', label: 'SMS' },
] as const;

export const QUICK_DATES = [
  { label: 'Today', value: 0 },
  { label: 'Tomorrow', value: 1 },
  { label: 'This Weekend', value: 6 },
  { label: 'Next Week', value: 7 },
] as const;

export const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  NOTIFICATIONS: 'notifications',
  FIRST_LAUNCH: 'first_launch',
  ANONYMOUS_ID: 'anonymous_id',
} as const;

export const API_ENDPOINTS = {
  BASE_URL: 'https://api.clearcue.com',
  AUTH: '/auth',
  REMINDERS: '/reminders',
  USERS: '/users',
  FAMILIES: '/families',
} as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTH_ERROR: 'Authentication failed. Please try again.',
  PERMISSION_ERROR: 'You don\'t have permission to perform this action.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

export const SUCCESS_MESSAGES = {
  REMINDER_CREATED: 'Reminder created successfully!',
  REMINDER_UPDATED: 'Reminder updated successfully!',
  REMINDER_DELETED: 'Reminder deleted successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
} as const;
