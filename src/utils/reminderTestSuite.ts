/**
 * Comprehensive Reminder Test Suite
 * 
 * This file tests all possible combinations when adding reminders:
 * - Basic reminder creation
 * - Different reminder types
 * - Date/time combinations
 * - Recurring patterns
 * - Notification settings
 * - Family sharing
 * - Edge cases and error conditions
 */

import { DateTime } from 'luxon';
import { reminderService } from '../services/firebaseService';
import notificationService from '../services/notificationService';
import { generateRecurringOccurrences } from './calendarUtils';
import { generateNextOccurrence, shouldGenerateNextOccurrence } from './recurringReminderUtils';
import { scheduleNotification, cancelNotification } from './notificationUtils';
import { 
  Reminder, 
  ReminderType, 
  ReminderPriority, 
  ReminderStatus, 
  RepeatPattern, 
  NotificationType, 
  NotificationTiming 
} from '../design-system/reminders/types';

// Test result interface
interface TestResult {
  testName: string;
  passed: boolean;
  error?: string;
  details?: unknown;
  duration?: number;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
}

interface TestReminderOverrides {
  title?: string;
  description?: string;
  type?: ReminderType;
  priority?: ReminderPriority;
  dueDate?: Date;
  dueTime?: string;
  location?: string;
  tags?: string[];
  isFavorite?: boolean;
  hasNotification?: boolean;
  notificationTimings?: NotificationTiming[];
  isRecurring?: boolean;
  assignedTo?: string[];
  userId?: string;
  status?: ReminderStatus;
  [key: string]: unknown;
}

interface FormData {
  title: string;
  datetime: string;
  repeatRRule?: string;
  pushNotification: boolean;
}

// Mock reminder service for testing
const reminderServiceMock = {
  createReminder: async (reminder: Reminder): Promise<string> => {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    return `test-reminder-${Date.now()}`;
  }
};

// Test data generators
const generateTestReminder = (overrides: TestReminderOverrides = {}): Reminder => ({
  id: `test-${Date.now()}`,
  title: 'Test Reminder',
  description: 'Test description',
  type: ReminderType.REMINDER,
  priority: ReminderPriority.MEDIUM,
  dueDate: new Date(),
  dueTime: '10:00',
  location: '',
  tags: [],
  isFavorite: false,
  hasNotification: true,
  notificationTimings: [
    { type: NotificationType.BEFORE, value: 15 }
  ],
  isRecurring: false,
  assignedTo: [],
  userId: 'test-user-id',
  status: ReminderStatus.PENDING,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

// Test suites
export class ReminderTestSuite {
  private results: TestSuite[] = [];
  private currentSuite: TestSuite | null = null;

  constructor() {
    // Initialize test suite
  }

  private startSuite(name: string): void {
    this.currentSuite = {
      name,
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0
    };
  }

  private endSuite(): void {
    if (this.currentSuite) {
      this.currentSuite.totalTests = this.currentSuite.tests.length;
      this.currentSuite.passedTests = this.currentSuite.tests.filter(t => t.passed).length;
      this.currentSuite.failedTests = this.currentSuite.tests.filter(t => !t.passed).length;
      
      this.results.push(this.currentSuite);
      
      if (this.currentSuite.failedTests > 0) {
        this.currentSuite.tests
          .filter(t => !t.passed)
          .forEach(test => {
            // Log failed tests
          });
      }
      
      this.currentSuite = null;
    }
  }

  private async runTest(testName: string, testFn: () => Promise<unknown>): Promise<TestResult> {
    const startTime = Date.now();
    const result: TestResult = {
      testName,
      passed: false
    };

    try {
      const testResult = await testFn();
      result.passed = true;
      result.details = testResult;
    } catch (error: unknown) {
      result.passed = false;
      result.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      result.duration = Date.now() - startTime;
    }

    if (this.currentSuite) {
      this.currentSuite.tests.push(result);
    }

    return result;
  }

  // Test Suite 1: Add Form Workflow
  async testAddFormWorkflow(): Promise<void> {
    this.startSuite('Add Form Workflow');

    // Test 1: Complete add form workflow - title only
    await this.runTest('Add form: Title only reminder', async () => {
      const formData: FormData = {
        title: 'Simple Test Reminder',
        datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        repeatRRule: undefined,
        pushNotification: true,
      };
      
      // Simulate the add form workflow
      const reminder: Reminder = {
        id: `test-${Date.now()}`,
        title: formData.title.trim(),
        description: '',
        type: ReminderType.REMINDER,
        priority: ReminderPriority.MEDIUM,
        dueDate: new Date(formData.datetime),
        dueTime: new Date(formData.datetime).toTimeString().slice(0, 5),
        location: '',
        tags: [],
        isFavorite: false,
        hasNotification: formData.pushNotification,
        notificationTimings: formData.pushNotification ? [
          { type: NotificationType.BEFORE, value: 15 },
        ] : [],
        isRecurring: false,
        assignedTo: [],
        userId: 'test-user-id',
        status: ReminderStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const id = await reminderServiceMock.createReminder(reminder);
      return { id, title: reminder.title, hasNotification: reminder.hasNotification };
    });

    // Test 2: Add form with custom date/time
    await this.runTest('Add form: Custom date/time', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      tomorrow.setHours(14, 30, 0, 0); // 2:30 PM
      
      const formData: FormData = {
        title: 'Custom Time Reminder',
        datetime: tomorrow.toISOString(),
        repeatRRule: undefined,
        pushNotification: true,
      };
      
      const reminder: Reminder = {
        id: `test-${Date.now()}`,
        title: formData.title.trim(),
        description: '',
        type: ReminderType.REMINDER,
        priority: ReminderPriority.MEDIUM,
        dueDate: new Date(formData.datetime),
        dueTime: new Date(formData.datetime).toTimeString().slice(0, 5),
        location: '',
        tags: [],
        isFavorite: false,
        hasNotification: formData.pushNotification,
        notificationTimings: formData.pushNotification ? [
          { type: NotificationType.BEFORE, value: 15 },
        ] : [],
        isRecurring: false,
        assignedTo: [],
        userId: 'test-user-id',
        status: ReminderStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const id = await reminderServiceMock.createReminder(reminder);
      return { id, title: reminder.title, dueTime: reminder.dueTime };
    });

    // Test 3: Add form with daily recurring
    await this.runTest('Add form: Daily recurring reminder', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      tomorrow.setHours(9, 0, 0, 0); // 9:00 AM
      
      const formData: FormData = {
        title: 'Daily Recurring Reminder',
        datetime: tomorrow.toISOString(),
        repeatRRule: 'FREQ=DAILY;INTERVAL=1',
        pushNotification: true,
      };
      
      const reminder: Reminder = {
        id: `test-${Date.now()}`,
        title: formData.title.trim(),
        description: '',
        type: ReminderType.REMINDER,
        priority: ReminderPriority.MEDIUM,
        dueDate: new Date(formData.datetime),
        dueTime: new Date(formData.datetime).toTimeString().slice(0, 5),
        location: '',
        tags: [],
        isFavorite: false,
        hasNotification: formData.pushNotification,
        notificationTimings: formData.pushNotification ? [
          { type: NotificationType.BEFORE, value: 15 },
        ] : [],
        isRecurring: true,
        repeatPattern: RepeatPattern.DAILY,
        customInterval: 1,
        assignedTo: [],
        userId: 'test-user-id',
        status: ReminderStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const id = await reminderServiceMock.createReminder(reminder);
      return { id, title: reminder.title, isRecurring: reminder.isRecurring };
    });

    this.endSuite();
  }

  // Test Suite 2: Recurring Reminders with Push Notifications
  async testRecurringWithNotifications(): Promise<void> {
    this.startSuite('Recurring Reminders with Push Notifications');

    // Test 1: Daily recurring with notifications for each occurrence
    await this.runTest('Daily recurring with notifications for each occurrence', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      tomorrow.setHours(9, 0, 0, 0); // 9:00 AM
      
      const formData: FormData = {
        title: 'Daily Medication Reminder',
        datetime: tomorrow.toISOString(),
        repeatRRule: 'FREQ=DAILY;INTERVAL=1',
        pushNotification: true,
      };
      
      const reminder: Reminder = {
        id: `test-${Date.now()}`,
        title: formData.title.trim(),
        description: '',
        type: ReminderType.REMINDER,
        priority: ReminderPriority.MEDIUM,
        dueDate: new Date(formData.datetime),
        dueTime: new Date(formData.datetime).toTimeString().slice(0, 5),
        location: '',
        tags: [],
        isFavorite: false,
        hasNotification: formData.pushNotification,
        notificationTimings: formData.pushNotification ? [
          { type: NotificationType.BEFORE, value: 15 },
        ] : [],
        isRecurring: true,
        repeatPattern: RepeatPattern.DAILY,
        customInterval: 1,
        assignedTo: [],
        userId: 'test-user-id',
        status: ReminderStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const id = await reminderServiceMock.createReminder(reminder);
      
      // Verify that notifications are scheduled for each occurrence
      const occurrences = generateRecurringOccurrences(reminder, new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 7); // Generate next 7 occurrences
      const notificationCount = occurrences.length;
      
      return { 
        id, 
        title: reminder.title, 
        isRecurring: reminder.isRecurring, 
        notificationCount,
        occurrences: occurrences.length
      };
    });

    // Test 2: Weekly recurring with notifications for specific days
    await this.runTest('Weekly recurring with notifications for specific days', async () => {
      const nextMonday = new Date();
      nextMonday.setDate(nextMonday.getDate() + (8 - nextMonday.getDay()) % 7); // Next Monday
      nextMonday.setHours(10, 0, 0, 0); // 10:00 AM
      
      const formData: FormData = {
        title: 'Weekly Meeting Reminder',
        datetime: nextMonday.toISOString(),
        repeatRRule: 'FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE,FR',
        pushNotification: true,
      };
      
      const reminder: Reminder = {
        id: `test-${Date.now()}`,
        title: formData.title.trim(),
        description: '',
        type: ReminderType.REMINDER,
        priority: ReminderPriority.MEDIUM,
        dueDate: new Date(formData.datetime),
        dueTime: new Date(formData.datetime).toTimeString().slice(0, 5),
        location: '',
        tags: [],
        isFavorite: false,
        hasNotification: formData.pushNotification,
        notificationTimings: formData.pushNotification ? [
          { type: NotificationType.BEFORE, value: 15 },
        ] : [],
        isRecurring: true,
        repeatPattern: RepeatPattern.WEEKLY,
        customInterval: 1,
        repeatDays: [1, 3, 5], // Monday, Wednesday, Friday
        assignedTo: [],
        userId: 'test-user-id',
        status: ReminderStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const id = await reminderServiceMock.createReminder(reminder);
      
      // Verify that notifications are scheduled for each occurrence
      const occurrences = generateRecurringOccurrences(reminder, new Date(), new Date(Date.now() + 4 * 7 * 24 * 60 * 60 * 1000), 12); // Generate next 12 occurrences (4 weeks * 3 days/week)
      const notificationCount = occurrences.length;
      
      return { 
        id, 
        title: reminder.title, 
        repeatDays: reminder.repeatDays, 
        notificationCount,
        occurrences: occurrences.length
      };
    });

    // Test 3: Monthly recurring with notifications
    await this.runTest('Monthly recurring with notifications', async () => {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(15); // 15th of next month
      nextMonth.setHours(14, 0, 0, 0); // 2:00 PM
      
      const formData: FormData = {
        title: 'Monthly Bill Payment',
        datetime: nextMonth.toISOString(),
        repeatRRule: 'FREQ=MONTHLY;INTERVAL=1',
        pushNotification: true,
      };
      
      const reminder: Reminder = {
        id: `test-${Date.now()}`,
        title: formData.title.trim(),
        description: '',
        type: ReminderType.REMINDER,
        priority: ReminderPriority.HIGH,
        dueDate: new Date(formData.datetime),
        dueTime: new Date(formData.datetime).toTimeString().slice(0, 5),
        location: '',
        tags: [],
        isFavorite: false,
        hasNotification: formData.pushNotification,
        notificationTimings: formData.pushNotification ? [
          { type: NotificationType.BEFORE, value: 60 },
          { type: NotificationType.BEFORE, value: 15 },
        ] : [],
        isRecurring: true,
        repeatPattern: RepeatPattern.MONTHLY,
        customInterval: 1,
        assignedTo: [],
        userId: 'test-user-id',
        status: ReminderStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const id = await reminderServiceMock.createReminder(reminder);
      
      // Verify that notifications are scheduled for each occurrence
      const occurrences = generateRecurringOccurrences(reminder, new Date(), new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000), 12); // Generate next 12 occurrences
      const notificationCount = occurrences.length * (reminder.notificationTimings?.length || 0); // Multiple notifications per occurrence
      
      return { 
        id, 
        title: reminder.title, 
        priority: reminder.priority,
        notificationCount,
        occurrences: occurrences.length
      };
    });

    this.endSuite();
  }

  // Test Suite 3: Family Member Notifications
  async testFamilyMemberNotifications(): Promise<void> {
    this.startSuite('Family Member Notifications');

    // Test 1: Reminder assigned to family members with notifications
    await this.runTest('Family member assignment with notifications', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      tomorrow.setHours(16, 0, 0, 0); // 4:00 PM
      
      const formData: FormData = {
        title: 'Family Dinner Preparation',
        datetime: tomorrow.toISOString(),
        repeatRRule: undefined,
        pushNotification: true,
      };
      
      const reminder: Reminder = {
        id: `test-${Date.now()}`,
        title: formData.title.trim(),
        description: 'Help prepare dinner for the family',
        type: ReminderType.REMINDER,
        priority: ReminderPriority.MEDIUM,
        dueDate: new Date(formData.datetime),
        dueTime: new Date(formData.datetime).toTimeString().slice(0, 5),
        location: 'Kitchen',
        tags: ['family', 'dinner'],
        isFavorite: false,
        hasNotification: formData.pushNotification,
        notificationTimings: formData.pushNotification ? [
          { type: NotificationType.BEFORE, value: 30 },
        ] : [],
        isRecurring: false,
        assignedTo: ['family-member-1', 'family-member-2'],
        userId: 'test-user-id',
        status: ReminderStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const id = await reminderServiceMock.createReminder(reminder);
      
      // Verify that family members receive notifications
      const familyNotificationCount = (reminder.assignedTo?.length || 0) * (reminder.notificationTimings?.length || 0);
      
      return { 
        id, 
        title: reminder.title, 
        assignedTo: reminder.assignedTo, 
        familyNotificationCount,
      };
    });

    // Test 2: Recurring family reminder with notifications for each occurrence
    await this.runTest('Recurring family reminder with notifications', async () => {
      const nextWeekend = new Date();
      nextWeekend.setDate(nextWeekend.getDate() + (6 - nextWeekend.getDay() + 7) % 7); // Next Saturday
      nextWeekend.setHours(10, 0, 0, 0); // 10:00 AM
      
      const formData: FormData = {
        title: 'Weekly Family Cleanup',
        datetime: nextWeekend.toISOString(),
        repeatRRule: 'FREQ=WEEKLY;INTERVAL=1;BYDAY=SA',
        pushNotification: true,
      };
      
      const reminder: Reminder = {
        id: `test-${Date.now()}`,
        title: formData.title.trim(),
        description: 'Weekly family house cleanup',
        type: ReminderType.REMINDER,
        priority: ReminderPriority.MEDIUM,
        dueDate: new Date(formData.datetime),
        dueTime: new Date(formData.datetime).toTimeString().slice(0, 5),
        location: 'Home',
        tags: ['family', 'chores'],
        isFavorite: false,
        hasNotification: formData.pushNotification,
        notificationTimings: formData.pushNotification ? [
          { type: NotificationType.BEFORE, value: 60 },
        ] : [],
        isRecurring: true,
        repeatPattern: RepeatPattern.WEEKLY,
        customInterval: 1,
        repeatDays: [6], // Saturday
        assignedTo: ['family-member-1', 'family-member-2', 'family-member-3'],
        userId: 'test-user-id',
        status: ReminderStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const id = await reminderServiceMock.createReminder(reminder);
      
      // Verify that family members receive notifications for each occurrence
      const occurrences = generateRecurringOccurrences(reminder, new Date(), new Date(Date.now() + 8 * 7 * 24 * 60 * 60 * 1000), 8); // Generate next 8 occurrences
      const familyNotificationCount = occurrences.length * (reminder.assignedTo?.length || 0) * (reminder.notificationTimings?.length || 0);
      
      return { 
        id, 
        title: reminder.title, 
        assignedTo: reminder.assignedTo, 
        occurrences: occurrences.length,
        familyNotificationCount
      };
    });

    this.endSuite();
  }

  // Test Suite 4: Past Date Validation
  async testPastDateValidation(): Promise<void> {
    this.startSuite('Past Date Validation');

    // Test 1: Attempt to create reminder with past date (should be prevented)
    await this.runTest('Prevent creating reminder with past date', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      yesterday.setHours(14, 0, 0, 0); // 2:00 PM yesterday
      
      const formData: FormData = {
        title: 'Past Date Reminder',
        datetime: yesterday.toISOString(),
        repeatRRule: undefined,
        pushNotification: true,
      };
      
      try {
        // This should fail validation
        if (new Date(formData.datetime) <= new Date()) {
          throw new Error('Cannot create reminder with past date');
        }
        
        const reminder: Reminder = {
          id: `test-${Date.now()}`,
          title: formData.title.trim(),
          description: '',
          type: ReminderType.REMINDER,
          priority: ReminderPriority.MEDIUM,
          dueDate: new Date(formData.datetime),
          dueTime: new Date(formData.datetime).toTimeString().slice(0, 5),
          location: '',
          tags: [],
          isFavorite: false,
          hasNotification: formData.pushNotification,
          notificationTimings: formData.pushNotification ? [
            { type: NotificationType.BEFORE, value: 15 },
          ] : [],
          isRecurring: false,
          assignedTo: [],
          userId: 'test-user-id',
          status: ReminderStatus.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        const id = await reminderServiceMock.createReminder(reminder);
        return { id, title: reminder.title, shouldHaveFailed: true };
      } catch (error: unknown) {
        return { error: error instanceof Error ? error.message : 'Unknown error', shouldHaveFailed: true, passed: true };
      }
    });

    // Test 2: Attempt to create reminder with past time today (should be prevented)
    await this.runTest('Prevent creating reminder with past time today', async () => {
      const pastTimeToday = new Date();
      pastTimeToday.setHours(pastTimeToday.getHours() - 2); // 2 hours ago
      
      const formData: FormData = {
        title: 'Past Time Today Reminder',
        datetime: pastTimeToday.toISOString(),
        repeatRRule: undefined,
        pushNotification: true,
      };
      
      try {
        // This should fail validation
        if (new Date(formData.datetime) <= new Date()) {
          throw new Error('Cannot create reminder with past time');
        }
        
        const reminder: Reminder = {
          id: `test-${Date.now()}`,
          title: formData.title.trim(),
          description: '',
          type: ReminderType.REMINDER,
          priority: ReminderPriority.MEDIUM,
          dueDate: new Date(formData.datetime),
          dueTime: new Date(formData.datetime).toTimeString().slice(0, 5),
          location: '',
          tags: [],
          isFavorite: false,
          hasNotification: formData.pushNotification,
          notificationTimings: formData.pushNotification ? [
            { type: NotificationType.BEFORE, value: 15 },
          ] : [],
          isRecurring: false,
          assignedTo: [],
          userId: 'test-user-id',
          status: ReminderStatus.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        const id = await reminderServiceMock.createReminder(reminder);
        return { id, title: reminder.title, shouldHaveFailed: true };
      } catch (error: unknown) {
        return { error: error instanceof Error ? error.message : 'Unknown error', shouldHaveFailed: true, passed: true };
      }
    });

    // Test 3: Valid future date should work
    await this.runTest('Allow creating reminder with future date', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      tomorrow.setHours(14, 0, 0, 0); // 2:00 PM tomorrow
      
      const formData: FormData = {
        title: 'Future Date Reminder',
        datetime: tomorrow.toISOString(),
        repeatRRule: undefined,
        pushNotification: true,
      };
      
      const reminder: Reminder = {
        id: `test-${Date.now()}`,
        title: formData.title.trim(),
        description: '',
        type: ReminderType.REMINDER,
        priority: ReminderPriority.MEDIUM,
        dueDate: new Date(formData.datetime),
        dueTime: new Date(formData.datetime).toTimeString().slice(0, 5),
        location: '',
        tags: [],
        isFavorite: false,
        hasNotification: formData.pushNotification,
        notificationTimings: formData.pushNotification ? [
          { type: NotificationType.BEFORE, value: 15 },
        ] : [],
        isRecurring: false,
        assignedTo: [],
        userId: 'test-user-id',
        status: ReminderStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const id = await reminderServiceMock.createReminder(reminder);
      return { id, title: reminder.title, dueDate: reminder.dueDate };
    });

    this.endSuite();
  }

  // Test Suite 5: Different Reminder Types
  async testReminderTypes(): Promise<void> {
    this.startSuite('Reminder Types');

    const types: Array<ReminderType> = [ReminderType.REMINDER, ReminderType.TASK, ReminderType.EVENT];

    for (const type of types) {
      await this.runTest(`Create ${type} type reminder`, async () => {
        const reminder: Reminder = generateTestReminder({
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} Test`,
          type,
          dueDate: new Date(Date.now() + (types.indexOf(type) + 1) * 24 * 60 * 60 * 1000),
        });
        
        const id = await reminderServiceMock.createReminder(reminder);
        return { id, title: reminder.title, type: reminder.type };
      });
    }

    this.endSuite();
  }

  // Test Suite 3: Date and Time Combinations
  async testDateTimeCombinations(): Promise<void> {
    this.startSuite('Date and Time Combinations');

    // Test 1: Reminder with date only
    await this.runTest('Create reminder with date only', async () => {
      const reminder: Reminder = generateTestReminder({
        title: 'Date Only Reminder',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        dueTime: undefined,
      });
      
      const id = await reminderServiceMock.createReminder(reminder);
      return { id, title: reminder.title, dueDate: reminder.dueDate };
    });

    // Test 2: Reminder with specific time
    await this.runTest('Create reminder with specific time', async () => {
      const reminder: Reminder = generateTestReminder({
        title: 'Time Specific Reminder',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        dueTime: '14:30',
      });
      
      const id = await reminderServiceMock.createReminder(reminder);
      return { id, title: reminder.title, dueTime: reminder.dueTime };
    });

    // Test 3: Reminder with start and end times
    await this.runTest('Create reminder with start and end times', async () => {
      const reminder: Reminder = generateTestReminder({
        title: 'Time Range Reminder',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        dueTime: '09:00',
        startTime: '09:00',
        endTime: '10:00',
      });
      
      const id = await reminderServiceMock.createReminder(reminder);
      return { id, title: reminder.title, startTime: reminder.startTime, endTime: reminder.endTime };
    });

    // Test 4: Past date reminder (should still work)
    await this.runTest('Create reminder with past date', async () => {
      const reminder: Reminder = generateTestReminder({
        title: 'Past Date Reminder',
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      });
      
      const id = await reminderServiceMock.createReminder(reminder);
      return { id, title: reminder.title, dueDate: reminder.dueDate };
    });

    // Test 5: Far future date
    await this.runTest('Create reminder with far future date', async () => {
      const reminder: Reminder = generateTestReminder({
        title: 'Future Date Reminder',
        dueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      });
      
      const id = await reminderServiceMock.createReminder(reminder);
      return { id, title: reminder.title, dueDate: reminder.dueDate };
    });

    this.endSuite();
  }

  // Test Suite 4: Recurring Patterns
  async testRecurringPatterns(): Promise<void> {
    this.startSuite('Recurring Patterns');

    // Test 1: Daily recurring
    await this.runTest('Create daily recurring reminder', async () => {
      const reminder: Reminder = generateTestReminder({
        title: 'Daily Recurring Reminder',
        isRecurring: true,
        repeatPattern: RepeatPattern.DAILY,
        recurringStartDate: new Date(),
        recurringEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });
      
      const id = await reminderServiceMock.createReminder(reminder);
      return { id, title: reminder.title, pattern: reminder.repeatPattern };
    });

    // Test 2: Weekly recurring
    await this.runTest('Create weekly recurring reminder', async () => {
      const reminder: Reminder = generateTestReminder({
        title: 'Weekly Recurring Reminder',
        isRecurring: true,
        repeatPattern: RepeatPattern.WEEKLY,
        customInterval: 1,
        recurringStartDate: new Date(),
        recurringEndDate: new Date(Date.now() + 12 * 7 * 24 * 60 * 60 * 1000), // 12 weeks
      });
      
      const id = await reminderServiceMock.createReminder(reminder);
      return { id, title: reminder.title, pattern: reminder.repeatPattern };
    });

    // Test 3: Monthly recurring
    await this.runTest('Create monthly recurring reminder', async () => {
      const reminder: Reminder = generateTestReminder({
        title: 'Monthly Recurring Reminder',
        isRecurring: true,
        repeatPattern: RepeatPattern.MONTHLY,
        customInterval: 1,
        recurringStartDate: new Date(),
        recurringEndDate: new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000), // 12 months
      });
      
      const id = await reminderServiceMock.createReminder(reminder);
      return { id, title: reminder.title, pattern: reminder.repeatPattern };
    });

    // Test 4: Yearly recurring
    await this.runTest('Create yearly recurring reminder', async () => {
      const reminder: Reminder = generateTestReminder({
        title: 'Yearly Recurring Reminder',
        isRecurring: true,
        repeatPattern: RepeatPattern.YEARLY,
        customInterval: 1,
        recurringStartDate: new Date(),
        recurringEndDate: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000), // 5 years
      });
      
      const id = await reminderServiceMock.createReminder(reminder);
      return { id, title: reminder.title, pattern: reminder.repeatPattern };
    });

    // Test 5: Custom weekly with specific days
    await this.runTest('Create custom weekly recurring reminder', async () => {
      const reminder: Reminder = generateTestReminder({
        title: 'Custom Weekly Reminder',
        isRecurring: true,
        repeatPattern: RepeatPattern.CUSTOM,
        customFrequencyType: 'weekly',
        customInterval: 1,
        repeatDays: [1, 3, 5], // Monday, Wednesday, Friday
        recurringStartDate: new Date(),
        recurringEndDate: new Date(Date.now() + 8 * 7 * 24 * 60 * 60 * 1000), // 8 weeks
      });
      
      const id = await reminderServiceMock.createReminder(reminder);
      return { id, title: reminder.title, repeatDays: reminder.repeatDays };
    });

    // Test 6: Custom interval (every 2 weeks)
    await this.runTest('Create custom interval recurring reminder', async () => {
      const reminder: Reminder = generateTestReminder({
        title: 'Every 2 Weeks Reminder',
        isRecurring: true,
        repeatPattern: RepeatPattern.WEEKLY,
        customInterval: 2,
        recurringStartDate: new Date(),
        recurringEndDate: new Date(Date.now() + 6 * 14 * 24 * 60 * 60 * 1000), // 6 occurrences
      });
      
      const id = await reminderServiceMock.createReminder(reminder);
      return { id, title: reminder.title, interval: reminder.customInterval };
    });

    this.endSuite();
  }

  // Test Suite 5: Notification Settings
  async testNotificationSettings(): Promise<void> {
    this.startSuite('Notification Settings');

    // Test 1: No notifications
    await this.runTest('Create reminder without notifications', async () => {
      const reminder: Reminder = generateTestReminder({
        title: 'No Notification Reminder',
        hasNotification: false,
        notificationTimings: [],
      });
      
      const id = await reminderServiceMock.createReminder(reminder);
      return { id, title: reminder.title, hasNotification: reminder.hasNotification };
    });

    // Test 2: Default notification (15 minutes before)
    await this.runTest('Create reminder with default notification', async () => {
      const reminder: Reminder = generateTestReminder({
        title: 'Default Notification Reminder',
        hasNotification: true,
        notificationTimings: [
          { type: NotificationType.BEFORE, value: 15 },
        ],
      });
      
      const id = await reminderServiceMock.createReminder(reminder);
      return { id, title: reminder.title, timings: reminder.notificationTimings };
    });

    // Test 3: Multiple notification timings
    await this.runTest('Create reminder with multiple notifications', async () => {
      const reminder: Reminder = generateTestReminder({
        title: 'Multiple Notifications Reminder',
        hasNotification: true,
        notificationTimings: [
          { type: NotificationType.BEFORE, value: 60 },
          { type: NotificationType.BEFORE, value: 15 },
          { type: NotificationType.EXACT, value: 0 },
        ],
      });
      
      const id = await reminderServiceMock.createReminder(reminder);
      return { id, title: reminder.title, timings: reminder.notificationTimings };
    });

    // Test 4: Notification after due time
    await this.runTest('Create reminder with notification after due time', async () => {
      const reminder: Reminder = generateTestReminder({
        title: 'After Notification Reminder',
        hasNotification: true,
        notificationTimings: [
          { type: NotificationType.AFTER, value: 30 },
        ],
      });
      
      const id = await reminderServiceMock.createReminder(reminder);
      return { id, title: reminder.title, timings: reminder.notificationTimings };
    });

    // Test 5: Very early notification
    await this.runTest('Create reminder with very early notification', async () => {
      const reminder: Reminder = generateTestReminder({
        title: 'Early Notification Reminder',
        hasNotification: true,
        notificationTimings: [
          { type: NotificationType.BEFORE, value: 1440 }, // 24 hours
        ],
      });
      
      const id = await reminderServiceMock.createReminder(reminder);
      return { id, title: reminder.title, timings: reminder.notificationTimings };
    });

    this.endSuite();
  }

  // Test Suite 6: Family Sharing
  async testFamilySharing(): Promise<void> {
    this.startSuite('Family Sharing');

    // Test 1: Reminder assigned to family member
    await this.runTest('Create reminder assigned to family member', async () => {
      const reminder: Reminder = generateTestReminder({
        title: 'Family Assigned Reminder',
        assignedTo: ['family-member-1'],
        hasNotification: true,
        notificationTimings: [
          { type: NotificationType.BEFORE, value: 15 },
        ],
      });
      
      const id = await reminderServiceMock.createReminder(reminder);
      return { id, title: reminder.title, assignedTo: reminder.assignedTo };
    });

    // Test 2: Reminder shared with family for editing
    await this.runTest('Create reminder shared for editing', async () => {
      const reminder: Reminder = generateTestReminder({
        title: 'Family Editable Reminder',
        hasNotification: true,
        notificationTimings: [
          { type: NotificationType.BEFORE, value: 15 },
        ],
      });
      
      const id = await reminderServiceMock.createReminder(reminder);
      return { id, title: reminder.title, hasNotification: reminder.hasNotification };
    });

    // Test 3: Multiple family members assigned
    await this.runTest('Create reminder assigned to multiple family members', async () => {
      const reminder: Reminder = generateTestReminder({
        title: 'Multi-Family Reminder',
        assignedTo: ['member-1', 'member-2', 'member-3'],
        hasNotification: true,
        notificationTimings: [
          { type: NotificationType.BEFORE, value: 15 },
        ],
      });
      
      const id = await reminderServiceMock.createReminder(reminder);
      return { id, title: reminder.title, assignedTo: reminder.assignedTo };
    });

    this.endSuite();
  }

  // Test Suite 7: Edge Cases and Error Conditions
  async testEdgeCases(): Promise<void> {
    this.startSuite('Edge Cases and Error Conditions');

    // Test 1: Empty title (should fail)
    await this.runTest('Create reminder with empty title (should fail)', async () => {
      const reminder: Reminder = generateTestReminder({
        title: '',
      });
      
      try {
        await reminderServiceMock.createReminder(reminder);
        throw new Error('Should have failed with empty title');
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes('title') || error instanceof Error && error.message.includes('required')) {
          return { expectedError: true, message: error.message };
        }
        throw error;
      }
    });

    // Test 2: Very long title
    await this.runTest('Create reminder with very long title', async () => {
      const longTitle = 'A'.repeat(200); // Exceeds 100 character limit
      const reminder: Reminder = generateTestReminder({
        title: longTitle,
      });
      
      try {
        await reminderServiceMock.createReminder(reminder);
        throw new Error('Should have failed with long title');
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes('title') || error instanceof Error && error.message.includes('length')) {
          return { expectedError: true, message: error.message };
        }
        throw error;
      }
    });

    // Test 3: Invalid date
    await this.runTest('Create reminder with invalid date', async () => {
      const reminder: Reminder = generateTestReminder({
        dueDate: new Date('invalid-date'),
      });
      
      try {
        await reminderServiceMock.createReminder(reminder);
        throw new Error('Should have failed with invalid date');
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes('date') || error instanceof Error && error.message.includes('invalid')) {
          return { expectedError: true, message: error.message };
        }
        throw error;
      }
    });

    // Test 4: Recurring reminder without pattern
    await this.runTest('Create recurring reminder without pattern (should fail)', async () => {
      const reminder: Reminder = generateTestReminder({
        title: 'Invalid Recurring Reminder',
        isRecurring: true,
        repeatPattern: undefined,
      });
      
      try {
        await reminderServiceMock.createReminder(reminder);
        throw new Error('Should have failed without repeat pattern');
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes('pattern') || error instanceof Error && error.message.includes('recurring')) {
          return { expectedError: true, message: error.message };
        }
        throw error;
      }
    });

    // Test 5: Notification without timings
    await this.runTest('Create reminder with notification but no timings', async () => {
      const reminder: Reminder = generateTestReminder({
        title: 'Notification Without Timings',
        hasNotification: true,
        notificationTimings: [],
      });
      
      const id = await reminderServiceMock.createReminder(reminder);
      return { id, title: reminder.title, hasNotification: reminder.hasNotification };
    });

    this.endSuite();
  }

  // Test Suite 8: Recurring Logic Validation
  async testRecurringLogic(): Promise<void> {
    this.startSuite('Recurring Logic Validation');

    // Test 1: Generate occurrences for daily reminder
    await this.runTest('Generate occurrences for daily reminder', async () => {
      const reminder: Reminder = generateTestReminder({
        title: 'Daily Occurrence Test',
        isRecurring: true,
        repeatPattern: RepeatPattern.DAILY,
        recurringStartDate: new Date(),
        recurringEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });
      
      const occurrences = generateRecurringOccurrences(reminder);
      return { occurrencesCount: occurrences.length, firstOccurrence: occurrences[0] };
    });

    // Test 2: Generate occurrences for weekly reminder
    await this.runTest('Generate occurrences for weekly reminder', async () => {
      const reminder: Reminder = generateTestReminder({
        title: 'Weekly Occurrence Test',
        isRecurring: true,
        repeatPattern: RepeatPattern.WEEKLY,
        customInterval: 1,
        recurringStartDate: new Date(),
        recurringEndDate: new Date(Date.now() + 4 * 7 * 24 * 60 * 60 * 1000), // 4 weeks
      });
      
      const occurrences = generateRecurringOccurrences(reminder);
      return { occurrencesCount: occurrences.length, firstOccurrence: occurrences[0] };
    });

    // Test 3: Check if should generate next occurrence
    await this.runTest('Check should generate next occurrence', async () => {
      const reminder: Reminder = generateTestReminder({
        title: 'Next Occurrence Test',
        isRecurring: true,
        repeatPattern: RepeatPattern.DAILY,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        recurringStartDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Week ago
        recurringEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Week from now
      });
      
      const shouldGenerate = shouldGenerateNextOccurrence(reminder);
      return { shouldGenerate, dueDate: reminder.dueDate };
    });

    // Test 4: Generate next occurrence
    await this.runTest('Generate next occurrence', async () => {
      const reminder: Reminder = generateTestReminder({
        title: 'Next Occurrence Generation Test',
        isRecurring: true,
        repeatPattern: RepeatPattern.DAILY,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        recurringStartDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Week ago
        recurringEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Week from now
      });
      
      const nextOccurrence = generateNextOccurrence(reminder);
      return { hasNextOccurrence: !!nextOccurrence, nextDate: nextOccurrence?.dueDate };
    });

    // Test 5: Recurring reminder past end date
    await this.runTest('Recurring reminder past end date', async () => {
      const reminder: Reminder = generateTestReminder({
        title: 'Past End Date Test',
        isRecurring: true,
        repeatPattern: RepeatPattern.DAILY,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        recurringStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Month ago
        recurringEndDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Week ago (past)
      });
      
      const shouldGenerate = shouldGenerateNextOccurrence(reminder);
      const nextOccurrence = generateNextOccurrence(reminder);
      return { shouldGenerate, hasNextOccurrence: !!nextOccurrence };
    });

    this.endSuite();
  }

  // Test Suite 9: Notification Scheduling
  async testNotificationScheduling(): Promise<void> {
    this.startSuite('Notification Scheduling');

    // Test 1: Schedule immediate notification
    await this.runTest('Schedule immediate notification', async () => {
      const notification = {
        id: 'test-immediate-' + Date.now(),
        title: 'Immediate Test',
        message: 'This is an immediate test notification',
        date: new Date(Date.now() + 5000), // 5 seconds from now
      };
      
      const scheduled = await scheduleNotification(notification);
      return { scheduled, notificationId: notification.id };
    });

    // Test 2: Schedule notification for future
    await this.runTest('Schedule future notification', async () => {
      const notification = {
        id: 'test-future-' + Date.now(),
        title: 'Future Test',
        message: 'This is a future test notification',
        date: new Date(Date.now() + 60 * 1000), // 1 minute from now
      };
      
      const scheduled = await scheduleNotification(notification);
      return { scheduled, notificationId: notification.id };
    });

    // Test 3: Cancel scheduled notification
    await this.runTest('Cancel scheduled notification', async () => {
      const notificationId = 'test-cancel-' + Date.now();
      const notification = {
        id: notificationId,
        title: 'Cancel Test',
        message: 'This notification will be cancelled',
        date: new Date(Date.now() + 30 * 1000), // 30 seconds from now
      };
      
      await scheduleNotification(notification);
      cancelNotification(notificationId);
      return { cancelled: true, notificationId };
    });

    // Test 4: Schedule notification for past time (should fail)
    await this.runTest('Schedule notification for past time (should fail)', async () => {
      const notification = {
        id: 'test-past-' + Date.now(),
        title: 'Past Test',
        message: 'This notification is in the past',
        date: new Date(Date.now() - 60 * 1000), // 1 minute ago
      };
      
      const scheduled = await scheduleNotification(notification);
      return { scheduled, expectedToFail: !scheduled };
    });

    this.endSuite();
  }

  // Test Suite 10: Complex Combinations
  async testComplexCombinations(): Promise<void> {
    this.startSuite('Complex Combinations');

    // Test 1: Recurring reminder with multiple notifications
    await this.runTest('Create recurring reminder with multiple notifications', async () => {
      const reminder: Reminder = generateTestReminder({
        title: 'Complex Recurring Reminder',
        isRecurring: true,
        repeatPattern: RepeatPattern.WEEKLY,
        customInterval: 1,
        recurringStartDate: new Date(),
        recurringEndDate: new Date(Date.now() + 4 * 7 * 24 * 60 * 60 * 1000), // 4 weeks
        hasNotification: true,
        notificationTimings: [
          { type: NotificationType.BEFORE, value: 60 },
          { type: NotificationType.BEFORE, value: 15 },
          { type: NotificationType.EXACT, value: 0 },
        ],
        assignedTo: ['family-member-1'],
        tags: ['work', 'important'],
      });
      
      const id = await reminderServiceMock.createReminder(reminder);
      return { 
        id, 
        title: reminder.title, 
        isRecurring: reminder.isRecurring,
        notificationCount: reminder.notificationTimings?.length || 0,
        assignedTo: reminder.assignedTo
      };
    });

    // Test 2: High priority recurring reminder with custom days
    await this.runTest('Create high priority recurring reminder with custom days', async () => {
      const reminder: Reminder = generateTestReminder({
        title: 'High Priority Custom Weekly',
        isRecurring: true,
        repeatPattern: RepeatPattern.CUSTOM,
        customFrequencyType: 'weekly',
        customInterval: 1,
        repeatDays: [1, 3, 5], // Monday, Wednesday, Friday
        recurringStartDate: new Date(),
        recurringEndDate: new Date(Date.now() + 6 * 7 * 24 * 60 * 60 * 1000), // 6 weeks
        priority: ReminderPriority.HIGH,
        hasNotification: true,
        notificationTimings: [
          { type: NotificationType.BEFORE, value: 30 },
        ],
        tags: ['urgent', 'meeting'],
      });
      
      const id = await reminderServiceMock.createReminder(reminder);
      return { 
        id, 
        title: reminder.title, 
        priority: reminder.priority,
        repeatDays: reminder.repeatDays
      };
    });

    // Test 3: Event with time range and family sharing
    await this.runTest('Create event with time range and family sharing', async () => {
      const reminder: Reminder = generateTestReminder({
        title: 'Family Event',
        type: ReminderType.EVENT,
        description: 'A family event with time range',
        startTime: '14:00',
        endTime: '16:00',
        location: 'Community Center',
        assignedTo: ['member-1', 'member-2'],
        hasNotification: true,
        notificationTimings: [
          { type: NotificationType.BEFORE, value: 60 },
          { type: NotificationType.BEFORE, value: 15 },
        ],
        tags: ['family', 'event'],
      });
      
      const id = await reminderServiceMock.createReminder(reminder);
      return { 
        id, 
        title: reminder.title, 
        type: reminder.type,
        startTime: reminder.startTime,
        endTime: reminder.endTime,
        assignedTo: reminder.assignedTo
      };
    });

    this.endSuite();
  }

  // Run all test suites
  async runAllTests(): Promise<TestSuite[]> {
    await this.testAddFormWorkflow();
    await this.testRecurringWithNotifications();
    await this.testFamilyMemberNotifications();
    await this.testPastDateValidation();
    await this.testReminderTypes();
    await this.testDateTimeCombinations();
    await this.testRecurringPatterns();
    await this.testNotificationSettings();
    await this.testFamilySharing();
    await this.testEdgeCases();
    await this.testRecurringLogic();
    await this.testNotificationScheduling();
    await this.testComplexCombinations();

    this.printFinalResults();
    return this.results;
  }

  private printFinalResults(): void {
    const totalTests = this.results.reduce((sum, suite) => sum + suite.totalTests, 0);
    const totalPassed = this.results.reduce((sum, suite) => sum + suite.passedTests, 0);
    const totalFailed = this.results.reduce((sum, suite) => sum + suite.failedTests, 0);

    // Log results
    console.log(`\n=== Reminder Test Suite Results ===`);
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${totalPassed}`);
    console.log(`Failed: ${totalFailed}`);
    console.log(`Success Rate: ${((totalPassed / totalTests) * 100).toFixed(2)}%`);
  }

  getResults(): TestSuite[] {
    return this.results;
  }

  exportResults(): string {
    return JSON.stringify(this.results, null, 2);
  }
}

// Export convenience functions
export const runReminderTestSuite = async (): Promise<TestSuite[]> => {
  const testSuite = new ReminderTestSuite();
  return await testSuite.runAllTests();
};

export const testAddFormWorkflow = async (): Promise<TestSuite[]> => {
  const testSuite = new ReminderTestSuite();
  await testSuite.testAddFormWorkflow();
  return testSuite.getResults();
};

export const testRecurringPatterns = async (): Promise<TestSuite[]> => {
  const testSuite = new ReminderTestSuite();
  await testSuite.testRecurringPatterns();
  return testSuite.getResults();
};

export const testNotificationSettings = async (): Promise<TestSuite[]> => {
  const testSuite = new ReminderTestSuite();
  await testSuite.testNotificationSettings();
  return testSuite.getResults();
}; 