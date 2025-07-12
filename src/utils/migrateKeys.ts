import secureKeyService from '../services/secureKeyService';

// Migration script to move keys from .env to secure storage
export const migrateKeysToKeychain = async () => {
  try {
    console.log('🔐 Starting key migration to secure storage...');
    
    // Initialize secure key service
    await secureKeyService.initialize();
    
    // Store REVENUECAT_IOS_API_KEY
    await secureKeyService.storeKey('REVENUECAT_IOS_API_KEY', 'appl_dsxXphLzhYTbzDkKZyGxbUswYXg');
    console.log('✅ Migrated REVENUECAT_IOS_API_KEY');
    
    console.log('🎉 Key migration completed successfully!');
    console.log('📝 You can now remove these keys from your .env file.');
    
    // Validate migration
    const validation = await secureKeyService.validateKeys();
    if (validation.valid) {
      console.log('✅ All keys validated successfully');
    } else {
      console.log('⚠️  Some keys are missing:', validation.missing);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
};