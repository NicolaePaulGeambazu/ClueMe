import { 
  testAllRecurringPatterns, 
  testRecurringPattern,
  RecurringPattern,
  calculateNextOccurrenceDate 
} from './recurringReminderUtils';

/**
 * Test script to verify all recurring patterns work correctly
 * Run this to test the recurring reminder system
 */
export function runRecurringPatternTests() {
  console.log('🧪 Testing All Recurring Patterns...\n');

  // Test all patterns
  const results = testAllRecurringPatterns();
  
  let successCount = 0;
  let totalCount = results.length;

  for (const result of results) {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.pattern}: ${result.description}`);
    
    if (result.success && result.nextOccurrences.length > 0) {
      console.log(`   First 3 occurrences: ${result.nextOccurrences.slice(0, 3).map(d => d.toDateString()).join(', ')}`);
    }
    
    if (result.success) successCount++;
  }

  console.log(`\n📊 Results: ${successCount}/${totalCount} patterns working correctly`);

  // Test specific complex patterns
  console.log('\n🔬 Testing Complex Patterns...\n');

  // Test Monday/Wednesday/Friday for 4 weeks
  const mwfPattern: RecurringPattern = {
    type: 'weekly',
    interval: 1,
    daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
    endDate: new Date(Date.now() + 4 * 7 * 24 * 60 * 60 * 1000) // 4 weeks from now
  };

  const mwfTest = testRecurringPattern(mwfPattern, new Date('2024-01-15'), 12);
  console.log(`Monday/Wednesday/Friday Pattern: ${mwfTest.success ? '✅' : '❌'}`);
  if (mwfTest.success) {
    console.log(`   Generated ${mwfTest.occurrences.length} occurrences`);
    console.log(`   Dates: ${mwfTest.occurrences.map(d => d.toDateString()).join(', ')}`);
  }

  // Test first Monday of every month
  const firstMondayPattern: RecurringPattern = {
    type: 'first_monday',
    interval: 1
  };

  const firstMondayTest = testRecurringPattern(firstMondayPattern, new Date('2024-01-15'), 6);
  console.log(`First Monday Pattern: ${firstMondayTest.success ? '✅' : '❌'}`);
  if (firstMondayTest.success) {
    console.log(`   Generated ${firstMondayTest.occurrences.length} occurrences`);
    console.log(`   Dates: ${firstMondayTest.occurrences.map(d => d.toDateString()).join(', ')}`);
  }

  // Test last Friday of every month
  const lastFridayPattern: RecurringPattern = {
    type: 'last_friday',
    interval: 1
  };

  const lastFridayTest = testRecurringPattern(lastFridayPattern, new Date('2024-01-15'), 6);
  console.log(`Last Friday Pattern: ${lastFridayTest.success ? '✅' : '❌'}`);
  if (lastFridayTest.success) {
    console.log(`   Generated ${lastFridayTest.occurrences.length} occurrences`);
    console.log(`   Dates: ${lastFridayTest.occurrences.map(d => d.toDateString()).join(', ')}`);
  }

  // Test custom interval patterns
  console.log('\n🔧 Testing Custom Intervals...\n');

  const customPatterns = [
    { name: 'Every 3 Days', pattern: { type: 'daily' as const, interval: 3 } },
    { name: 'Every 2 Weeks', pattern: { type: 'weekly' as const, interval: 2 } },
    { name: 'Every 3 Months', pattern: { type: 'monthly' as const, interval: 3 } },
    { name: 'Every 2 Years', pattern: { type: 'yearly' as const, interval: 2 } }
  ];

  for (const customTest of customPatterns) {
    const result = testRecurringPattern(customTest.pattern, new Date('2024-01-15'), 5);
    console.log(`${customTest.name}: ${result.success ? '✅' : '❌'}`);
    if (result.success) {
      console.log(`   Generated ${result.occurrences.length} occurrences`);
      console.log(`   Dates: ${result.occurrences.map(d => d.toDateString()).join(', ')}`);
    }
  }

  console.log('\n🎉 Recurring Pattern Tests Complete!');
}

// Export for use in other files
export default runRecurringPatternTests; 