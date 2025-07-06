/**
 * Reminder Design System
 * 
 * This module provides a centralized system for all reminder-related functionality:
 * - Types and interfaces
 * - Utility functions
 * - Reusable components
 * - Business logic hooks
 * - Validation schemas
 */

// Core Types
export * from './types';

// Utilities
export * from './utils/date-utils';
export * from './utils/recurring-utils';
export * from './utils/notification-utils';
export * from './utils/validation-utils';
export * from './utils/error-handling';

// Constants
export * from './constants';

// Note: Components, hooks, services, and schemas will be exported here when implemented
// - Components: ReminderForm, RecurringOptions, NotificationSettings, ReminderCard, ReminderList
// - Hooks: useReminderForm, useRecurringLogic, useNotificationScheduling
// - Services: reminder-service, recurring-service, notification-service
// - Schemas: validation schemas 