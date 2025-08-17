#!/usr/bin/env node

/**
 * Script to remove/replace console.log statements in production code
 * This prevents the 517+ console logs from impacting performance
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns to replace
const REPLACEMENTS = [
  // Remove debug console.logs
  {
    pattern: /console\.log\(['"`].*?DEBUG.*?['"`].*?\);?\s*$/gm,
    replacement: '// Debug log removed for production',
  },
  {
    pattern: /console\.log\(['"`]\[.*?\].*?['"`].*?\);?\s*$/gm,
    replacement: '// Log removed for production',
  },
  // Replace error logs with proper error handling
  {
    pattern: /console\.error\(['"`].*?error.*?['"`].*?\);?\s*$/gmi,
    replacement: '// Error logging handled by logger',
  },
  // Remove performance logs
  {
    pattern: /console\.log.*?performance.*?\);?\s*$/gmi,
    replacement: '// Performance log removed',
  },
  // Remove general console.log with string literals
  {
    pattern: /^\s*console\.log\(['"`][^'"`]*['"`]\);?\s*$/gm,
    replacement: '',
  },
];

// Files to process
const INCLUDE_PATTERNS = [
  'src/**/*.ts',
  'src/**/*.tsx',
];

const EXCLUDE_PATTERNS = [
  'src/utils/logger.ts', // Don't modify our logger
  'src/**/*.test.ts',
  'src/**/*.test.tsx',
  '__tests__/**/*',
];

function shouldProcessFile(filePath) {
  // Check if file should be excluded
  for (const exclude of EXCLUDE_PATTERNS) {
    if (filePath.includes(exclude.replace('**/', ''))) {
      return false;
    }
  }
  return true;
}

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let changeCount = 0;

    // Apply replacements
    for (const { pattern, replacement } of REPLACEMENTS) {
      const matches = content.match(pattern);
      if (matches) {
        changeCount += matches.length;
        content = content.replace(pattern, replacement);
        modified = true;
      }
    }

    // Write back if modified
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ ${filePath}: Removed ${changeCount} console statements`);
      return changeCount;
    }

    return 0;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

function main() {
  let totalFiles = 0;
  let processedFiles = 0;
  let totalRemovals = 0;

  console.log('🧹 Starting console.log cleanup...\n');

  // Find all files to process
  const allFiles = [];
  for (const pattern of INCLUDE_PATTERNS) {
    const files = glob.sync(pattern);
    allFiles.push(...files);
  }

  // Process each file
  for (const filePath of allFiles) {
    if (!shouldProcessFile(filePath)) {
      continue;
    }

    totalFiles++;
    const removals = processFile(filePath);
    if (removals > 0) {
      processedFiles++;
      totalRemovals += removals;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Files scanned: ${totalFiles}`);
  console.log(`   Files modified: ${processedFiles}`);
  console.log(`   Console statements removed: ${totalRemovals}`);
  console.log(`\n✨ Console cleanup completed!`);
}

if (require.main === module) {
  main();
}

module.exports = { processFile, REPLACEMENTS };
