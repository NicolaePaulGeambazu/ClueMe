import { 
  parseRecurringPattern,
  calculateNextOccurrenceDate,
  shouldGenerateNextOccurrence,
  generateNextOccurrence,
  generateOccurrences,
  isRecurringReminder,
  getRecurringPatternDescription,
  validateRecurringPattern,
  RecurringPattern,
  RecurringOccurrence
} from '../recurringReminderUtils';
import { Reminder } from '../../services/firebaseService';

// Mock Reminder type for testing
const createMockReminder = (overrides: Partial<Reminder> = {}): Reminder => ({
  id: 'test-reminder-1',
  title: 'Test Reminder',
  description: 'Test Description',
  type: 'event',
  priority: 'medium',
  dueDate: new Date('2024-01-15'),
  dueTime: '10:00',
  location: '',
  isFavorite: false,
  isRecurring: false,
  repeatPattern: 'daily',
  customInterval: 1,
  hasNotification: true,
  notificationTimings: [],
  assignedTo: [],
  tags: [],
  completed: false,
  status: 'pending',
  userId: 'test-user',
  repeatDays: [],
  recurringStartDate: new Date('2024-01-15'),
  recurringEndDate: undefined,
  customFrequencyType: undefined,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
} as Reminder);

// Simple test runner
const runTests = () => {
  
  let passedTests = 0;
  let failedTests = 0;
  
  const test = (name: string, fn: () => void) => {
    try {
      fn();
      passedTests++;
    } catch (error) {
      failedTests++;
    }
  };
  
  const expect = (actual: any) => ({
    toBe: (expected: any) => {
      if (actual !== expected) {
        throw new Error(`Expected ${actual} to be ${expected}`);
      }
    },
    toBeInstanceOf: (constructor: any) => {
      if (!(actual instanceof constructor)) {
        throw new Error(`Expected ${actual} to be instance of ${constructor.name}`);
      }
    },
    toHaveLength: (length: number) => {
      if (actual.length !== length) {
        throw new Error(`Expected length ${length}, got ${actual.length}`);
      }
    },
    toBeGreaterThanOrEqual: (value: number) => {
      if (actual < value) {
        throw new Error(`Expected ${actual} to be >= ${value}`);
      }
    },
    toBeLessThanOrEqual: (value: number) => {
      if (actual > value) {
        throw new Error(`Expected ${actual} to be <= ${value}`);
      }
    },
    toBeGreaterThan: (value: number) => {
      if (actual <= value) {
        throw new Error(`Expected ${actual} to be > ${value}`);
      }
    },
    toContain: (item: any) => {
      if (!actual.includes(item)) {
        throw new Error(`Expected ${actual} to contain ${item}`);
      }
    },
    toBeUndefined: () => {
      if (actual !== undefined) {
        throw new Error(`Expected undefined, got ${actual}`);
      }
    },
    toBeNull: () => {
      if (actual !== null) {
        throw new Error(`Expected null, got ${actual}`);
      }
    },
    toEqual: (expected: any) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
      }
    },
    toBeTruthy: () => {
      if (!actual) {
        throw new Error(`Expected truthy value, got ${actual}`);
      }
    },
    toBeFalsy: () => {
      if (actual) {
        throw new Error(`Expected falsy value, got ${actual}`);
      }
    }
  });

  // Test parseRecurringPattern
  test('parseRecurringPattern should parse daily pattern', () => {
    const reminder = createMockReminder({
      repeatPattern: 'daily',
      isRecurring: true
    });
    
    const pattern = parseRecurringPattern(reminder);
    expect(pattern.type).toBe('daily');
    expect(pattern.interval).toBeUndefined();
  });

  test('parseRecurringPattern should parse weekly pattern with days', () => {
    const reminder = createMockReminder({
      repeatPattern: 'weekly',
      isRecurring: true,
      repeatDays: [1, 3, 5] // Monday, Wednesday, Friday
    });
    
    const pattern = parseRecurringPattern(reminder);
    expect(pattern.type).toBe('weekly');
    expect(pattern.daysOfWeek).toEqual([1, 3, 5]);
  });

  test('parseRecurringPattern should parse custom interval', () => {
    const reminder = createMockReminder({
      repeatPattern: 'daily',
      customInterval: 3,
      isRecurring: true
    });
    
    const pattern = parseRecurringPattern(reminder);
    expect(pattern.type).toBe('daily');
    expect(pattern.interval).toBe(3);
  });

  test('parseRecurringPattern should parse end date', () => {
    const reminder = createMockReminder({
      repeatPattern: 'daily',
      recurringEndDate: new Date('2024-12-31'),
      isRecurring: true
    });
    
    const pattern = parseRecurringPattern(reminder);
    expect(pattern.type).toBe('daily');
    expect(pattern.endDate).toEqual(new Date('2024-12-31'));
  });

  // Test calculateNextOccurrenceDate
  test('calculateNextOccurrenceDate should calculate next daily occurrence', () => {
    const currentDate = new Date('2024-01-15');
    const pattern: RecurringPattern = { type: 'daily' };
    
    const nextDate = calculateNextOccurrenceDate(currentDate, pattern);
    expect(nextDate).toBeInstanceOf(Date);
    expect(nextDate!.getDate()).toBe(16); // Next day
  });

  test('calculateNextOccurrenceDate should calculate next weekly occurrence', () => {
    const currentDate = new Date('2024-01-15'); // Monday
    const pattern: RecurringPattern = { 
      type: 'weekly',
      daysOfWeek: [3] // Wednesday
    };
    
    const nextDate = calculateNextOccurrenceDate(currentDate, pattern);
    expect(nextDate).toBeInstanceOf(Date);
    expect(nextDate!.getDay()).toBe(3); // Wednesday
  });

  test('calculateNextOccurrenceDate should respect end date', () => {
    const currentDate = new Date('2024-01-15');
    const pattern: RecurringPattern = { 
      type: 'daily',
      endDate: new Date('2024-01-16')
    };
    
    // Should get next occurrence
    const nextDate = calculateNextOccurrenceDate(currentDate, pattern);
    expect(nextDate).toBeInstanceOf(Date);
    expect(nextDate!.getDate()).toBe(16);
    
    // Should return null after end date
    const afterEndDate = new Date('2024-01-17');
    const noNextDate = calculateNextOccurrenceDate(afterEndDate, pattern);
    expect(noNextDate).toBeNull();
  });

  test('calculateNextOccurrenceDate should handle weekdays pattern', () => {
    const currentDate = new Date('2024-01-15'); // Monday
    const pattern: RecurringPattern = { type: 'weekdays' };
    
    const nextDate = calculateNextOccurrenceDate(currentDate, pattern);
    expect(nextDate).toBeInstanceOf(Date);
    expect(nextDate!.getDay()).toBeGreaterThanOrEqual(1); // Tuesday or later
    expect(nextDate!.getDay()).toBeLessThanOrEqual(5); // Friday or earlier
  });

  test('calculateNextOccurrenceDate should handle weekends pattern', () => {
    const currentDate = new Date('2024-01-15'); // Monday
    const pattern: RecurringPattern = { type: 'weekends' };
    
    const nextDate = calculateNextOccurrenceDate(currentDate, pattern);
    expect(nextDate).toBeInstanceOf(Date);
    expect([0, 6]).toContain(nextDate!.getDay()); // Sunday or Saturday
  });

  test('calculateNextOccurrenceDate should handle monthly pattern', () => {
    const currentDate = new Date('2024-01-15');
    const pattern: RecurringPattern = { type: 'monthly' };
    
    const nextDate = calculateNextOccurrenceDate(currentDate, pattern);
    expect(nextDate).toBeInstanceOf(Date);
    expect(nextDate!.getMonth()).toBe(1); // February
    expect(nextDate!.getDate()).toBe(15); // Same day
  });

  test('calculateNextOccurrenceDate should handle yearly pattern', () => {
    const currentDate = new Date('2024-01-15');
    const pattern: RecurringPattern = { type: 'yearly' };
    
    const nextDate = calculateNextOccurrenceDate(currentDate, pattern);
    expect(nextDate).toBeInstanceOf(Date);
    expect(nextDate!.getFullYear()).toBe(2025);
    expect(nextDate!.getMonth()).toBe(0); // January
    expect(nextDate!.getDate()).toBe(15); // Same day
  });

  // Test shouldGenerateNextOccurrence
  test('shouldGenerateNextOccurrence should return true for recurring reminders', () => {
    const reminder = createMockReminder({
      isRecurring: true,
      repeatPattern: 'daily',
      completed: false
    });
    
    expect(shouldGenerateNextOccurrence(reminder)).toBeTruthy();
  });

  test('shouldGenerateNextOccurrence should return false for non-recurring reminders', () => {
    const reminder = createMockReminder({
      isRecurring: false,
      completed: false
    });
    
    expect(shouldGenerateNextOccurrence(reminder)).toBeFalsy();
  });

  test('shouldGenerateNextOccurrence should return false for completed reminders', () => {
    const reminder = createMockReminder({
      isRecurring: true,
      repeatPattern: 'daily',
      completed: true
    });
    
    expect(shouldGenerateNextOccurrence(reminder)).toBeFalsy();
  });

  test('shouldGenerateNextOccurrence should return false when past end date', () => {
    const reminder = createMockReminder({
      isRecurring: true,
      repeatPattern: 'daily',
      recurringEndDate: new Date('2024-01-01'), // Past date
      completed: false
    });
    
    expect(shouldGenerateNextOccurrence(reminder)).toBeFalsy();
  });

  // Test generateNextOccurrence
  test('generateNextOccurrence should generate next occurrence for daily reminder', () => {
    const reminder = createMockReminder({
      isRecurring: true,
      repeatPattern: 'daily',
      dueDate: new Date('2024-01-15'),
      completed: false
    });
    
    const nextOccurrence = generateNextOccurrence(reminder);
    expect(nextOccurrence).toBeInstanceOf(Object);
    expect(nextOccurrence!.dueDate).toBeInstanceOf(Date);
    expect(nextOccurrence!.dueDate.getDate()).toBe(16); // Next day
    expect(nextOccurrence!.isRecurring).toBeTruthy();
  });

  test('generateNextOccurrence should return null for non-recurring reminders', () => {
    const reminder = createMockReminder({
      isRecurring: false,
      completed: false
    });
    
    const nextOccurrence = generateNextOccurrence(reminder);
    expect(nextOccurrence).toBeNull();
  });

  test('generateNextOccurrence should return null for completed reminders', () => {
    const reminder = createMockReminder({
      isRecurring: true,
      repeatPattern: 'daily',
      completed: true
    });
    
    const nextOccurrence = generateNextOccurrence(reminder);
    expect(nextOccurrence).toBeNull();
  });

  // Test generateOccurrences
  test('generateOccurrences should generate multiple occurrences', () => {
    const reminder = createMockReminder({
      isRecurring: true,
      repeatPattern: 'daily',
      dueDate: new Date('2024-01-15'),
      completed: false
    });
    
    const occurrences = generateOccurrences(reminder, 5);
    expect(occurrences).toHaveLength(5);
    expect(occurrences[0].dueDate.getDate()).toBe(16); // First occurrence
    expect(occurrences[4].dueDate.getDate()).toBe(20); // Fifth occurrence
  });

  test('generateOccurrences should respect max occurrences', () => {
    const reminder = createMockReminder({
      isRecurring: true,
      repeatPattern: 'daily',
      dueDate: new Date('2024-01-15'),
      completed: false
    });
    
    const occurrences = generateOccurrences(reminder, 3);
    expect(occurrences).toHaveLength(3);
  });

  test('generateOccurrences should respect end date', () => {
    const reminder = createMockReminder({
      isRecurring: true,
      repeatPattern: 'daily',
      dueDate: new Date('2024-01-15'),
      recurringEndDate: new Date('2024-01-17'), // Only 2 more days
      completed: false
    });
    
    const occurrences = generateOccurrences(reminder, 10);
    expect(occurrences).toHaveLength(2); // Should stop at end date
  });

  // Test isRecurringReminder
  test('isRecurringReminder should return true for recurring reminders', () => {
    const reminder = createMockReminder({
      isRecurring: true,
      repeatPattern: 'daily'
    });
    
    expect(isRecurringReminder(reminder)).toBeTruthy();
  });

  test('isRecurringReminder should return false for non-recurring reminders', () => {
    const reminder = createMockReminder({
      isRecurring: false
    });
    
    expect(isRecurringReminder(reminder)).toBeFalsy();
  });

  // Test getRecurringPatternDescription
  test('getRecurringPatternDescription should describe daily pattern', () => {
    const reminder = createMockReminder({
      repeatPattern: 'daily'
    });
    
    const description = getRecurringPatternDescription(reminder);
    expect(description).toContain('Daily');
  });

  test('getRecurringPatternDescription should describe weekly pattern', () => {
    const reminder = createMockReminder({
      repeatPattern: 'weekly',
      repeatDays: [1, 3, 5]
    });
    
    const description = getRecurringPatternDescription(reminder);
    expect(description).toContain('Weekly');
    expect(description).toContain('Monday');
    expect(description).toContain('Wednesday');
    expect(description).toContain('Friday');
  });

  test('getRecurringPatternDescription should describe custom interval', () => {
    const reminder = createMockReminder({
      repeatPattern: 'daily',
      customInterval: 3
    });
    
    const description = getRecurringPatternDescription(reminder);
    expect(description).toContain('Every 3 days');
  });

  // Test validateRecurringPattern
  test('validateRecurringPattern should validate valid pattern', () => {
    const pattern: RecurringPattern = {
      type: 'daily'
    };
    
    const result = validateRecurringPattern(pattern);
    expect(result.isValid).toBeTruthy();
    expect(result.errors).toHaveLength(0);
  });

  test('validateRecurringPattern should catch invalid pattern type', () => {
    const pattern: RecurringPattern = {
      type: 'invalid' as any
    };
    
    const result = validateRecurringPattern(pattern);
    expect(result.isValid).toBeFalsy();
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('validateRecurringPattern should catch invalid interval', () => {
    const pattern: RecurringPattern = {
      type: 'daily',
      interval: 0
    };
    
    const result = validateRecurringPattern(pattern);
    expect(result.isValid).toBeFalsy();
    expect(result.errors.length).toBeGreaterThan(0);
  });

  // Test edge cases
  test('calculateNextOccurrenceDate should handle leap year', () => {
    const currentDate = new Date('2024-02-29'); // Leap year
    const pattern: RecurringPattern = { type: 'yearly' };
    
    const nextDate = calculateNextOccurrenceDate(currentDate, pattern);
    expect(nextDate).toBeInstanceOf(Date);
    expect(nextDate!.getFullYear()).toBe(2025);
    expect(nextDate!.getMonth()).toBe(2); // March (no Feb 29 in 2025)
    expect(nextDate!.getDate()).toBe(1); // March 1st
  });

  test('calculateNextOccurrenceDate should handle month end dates', () => {
    const currentDate = new Date('2024-01-31'); // January 31st
    const pattern: RecurringPattern = { type: 'monthly' };
    
    const nextDate = calculateNextOccurrenceDate(currentDate, pattern);
    expect(nextDate).toBeInstanceOf(Date);
    expect(nextDate!.getMonth()).toBe(1); // February
    expect(nextDate!.getDate()).toBe(29); // February 29th (leap year)
  });

  test('calculateNextOccurrenceDate should handle invalid end date', () => {
    const currentDate = new Date('2024-01-15');
    const pattern: RecurringPattern = { 
      type: 'daily',
      endDate: 'invalid-date' as any
    };
    
    const nextDate = calculateNextOccurrenceDate(currentDate, pattern);
    expect(nextDate).toBeInstanceOf(Date); // Should still work, just ignore invalid end date
  });

  // Performance tests
  test('calculateNextOccurrenceDate should not exceed max iterations', () => {
    const currentDate = new Date('2024-01-15');
    const pattern: RecurringPattern = { 
      type: 'daily',
      endDate: new Date('2025-01-15') // Far future
    };
    
    const startTime = Date.now();
    const nextDate = calculateNextOccurrenceDate(currentDate, pattern, 5); // Max 5 iterations
    const endTime = Date.now();
    
    expect(nextDate).toBeInstanceOf(Date);
    expect(endTime - startTime).toBeLessThanOrEqual(100); // Should be fast
  });

  
  if (failedTests > 0) {
    process.exit(1);
  } else {
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

export { runTests }; 