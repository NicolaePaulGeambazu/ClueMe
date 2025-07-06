/**
 * Constants for the Reminder System
 * 
 * Centralized configuration and limits for the reminder functionality
 * All user-facing strings use translation keys for internationalization
 */

import { ReminderType, ReminderPriority, RepeatPattern, NotificationType } from './types';

// Form limits and constraints
export const FORM_LIMITS = {
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  LOCATION_MAX_LENGTH: 200,
  TAGS_MAX_COUNT: 10,
  TAGS_MAX_LENGTH: 20,
  ASSIGNED_TO_MAX_COUNT: 10,
  CUSTOM_INTERVAL_MIN: 1,
  CUSTOM_INTERVAL_MAX: 365,
  NOTIFICATION_TIMINGS_MAX_COUNT: 5,
  NOTIFICATION_VALUE_MAX: 10080, // 1 week in minutes
} as const;

// Default values
export const DEFAULTS = {
  PRIORITY: ReminderPriority.MEDIUM,
  TYPE: ReminderType.TASK,
  NOTIFICATION_TIMINGS: [
    {
      type: NotificationType.BEFORE,
      value: 15,
      labelKey: 'reminders.notifications.15MinutesBefore'
    }
  ],
  CUSTOM_INTERVAL: 7,
  REPEAT_DAYS: [1, 2, 3, 4, 5], // Monday to Friday
} as const;

// Recurring patterns configuration
export const RECURRING_PATTERNS = {
  [RepeatPattern.DAILY]: {
    labelKey: 'reminders.recurring.daily.label',
    descriptionKey: 'reminders.recurring.daily.description',
    icon: 'calendar-day',
    smartNudgeKey: 'reminders.recurring.daily.smartNudge'
  },
  [RepeatPattern.WEEKDAYS]: {
    labelKey: 'reminders.recurring.weekdays.label',
    descriptionKey: 'reminders.recurring.weekdays.description',
    icon: 'calendar-week',
    smartNudgeKey: 'reminders.recurring.weekdays.smartNudge'
  },
  [RepeatPattern.WEEKLY]: {
    labelKey: 'reminders.recurring.weekly.label',
    descriptionKey: 'reminders.recurring.weekly.description',
    icon: 'calendar-week',
    smartNudgeKey: 'reminders.recurring.weekly.smartNudge'
  },
  [RepeatPattern.MONTHLY]: {
    labelKey: 'reminders.recurring.monthly.label',
    descriptionKey: 'reminders.recurring.monthly.description',
    icon: 'calendar-month',
    smartNudgeKey: 'reminders.recurring.monthly.smartNudge'
  },
  [RepeatPattern.YEARLY]: {
    labelKey: 'reminders.recurring.yearly.label',
    descriptionKey: 'reminders.recurring.yearly.description',
    icon: 'calendar-year',
    smartNudgeKey: 'reminders.recurring.yearly.smartNudge'
  },
  [RepeatPattern.FIRST_MONDAY]: {
    labelKey: 'reminders.recurring.firstMonday.label',
    descriptionKey: 'reminders.recurring.firstMonday.description',
    icon: 'calendar-month',
    smartNudgeKey: 'reminders.recurring.firstMonday.smartNudge'
  },
  [RepeatPattern.LAST_FRIDAY]: {
    labelKey: 'reminders.recurring.lastFriday.label',
    descriptionKey: 'reminders.recurring.lastFriday.description',
    icon: 'calendar-month',
    smartNudgeKey: 'reminders.recurring.lastFriday.smartNudge'
  },
  [RepeatPattern.CUSTOM]: {
    labelKey: 'reminders.recurring.custom.label',
    descriptionKey: 'reminders.recurring.custom.description',
    icon: 'settings',
    smartNudgeKey: 'reminders.recurring.custom.smartNudge'
  }
} as const;

// Priority configuration
export const PRIORITY_CONFIG = {
  [ReminderPriority.LOW]: {
    labelKey: 'reminders.priority.low.label',
    color: '#10B981', // Green
    icon: 'arrow-down',
    descriptionKey: 'reminders.priority.low.description'
  },
  [ReminderPriority.MEDIUM]: {
    labelKey: 'reminders.priority.medium.label',
    color: '#F59E0B', // Yellow
    icon: 'minus',
    descriptionKey: 'reminders.priority.medium.description'
  },
  [ReminderPriority.HIGH]: {
    labelKey: 'reminders.priority.high.label',
    color: '#EF4444', // Red
    icon: 'arrow-up',
    descriptionKey: 'reminders.priority.high.description'
  }
} as const;

// Reminder type configuration
export const REMINDER_TYPE_CONFIG = {
  [ReminderType.TASK]: {
    labelKey: 'reminders.types.task.label',
    icon: 'check-square',
    color: '#3B82F6',
    descriptionKey: 'reminders.types.task.description'
  },
  [ReminderType.EVENT]: {
    labelKey: 'reminders.types.event.label',
    icon: 'calendar',
    color: '#8B5CF6',
    descriptionKey: 'reminders.types.event.description'
  },
  [ReminderType.NOTE]: {
    labelKey: 'reminders.types.note.label',
    icon: 'file-text',
    color: '#10B981',
    descriptionKey: 'reminders.types.note.description'
  },
  [ReminderType.REMINDER]: {
    labelKey: 'reminders.types.reminder.label',
    icon: 'bell',
    color: '#F59E0B',
    descriptionKey: 'reminders.types.reminder.description'
  },
  [ReminderType.BILL]: {
    labelKey: 'reminders.types.bill.label',
    icon: 'credit-card',
    color: '#EF4444',
    descriptionKey: 'reminders.types.bill.description'
  },
  [ReminderType.MED]: {
    labelKey: 'reminders.types.medication.label',
    icon: 'pill',
    color: '#EC4899',
    descriptionKey: 'reminders.types.medication.description'
  }
} as const;

// Notification timing presets
export const NOTIFICATION_PRESETS = [
  {
    id: 'just-in-time',
    labelKey: 'reminders.notifications.presets.justInTime.label',
    descriptionKey: 'reminders.notifications.presets.justInTime.description',
    timings: [
      { type: NotificationType.EXACT, value: 0, labelKey: 'reminders.notifications.exactlyOnTime' }
    ]
  },
  {
    id: 'early-warning',
    labelKey: 'reminders.notifications.presets.earlyWarning.label',
    descriptionKey: 'reminders.notifications.presets.earlyWarning.description',
    timings: [
      { type: NotificationType.BEFORE, value: 15, labelKey: 'reminders.notifications.15MinutesBefore' }
    ]
  },
  {
    id: 'well-prepared',
    labelKey: 'reminders.notifications.presets.wellPrepared.label',
    descriptionKey: 'reminders.notifications.presets.wellPrepared.description',
    timings: [
      { type: NotificationType.BEFORE, value: 60, labelKey: 'reminders.notifications.1HourBefore' },
      { type: NotificationType.BEFORE, value: 15, labelKey: 'reminders.notifications.15MinutesBefore' }
    ]
  },
  {
    id: 'day-ahead',
    labelKey: 'reminders.notifications.presets.dayAhead.label',
    descriptionKey: 'reminders.notifications.presets.dayAhead.description',
    timings: [
      { type: NotificationType.BEFORE, value: 1440, labelKey: 'reminders.notifications.1DayBefore' },
      { type: NotificationType.BEFORE, value: 60, labelKey: 'reminders.notifications.1HourBefore' }
    ]
  },
  {
    id: 'custom',
    labelKey: 'reminders.notifications.presets.custom.label',
    descriptionKey: 'reminders.notifications.presets.custom.description',
    timings: []
  }
] as const;

// Day of week configuration
export const DAYS_OF_WEEK = [
  { value: 0, labelKey: 'common.days.sunday', shortKey: 'common.days.sun', icon: 'sun' },
  { value: 1, labelKey: 'common.days.monday', shortKey: 'common.days.mon', icon: 'moon' },
  { value: 2, labelKey: 'common.days.tuesday', shortKey: 'common.days.tue', icon: 'moon' },
  { value: 3, labelKey: 'common.days.wednesday', shortKey: 'common.days.wed', icon: 'moon' },
  { value: 4, labelKey: 'common.days.thursday', shortKey: 'common.days.thu', icon: 'moon' },
  { value: 5, labelKey: 'common.days.friday', shortKey: 'common.days.fri', icon: 'moon' },
  { value: 6, labelKey: 'common.days.saturday', shortKey: 'common.days.sat', icon: 'sun' }
] as const;

// Time intervals for custom recurring
export const TIME_INTERVALS = [
  { value: 1, labelKey: 'reminders.intervals.1Day' },
  { value: 2, labelKey: 'reminders.intervals.2Days' },
  { value: 3, labelKey: 'reminders.intervals.3Days' },
  { value: 7, labelKey: 'reminders.intervals.1Week' },
  { value: 14, labelKey: 'reminders.intervals.2Weeks' },
  { value: 30, labelKey: 'reminders.intervals.1Month' },
  { value: 60, labelKey: 'reminders.intervals.2Months' },
  { value: 90, labelKey: 'reminders.intervals.3Months' },
  { value: 180, labelKey: 'reminders.intervals.6Months' },
  { value: 365, labelKey: 'reminders.intervals.1Year' }
] as const;

// Common notification intervals
export const NOTIFICATION_INTERVALS = [
  { value: 1, labelKey: 'reminders.notifications.intervals.1Minute' },
  { value: 5, labelKey: 'reminders.notifications.intervals.5Minutes' },
  { value: 15, labelKey: 'reminders.notifications.intervals.15Minutes' },
  { value: 30, labelKey: 'reminders.notifications.intervals.30Minutes' },
  { value: 60, labelKey: 'reminders.notifications.intervals.1Hour' },
  { value: 120, labelKey: 'reminders.notifications.intervals.2Hours' },
  { value: 240, labelKey: 'reminders.notifications.intervals.4Hours' },
  { value: 480, labelKey: 'reminders.notifications.intervals.8Hours' },
  { value: 1440, labelKey: 'reminders.notifications.intervals.1Day' },
  { value: 2880, labelKey: 'reminders.notifications.intervals.2Days' },
  { value: 10080, labelKey: 'reminders.notifications.intervals.1Week' }
] as const;

// Error message keys
export const ERROR_MESSAGE_KEYS = {
  REQUIRED_FIELD: 'validation.required',
  INVALID_DATE: 'validation.invalidDate',
  INVALID_TIME: 'validation.invalidTime',
  INVALID_DATE_RANGE: 'validation.invalidDateRange',
  INVALID_DUE_DATE: 'validation.invalidDueDate',
  PAST_DATE: 'validation.pastDate',
  DUPLICATE_TIMINGS: 'validation.duplicateTimings',
  TOO_MANY_ASSIGNMENTS: 'validation.tooManyAssignments',
  TOO_MANY_TAGS: 'validation.tooManyTags',
  TOO_MANY_NOTIFICATIONS: 'validation.tooManyNotifications',
  INVALID_INTERVAL: 'validation.invalidInterval',
  NO_REPEAT_DAYS: 'validation.noRepeatDays',
  NETWORK_ERROR: 'errors.network',
  SAVE_ERROR: 'errors.save',
  DELETE_ERROR: 'errors.delete',
  NOTIFICATION_ERROR: 'errors.notification',
  RECURRING_ERROR: 'errors.recurring',
} as const;

// Warning message keys
export const WARNING_MESSAGE_KEYS = {
  PAST_DUE_DATE: 'warnings.pastDueDate',
  LONG_INTERVAL: 'warnings.longInterval',
  MANY_NOTIFICATIONS: 'warnings.manyNotifications',
  LONG_NOTIFICATION: 'warnings.longNotification',
  COMPLETED_REMINDER: 'warnings.completedReminder',
  CANCELLED_REMINDER: 'warnings.cancelledReminder',
  DELETING_COMPLETED: 'warnings.deletingCompleted',
  UPDATING_COMPLETED: 'warnings.updatingCompleted',
} as const;

// Success message keys
export const SUCCESS_MESSAGE_KEYS = {
  REMINDER_CREATED: 'success.reminderCreated',
  REMINDER_UPDATED: 'success.reminderUpdated',
  REMINDER_DELETED: 'success.reminderDeleted',
  REMINDER_COMPLETED: 'success.reminderCompleted',
  REMINDER_CANCELLED: 'success.reminderCancelled',
  NOTIFICATIONS_SCHEDULED: 'success.notificationsScheduled',
  RECURRING_CREATED: 'success.recurringCreated',
} as const;

// Performance and caching constants
export const PERFORMANCE = {
  MAX_OCCURRENCES_GENERATED: 50,
  MAX_NOTIFICATIONS_PER_REMINDER: 5,
  CACHE_DURATION_MS: 5 * 60 * 1000, // 5 minutes
  DEBOUNCE_DELAY_MS: 300,
  THROTTLE_DELAY_MS: 1000,
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
} as const;

// Background job constants
export const BACKGROUND_JOBS = {
  REMINDER_CHECK_INTERVAL_MS: 15 * 60 * 1000, // 15 minutes
  NOTIFICATION_CLEANUP_INTERVAL_MS: 60 * 60 * 1000, // 1 hour
  DATA_SYNC_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
  MAX_BACKGROUND_DURATION_MS: 30 * 1000, // 30 seconds
} as const;

// UI constants
export const UI = {
  ANIMATION_DURATION_MS: 300,
  TOAST_DURATION_MS: 3000,
  LOADING_TIMEOUT_MS: 10000,
  PULL_TO_REFRESH_TIMEOUT_MS: 5000,
  INFINITE_SCROLL_THRESHOLD: 10,
  SEARCH_DEBOUNCE_MS: 500,
  AUTO_SAVE_DELAY_MS: 2000,
} as const; 