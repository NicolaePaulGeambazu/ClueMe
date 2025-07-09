/**
 * Error Handling Utilities for Reminders
 * 
 * Comprehensive error handling, recovery, and user feedback system
 * All user-facing messages use translation keys for internationalization
 */

import { Reminder, ValidationResult } from '../types';
import { validateReminder, checkDataConsistency } from './validation-utils';
import { generateOccurrences } from './recurring-utils';
import { generateNotificationTimes } from './notification-utils';
import { ERROR_MESSAGE_KEYS, WARNING_MESSAGE_KEYS } from '../constants';
import analyticsService from '../../../services/analyticsService';

// Error types for better error handling
export enum ErrorType {
  VALIDATION = 'validation',
  NETWORK = 'network',
  PERMISSION = 'permission',
  DATA_CORRUPTION = 'data_corruption',
  NOTIFICATION = 'notification',
  RECURRING = 'recurring',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

export interface AppError {
  type: ErrorType;
  messageKey: string; // Translation key instead of hardcoded message
  code?: string;
  details?: any;
  recoverable: boolean;
  retryCount?: number;
  timestamp: Date;
}

export interface ErrorRecovery {
  canRecover: boolean;
  recoveryStepKeys: string[]; // Translation keys for recovery steps
  automaticRecovery?: () => Promise<boolean>;
  userActionRequired?: boolean;
}

/**
 * Create a standardized error object
 */
export const createError = (
  type: ErrorType,
  messageKey: string,
  details?: any,
  recoverable: boolean = true
): AppError => {
  return {
    type,
    messageKey,
    details,
    recoverable,
    timestamp: new Date()
  };
};

/**
 * Handle validation errors
 */
export const handleValidationError = (validation: ValidationResult): AppError[] => {
  const errors: AppError[] = [];
  
  for (const error of validation.errors) {
    errors.push(createError(ErrorType.VALIDATION, error, { validation }, false));
  }
  
  for (const warning of validation.warnings) {
    errors.push(createError(ErrorType.VALIDATION, warning, { validation }, true));
  }
  
  return errors;
};

/**
 * Handle network errors with retry logic
 */
export const handleNetworkError = (
  error: any,
  retryCount: number = 0
): AppError => {
  const maxRetries = 3;
  const canRetry = retryCount < maxRetries;
  
  return createError(
    ErrorType.NETWORK,
    ERROR_MESSAGE_KEYS.NETWORK_ERROR,
    { 
      originalError: error,
      retryCount,
      maxRetries,
      canRetry
    },
    canRetry
  );
};

/**
 * Handle data corruption errors
 */
export const handleDataCorruptionError = (reminder: Reminder): AppError[] => {
  const errors: AppError[] = [];
  const issues = checkDataConsistency(reminder);
  
  for (const issue of issues) {
    errors.push(createError(
      ErrorType.DATA_CORRUPTION,
      'errors.dataCorruption',
      { reminder, issue },
      true
    ));
  }
  
  return errors;
};

/**
 * Handle recurring reminder errors
 */
export const handleRecurringError = (reminder: Reminder): AppError[] => {
  const errors: AppError[] = [];
  
  try {
    const occurrences = generateOccurrences(reminder);
    if (occurrences.length === 0) {
      errors.push(createError(
        ErrorType.RECURRING,
        ERROR_MESSAGE_KEYS.RECURRING_ERROR,
        { reminder },
        true
      ));
    }
  } catch (error) {
    errors.push(createError(
      ErrorType.RECURRING,
      ERROR_MESSAGE_KEYS.RECURRING_ERROR,
      { reminder, error },
      true
    ));
  }
  
  return errors;
};

/**
 * Handle notification errors
 */
export const handleNotificationError = (reminder: Reminder): AppError[] => {
  const errors: AppError[] = [];
  
  try {
    const notificationTimes = generateNotificationTimes(reminder);
    if (reminder.hasNotification && notificationTimes.length === 0) {
      errors.push(createError(
        ErrorType.NOTIFICATION,
        ERROR_MESSAGE_KEYS.NOTIFICATION_ERROR,
        { reminder },
        true
      ));
    }
  } catch (error) {
    errors.push(createError(
      ErrorType.NOTIFICATION,
      ERROR_MESSAGE_KEYS.NOTIFICATION_ERROR,
      { reminder, error },
      true
    ));
  }
  
  return errors;
};

/**
 * Attempt to recover from an error
 */
export const attemptErrorRecovery = async (error: AppError): Promise<ErrorRecovery> => {
  switch (error.type) {
    case ErrorType.NETWORK:
      return handleNetworkRecovery(error);
    
    case ErrorType.DATA_CORRUPTION:
      return handleDataCorruptionRecovery(error);
    
    case ErrorType.RECURRING:
      return handleRecurringRecovery(error);
    
    case ErrorType.NOTIFICATION:
      return handleNotificationRecovery(error);
    
    case ErrorType.VALIDATION:
      return handleValidationRecovery(error);
    
    default:
      return {
        canRecover: false,
        recoveryStepKeys: ['errors.contactSupport'],
        userActionRequired: true
      };
  }
};

/**
 * Handle network error recovery
 */
const handleNetworkRecovery = (error: AppError): ErrorRecovery => {
  const retryCount = error.retryCount || 0;
  const maxRetries = error.details?.maxRetries || 3;
  
  if (retryCount < maxRetries) {
    return {
      canRecover: true,
      recoveryStepKeys: [
        'errors.recovery.checkingNetwork',
        'errors.recovery.retrying',
        `errors.recovery.attempt${retryCount + 1}Of${maxRetries}`
      ],
      automaticRecovery: async () => {
        // Simulate retry delay
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return true; // Assume success for now
      }
    };
  }
  
  return {
    canRecover: false,
    recoveryStepKeys: [
      'errors.recovery.checkInternet',
      'errors.recovery.tryAgainLater',
      'errors.recovery.contactSupport'
    ],
    userActionRequired: true
  };
};

/**
 * Handle data corruption recovery
 */
const handleDataCorruptionRecovery = (error: AppError): ErrorRecovery => {
  const reminder = error.details?.reminder;
  
  if (!reminder) {
    return {
      canRecover: false,
      recoveryStepKeys: ['errors.recovery.dataCorrupted'],
      userActionRequired: true
    };
  }
  
  return {
    canRecover: true,
    recoveryStepKeys: [
      'errors.recovery.fixingInconsistencies',
      'errors.recovery.validatingData',
      'errors.recovery.applyingCorrections'
    ],
    automaticRecovery: async () => {
      try {
        // Attempt to fix common data issues
        const fixedReminder = await fixDataCorruption(reminder);
        return validateReminder(fixedReminder).isValid;
      } catch {
        return false;
      }
    }
  };
};

/**
 * Handle recurring error recovery
 */
const handleRecurringRecovery = (error: AppError): ErrorRecovery => {
  return {
    canRecover: true,
    recoveryStepKeys: [
      'errors.recovery.checkingRecurringConfig',
      'errors.recovery.regeneratingOccurrences',
      'errors.recovery.validatingPattern'
    ],
    automaticRecovery: async () => {
      try {
        const reminder = error.details?.reminder;
        if (!reminder) return false;
        
        const occurrences = generateOccurrences(reminder);
        return occurrences.length > 0;
      } catch {
        return false;
      }
    }
  };
};

/**
 * Handle notification error recovery
 */
const handleNotificationRecovery = (error: AppError): ErrorRecovery => {
  return {
    canRecover: true,
    recoveryStepKeys: [
      'errors.recovery.checkingNotificationSettings',
      'errors.recovery.reschedulingNotifications',
      'errors.recovery.validatingTimings'
    ],
    automaticRecovery: async () => {
      try {
        const reminder = error.details?.reminder;
        if (!reminder) return false;
        
        const notificationTimes = generateNotificationTimes(reminder);
        return notificationTimes.length > 0;
      } catch {
        return false;
      }
    }
  };
};

/**
 * Handle validation error recovery
 */
const handleValidationRecovery = (error: AppError): ErrorRecovery => {
  return {
    canRecover: false,
    recoveryStepKeys: [
      'errors.recovery.correctValidationErrors',
      'errors.recovery.checkRequiredFields',
      'errors.recovery.ensureValidDates'
    ],
    userActionRequired: true
  };
};

/**
 * Fix common data corruption issues
 */
const fixDataCorruption = async (reminder: Reminder): Promise<Reminder> => {
  const fixed = { ...reminder };
  
  // Fix orphaned recurring reminders
  if (fixed.isRecurring && !fixed.repeatPattern) {
    fixed.isRecurring = false;
  }
  
  // Fix notifications without timings
  if (fixed.hasNotification && (!fixed.notificationTimings || fixed.notificationTimings.length === 0)) {
    fixed.hasNotification = false;
  }
  
  // Fix invalid dates
  if (fixed.dueDate && isNaN(fixed.dueDate.getTime())) {
    fixed.dueDate = undefined;
  }
  
  if (fixed.startDate && isNaN(fixed.startDate.getTime())) {
    fixed.startDate = undefined;
  }
  
  if (fixed.endDate && isNaN(fixed.endDate.getTime())) {
    fixed.endDate = undefined;
  }
  
  // Fix status inconsistencies
  if (fixed.status === 'completed' && !fixed.completed) {
    fixed.completed = true;
  }
  
  if (fixed.status === 'cancelled' && !fixed.deletedAt) {
    fixed.deletedAt = new Date();
  }
  
  return fixed;
};

/**
 * Log error for analytics and debugging
 */
export const logError = (error: AppError): void => {
  analyticsService.trackError(
    error.messageKey,
    error.code,
    {
      errorType: error.type,
      recoverable: error.recoverable,
      retryCount: error.retryCount,
      details: error.details
    }
  );
};

/**
 * Get user-friendly error message key
 */
export const getUserFriendlyMessageKey = (error: AppError): string => {
  switch (error.type) {
    case ErrorType.NETWORK:
      return 'errors.userFriendly.network';
    
    case ErrorType.PERMISSION:
      return 'errors.userFriendly.permission';
    
    case ErrorType.VALIDATION:
      return error.messageKey;
    
    case ErrorType.DATA_CORRUPTION:
      return 'errors.userFriendly.dataCorruption';
    
    case ErrorType.NOTIFICATION:
      return 'errors.userFriendly.notification';
    
    case ErrorType.RECURRING:
      return 'errors.userFriendly.recurring';
    
    case ErrorType.TIMEOUT:
      return 'errors.userFriendly.timeout';
    
    default:
      return 'errors.userFriendly.unknown';
  }
};

/**
 * Check if error is critical (non-recoverable)
 */
export const isCriticalError = (error: AppError): boolean => {
  return !error.recoverable || error.type === ErrorType.DATA_CORRUPTION;
};

/**
 * Get error priority for UI display
 */
export const getErrorPriority = (error: AppError): 'low' | 'medium' | 'high' | 'critical' => {
  if (isCriticalError(error)) return 'critical';
  if (error.type === ErrorType.NETWORK) return 'high';
  if (error.type === ErrorType.VALIDATION) return 'medium';
  return 'low';
};

/**
 * Batch error handling for multiple operations
 */
export const handleBatchErrors = (errors: AppError[]): {
  critical: AppError[];
  recoverable: AppError[];
  autoRecovery: Promise<boolean>[];
} => {
  const critical: AppError[] = [];
  const recoverable: AppError[] = [];
  const autoRecovery: Promise<boolean>[] = [];
  
  for (const error of errors) {
    if (isCriticalError(error)) {
      critical.push(error);
    } else {
      recoverable.push(error);
      
      // Attempt automatic recovery
      attemptErrorRecovery(error).then(recovery => {
        if (recovery.canRecover && recovery.automaticRecovery) {
          autoRecovery.push(recovery.automaticRecovery());
        }
      });
    }
  }
  
  return { critical, recoverable, autoRecovery };
}; 