/**
 * Core Reminder Types
 *
 * All reminder-related types are centralized here for consistency
 * and better type safety across the application.
 */

import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// Base reminder interface
export interface Reminder {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: ReminderType;
  priority: ReminderPriority;
  status: ReminderStatus;

  // Date and time fields
  dueDate?: Date;
  dueTime?: string;
  startDate?: Date;
  startTime?: string;
  endDate?: Date;
  endTime?: string;

  // Location and metadata
  location?: string;
  tags?: string[];
  isFavorite?: boolean;

  // Recurring fields
  isRecurring?: boolean;
  repeatPattern?: RepeatPattern;
  customInterval?: number;
  repeatDays?: number[]; // Days of week (0=Sunday, 1=Monday, ...)
  recurringStartDate?: Date;
  recurringEndDate?: Date;
  recurringEndAfter?: number; // Number of occurrences before ending (optional)
  recurringGroupId?: string; // ID to group related recurring reminders together

  // Notification fields - Updated for premium features
  hasNotification?: boolean;
  notificationTimings?: NotificationTiming[];
  notificationTimes?: number[]; // Legacy field for backward compatibility (minutes before due)

  // Premium feature flags
  isPremiumFeature?: boolean; // Indicates if this reminder uses premium features

  // Assignment fields
  assignedTo?: string[];
  assignedBy?: string;

  // Family sharing fields
  sharedWithFamily?: boolean;
  sharedForEditing?: boolean;
  familyId?: string;

  // Task chunking fields - ADHD-friendly feature
  isChunked?: boolean; // Indicates if this task has been broken down into sub-tasks
  subTasks?: SubTask[]; // Array of sub-tasks
  parentTaskId?: string; // ID of parent task (for sub-tasks)
  chunkedProgress?: number; // Progress percentage (0-100) for chunked tasks

  // System fields
  completed?: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Enums for better type safety
export enum ReminderType {
  TASK = 'task',
  EVENT = 'event',
  NOTE = 'note',
  REMINDER = 'reminder',
  BILL = 'bill',
  MED = 'med',
}

export enum ReminderPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum ReminderStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum RepeatPattern {
  DAILY = 'daily',
  WEEKDAYS = 'weekdays',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  FIRST_MONDAY = 'first_monday',
  LAST_FRIDAY = 'last_friday',
  CUSTOM = 'custom',
}

export enum NotificationType {
  EXACT = 'exact',
  BEFORE = 'before',
  AFTER = 'after',
}

// Sub-task interface for task chunking
export interface SubTask {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  order: number; // For maintaining sub-task order
  estimatedMinutes?: number; // Estimated time to complete
  createdAt: Date;
  updatedAt: Date;
}

// Notification timing interface
export interface NotificationTiming {
  type: NotificationType;
  value: number; // minutes before/after due time, or 0 for exact
  label?: string; // Human-readable label (legacy)
  labelKey?: string; // Translation key for the label (new)
}

// Form data interface for creating/editing reminders
export interface ReminderFormData {
  title: string;
  description: string;
  type: ReminderType;
  priority: ReminderPriority;
  dueDate?: string; // ISO date string
  dueTime?: string; // HH:mm format
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  location: string;
  tags: string[];
  isFavorite: boolean;
  hasNotification: boolean;
  notificationTimings: NotificationTiming[];
  isRecurring: boolean;
  repeatPattern?: RepeatPattern;
  customInterval?: number;
  repeatDays?: number[];
  recurringStartDate?: Date;
  recurringEndDate?: Date;
  assignedTo: string[];

  // Task chunking fields
  isChunked?: boolean;
  subTasks?: SubTask[];
  parentTaskId?: string;
  chunkedProgress?: number;
}

// Recurring occurrence interface
export interface RecurringOccurrence {
  date: Date;
  reminder: Reminder;
  isNext: boolean;
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Reminder filter interface
export interface ReminderFilter {
  type?: ReminderType;
  priority?: ReminderPriority;
  status?: ReminderStatus;
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  assignedTo?: string[];
  isRecurring?: boolean;
  hasNotifications?: boolean;
}

// Reminder sort options
export interface ReminderSort {
  field: 'dueDate' | 'priority' | 'createdAt' | 'title' | 'type';
  direction: 'asc' | 'desc';
}

// Firebase-specific types
export interface FirebaseReminder extends Omit<Reminder, 'dueDate' | 'startDate' | 'endDate' | 'recurringStartDate' | 'recurringEndDate' | 'deletedAt' | 'createdAt' | 'updatedAt'> {
  dueDate?: FirebaseFirestoreTypes.Timestamp;
  startDate?: FirebaseFirestoreTypes.Timestamp;
  endDate?: FirebaseFirestoreTypes.Timestamp;
  recurringStartDate?: FirebaseFirestoreTypes.Timestamp;
  recurringEndDate?: FirebaseFirestoreTypes.Timestamp;
  deletedAt?: FirebaseFirestoreTypes.Timestamp;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
}

// Component props interfaces
export interface ReminderFormProps {
  initialData?: Partial<ReminderFormData>;
  onSubmit: (data: ReminderFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

export interface RecurringOptionsProps {
  isRecurring: boolean;
  onRecurringChange: (recurring: boolean) => void;
  repeatPattern?: RepeatPattern;
  onRepeatPatternChange: (pattern: RepeatPattern) => void;
  customInterval?: number;
  onCustomIntervalChange: (interval: number) => void;
  repeatDays?: number[];
  onRepeatDaysChange: (days: number[]) => void;
  recurringStartDate?: Date;
  onRecurringStartDateChange: (date: Date | undefined) => void;
  recurringEndDate?: Date;
  onRecurringEndDateChange: (date: Date | undefined) => void;
  onDatePickerOpen: (mode: 'start' | 'end') => void;
}

export interface NotificationSettingsProps {
  hasNotification: boolean;
  onNotificationChange: (enabled: boolean) => void;
  notificationTimings: NotificationTiming[];
  onNotificationTimingsChange: (timings: NotificationTiming[]) => void;
  onTimingSelectorOpen: () => void;
}

export interface ReminderCardProps {
  reminder: Reminder;
  onPress?: (reminder: Reminder) => void;
  onLongPress?: (reminder: Reminder) => void;
  onComplete?: (reminder: Reminder) => void;
  onEdit?: (reminder: Reminder) => void;
  onDelete?: (reminder: Reminder) => void;
  showActions?: boolean;
  compact?: boolean;
}

export interface ReminderListProps {
  reminders: Reminder[];
  onReminderPress?: (reminder: Reminder) => void;
  onReminderLongPress?: (reminder: Reminder) => void;
  onReminderComplete?: (reminder: Reminder) => void;
  onReminderEdit?: (reminder: Reminder) => void;
  onReminderDelete?: (reminder: Reminder) => void;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  isLoading?: boolean;
  isRefreshing?: boolean;
  hasMore?: boolean;
  emptyMessage?: string;
  filter?: ReminderFilter;
  sort?: ReminderSort;
}
