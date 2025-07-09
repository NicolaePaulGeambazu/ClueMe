# i18n-ally Setup for ClearCue

## Overview
This document explains how to configure the i18n-ally VS Code extension to work with ClearCue's dual translation system:
- **Client-side translations**: `src/locales/` (React Native app)
- **Cloud Functions translations**: `functions/translations/` (Firebase Functions)

## Current Status

✅ **Cloud Functions translations are complete** - All 32 required keys exist in all language files
✅ **Client-side translations need work** - Many keys are missing or have placeholder text

## i18n-ally Configuration

### Option 1: Use Workspace Settings (Recommended)
Open the workspace file: `.vscode/workspace.code-workspace`

This file contains all the necessary i18n-ally configuration to:
- Find both translation directories
- Enable namespace support for Cloud Functions
- Configure validation and auto-completion

### Option 2: Manual VS Code Settings
Add these settings to your VS Code settings.json:

```json
{
  "i18n-ally.enabled": true,
  "i18n-ally.localesPaths": [
    "src/locales",
    "functions/translations"
  ],
  "i18n-ally.sourceLanguage": "en",
  "i18n-ally.namespace": true,
  "i18n-ally.keySeparator": ".",
  "i18n-ally.enableValidation": true
}
```

## Translation Structure

### Cloud Functions Translations (`functions/translations/`)
- **Structure**: Nested keys with namespaces
- **Example**: `notifications.reminderDue`, `time.minutes`
- **Files**: `en.json`, `es.json`, `fr.json`
- **Status**: ✅ Complete (32 keys)

### Client-side Translations (`src/locales/`)
- **Structure**: Flat keys
- **Example**: `reminders.title`, `common.save`
- **Files**: `en.json`, `es.json`, `fr.json`
- **Status**: ⚠️ Incomplete (many missing keys)

## Validation Scripts

### Cloud Functions Validation
```bash
node scripts/validate-cloud-functions-translations.js
```
This script validates that all keys used in `functions/i18n.js` exist in the translation files.

### Full Translation Validation
```bash
node scripts/validate-translations.js
```
This script validates both client-side and Cloud Functions translations.

## Resolving i18n-ally Warnings

### For Cloud Functions
The warnings about missing keys in `functions/i18n.js` should be resolved by:
1. Using the workspace configuration (`.vscode/workspace.code-workspace`)
2. Restarting VS Code
3. Reloading the i18n-ally extension

### For Client-side
The warnings about missing keys in client-side files can be resolved by:
1. Adding the missing translation keys to `src/locales/es.json` and `src/locales/fr.json`
2. Replacing placeholder text with proper translations

## Key Differences

| Aspect | Client-side | Cloud Functions |
|--------|-------------|-----------------|
| **Location** | `src/locales/` | `functions/translations/` |
| **Structure** | Flat keys | Nested with namespaces |
| **Usage** | React Native app | Firebase Functions |
| **Status** | ⚠️ Incomplete | ✅ Complete |
| **Keys** | ~400+ keys | 32 keys |

## Troubleshooting

### i18n-ally Not Finding Files
1. Check that the workspace file is being used
2. Verify the paths in `i18n-ally.localesPaths`
3. Restart VS Code
4. Reload the i18n-ally extension

### Missing Key Warnings
1. Run the validation scripts to identify missing keys
2. Add the missing keys to the appropriate translation files
3. Ensure the key structure matches the expected format

### Extension Not Working
1. Install the i18n-ally extension: `antfu.i18n-ally`
2. Check that the extension is enabled
3. Verify the configuration in workspace settings

## Next Steps

1. **Immediate**: Use the workspace configuration to resolve Cloud Functions warnings
2. **Short-term**: Focus on completing client-side translations
3. **Long-term**: Maintain translation consistency across both systems

## Files Created

- `.vscode/workspace.code-workspace` - Workspace configuration
- `.vscode/settings.json` - VS Code settings
- `.i18n-ally.config.js` - i18n-ally configuration
- `scripts/validate-cloud-functions-translations.js` - Cloud Functions validation
- `scripts/validate-translations.js` - Full validation
- `I18N_ALLY_SETUP.md` - This documentation 