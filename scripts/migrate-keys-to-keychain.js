#!/usr/bin/env node

/**
 * Migration script to move API keys from .env file to react-native-keychain
 *
 * This script helps developers migrate their sensitive API keys from environment
 * variables to secure storage using react-native-keychain.
 *
 * Usage:
 *   node scripts/migrate-keys-to-keychain.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
};

// Keys to migrate
const KEYS_TO_MIGRATE = [
  'REVENUECAT_IOS_API_KEY',
  'REVENUECAT_ANDROID_API_KEY',
  'ADMOB_APP_ID',
  'ADMOB_BANNER_ID',
  'ADMOB_INTERSTITIAL_ID',
  'ADMOB_REWARDED_ID',
  'GOOGLE_MAPS_API_KEY',
];

// Default values that should not be migrated
const DEFAULT_VALUES = [
  'appl_YOUR_IOS_API_KEY',
  'goog_YOUR_ANDROID_API_KEY',
  'ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy',
  'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy',
  'your-google-maps-api-key',
  'YOUR_',
];

function isDefaultValue(value) {
  return DEFAULT_VALUES.some(defaultVal =>
    value.includes(defaultVal) || value === defaultVal
  );
}

function parseEnvFile(envPath) {
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    const envVars = {};

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    return envVars;
  } catch (error) {
    return {};
  }
}

function createMigrationCode(envVars) {
  const validKeys = {};

  KEYS_TO_MIGRATE.forEach(key => {
    const value = envVars[key];
    if (value && !isDefaultValue(value)) {
      validKeys[key] = value;
    }
  });

  if (Object.keys(validKeys).length === 0) {
    return null;
  }

  const codeLines = [
    "import secureKeyService from '../src/services/secureKeyService';",
    '',
    '// Migration script to move keys from .env to secure storage',
    'export const migrateKeysToKeychain = async () => {',
    '  try {',
    "    console.log('🔐 Starting key migration to secure storage...');",
    '    ',
    '    // Initialize secure key service',
    '    await secureKeyService.initialize();',
    '    ',
  ];

  Object.entries(validKeys).forEach(([key, value]) => {
    codeLines.push(`    // Store ${key}`);
    codeLines.push(`    await secureKeyService.storeKey('${key}', '${value}');`);
    codeLines.push(`    console.log('✅ Migrated ${key}');`);
    codeLines.push('    ');
  });

  codeLines.push("    console.log('🎉 Key migration completed successfully!');");
  codeLines.push("    console.log('📝 You can now remove these keys from your .env file.');");
  codeLines.push('    ');
  codeLines.push('    // Validate migration');
  codeLines.push('    const validation = await secureKeyService.validateKeys();');
  codeLines.push('    if (validation.valid) {');
  codeLines.push("      console.log('✅ All keys validated successfully');");
  codeLines.push('    } else {');
  codeLines.push("      console.log('⚠️  Some keys are missing:', validation.missing);");
  codeLines.push('    }');
  codeLines.push('    ');
  codeLines.push('    return true;');
  codeLines.push('  } catch (error) {');
  codeLines.push("    console.error('❌ Migration failed:', error);");
  codeLines.push('    return false;');
  codeLines.push('  }');
  codeLines.push('};');

  return codeLines.join('\n');
}

function createEnvBackup(envPath, envVars) {
  const backupPath = envPath + '.backup.' + Date.now();
  const backupContent = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  fs.writeFileSync(backupPath, backupContent);
  return backupPath;
}

function createCleanEnvFile(envPath, envVars) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  const newLines = [];

  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key] = trimmed.split('=');
      if (key && KEYS_TO_MIGRATE.includes(key.trim())) {
        // Comment out migrated keys
        newLines.push(`# ${line} # Migrated to secure storage`);
      } else {
        newLines.push(line);
      }
    } else {
      newLines.push(line);
    }
  });

  return newLines.join('\n');
}

async function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase());
    });
  });
}

async function main() {
  log.header('🔐 ClearCue Key Migration to Secure Storage');

  const projectRoot = path.resolve(__dirname, '..');
  const envPath = path.join(projectRoot, '.env');
  const envExamplePath = path.join(projectRoot, 'env');

  // Check if .env file exists
  let envVars = {};
  if (fs.existsSync(envPath)) {
    log.info('Found .env file');
    envVars = parseEnvFile(envPath);
  } else if (fs.existsSync(envExamplePath)) {
    log.info('Found env file (example)');
    envVars = parseEnvFile(envExamplePath);
  } else {
    log.error('No .env or env file found');
    log.info('Please create a .env file with your API keys first');
    process.exit(1);
  }

  // Find valid keys to migrate
  const validKeys = {};
  const invalidKeys = [];

  KEYS_TO_MIGRATE.forEach(key => {
    const value = envVars[key];
    if (value && !isDefaultValue(value)) {
      validKeys[key] = value;
    } else if (value) {
      invalidKeys.push(key);
    }
  });

  if (Object.keys(validKeys).length === 0) {
    log.warning('No valid keys found to migrate');
    log.info('Make sure your .env file contains actual API keys, not placeholder values');
    process.exit(0);
  }

  // Display found keys
  log.info('Found the following keys to migrate:');
  Object.entries(validKeys).forEach(([key, value]) => {
    const maskedValue = value.substring(0, 8) + '...' + value.substring(value.length - 4);
    log.success(`${key}: ${maskedValue}`);
  });

  if (invalidKeys.length > 0) {
    log.warning('The following keys contain placeholder values and will be skipped:');
    invalidKeys.forEach(key => {
      log.warning(`  - ${key}`);
    });
  }

  // Ask for confirmation
  console.log('\n');
  const answer = await promptUser('Do you want to proceed with the migration? (y/N): ');

  if (answer !== 'y' && answer !== 'yes') {
    log.info('Migration cancelled');
    process.exit(0);
  }

  // Create migration code
  const migrationCode = createMigrationCode(envVars);
  const migrationPath = path.join(projectRoot, 'src/utils/migrateKeys.ts');

  // Ensure utils directory exists
  const utilsDir = path.dirname(migrationPath);
  if (!fs.existsSync(utilsDir)) {
    fs.mkdirSync(utilsDir, { recursive: true });
  }

  // Write migration file
  fs.writeFileSync(migrationPath, migrationCode);
  log.success(`Created migration file: ${migrationPath}`);

  // Create backup
  if (fs.existsSync(envPath)) {
    const backupPath = createEnvBackup(envPath, envVars);
    log.success(`Created backup: ${backupPath}`);
  }

  // Update .env file
  if (fs.existsSync(envPath)) {
    const cleanContent = createCleanEnvFile(envPath, envVars);
    fs.writeFileSync(envPath, cleanContent);
    log.success('Updated .env file (commented out migrated keys)');
  }

  // Display next steps
  log.header('📋 Next Steps');
  log.info('1. Run the migration in your app:');
  log.info('   import { migrateKeysToKeychain } from "./src/utils/migrateKeys";');
  log.info('   await migrateKeysToKeychain();');
  log.info('');
  log.info('2. Update your services to use secureKeyService:');
  log.info('   import secureKeyService from "./src/services/secureKeyService";');
  log.info('   const apiKey = await secureKeyService.getKey("REVENUECAT_IOS_API_KEY");');
  log.info('');
  log.info('3. Remove the migration file after successful migration');
  log.info('');
  log.info('4. Test your app to ensure all services work correctly');
  log.info('');
  log.success('Migration setup completed! 🎉');
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    log.error('Migration failed:');
    console.error(error);
    process.exit(1);
  });
}

module.exports = { main, createMigrationCode, parseEnvFile };
