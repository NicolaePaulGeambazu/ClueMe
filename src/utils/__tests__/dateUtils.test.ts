import {
  DateUtils,
  getTodayISO,
  formatDate,
  isToday,
  isOverdue,
  parseDateWithTimezone,
  compareDates,
  isDateInPast,
  isDateToday,
  normalizeDate,
  getUserTimezoneOffset,
  toUTCPreservingLocalTime,
  fromUTCToLocal,
  getNextOccurrence,
  generateOccurrences,
} from '../dateUtils';

// Mock i18n - we'll handle this differently for now
const mockI18n = {
  language: 'en',
};

// Simple test runner for now - we'll enhance this later
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
  });

  // Reset DateUtils configuration before each test
  DateUtils.configure({
    dateFormat: 'european',
    timeFormat: '24h',
    locale: 'en',
  });

  // Test getTodayISO
  test('getTodayISO should return today in ISO format', () => {
    const today = new Date();
    const expected = today.toISOString().split('T')[0]; // YYYY-MM-DD
    expect(getTodayISO()).toBe(expected);
  });

  // Test formatDate
  test('formatDate should format date in european format by default', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date)).toBe('15/01/2024');
  });

  test('formatDate should format date in american format when specified', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date, 'american')).toBe('01/15/2024');
  });

  test('formatDate should format date in ISO format when specified', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date, 'iso')).toBe('2024-01-15');
  });

  test('formatDate should handle string dates', () => {
    expect(formatDate('2024-01-15')).toBe('15/01/2024');
  });

  // Test isToday
  test('isToday should return true for today', () => {
    expect(isToday(new Date())).toBe(true);
  });

  test('isToday should return false for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isToday(yesterday)).toBe(false);
  });

  test('isToday should return false for tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isToday(tomorrow)).toBe(false);
  });

  test('isToday should handle string dates', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(isToday(today)).toBe(true);
  });

  // Test isOverdue
  test('isOverdue should return false for completed reminders', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = yesterday.toISOString().split('T')[0];

    expect(isOverdue(yesterdayISO, true)).toBe(false);
  });

  test('isOverdue should return false for reminders without due date', () => {
    expect(isOverdue(undefined, false)).toBe(false);
  });

  test('isOverdue should return true for overdue reminders', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = yesterday.toISOString().split('T')[0];

    expect(isOverdue(yesterdayISO, false)).toBe(true);
  });

  test('isOverdue should return false for future reminders', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = tomorrow.toISOString().split('T')[0];

    expect(isOverdue(tomorrowISO, false)).toBe(false);
  });

  // Test parseDateWithTimezone
  test('parseDateWithTimezone should parse date string correctly', () => {
    const dateString = '2024-01-15';
    const result = parseDateWithTimezone(dateString);

    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(0); // January is 0
    expect(result.getDate()).toBe(15);
  });

  test('parseDateWithTimezone should handle time string', () => {
    const dateString = '2024-01-15';
    const timeString = '14:30';
    const result = parseDateWithTimezone(dateString, timeString);

    expect(result.getHours()).toBe(14);
    expect(result.getMinutes()).toBe(30);
  });

  // Test compareDates
  test('compareDates should return 0 for equal dates', () => {
    const date1 = new Date('2024-01-15');
    const date2 = new Date('2024-01-15');
    expect(compareDates(date1, date2)).toBe(0);
  });

  test('compareDates should return -1 when first date is before second', () => {
    const date1 = new Date('2024-01-15');
    const date2 = new Date('2024-01-16');
    expect(compareDates(date1, date2)).toBe(-1);
  });

  test('compareDates should return 1 when first date is after second', () => {
    const date1 = new Date('2024-01-16');
    const date2 = new Date('2024-01-15');
    expect(compareDates(date1, date2)).toBe(1);
  });

  test('compareDates should handle string dates', () => {
    expect(compareDates('2024-01-15', '2024-01-16')).toBe(-1);
  });

  // Test isDateInPast
  test('isDateInPast should return true for past dates', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isDateInPast(yesterday)).toBe(true);
  });

  test('isDateInPast should return false for future dates', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isDateInPast(tomorrow)).toBe(false);
  });

  test('isDateInPast should return false for today', () => {
    expect(isDateInPast(new Date())).toBe(false);
  });

  // Test isDateToday
  test('isDateToday should return true for today', () => {
    expect(isDateToday(new Date())).toBe(true);
  });

  test('isDateToday should return false for other dates', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isDateToday(tomorrow)).toBe(false);
  });

  // Test normalizeDate
  test('normalizeDate should return undefined for null/undefined input', () => {
    expect(normalizeDate(null)).toBeUndefined();
    expect(normalizeDate(undefined)).toBeUndefined();
  });

  test('normalizeDate should return Date object for valid input', () => {
    const date = new Date('2024-01-15');
    expect(normalizeDate(date)).toEqual(date);
  });

  test('normalizeDate should parse string dates', () => {
    const result = normalizeDate('2024-01-15');
    expect(result).toBeInstanceOf(Date);
    expect(result?.getFullYear()).toBe(2024);
    expect(result?.getMonth()).toBe(0);
    expect(result?.getDate()).toBe(15);
  });

  // Test getUserTimezoneOffset
  test('getUserTimezoneOffset should return timezone offset in minutes', () => {
    const offset = getUserTimezoneOffset();
    expect(typeof offset).toBe('number');
    expect(offset).toBeGreaterThanOrEqual(-720); // -12 hours
    expect(offset).toBeLessThanOrEqual(720); // +12 hours
  });

  // Test getNextOccurrence
  test('getNextOccurrence should generate next daily occurrence', () => {
    const baseDate = new Date('2024-01-15');
    const nextDate = getNextOccurrence(baseDate, 'daily');

    expect(nextDate).toBeInstanceOf(Date);
    expect(nextDate?.getDate()).toBe(16);
    expect(nextDate?.getMonth()).toBe(0);
    expect(nextDate?.getFullYear()).toBe(2024);
  });

  test('getNextOccurrence should generate next weekly occurrence', () => {
    const baseDate = new Date('2024-01-15'); // Monday
    const nextDate = getNextOccurrence(baseDate, 'weekly');

    expect(nextDate).toBeInstanceOf(Date);
    expect(nextDate?.getDate()).toBe(22); // Next Monday
  });

  test('getNextOccurrence should generate next monthly occurrence', () => {
    const baseDate = new Date('2024-01-15');
    const nextDate = getNextOccurrence(baseDate, 'monthly');

    expect(nextDate).toBeInstanceOf(Date);
    expect(nextDate?.getDate()).toBe(15);
    expect(nextDate?.getMonth()).toBe(1); // February
  });

  test('getNextOccurrence should respect end date', () => {
    const baseDate = new Date('2024-01-15');
    const endDate = new Date('2024-01-20');
    const nextDate = getNextOccurrence(baseDate, 'daily', undefined, undefined, undefined, endDate);

    // Should not generate occurrences after end date
    expect(nextDate).toBeNull();
  });

  test('getNextOccurrence should handle custom intervals', () => {
    const baseDate = new Date('2024-01-15');
    const nextDate = getNextOccurrence(baseDate, 'daily', 3); // Every 3 days

    expect(nextDate).toBeInstanceOf(Date);
    expect(nextDate?.getDate()).toBe(18);
  });

  // Test generateOccurrences
  test('generateOccurrences should generate multiple daily occurrences', () => {
    const baseDate = new Date('2024-01-15');
    const occurrences = generateOccurrences(baseDate, 'daily', undefined, undefined, undefined, undefined, 5);

    expect(occurrences).toHaveLength(5);
    expect(occurrences[0].getDate()).toBe(15);
    expect(occurrences[1].getDate()).toBe(16);
    expect(occurrences[2].getDate()).toBe(17);
    expect(occurrences[3].getDate()).toBe(18);
    expect(occurrences[4].getDate()).toBe(19);
  });

  test('generateOccurrences should respect max occurrences limit', () => {
    const baseDate = new Date('2024-01-15');
    const occurrences = generateOccurrences(baseDate, 'daily', undefined, undefined, undefined, undefined, 3);

    expect(occurrences).toHaveLength(3);
  });

  test('generateOccurrences should respect end date', () => {
    const baseDate = new Date('2024-01-15');
    const endDate = new Date('2024-01-17');
    const occurrences = generateOccurrences(baseDate, 'daily', undefined, undefined, undefined, endDate, 10);

    expect(occurrences).toHaveLength(3); // 15th, 16th, 17th
  });


  if (failedTests > 0) {
    throw new Error(`${failedTests} tests failed`);
  }
};

// Export for manual testing
export { runTests };

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}
