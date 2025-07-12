import { revenueCatService, PRODUCT_IDS } from './revenueCatService';
import secureKeyService from './secureKeyService';

export const testRevenueCatIntegration = async () => {
  console.log('🧪 Testing RevenueCat Integration...');
  
  try {
    // 0. Check API key
    console.log('0. Checking API key...');
    await secureKeyService.initialize();
    const apiKey = await secureKeyService.getKey('REVENUECAT_IOS_API_KEY');
    if (!apiKey || apiKey === 'appl_YOUR_IOS_API_KEY') {
      console.log('❌ API key not set. Please add REVENUECAT_IOS_API_KEY using secureKeyService');
      return false;
    }
    console.log('✅ API key found:', apiKey.substring(0, 10) + '...');
    
    // 1. Test initialization
    console.log('1. Testing initialization...');
    const initialized = await revenueCatService.initialize();
    console.log('✅ Initialization:', initialized ? 'SUCCESS' : 'FAILED');
    
    if (!initialized) {
      console.log('❌ Initialization failed. Check your API key and try again.');
      return false;
    }
    
    // 2. Test getting offerings
    console.log('2. Testing offerings...');
    const offerings = await revenueCatService.getOfferings();
    console.log('✅ Offerings:', offerings ? 'FOUND' : 'NOT FOUND');
    if (offerings) {
      console.log('Offerings data:', JSON.stringify(offerings, null, 2));
    } else {
      console.log('❌ No offerings available. This could be due to:');
      console.log('   - Products not configured in App Store Connect');
      console.log('   - Products have MISSING_METADATA status');
      console.log('   - Running in simulator without StoreKit config file');
      console.log('   - RevenueCat dashboard not properly configured');
    }
    
    // 3. Test subscription status
    console.log('3. Testing subscription status...');
    const status = await revenueCatService.getSubscriptionStatus();
    console.log('✅ Subscription status:', status);
    
    // 4. Test product availability
    console.log('4. Testing product availability...');
    for (const [key, productId] of Object.entries(PRODUCT_IDS)) {
      const available = await revenueCatService.isProductAvailable(productId);
      console.log(`✅ ${key} (${productId}):`, available ? 'AVAILABLE' : 'NOT AVAILABLE');
    }
    
    // 5. Test product prices
    console.log('5. Testing product prices...');
    for (const [key, productId] of Object.entries(PRODUCT_IDS)) {
      try {
        const price = await revenueCatService.getProductPrice(productId);
        console.log(`✅ ${key} (${productId}): ${price}`);
      } catch (error) {
        console.log(`❌ ${key} (${productId}): Error getting price -`, error);
      }
    }
    
    // 6. Additional debugging info
    console.log('6. Additional debugging info...');
    console.log('Current product IDs configured:');
    Object.entries(PRODUCT_IDS).forEach(([key, productId]) => {
      console.log(`   ${key}: ${productId}`);
    });
    
    console.log('🎉 RevenueCat integration test completed!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. If products show "NOT AVAILABLE", check App Store Connect');
    console.log('2. If running in simulator, create a StoreKit config file');
    console.log('3. Verify products are approved in App Store Connect');
    console.log('4. Check RevenueCat dashboard configuration');
    
    return true;
    
  } catch (error) {
    console.error('❌ RevenueCat integration test failed:', error);
    return false;
  }
}; 