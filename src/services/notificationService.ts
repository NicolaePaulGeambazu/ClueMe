// DEPRECATED: This file is replaced by cleanNotificationService.ts
// The old hybrid notification system has been removed due to bugs and issues
// Please use cleanNotificationService.ts for all notification functionality

import cleanNotificationService from './cleanNotificationService';

// Re-export types and constants for backward compatibility
export type { NotificationTiming, ReminderData, NotificationUserInfo } from './cleanNotificationService';
export { DEFAULT_NOTIFICATION_TIMINGS } from './cleanNotificationService';

// Re-export the clean notification service as default
export default cleanNotificationService;
