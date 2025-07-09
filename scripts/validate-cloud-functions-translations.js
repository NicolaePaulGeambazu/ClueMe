#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Cloud Functions Translation Validation Script
// This script validates that all translation keys used in functions/i18n.js
// exist in the Cloud Functions translation files

const SUPPORTED_LANGUAGES = ['en', 'es', 'fr'];
const CLOUD_FUNCTIONS_TRANSLATIONS_PATH = 'functions/translations';

// Keys that are used in functions/i18n.js
const REQUIRED_KEYS = [
  'notifications.reminderDue',
  'notifications.reminderIn15Minutes',
  'notifications.reminderIn30Minutes',
  'notifications.reminderIn1Hour',
  'notifications.reminderIn1Day',
  'notifications.reminderOverdue',
  'notifications.taskAssigned',
  'notifications.taskAssignedBy',
  'notifications.taskCompleted',
  'notifications.taskCompletedBy',
  'notifications.taskUpdated',
  'notifications.taskUpdatedBy',
  'notifications.familyInvitation',
  'notifications.familyInvitationFrom',
  'notifications.general',
  'notifications.generalWithDescription',
  'notifications.dueNow',
  'notifications.dueIn15Minutes',
  'notifications.dueIn30Minutes',
  'notifications.dueIn1Hour',
  'notifications.dueIn1Day',
  'notifications.overdueBy',
  'notifications.overdueBy1Day',
  'notifications.minutesLeft',
  'notifications.hoursLeft',
  'notifications.daysLeft',
  'time.minutes',
  'time.minute',
  'time.hours',
  'time.hour',
  'time.days',
  'time.day'
];

/**
 * Load translation file
 * @param {string} filePath - Path to the translation file
 * @returns {Object|null} Parsed JSON or null if file doesn't exist
 */
function loadTranslationFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading translation file ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Get all keys from a nested object
 * @param {Object} obj - The object to extract keys from
 * @param {string} prefix - The prefix for the current level
 * @returns {Array} Array of dot-separated keys
 */
function getAllKeys(obj, prefix = '') {
  const keys = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

/**
 * Check if a key exists in the translation object
 * @param {Object} translations - Translation object
 * @param {string} key - Key to check (e.g., 'notifications.reminderDue')
 * @returns {boolean} True if key exists
 */
function keyExists(translations, key) {
  const keys = key.split('.');
  let current = translations;
  
  for (const k of keys) {
    if (!current || typeof current !== 'object' || !(k in current)) {
      return false;
    }
    current = current[k];
  }
  
  return true;
}

/**
 * Validate Cloud Functions translations
 */
function validateCloudFunctionsTranslations() {
  console.log('🌐 Cloud Functions Translation Validation');
  console.log('==========================================');
  
  // Load English file as reference
  const englishFile = path.join(CLOUD_FUNCTIONS_TRANSLATIONS_PATH, 'en.json');
  const englishData = loadTranslationFile(englishFile);
  
  if (!englishData) {
    console.error(`❌ English translation file not found: ${englishFile}`);
    return false;
  }
  
  console.log(`📋 Checking ${REQUIRED_KEYS.length} required keys...`);
  
  let allValid = true;
  
  // Check each language file
  for (const lang of SUPPORTED_LANGUAGES) {
    const langFile = path.join(CLOUD_FUNCTIONS_TRANSLATIONS_PATH, `${lang}.json`);
    const langData = loadTranslationFile(langFile);
    
    if (!langData) {
      console.error(`❌ ${lang.toUpperCase()} translation file not found: ${langFile}`);
      allValid = false;
      continue;
    }
    
    console.log(`\n🔍 Checking ${lang.toUpperCase()} translations...`);
    
    // Check each required key
    const missingKeys = [];
    for (const key of REQUIRED_KEYS) {
      if (!keyExists(langData, key)) {
        missingKeys.push(key);
      }
    }
    
    if (missingKeys.length > 0) {
      console.error(`❌ Missing keys in ${lang.toUpperCase()}:`);
      missingKeys.forEach(key => console.error(`   - ${key}`));
      allValid = false;
    } else {
      console.log(`✅ ${lang.toUpperCase()} translations complete`);
    }
    
    // Check for extra keys (optional warning)
    const allKeys = getAllKeys(langData);
    const extraKeys = allKeys.filter(key => !REQUIRED_KEYS.includes(key));
    if (extraKeys.length > 0) {
      console.warn(`⚠️  Extra keys in ${lang.toUpperCase()} (not used in i18n.js):`);
      extraKeys.forEach(key => console.warn(`   - ${key}`));
    }
  }
  
  console.log('\n==========================================');
  
  if (allValid) {
    console.log('✅ All Cloud Functions translation validations passed!');
    console.log('🎉 The i18n-ally warnings should be resolved.');
    return true;
  } else {
    console.log('❌ Some Cloud Functions translation validations failed!');
    console.log('\nTo fix missing translations:');
    console.log('1. Add the missing keys to the translation files in functions/translations/');
    console.log('2. Run this script again to validate');
    console.log('3. The i18n-ally warnings will be resolved once all keys exist');
    return false;
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  const success = validateCloudFunctionsTranslations();
  process.exit(success ? 0 : 1);
}

module.exports = {
  validateCloudFunctionsTranslations,
  REQUIRED_KEYS
}; 