/**
 * User Behavior Analysis and Edge Case Prevention
 * 
 * Analyzes user behavior patterns and prevents common edge cases
 * All user-facing messages use translation keys for internationalization
 */

import { Reminder, ReminderFormData, ReminderType, ReminderPriority, RepeatPattern, NotificationType } from '../types';
import { isPast, isFuture, addDays, addHours } from './date-utils';
import { generateOccurrences } from './recurring-utils';
import { PERFORMANCE, FORM_LIMITS } from '../constants';

// User behavior patterns
export interface UserBehaviorPattern {
  type: 'rapid_creation' | 'past_dates' | 'long_intervals' | 'many_notifications' | 'incomplete_forms' | 'timezone_changes';
  frequency: number;
  lastOccurrence: Date;
  severity: 'low' | 'medium' | 'high';
  suggestionKeys: string[]; // Translation keys for suggestions
}

export interface BehaviorAnalysis {
  patterns: UserBehaviorPattern[];
  riskLevel: 'low' | 'medium' | 'high';
  suggestionKeys: string[]; // Translation keys for suggestions
  warningKeys: string[]; // Translation keys for warnings
}

/**
 * Analyze user behavior for potential issues
 */
export const analyzeUserBehavior = (
  reminders: Reminder[],
  recentActions: Array<{ action: string; timestamp: Date; data?: any }>
): BehaviorAnalysis => {
  const patterns: UserBehaviorPattern[] = [];
  const suggestionKeys: string[] = [];
  const warningKeys: string[] = [];

  // Check for rapid reminder creation
  const rapidCreationPattern = detectRapidCreation(recentActions);
  if (rapidCreationPattern) {
    patterns.push(rapidCreationPattern);
    suggestionKeys.push('behavior.suggestions.useTemplates');
  }

  // Check for past dates
  const pastDatesPattern = detectPastDates(reminders);
  if (pastDatesPattern) {
    patterns.push(pastDatesPattern);
    warningKeys.push('behavior.warnings.pastDueDates');
  }

  // Check for long intervals
  const longIntervalsPattern = detectLongIntervals(reminders);
  if (longIntervalsPattern) {
    patterns.push(longIntervalsPattern);
    suggestionKeys.push('behavior.suggestions.shorterIntervals');
  }

  // Check for many notifications
  const manyNotificationsPattern = detectManyNotifications(reminders);
  if (manyNotificationsPattern) {
    patterns.push(manyNotificationsPattern);
    suggestionKeys.push('behavior.suggestions.reduceNotifications');
  }

  // Check for incomplete forms
  const incompleteFormsPattern = detectIncompleteForms(recentActions);
  if (incompleteFormsPattern) {
    patterns.push(incompleteFormsPattern);
    suggestionKeys.push('behavior.suggestions.useQuickAdd');
  }

  // Check for timezone changes
  const timezonePattern = detectTimezoneChanges(recentActions);
  if (timezonePattern) {
    patterns.push(timezonePattern);
    warningKeys.push('behavior.warnings.timezoneChanges');
  }

  // Calculate overall risk level
  const riskLevel = calculateRiskLevel(patterns);

  return {
    patterns,
    riskLevel,
    suggestionKeys,
    warningKeys
  };
};

/**
 * Detect rapid reminder creation
 */
const detectRapidCreation = (recentActions: Array<{ action: string; timestamp: Date }>): UserBehaviorPattern | null => {
  const createActions = recentActions
    .filter(action => action.action === 'create_reminder')
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  if (createActions.length < 3) return null;

  const now = new Date();
  const recentCreates = createActions.filter(action => 
    now.getTime() - action.timestamp.getTime() < 5 * 60 * 1000 // 5 minutes
  );

  if (recentCreates.length >= 3) {
    return {
      type: 'rapid_creation',
      frequency: recentCreates.length,
      lastOccurrence: recentCreates[0].timestamp,
      severity: recentCreates.length > 5 ? 'high' : 'medium',
      suggestionKeys: [
        'behavior.suggestions.useTemplates',
        'behavior.suggestions.batchCreation',
        'behavior.suggestions.quickAdd'
      ]
    };
  }

  return null;
};

/**
 * Detect reminders with past dates
 */
const detectPastDates = (reminders: Reminder[]): UserBehaviorPattern | null => {
  const pastDueReminders = reminders.filter(reminder => 
    reminder.dueDate && isPast(reminder.dueDate) && reminder.status === 'pending'
  );

  if (pastDueReminders.length > 0) {
    return {
      type: 'past_dates',
      frequency: pastDueReminders.length,
      lastOccurrence: new Date(),
      severity: pastDueReminders.length > 10 ? 'high' : 'medium',
      suggestionKeys: [
        'behavior.suggestions.reviewPastDue',
        'behavior.suggestions.defaultTimes',
        'behavior.suggestions.calendarView'
      ]
    };
  }

  return null;
};

/**
 * Detect long recurring intervals
 */
const detectLongIntervals = (reminders: Reminder[]): UserBehaviorPattern | null => {
  const longIntervalReminders = reminders.filter(reminder => 
    reminder.isRecurring && 
    reminder.customInterval && 
    reminder.customInterval > 30
  );

  if (longIntervalReminders.length > 0) {
    return {
      type: 'long_intervals',
      frequency: longIntervalReminders.length,
      lastOccurrence: new Date(),
      severity: 'medium',
      suggestionKeys: [
        'behavior.suggestions.shorterIntervals',
        'behavior.suggestions.useMonthlyYearly',
        'behavior.suggestions.intermediateCheckins'
      ]
    };
  }

  return null;
};

/**
 * Detect reminders with many notifications
 */
const detectManyNotifications = (reminders: Reminder[]): UserBehaviorPattern | null => {
  const manyNotificationReminders = reminders.filter(reminder => 
    reminder.notificationTimings && 
    reminder.notificationTimings.length > 3
  );

  if (manyNotificationReminders.length > 0) {
    return {
      type: 'many_notifications',
      frequency: manyNotificationReminders.length,
      lastOccurrence: new Date(),
      severity: 'medium',
      suggestionKeys: [
        'behavior.suggestions.reduceNotifications',
        'behavior.suggestions.usePresets',
        'behavior.suggestions.groupNotifications'
      ]
    };
  }

  return null;
};

/**
 * Detect incomplete form submissions
 */
const detectIncompleteForms = (recentActions: Array<{ action: string; data?: any }>): UserBehaviorPattern | null => {
  const incompleteSubmissions = recentActions.filter(action => 
    action.action === 'form_abandoned' || 
    (action.action === 'validation_error' && action.data?.errors?.length > 2)
  );

  if (incompleteSubmissions.length > 0) {
    return {
      type: 'incomplete_forms',
      frequency: incompleteSubmissions.length,
      lastOccurrence: new Date(),
      severity: 'low',
      suggestionKeys: [
        'behavior.suggestions.quickAdd',
        'behavior.suggestions.useTemplates',
        'behavior.suggestions.saveDrafts'
      ]
    };
  }

  return null;
};

/**
 * Detect timezone changes
 */
const detectTimezoneChanges = (recentActions: Array<{ action: string; data?: any }>): UserBehaviorPattern | null => {
  const timezoneChanges = recentActions.filter(action => 
    action.action === 'timezone_changed'
  );

  if (timezoneChanges.length > 0) {
    return {
      type: 'timezone_changes',
      frequency: timezoneChanges.length,
      lastOccurrence: new Date(),
      severity: 'high',
      suggestionKeys: [
        'behavior.suggestions.reviewTimes',
        'behavior.suggestions.useUTC',
        'behavior.suggestions.checkNotifications'
      ]
    };
  }

  return null;
};

/**
 * Calculate overall risk level
 */
const calculateRiskLevel = (patterns: UserBehaviorPattern[]): 'low' | 'medium' | 'high' => {
  if (patterns.length === 0) return 'low';

  const severityScores = patterns.map(pattern => {
    switch (pattern.severity) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  });

  const totalScore = severityScores.reduce((sum: number, score: number) => sum + score, 0);
  const averageScore = totalScore / patterns.length;

  if (averageScore >= 2.5) return 'high';
  if (averageScore >= 1.5) return 'medium';
  return 'low';
};

/**
 * Prevent common edge cases in form data
 */
export const preventEdgeCases = (formData: ReminderFormData): {
  sanitizedData: ReminderFormData;
  warningKeys: string[]; // Translation keys for warnings
  suggestionKeys: string[]; // Translation keys for suggestions
} => {
  const sanitizedData = { ...formData };
  const warningKeys: string[] = [];
  const suggestionKeys: string[] = [];

  // Prevent past dates
  if (sanitizedData.dueDate) {
    const dueDate = new Date(sanitizedData.dueDate);
    if (isPast(dueDate)) {
      warningKeys.push('validation.pastDate');
      // Suggest tomorrow as default
      const tomorrow = addDays(new Date(), 1);
      sanitizedData.dueDate = tomorrow.toISOString().split('T')[0];
      suggestionKeys.push('behavior.suggestions.adjustedToTomorrow');
    }
  }

  // Prevent very long titles
  if (sanitizedData.title && sanitizedData.title.length > FORM_LIMITS.TITLE_MAX_LENGTH) {
    sanitizedData.title = sanitizedData.title.substring(0, FORM_LIMITS.TITLE_MAX_LENGTH);
    warningKeys.push('validation.titleTruncated');
  }

  // Prevent too many tags
  if (sanitizedData.tags && sanitizedData.tags.length > FORM_LIMITS.TAGS_MAX_COUNT) {
    sanitizedData.tags = sanitizedData.tags.slice(0, FORM_LIMITS.TAGS_MAX_COUNT);
    warningKeys.push('validation.tooManyTags');
  }

  // Prevent too many notifications
  if (sanitizedData.notificationTimings && sanitizedData.notificationTimings.length > FORM_LIMITS.NOTIFICATION_TIMINGS_MAX_COUNT) {
    sanitizedData.notificationTimings = sanitizedData.notificationTimings.slice(0, FORM_LIMITS.NOTIFICATION_TIMINGS_MAX_COUNT);
    warningKeys.push('validation.tooManyNotifications');
  }

  // Prevent invalid time ranges
  if (sanitizedData.startDate && sanitizedData.endDate) {
    const startDate = new Date(sanitizedData.startDate);
    const endDate = new Date(sanitizedData.endDate);
    if (endDate <= startDate) {
      warningKeys.push('validation.invalidDateRange');
      // Suggest end date as start date + 1 hour
      const suggestedEndDate = addHours(startDate, 1);
      sanitizedData.endDate = suggestedEndDate.toISOString().split('T')[0];
      suggestionKeys.push('behavior.suggestions.adjustedEndTime');
    }
  }

  // Prevent recurring reminders without patterns
  if (sanitizedData.isRecurring && !sanitizedData.repeatPattern) {
    sanitizedData.repeatPattern = RepeatPattern.DAILY;
    warningKeys.push('validation.recurringNeedsPattern');
  }

  // Prevent notifications without timings
  if (sanitizedData.hasNotification && (!sanitizedData.notificationTimings || sanitizedData.notificationTimings.length === 0)) {
    sanitizedData.notificationTimings = [
      { type: NotificationType.BEFORE, value: 15, labelKey: 'reminders.notifications.15MinutesBefore' }
    ];
    warningKeys.push('validation.notificationsNeedTimings');
  }

  return { sanitizedData, warningKeys, suggestionKeys };
};

/**
 * Suggest improvements based on user behavior
 */
export const suggestImprovements = (reminders: Reminder[]): string[] => {
  const suggestionKeys: string[] = [];

  // Check for reminder type distribution
  const typeCounts = reminders.reduce((counts, reminder) => {
    counts[reminder.type] = (counts[reminder.type] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  const totalReminders = reminders.length;
  const taskPercentage = (typeCounts[ReminderType.TASK] || 0) / totalReminders;

  if (taskPercentage > 0.8) {
    suggestionKeys.push('behavior.suggestions.differentTypes');
  }

  // Check for priority distribution
  const priorityCounts = reminders.reduce((counts, reminder) => {
    counts[reminder.priority] = (counts[reminder.priority] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  const highPriorityPercentage = (priorityCounts[ReminderPriority.HIGH] || 0) / totalReminders;
  if (highPriorityPercentage > 0.5) {
    suggestionKeys.push('behavior.suggestions.reviewPriorities');
  }

  // Check for recurring vs non-recurring
  const recurringCount = reminders.filter(r => r.isRecurring).length;
  const recurringPercentage = recurringCount / totalReminders;
  if (recurringPercentage < 0.1 && totalReminders > 10) {
    suggestionKeys.push('behavior.suggestions.useRecurring');
  }

  // Check for notification usage
  const notificationCount = reminders.filter(r => r.hasNotification).length;
  const notificationPercentage = notificationCount / totalReminders;
  if (notificationPercentage < 0.3) {
    suggestionKeys.push('behavior.suggestions.enableNotifications');
  }

  return suggestionKeys;
};

/**
 * Detect potential data quality issues
 */
export const detectDataQualityIssues = (reminders: Reminder[]): {
  issueKeys: string[]; // Translation keys for issues
  affectedReminders: string[];
  severity: 'low' | 'medium' | 'high';
} => {
  const issueKeys: string[] = [];
  const affectedReminders: string[] = [];
  let severity: 'low' | 'medium' | 'high' = 'low';

  // Check for reminders without titles
  const noTitleReminders = reminders.filter(r => !r.title || r.title.trim().length === 0);
  if (noTitleReminders.length > 0) {
    issueKeys.push('dataQuality.issues.noTitles');
    affectedReminders.push(...noTitleReminders.map(r => r.id));
    severity = 'high';
  }

  // Check for orphaned recurring reminders
  const orphanedRecurring = reminders.filter(r => r.isRecurring && !r.repeatPattern);
  if (orphanedRecurring.length > 0) {
    issueKeys.push('dataQuality.issues.orphanedRecurring');
    affectedReminders.push(...orphanedRecurring.map(r => r.id));
    severity = severity === 'low' ? 'medium' : severity;
  }

  // Check for notifications without timings
  const notificationsWithoutTimings = reminders.filter(r => 
    r.hasNotification && (!r.notificationTimings || r.notificationTimings.length === 0)
  );
  if (notificationsWithoutTimings.length > 0) {
    issueKeys.push('dataQuality.issues.notificationsWithoutTimings');
    affectedReminders.push(...notificationsWithoutTimings.map(r => r.id));
    severity = severity === 'low' ? 'medium' : severity;
  }

  // Check for invalid dates
  const invalidDates = reminders.filter(r => 
    (r.dueDate && isNaN(r.dueDate.getTime())) ||
    (r.startDate && isNaN(r.startDate.getTime())) ||
    (r.endDate && isNaN(r.endDate.getTime()))
  );
  if (invalidDates.length > 0) {
    issueKeys.push('dataQuality.issues.invalidDates');
    affectedReminders.push(...invalidDates.map(r => r.id));
    severity = 'high';
  }

  return { issueKeys, affectedReminders, severity };
}; 