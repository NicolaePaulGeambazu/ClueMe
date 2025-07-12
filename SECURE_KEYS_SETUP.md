# 🔐 Secure Key Management Setup

This guide explains how to migrate from environment variables to secure storage using `react-native-keychain` for better security of your API keys.

## 🚀 Quick Start

### 1. Install Dependencies

The required dependencies are already installed:
- `react-native-keychain` - For secure key storage
- `react-native-config` - For reading environment variables (for migration)

### 2. Run Migration Script

```bash
# Run the migration script
yarn migrate:keys

# Or run directly
node scripts/migrate-keys-to-keychain.js
```

The script will:
- ✅ Read your existing `.env` file
- ✅ Create a migration file with your keys
- ✅ Backup your `.env` file
- ✅ Comment out migrated keys in `.env`
- ✅ Provide next steps

### 3. Run Migration in Your App

Add this to your app initialization (e.g., in `App.tsx`):

```typescript
import { migrateKeysToKeychain } from './src/utils/migrateKeys';

// Run migration once
useEffect(() => {
  migrateKeysToKeychain();
}, []);
```

### 4. Update Your Services

Your services have been updated to use secure storage:

```typescript
// Before (using environment variables)
import Config from 'react-native-config';
const apiKey = Config.REVENUECAT_IOS_API_KEY;

// After (using secure storage)
import secureKeyService from './src/services/secureKeyService';
const apiKey = await secureKeyService.getKey('REVENUECAT_IOS_API_KEY');
```

## 📋 Supported Keys

The following keys can be stored securely:

| Key | Description | Service |
|-----|-------------|---------|
| `REVENUECAT_IOS_API_KEY` | RevenueCat iOS API Key | RevenueCat |
| `REVENUECAT_ANDROID_API_KEY` | RevenueCat Android API Key | RevenueCat |
| `ADMOB_APP_ID` | AdMob App ID | AdMob |
| `ADMOB_BANNER_ID` | AdMob Banner Ad Unit ID | AdMob |
| `ADMOB_INTERSTITIAL_ID` | AdMob Interstitial Ad Unit ID | AdMob |
| `ADMOB_REWARDED_ID` | AdMob Rewarded Ad Unit ID | AdMob |
| `GOOGLE_MAPS_API_KEY` | Google Maps API Key | Google Maps |

## 🔧 Manual Setup

If you prefer to set up keys manually:

### 1. Initialize Secure Key Service

```typescript
import secureKeyService from './src/services/secureKeyService';

// Initialize the service
await secureKeyService.initialize();
```

### 2. Store Keys

```typescript
// Store a key
await secureKeyService.storeKey('REVENUECAT_IOS_API_KEY', 'your-actual-api-key');

// Store multiple keys
await secureKeyService.storeKey('ADMOB_BANNER_ID', 'ca-app-pub-xxx/yyy');
await secureKeyService.storeKey('ADMOB_INTERSTITIAL_ID', 'ca-app-pub-xxx/zzz');
```

### 3. Retrieve Keys

```typescript
// Get a key
const apiKey = await secureKeyService.getKey('REVENUECAT_IOS_API_KEY');

// Check if key exists
const hasKey = await secureKeyService.hasKey('REVENUECAT_IOS_API_KEY');
```

## 🛠️ API Reference

### SecureKeyService Methods

#### `initialize(): Promise<boolean>`
Initialize the secure key service.

#### `storeKey(keyType: SecureKeyType, value: string): Promise<boolean>`
Store a key securely in the keychain.

#### `getKey(keyType: SecureKeyType): Promise<string | null>`
Retrieve a key from the keychain.

#### `hasKey(keyType: SecureKeyType): Promise<boolean>`
Check if a key exists in the keychain.

#### `removeKey(keyType: SecureKeyType): Promise<boolean>`
Remove a key from the keychain.

#### `getAllKeys(): Promise<Record<SecureKeyType, string | null>>`
Get all stored keys (for debugging).

#### `clearAllKeys(): Promise<boolean>`
Clear all stored keys.

#### `validateKeys(): Promise<{ valid: boolean; missing: SecureKeyType[] }>`
Validate that all required keys are present.

#### `migrateFromEnv(): Promise<boolean>`
Migrate keys from environment variables to secure storage.

## 🔒 Security Features

### Biometric Authentication
- Uses device biometrics (Touch ID, Face ID, fingerprint) when available
- Falls back to device passcode if biometrics are not available
- Keys are stored in the iOS Keychain or Android Keystore

### Access Control
- Keys are only accessible when the device is unlocked
- Uses secure hardware when available
- Keys are encrypted at rest

### Platform Support
- **iOS**: Uses iOS Keychain with biometric authentication
- **Android**: Uses Android Keystore with biometric authentication

## 🚨 Important Notes

### Development vs Production
- In development, services will use test IDs if secure keys are not available
- In production, services will fail gracefully if keys are missing

### Key Management
- Keys are cached in memory for performance
- Keys persist across app restarts
- Keys are automatically cleared when the app is uninstalled

### Migration
- The migration script creates a backup of your `.env` file
- Migrated keys are commented out in `.env` but not deleted
- You can safely remove the migration file after successful migration

## 🔍 Troubleshooting

### Common Issues

#### "Key not found" errors
```typescript
// Check if key exists
const hasKey = await secureKeyService.hasKey('REVENUECAT_IOS_API_KEY');
if (!hasKey) {
  // Key needs to be stored
  await secureKeyService.storeKey('REVENUECAT_IOS_API_KEY', 'your-key');
}
```

#### Biometric authentication issues
```typescript
// Check if biometrics are available
const canImplyAuth = await Keychain.canImplyAuthentication({
  authenticationType: Keychain.AUTHENTICATION_TYPE.BIOMETRICS,
});
```

#### Migration issues
```typescript
// Run migration manually
await secureKeyService.migrateFromEnv();

// Validate migration
const validation = await secureKeyService.validateKeys();
console.log('Missing keys:', validation.missing);
```

### Debug Mode

Enable debug logging:

```typescript
// Check all stored keys
const allKeys = await secureKeyService.getAllKeys();
console.log('Stored keys:', allKeys);

// Validate keys
const validation = await secureKeyService.validateKeys();
console.log('Validation:', validation);
```

## 📱 Platform-Specific Notes

### iOS
- Requires `NSFaceIDUsageDescription` in `Info.plist` for Face ID
- Keys are stored in iOS Keychain
- Supports biometric authentication

### Android
- Requires biometric permission in `AndroidManifest.xml`
- Keys are stored in Android Keystore
- Supports fingerprint authentication

## 🔄 Migration Checklist

- [ ] Run `yarn migrate:keys`
- [ ] Review and confirm migration
- [ ] Run migration in your app
- [ ] Test all services (RevenueCat, AdMob, etc.)
- [ ] Remove migration file
- [ ] Update team documentation
- [ ] Remove keys from `.env` file (optional)

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify that `react-native-keychain` is properly installed
3. Ensure your device supports biometric authentication
4. Check the console logs for detailed error messages

## 🔗 Related Files

- `src/services/secureKeyService.ts` - Main secure key service
- `src/services/revenueCatService.ts` - Updated to use secure storage
- `src/services/adMobService.ts` - Updated to use secure storage
- `scripts/migrate-keys-to-keychain.js` - Migration script
- `src/utils/migrateKeys.ts` - Generated migration code (after running script) 