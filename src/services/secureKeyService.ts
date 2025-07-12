import * as Keychain from 'react-native-keychain';
import { Platform } from 'react-native';

// Key identifiers for secure storage
export const SECURE_KEYS = {
  REVENUECAT_IOS_API_KEY: 'clearcue_revenuecat_ios_api_key',
  REVENUECAT_ANDROID_API_KEY: 'clearcue_revenuecat_android_api_key',
  ADMOB_APP_ID: 'clearcue_admob_app_id',
  ADMOB_BANNER_ID: 'clearcue_admob_banner_id',
  ADMOB_INTERSTITIAL_ID: 'clearcue_admob_interstitial_id',
  ADMOB_REWARDED_ID: 'clearcue_admob_rewarded_id',
  GOOGLE_MAPS_API_KEY: 'clearcue_google_maps_api_key',
} as const;

export type SecureKeyType = keyof typeof SECURE_KEYS;

// Service options for Keychain
const KEYCHAIN_OPTIONS = {
  accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
  authenticationType: Keychain.AUTHENTICATION_TYPE.BIOMETRICS,
  securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
};

class SecureKeyService {
  private isInitialized = false;
  private keyCache: Map<string, string> = new Map();

  /**
   * Initialize the secure key service
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Check if keychain is available
      const canImplyAuthentication = await Keychain.canImplyAuthentication({
        authenticationType: Keychain.AUTHENTICATION_TYPE.BIOMETRICS,
      });

      if (!canImplyAuthentication) {
        console.warn('[SecureKeyService] Biometric authentication not available, falling back to basic security');
      }

      this.isInitialized = true;
      console.log('[SecureKeyService] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[SecureKeyService] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Store a key securely in the keychain
   */
  async storeKey(keyType: SecureKeyType, value: string): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const key = SECURE_KEYS[keyType];

      await Keychain.setGenericPassword(key, value, { service: key });
      
      // Update cache
      this.keyCache.set(key, value);
      
      console.log(`[SecureKeyService] Stored key: ${keyType}`);
      return true;
    } catch (error) {
      console.error(`[SecureKeyService] Failed to store key ${keyType}:`, error);
      return false;
    }
  }

  /**
   * Retrieve a key from the keychain
   */
  async getKey(keyType: SecureKeyType): Promise<string | null> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const key = SECURE_KEYS[keyType];

      // Check cache first
      if (this.keyCache.has(key)) {
        return this.keyCache.get(key) || null;
      }

      const credentials = await Keychain.getGenericPassword({ service: key });
      
      if (credentials && credentials.password) {
        // Update cache
        this.keyCache.set(key, credentials.password);
        return credentials.password;
      }

      return null;
    } catch (error) {
      console.error(`[SecureKeyService] Failed to retrieve key ${keyType}:`, error);
      return null;
    }
  }

  /**
   * Remove a key from the keychain
   */
  async removeKey(keyType: SecureKeyType): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const key = SECURE_KEYS[keyType];
      await Keychain.resetGenericPassword({ service: key });
      
      // Remove from cache
      this.keyCache.delete(key);
      
      console.log(`[SecureKeyService] Removed key: ${keyType}`);
      return true;
    } catch (error) {
      console.error(`[SecureKeyService] Failed to remove key ${keyType}:`, error);
      return false;
    }
  }

  /**
   * Check if a key exists in the keychain
   */
  async hasKey(keyType: SecureKeyType): Promise<boolean> {
    try {
      const value = await this.getKey(keyType);
      return value !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all stored keys (for debugging/migration purposes)
   */
  async getAllKeys(): Promise<Record<SecureKeyType, string | null>> {
    const result: Record<SecureKeyType, string | null> = {} as any;
    
    for (const keyType of Object.keys(SECURE_KEYS) as SecureKeyType[]) {
      result[keyType] = await this.getKey(keyType);
    }
    
    return result;
  }

  /**
   * Clear all stored keys
   */
  async clearAllKeys(): Promise<boolean> {
    try {
      for (const keyType of Object.keys(SECURE_KEYS) as SecureKeyType[]) {
        await this.removeKey(keyType);
      }
      
      this.keyCache.clear();
      console.log('[SecureKeyService] Cleared all keys');
      return true;
    } catch (error) {
      console.error('[SecureKeyService] Failed to clear all keys:', error);
      return false;
    }
  }

  /**
   * Migrate keys from environment variables to secure storage
   */
  async migrateFromEnv(): Promise<boolean> {
    try {
      // Import Config dynamically to avoid issues if not available
      const Config = require('react-native-config').default;
      
      const envKeys: Record<SecureKeyType, string | undefined> = {
        REVENUECAT_IOS_API_KEY: Config.REVENUECAT_IOS_API_KEY,
        REVENUECAT_ANDROID_API_KEY: Config.REVENUECAT_ANDROID_API_KEY,
        ADMOB_APP_ID: Config.ADMOB_APP_ID,
        ADMOB_BANNER_ID: Config.ADMOB_BANNER_ID,
        ADMOB_INTERSTITIAL_ID: Config.ADMOB_INTERSTITIAL_ID,
        ADMOB_REWARDED_ID: Config.ADMOB_REWARDED_ID,
        GOOGLE_MAPS_API_KEY: Config.GOOGLE_MAPS_API_KEY,
      };

      let migratedCount = 0;
      
      for (const [keyType, value] of Object.entries(envKeys)) {
        if (value && value !== 'your-google-maps-api-key' && !value.includes('YOUR_')) {
          const success = await this.storeKey(keyType as SecureKeyType, value);
          if (success) {
            migratedCount++;
            console.log(`[SecureKeyService] Migrated ${keyType}`);
          }
        }
      }

      console.log(`[SecureKeyService] Migration complete. Migrated ${migratedCount} keys.`);
      return migratedCount > 0;
    } catch (error) {
      console.error('[SecureKeyService] Migration failed:', error);
      return false;
    }
  }

  /**
   * Validate that all required keys are present
   */
  async validateKeys(): Promise<{ valid: boolean; missing: SecureKeyType[] }> {
    const missing: SecureKeyType[] = [];
    
    for (const keyType of Object.keys(SECURE_KEYS) as SecureKeyType[]) {
      const hasKey = await this.hasKey(keyType);
      if (!hasKey) {
        missing.push(keyType);
      }
    }
    
    return {
      valid: missing.length === 0,
      missing,
    };
  }
}

// Export singleton instance
export const secureKeyService = new SecureKeyService();
export default secureKeyService; 