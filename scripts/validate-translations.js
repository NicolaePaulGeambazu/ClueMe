#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const LOCALES_DIR = path.join(__dirname, '../src/locales');
const SUPPORTED_LANGUAGES = ['en', 'es', 'fr'];
const BASE_LANGUAGE = 'en';

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

// Paths to translation files
const CLIENT_TRANSLATIONS_PATH = 'src/locales';
const CLOUD_FUNCTIONS_TRANSLATIONS_PATH = 'functions/translations';

class TranslationValidator {
  constructor() {
    this.translations = {};
    this.missingKeys = {};
    this.incompleteTranslations = {};
    this.placeholderMismatches = {};
    this.totalIssues = 0;
  }

  // Load all translation files
  loadTranslations() {
    console.log(`${colors.blue}${colors.bold}Loading translation files...${colors.reset}`);

    SUPPORTED_LANGUAGES.forEach(lang => {
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

  // Extract placeholders from a string
  extractPlaceholders(str) {
    const placeholderRegex = /\{\{(\w+)\}\}/g;
    const placeholders = [];
    let match;
    while ((match = placeholderRegex.exec(str)) !== null) {
      placeholders.push(match[1]);
    }
    return placeholders;
  }

  // Get nested value from object using dot notation
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  // Check for missing keys
  checkMissingKeys() {
    console.log(`\n${colors.blue}${colors.bold}Checking for missing keys...${colors.reset}`);

    const baseKeys = this.getAllKeys(this.translations[BASE_LANGUAGE]);

    SUPPORTED_LANGUAGES.forEach(lang => {
      if (lang === BASE_LANGUAGE) {return;}

      this.missingKeys[lang] = [];
      const langKeys = this.getAllKeys(this.translations[lang]);

      baseKeys.forEach(key => {
        if (!langKeys.includes(key)) {
          this.missingKeys[lang].push(key);
          this.totalIssues++;
        }
      });

      if (this.missingKeys[lang].length > 0) {
        console.log(`${colors.red}✗${colors.reset} ${lang}: ${this.missingKeys[lang].length} missing keys`);
      } else {
        console.log(`${colors.green}✓${colors.reset} ${lang}: All keys present`);
      }
    });
  }

  // Check for incomplete translations (empty strings, same as English, etc.)
  checkIncompleteTranslations() {
    console.log(`\n${colors.blue}${colors.bold}Checking for incomplete translations...${colors.reset}`);

    const baseKeys = this.getAllKeys(this.translations[BASE_LANGUAGE]);

    SUPPORTED_LANGUAGES.forEach(lang => {
      if (lang === BASE_LANGUAGE) {return;}

      this.incompleteTranslations[lang] = [];

      baseKeys.forEach(key => {
        const baseValue = this.getNestedValue(this.translations[BASE_LANGUAGE], key);
        const langValue = this.getNestedValue(this.translations[lang], key);

        if (langValue === undefined) {return;} // Already caught by missing keys check

        // Check for empty strings
        if (langValue === '') {
          this.incompleteTranslations[lang].push({
            key,
            issue: 'empty_string',
            value: langValue,
          });
          this.totalIssues++;
        }

        // Check if translation is same as English (likely untranslated)
        else if (langValue === baseValue) {
          this.incompleteTranslations[lang].push({
            key,
            issue: 'same_as_english',
            value: langValue,
          });
          this.totalIssues++;
        }

        // Check for placeholder text
        else if (langValue.includes('TODO') || langValue.includes('TRANSLATE')) {
          this.incompleteTranslations[lang].push({
            key,
            issue: 'placeholder_text',
            value: langValue,
          });
          this.totalIssues++;
        }
      });

      if (this.incompleteTranslations[lang].length > 0) {
        console.log(`${colors.yellow}⚠${colors.reset} ${lang}: ${this.incompleteTranslations[lang].length} incomplete translations`);
      } else {
        console.log(`${colors.green}✓${colors.reset} ${lang}: All translations complete`);
      }
    });
  }

  // Check for placeholder mismatches
  checkPlaceholderMismatches() {
    console.log(`\n${colors.blue}${colors.bold}Checking for placeholder mismatches...${colors.reset}`);

    const baseKeys = this.getAllKeys(this.translations[BASE_LANGUAGE]);

    SUPPORTED_LANGUAGES.forEach(lang => {
      if (lang === BASE_LANGUAGE) {return;}

      this.placeholderMismatches[lang] = [];

      baseKeys.forEach(key => {
        const baseValue = this.getNestedValue(this.translations[BASE_LANGUAGE], key);
        const langValue = this.getNestedValue(this.translations[lang], key);

        if (langValue === undefined) {return;}

        const basePlaceholders = this.extractPlaceholders(baseValue);
        const langPlaceholders = this.extractPlaceholders(langValue);

        // Check for missing placeholders
        const missingPlaceholders = basePlaceholders.filter(p => !langPlaceholders.includes(p));
        if (missingPlaceholders.length > 0) {
          this.placeholderMismatches[lang].push({
            key,
            issue: 'missing_placeholders',
            missing: missingPlaceholders,
            baseValue,
            langValue,
          });
          this.totalIssues++;
        }

        // Check for extra placeholders
        const extraPlaceholders = langPlaceholders.filter(p => !basePlaceholders.includes(p));
        if (extraPlaceholders.length > 0) {
          this.placeholderMismatches[lang].push({
            key,
            issue: 'extra_placeholders',
            extra: extraPlaceholders,
            baseValue,
            langValue,
          });
          this.totalIssues++;
        }
      });

      if (this.placeholderMismatches[lang].length > 0) {
        console.log(`${colors.red}✗${colors.reset} ${lang}: ${this.placeholderMismatches[lang].length} placeholder mismatches`);
      } else {
        console.log(`${colors.green}✓${colors.reset} ${lang}: All placeholders match`);
      }
    });
  }

  // Generate detailed report
  generateReport() {
    console.log(`\n${colors.blue}${colors.bold}=== TRANSLATION VALIDATION REPORT ===${colors.reset}`);
    console.log(`Total issues found: ${colors.bold}${this.totalIssues}${colors.reset}\n`);

    if (this.totalIssues === 0) {
      console.log(`${colors.green}${colors.bold}🎉 All translations are complete and valid!${colors.reset}`);
      return;
    }

    // Missing keys report
    Object.entries(this.missingKeys).forEach(([lang, keys]) => {
      if (keys.length > 0) {
        console.log(`${colors.red}${colors.bold}Missing Keys in ${lang}:${colors.reset}`);
        keys.forEach(key => {
          console.log(`  ${colors.red}✗${colors.reset} ${key}`);
        });
        console.log('');
      }
    });

    // Incomplete translations report
    Object.entries(this.incompleteTranslations).forEach(([lang, issues]) => {
      if (issues.length > 0) {
        console.log(`${colors.yellow}${colors.bold}Incomplete Translations in ${lang}:${colors.reset}`);
        issues.forEach(issue => {
          const issueType = {
            'empty_string': 'Empty string',
            'same_as_english': 'Same as English',
            'placeholder_text': 'Placeholder text',
          }[issue.issue];

          console.log(`  ${colors.yellow}⚠${colors.reset} ${issue.key} - ${issueType}`);
          console.log(`    Value: "${issue.value}"`);
        });
        console.log('');
      }
    });

    // Placeholder mismatches report
    Object.entries(this.placeholderMismatches).forEach(([lang, issues]) => {
      if (issues.length > 0) {
        console.log(`${colors.red}${colors.bold}Placeholder Mismatches in ${lang}:${colors.reset}`);
        issues.forEach(issue => {
          if (issue.issue === 'missing_placeholders') {
            console.log(`  ${colors.red}✗${colors.reset} ${issue.key} - Missing: {{${issue.missing.join('}}, {{')}}}`);
          } else if (issue.issue === 'extra_placeholders') {
            console.log(`  ${colors.red}✗${colors.reset} ${issue.key} - Extra: {{${issue.extra.join('}}, {{')}}}`);
          }
          console.log(`    English: "${issue.baseValue}"`);
          console.log(`    ${lang}: "${issue.langValue}"`);
        });
        console.log('');
      }
    });
  }

  // Generate fix suggestions
  generateFixSuggestions() {
    if (this.totalIssues === 0) {return;}

    console.log(`${colors.cyan}${colors.bold}=== FIX SUGGESTIONS ===${colors.reset}`);

    // Missing keys suggestions
    Object.entries(this.missingKeys).forEach(([lang, keys]) => {
      if (keys.length > 0) {
        console.log(`\n${colors.cyan}Add these keys to ${lang}.json:${colors.reset}`);
        keys.forEach(key => {
          const baseValue = this.getNestedValue(this.translations[BASE_LANGUAGE], key);
          console.log(`  "${key}": "${baseValue}", // TODO: Translate`);
        });
      }
    });

    // Incomplete translations suggestions
    Object.entries(this.incompleteTranslations).forEach(([lang, issues]) => {
      if (issues.length > 0) {
        console.log(`\n${colors.cyan}Fix these translations in ${lang}.json:${colors.reset}`);
        issues.forEach(issue => {
          console.log(`  "${issue.key}": "TODO: Translate this properly",`);
        });
      }
    });
  }

  // Run all validations
  validate() {
    console.log(`${colors.bold}Translation Validation Tool${colors.reset}\n`);

    this.loadTranslations();
    this.checkMissingKeys();
    this.checkIncompleteTranslations();
    this.checkPlaceholderMismatches();
    this.generateReport();
    this.generateFixSuggestions();

    // Exit with error code if issues found
    if (this.totalIssues > 0) {
      console.log(`\n${colors.red}${colors.bold}❌ Translation validation failed with ${this.totalIssues} issues${colors.reset}`);
      process.exit(1);
    } else {
      console.log(`\n${colors.green}${colors.bold}✅ Translation validation passed!${colors.reset}`);
      process.exit(0);
    }
  }
}

// Run validation
const validator = new TranslationValidator();
validator.validate();

module.exports = {
  validateTranslations,
  getAllKeys,
  loadTranslationFile,
};
