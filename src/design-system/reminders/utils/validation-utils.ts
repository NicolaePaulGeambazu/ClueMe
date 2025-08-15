/**
 * Validation Utilities for Reminders
 *
 * Comprehensive validation covering all edge cases and user behaviors
 */

import {
  Reminder,
  ReminderFormData,
  ValidationResult,
  ReminderType,
  ReminderPriority,
  RepeatPattern,
  NotificationType,
  ReminderStatus,
} from '../types';
import {
  normalizeDate,
  isPast,
  isFuture,
  isValidDateString,
  isValidTimeString,
  parseTimeString,
  getCurrentDateString,
  getCurrentTimeString,
} from './date-utils';
import { validateRecurringConfig } from './recurring-utils';
import { validateNotificationConfig } from './notification-utils';
import analyticsService from '../../../services/analyticsService';

/**
 * Validate a complete reminder form
 */
export const validateReminderForm = (data: ReminderFormData): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Title validation
  if (!data.title || data.title.trim().length === 0) {
    errors.push('Title is required');
  } else if (data.title.trim().length > 100) {
    errors.push('Title must be 100 characters or less');
  }

  // Description validation
  if (data.description && data.description.length > 500) {
    errors.push('Description must be 500 characters or less');
  }

  // Type validation
  if (!Object.values(ReminderType).includes(data.type)) {
    errors.push('Invalid reminder type');
  }

  // Priority validation
  if (!Object.values(ReminderPriority).includes(data.priority)) {
    errors.push('Invalid priority level');
  }

  // Date and time validation
  const dateTimeValidation = validateDateTimeFields(data);
  errors.push(...dateTimeValidation.errors);
  warnings.push(...dateTimeValidation.warnings);

  // Recurring validation
  if (data.isRecurring) {
    const recurringValidation = validateRecurringFields(data);
    errors.push(...recurringValidation.errors);
    warnings.push(...recurringValidation.warnings);
  }

  // Notification validation
  if (data.hasNotification) {
    const notificationValidation = validateNotificationFields(data);
    errors.push(...notificationValidation.errors);
    warnings.push(...notificationValidation.warnings);
  }

  // Assignment validation
  const assignmentValidation = validateAssignmentFields(data);
  errors.push(...assignmentValidation.errors);
  warnings.push(...assignmentValidation.warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Validate date and time fields
 */
const validateDateTimeFields = (data: ReminderFormData): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Due date validation
  if (data.dueDate) {
    if (!isValidDateString(data.dueDate)) {
      errors.push('Invalid due date format');
    } else {
      const dueDate = new Date(data.dueDate);
      if (isPast(dueDate)) {
        warnings.push('Due date is in the past');
      }
    }
  }

  // Due time validation
  if (data.dueTime && !isValidTimeString(data.dueTime)) {
    errors.push('Invalid due time format (use HH:MM)');
  }

  // Start date validation
  if (data.startDate) {
    if (!isValidDateString(data.startDate)) {
      errors.push('Invalid start date format');
    } else {
      const startDate = new Date(data.startDate);
      if (isPast(startDate)) {
        warnings.push('Start date is in the past');
      }
    }
  }

  // Start time validation
  if (data.startTime && !isValidTimeString(data.startTime)) {
    errors.push('Invalid start time format (use HH:MM)');
  }

  // End date validation
  if (data.endDate) {
    if (!isValidDateString(data.endDate)) {
      errors.push('Invalid end date format');
    } else {
      const endDate = new Date(data.endDate);
      if (isPast(endDate)) {
        warnings.push('End date is in the past');
      }
    }
  }

  // End time validation
  if (data.endTime && !isValidTimeString(data.endTime)) {
    errors.push('Invalid end time format (use HH:MM)');
  }

  // Date range validation
  if (data.startDate && data.endDate) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (endDate <= startDate) {
      errors.push('End date must be after start date');
    }
  }

  if (data.dueDate && data.startDate) {
    const dueDate = new Date(data.dueDate);
    const startDate = new Date(data.startDate);
    if (dueDate < startDate) {
      errors.push('Due date cannot be before start date');
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
};

/**
 * Validate recurring fields
 */
const validateRecurringFields = (data: ReminderFormData): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data.repeatPattern) {
    errors.push('Repeat pattern is required for recurring reminders');
  } else if (!Object.values(RepeatPattern).includes(data.repeatPattern)) {
    errors.push('Invalid repeat pattern');
  }

  if (data.repeatPattern === RepeatPattern.CUSTOM) {
    if (!data.customInterval || data.customInterval < 1) {
      errors.push('Custom interval must be at least 1 day');
    } else if (data.customInterval > 365) {
      warnings.push('Custom interval is very long - consider using a different pattern');
    }

    if (!data.repeatDays || data.repeatDays.length === 0) {
      errors.push('At least one day must be selected for custom recurring pattern');
    } else {
      // Check for invalid day numbers
      const invalidDays = data.repeatDays.filter(day => day < 0 || day > 6);
      if (invalidDays.length > 0) {
        errors.push('Invalid day numbers in repeat days');
      }
    }
  }

  // Recurring date range validation
  if (data.recurringStartDate && data.recurringEndDate) {
    if (data.recurringEndDate <= data.recurringStartDate) {
      errors.push('Recurring end date must be after start date');
    }

    if (isPast(data.recurringEndDate)) {
      warnings.push('Recurring end date is in the past');
    }
  }

  // Check if recurring reminder has a due date
  if (!data.dueDate) {
    errors.push('Due date is required for recurring reminders');
  }

  return { isValid: errors.length === 0, errors, warnings };
};

/**
 * Validate notification fields
 */
const validateNotificationFields = (data: ReminderFormData): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data.notificationTimings || data.notificationTimings.length === 0) {
    errors.push('At least one notification timing must be specified');
    return { isValid: false, errors, warnings };
  }

  // Check for duplicate timings
  const timingKeys = data.notificationTimings.map(t => `${t.type}-${t.value}`);
  const uniqueKeys = new Set(timingKeys);
  if (timingKeys.length !== uniqueKeys.size) {
    errors.push('Duplicate notification timings are not allowed');
  }

  // Validate each timing
  for (const timing of data.notificationTimings) {
    if (timing.value < 0) {
      errors.push('Notification timing value cannot be negative');
    }

    if (timing.type === NotificationType.BEFORE && timing.value === 0) {
      errors.push('Before notification timing cannot be 0 minutes');
    }

    if (timing.type === NotificationType.AFTER && timing.value === 0) {
      errors.push('After notification timing cannot be 0 minutes');
    }

    // Warn about very long notification times
    if (timing.value > 10080) { // 1 week
      warnings.push('Notification timing is very long - consider a shorter time');
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
};

/**
 * Validate assignment fields
 */
const validateAssignmentFields = (data: ReminderFormData): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (data.assignedTo && data.assignedTo.length > 10) {
    errors.push('Cannot assign to more than 10 people');
  }

  // Check for duplicate assignments
  const uniqueAssignments = new Set(data.assignedTo);
  if (data.assignedTo.length !== uniqueAssignments.size) {
    errors.push('Duplicate assignments are not allowed');
  }

  return { isValid: errors.length === 0, errors, warnings };
};

/**
 * Validate a complete reminder object
 */
export const validateReminder = (reminder: Reminder): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic field validation
  if (!reminder.id) {
    errors.push('Reminder ID is required');
  }

  if (!reminder.userId) {
    errors.push('User ID is required');
  }

  if (!reminder.title || reminder.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (!Object.values(ReminderType).includes(reminder.type)) {
    errors.push('Invalid reminder type');
  }

  if (!Object.values(ReminderPriority).includes(reminder.priority)) {
    errors.push('Invalid priority level');
  }

  if (!Object.values(ReminderStatus).includes(reminder.status)) {
    errors.push('Invalid status');
  }

  // Date validation
  if (reminder.dueDate && isNaN(reminder.dueDate.getTime())) {
    errors.push('Invalid due date');
  }

  if (reminder.startDate && isNaN(reminder.startDate.getTime())) {
    errors.push('Invalid start date');
  }

  if (reminder.endDate && isNaN(reminder.endDate.getTime())) {
    errors.push('Invalid end date');
  }

  // Recurring validation
  if (reminder.isRecurring) {
    const recurringValidation = validateRecurringConfig(reminder);
    errors.push(...recurringValidation.errors);
  }

  // Notification validation
  if (reminder.hasNotification) {
    const notificationValidation = validateNotificationConfig(reminder);
    errors.push(...notificationValidation.errors);
  }

  // Status consistency validation
  if (reminder.status === 'completed' && !reminder.completed) {
    warnings.push('Status is completed but completed flag is false');
  }

  if (reminder.status === 'cancelled' && reminder.deletedAt) {
    warnings.push('Cancelled reminder should be in trash');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Sanitize reminder form data
 */
export const sanitizeReminderFormData = (data: ReminderFormData): ReminderFormData => {
  return {
    ...data,
    title: data.title?.trim() || '',
    description: data.description?.trim() || '',
    location: data.location?.trim() || '',
    tags: data.tags?.filter(tag => tag.trim().length > 0) || [],
    assignedTo: data.assignedTo?.filter(id => id.trim().length > 0) || [],
    dueDate: data.dueDate?.trim() || undefined,
    dueTime: data.dueTime?.trim() || undefined,
    startDate: data.startDate?.trim() || undefined,
    startTime: data.startTime?.trim() || undefined,
    endDate: data.endDate?.trim() || undefined,
    endTime: data.endTime?.trim() || undefined,
  };
};

/**
 * Check for potential data inconsistencies
 */
export const checkDataConsistency = (reminder: Reminder): string[] => {
  const issues: string[] = [];

  // Check for orphaned recurring reminders
  if (reminder.isRecurring && !reminder.repeatPattern) {
    issues.push('Recurring reminder missing repeat pattern');
  }

  // Check for notifications without timings
  if (reminder.hasNotification && (!reminder.notificationTimings || reminder.notificationTimings.length === 0)) {
    issues.push('Reminder has notifications enabled but no timings');
  }

  // Check for invalid date ranges
  if (reminder.startDate && reminder.endDate && reminder.endDate <= reminder.startDate) {
    issues.push('Invalid date range: end date is not after start date');
  }

  // Check for past due dates on active reminders
  if (reminder.dueDate && reminder.status === 'pending' && isPast(reminder.dueDate)) {
    issues.push('Active reminder has past due date');
  }

  // Check for completed reminders with future due dates
  if (reminder.dueDate && reminder.status === 'completed' && isFuture(reminder.dueDate)) {
    issues.push('Completed reminder has future due date');
  }

  analyticsService.trackCustomEvent('data_consistency_issue', { details: issues.join(', ') });

  return issues;
};

/**
 * Validate reminder for specific operations
 */
export const validateReminderForOperation = (
  reminder: Reminder,
  operation: 'create' | 'update' | 'delete' | 'complete' | 'cancel'
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  switch (operation) {
    case 'create':
      if (!reminder.title || reminder.title.trim().length === 0) {
        errors.push('Title is required for new reminders');
      }
      if (!reminder.dueDate) {
        errors.push('Due date is required for new reminders');
      }
      break;

    case 'update':
      if (reminder.status === 'completed') {
        errors.push('Cannot update completed reminders');
      }
      if (reminder.status === 'cancelled') {
        errors.push('Cannot update cancelled reminders');
      }
      break;

    case 'delete':
      if (reminder.status === 'completed') {
        warnings.push('Deleting a completed reminder');
      }
      break;

    case 'complete':
      if (reminder.status === 'completed') {
        errors.push('Reminder is already completed');
      }
      if (reminder.status === 'cancelled') {
        errors.push('Cannot complete cancelled reminders');
      }
      break;

    case 'cancel':
      if (reminder.status === 'cancelled') {
        errors.push('Reminder is already cancelled');
      }
      if (reminder.status === 'completed') {
        errors.push('Cannot cancel completed reminders');
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};
