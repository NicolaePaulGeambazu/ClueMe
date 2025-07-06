const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, '../src/locales/en.json');
const targets = [
  path.join(__dirname, '../src/locales/es.json'),
  path.join(__dirname, '../src/locales/fr.json'),
];

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function deepMerge(baseObj, targetObj) {
  if (typeof baseObj !== 'object' || baseObj === null) return targetObj;
  if (typeof targetObj !== 'object' || targetObj === null) targetObj = {};
  const result = Array.isArray(baseObj) ? [...baseObj] : { ...targetObj };
  for (const key of Object.keys(baseObj)) {
    if (typeof baseObj[key] === 'object' && baseObj[key] !== null && !Array.isArray(baseObj[key])) {
      result[key] = deepMerge(baseObj[key], targetObj[key]);
    } else {
      result[key] = key in targetObj ? targetObj[key] : baseObj[key];
    }
  }
  return result;
}

const en = readJSON(base);
for (const target of targets) {
  const t = readJSON(target);
  const merged = deepMerge(en, t);
  writeJSON(target, merged);
  console.log(`Synced: ${path.basename(target)}`);
} 