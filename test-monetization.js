// Test script to verify monetization logic
const monetizationService = require('./src/services/monetizationService').default;

async function testMonetization() {
  console.log('Testing monetization service...');
  
  try {
    // Initialize the service
    await monetizationService.initialize();
    
    // Test with a mock user ID
    const userId = 'test-user-123';
    
    // Check reminder creation
    const result = await monetizationService.checkReminderCreation(userId);
    
    console.log('Monetization check result:', {
      shouldShow: result.shouldShow,
      isBlocking: result.isBlocking,
      currentCount: result.currentCount,
      limit: result.limit,
      message: result.message
    });
    
  } catch (error) {
    console.error('Error testing monetization:', error);
  }
}

testMonetization(); 