import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.resolve(__dirname, '../../supabase/BAOMS_COMPLETE_SCHEMA.sql');

const sql = fs.readFileSync(schemaPath, 'utf8');

console.log('=== Auditing BAOMS_COMPLETE_SCHEMA.sql ===');

// 1. Find all created functions
const createdFunctions = new Set();
const funcRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?([a-zA-Z0-9_]+)\s*\(/gi;
let m;
while ((m = funcRegex.exec(sql)) !== null) {
  createdFunctions.add(m[1].toLowerCase());
}
console.log(`Found ${createdFunctions.size} defined functions:`, Array.from(createdFunctions).sort().join(', '));

// 2. Find all triggers and their executed functions
const triggerRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?TRIGGER\s+([a-zA-Z0-9_]+)\s+[\s\S]*?(?:EXECUTE\s+(?:FUNCTION|PROCEDURE)\s+(?:public\.)?([a-zA-Z0-9_]+)\s*\()/gi;
const missingTriggerFuncs = [];
while ((m = triggerRegex.exec(sql)) !== null) {
  const triggerName = m[1];
  const funcName = m[2].toLowerCase();
  if (!createdFunctions.has(funcName) && funcName !== 'enforce_email_domain') {
    missingTriggerFuncs.push({ trigger: triggerName, func: funcName });
  }
}

if (missingTriggerFuncs.length > 0) {
  console.error('\n❌ Missing Trigger Functions:');
  missingTriggerFuncs.forEach(t => console.error(`  - Trigger ${t.trigger} calls undefined function: ${t.func}()`));
} else {
  console.log('✓ All trigger functions are properly defined!');
}

// 3. Find created tables
const createdTables = new Set();
const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)\s*\(/gi;
while ((m = tableRegex.exec(sql)) !== null) {
  createdTables.add(m[1].toLowerCase());
}
console.log(`\nFound ${createdTables.size} defined tables:`, Array.from(createdTables).sort().join(', '));

// 4. Find all foreign keys referencing public tables
const fkRegex = /REFERENCES\s+(?:public\.)?([a-zA-Z0-9_]+)\s*(?:\([a-zA-Z0-9_]+\))?/gi;
const missingTables = new Set();
while ((m = fkRegex.exec(sql)) !== null) {
  const tableRef = m[1].toLowerCase();
  if (tableRef !== 'users' && !createdTables.has(tableRef)) {
    missingTables.add(tableRef);
  }
}

if (missingTables.size > 0) {
  console.error('\n❌ Missing Tables referenced in Foreign Keys:');
  missingTables.forEach(t => console.error(`  - Missing referenced table: ${t}`));
} else {
  console.log('✓ All referenced foreign key tables exist!');
}
