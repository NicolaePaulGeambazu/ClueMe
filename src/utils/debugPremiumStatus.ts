import { premiumStatusManager } from '../services/premiumStatusManager';

export const debugPremiumStatus = async () => {
  console.log('🔍 Debugging Premium Status...');
  
  try {
    // Initialize the manager if needed
    await premiumStatusManager.initialize();
    
    // Use the centralized debug function
    await premiumStatusManager.debugStatus();
    
  } catch (error) {
    console.error('❌ Debug Error:', error);
  }
};

export const resetPremiumStatus = async () => {
  console.log('🔄 Resetting Premium Status...');
  
  try {
    // Use the centralized force clear function
    await premiumStatusManager.forceClearStatus();
    
    console.log('✅ Premium status reset to free');
  } catch (error) {
    console.error('❌ Reset Error:', error);
  }
};

export const forceRefreshPremiumStatus = async () => {
  console.log('🔄 Force Refreshing Premium Status...');
  
  try {
    // Use the centralized refresh function
    await premiumStatusManager.refreshStatus();
    
    console.log('✅ Premium status refreshed');
  } catch (error) {
    console.error('❌ Force Refresh Error:', error);
  }
};

export const clearRevenueCatData = async () => {
  console.log('🧹 Clearing RevenueCat Data...');
  
  try {
    // Use the centralized force clear function
    await premiumStatusManager.forceClearStatus();
    
    console.log('✅ RevenueCat data cleared');
  } catch (error) {
    console.error('❌ Clear RevenueCat Error:', error);
  }
}; 