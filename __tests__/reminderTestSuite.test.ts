import { ReminderTestSuite } from '../src/utils/reminderTestSuite';

describe('Comprehensive Reminder Test Suite', () => {
  it('should pass all reminder scenarios', async () => {
    const testSuite = new ReminderTestSuite();
    const results = await testSuite.runAllTests();
    // Print results for developer visibility
    // (Jest will show failures if any assertion fails)
    console.log(JSON.stringify(results, null, 2));
    // Assert all test suites passed
    results.forEach(suite => {
      expect(suite.failedTests).toBe(0);
    });
  });
}); 