#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const LOCALES_DIR = path.join(__dirname, '../src/locales');
const SUPPORTED_LANGUAGES = ['es', 'fr'];
const BASE_LANGUAGE = 'en';

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class TranslationFixer {
  constructor() {
    this.translations = {};
    this.fixedCount = 0;
  }

  // Load all translation files
  loadTranslations() {
    console.log(`${colors.blue}${colors.bold}Loading translation files...${colors.reset}`);
    
    [BASE_LANGUAGE, ...SUPPORTED_LANGUAGES].forEach(lang => {
      const filePath = path.join(LOCALES_DIR, `${lang}.json`);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        this.translations[lang] = JSON.parse(content);
        console.log(`${colors.green}✓${colors.reset} Loaded ${lang}.json`);
      } catch (error) {
        console.error(`${colors.red}✗${colors.reset} Failed to load ${lang}.json:`, error.message);
        process.exit(1);
      }
    });
  }

  // Get all keys from a nested object
  getAllKeys(obj, prefix = '') {
    const keys = [];
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        keys.push(...this.getAllKeys(value, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    return keys;
  }

  // Get nested value from object using dot notation
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  // Set nested value in object using dot notation
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  // Fix missing keys by copying from English with TODO marker
  fixMissingKeys() {
    console.log(`\n${colors.blue}${colors.bold}Fixing missing keys...${colors.reset}`);
    
    const baseKeys = this.getAllKeys(this.translations[BASE_LANGUAGE]);
    
    SUPPORTED_LANGUAGES.forEach(lang => {
      console.log(`\n${colors.cyan}Processing ${lang}...${colors.reset}`);
      const langKeys = this.getAllKeys(this.translations[lang]);
      let fixedInLang = 0;
      
      baseKeys.forEach(key => {
        if (!langKeys.includes(key)) {
          const baseValue = this.getNestedValue(this.translations[BASE_LANGUAGE], key);
          if (baseValue !== undefined) {
            // Add TODO marker for translation
            const todoValue = `TODO: ${baseValue}`;
            this.setNestedValue(this.translations[lang], key, todoValue);
            fixedInLang++;
            this.fixedCount++;
          }
        }
      });
      
      if (fixedInLang > 0) {
        console.log(`${colors.green}✓${colors.reset} Fixed ${fixedInLang} missing keys in ${lang}`);
      } else {
        console.log(`${colors.green}✓${colors.reset} No missing keys in ${lang}`);
      }
    });
  }

  // Save updated translation files
  saveTranslations() {
    console.log(`\n${colors.blue}${colors.bold}Saving updated translation files...${colors.reset}`);
    
    SUPPORTED_LANGUAGES.forEach(lang => {
      const filePath = path.join(LOCALES_DIR, `${lang}.json`);
      try {
        const content = JSON.stringify(this.translations[lang], null, 2);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`${colors.green}✓${colors.reset} Saved ${lang}.json`);
      } catch (error) {
        console.error(`${colors.red}✗${colors.reset} Failed to save ${lang}.json:`, error.message);
      }
    });
  }

  // Generate translation checklist
  generateChecklist() {
    console.log(`\n${colors.blue}${colors.bold}=== TRANSLATION CHECKLIST ===${colors.reset}`);
    console.log(`Total keys to translate: ${colors.bold}${this.fixedCount}${colors.reset}\n`);
    
    SUPPORTED_LANGUAGES.forEach(lang => {
      const baseKeys = this.getAllKeys(this.translations[BASE_LANGUAGE]);
      const todoKeys = [];
      
      baseKeys.forEach(key => {
        const langValue = this.getNestedValue(this.translations[lang], key);
        if (langValue && langValue.startsWith('TODO:')) {
          todoKeys.push(key);
        }
      });
      
      if (todoKeys.length > 0) {
        console.log(`${colors.yellow}${colors.bold}${lang.toUpperCase()} - ${todoKeys.length} keys need translation:${colors.reset}`);
        todoKeys.forEach(key => {
          const baseValue = this.getNestedValue(this.translations[BASE_LANGUAGE], key);
          console.log(`  ${colors.cyan}${key}${colors.reset}: "${baseValue}"`);
        });
        console.log('');
      } else {
        console.log(`${colors.green}${colors.bold}${lang.toUpperCase()} - All keys translated!${colors.reset}\n`);
      }
    });
  }

  // Run the fix process
  fix() {
    console.log(`${colors.bold}Translation Fixer${colors.reset}\n`);
    
    this.loadTranslations();
    this.fixMissingKeys();
    this.saveTranslations();
    this.generateChecklist();
    
    console.log(`\n${colors.green}${colors.bold}✅ Translation fix completed!${colors.reset}`);
    console.log(`Fixed ${this.fixedCount} missing keys across all languages.`);
    console.log(`\n${colors.yellow}Next steps:${colors.reset}`);
    console.log(`1. Review the checklist above`);
    console.log(`2. Translate all TODO items in the locale files`);
    console.log(`3. Run 'node scripts/validate-translations.js' to verify`);
  }
}

// Run the fixer
const fixer = new TranslationFixer();
fixer.fix(); 