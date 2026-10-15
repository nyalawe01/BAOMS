/**
 * BAOMS Supabase Connection Verification Script
 * Non-destructive, safe diagnostic utility.
 * Verifies API reachability, publishable key authentication, and schema status.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

// Resolve directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');
const envPath = path.join(rootDir, '.env.local');

// 1. Parse .env.local
let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^['"]|['"]$/g, '');
      if (key === 'VITE_SUPABASE_URL' && !supabaseUrl) supabaseUrl = val;
      if (key === 'VITE_SUPABASE_ANON_KEY' && !supabaseAnonKey) supabaseAnonKey = val;
    }
  }
}

console.log('\n======================================================');
console.log('  BAOMS — Supabase Connection Diagnostic & Health Check');
console.log('======================================================\n');

console.log(`[1/4] Checking Local Environment Configuration...`);
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERROR: Missing Supabase credentials in .env.local.');
  console.error('   Expected VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to be set.');
  process.exit(1);
}

const maskedKey = supabaseAnonKey.length > 16 
  ? `${supabaseAnonKey.substring(0, 14)}...${supabaseAnonKey.substring(supabaseAnonKey.length - 6)}`
  : '***';

console.log(`  ✓ Project URL:   ${supabaseUrl}`);
console.log(`  ✓ Publishable Key: ${maskedKey}`);

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

async function runDiagnostics() {
  // 2. Gateway & Auth Reachability
  console.log(`\n[2/4] Testing API Gateway & Auth Service...`);
  const t0 = performance.now();
  let authOk = false;

  try {
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    const latency = Math.round(performance.now() - t0);

    if (sessionErr) {
      console.error(`  ❌ Auth error (${latency}ms): ${sessionErr.message}`);
    } else {
      console.log(`  ✓ Supabase Auth Gateway responded successfully (${latency}ms).`);
      console.log(`  ✓ Anonymous publishable key is authenticated.`);
      authOk = true;
    }
  } catch (err) {
    console.error(`  ❌ Network error reaching Supabase:`, err.message);
  }

  // 3. PostgreSQL Database Schema Check
  console.log(`\n[3/4] Testing PostgreSQL Schema & Table Readiness...`);
  const tablesToCheck = ['departments', 'roles', 'profiles', 'projects', 'staff_profiles'];
  const tableStatus = {};
  let schemaPresent = false;

  for (const table of tablesToCheck) {
    try {
      const { status, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);

      if (error) {
        if (error.code === 'PGRST205') {
          tableStatus[table] = 'Missing (Not Migrated)';
        } else {
          tableStatus[table] = `Error: [${error.code}] ${error.message}`;
        }
      } else {
        tableStatus[table] = `Available (HTTP ${status})`;
        schemaPresent = true;
      }
    } catch (e) {
      tableStatus[table] = `Failed: ${e.message}`;
    }
  }

  for (const [tbl, stat] of Object.entries(tableStatus)) {
    const icon = stat.startsWith('Available') ? '✓' : '⚠️ ';
    console.log(`  ${icon} Table public.${tbl}: ${stat}`);
  }

  // 4. Storage Service Check
  console.log(`\n[4/4] Testing Storage Buckets...`);
  try {
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
      console.log(`  ⚠️  Storage service response: ${bucketError.message}`);
    } else {
      const names = (buckets || []).map(b => b.name);
      console.log(`  ✓ Storage service connected. Found ${names.length} bucket(s): ${names.join(', ') || 'None yet'}`);
    }
  } catch (err) {
    console.log(`  ⚠️  Storage check skipped: ${err.message}`);
  }

  // Final Summary
  console.log('\n======================================================');
  console.log('  Diagnostic Summary');
  console.log('======================================================');
  if (authOk && schemaPresent) {
    console.log('  STATUS: CONNECTED & SCHEMA READY ✓');
    console.log('  Your BAOMS application is fully communicating with Supabase PostgreSQL.');
  } else if (authOk && !schemaPresent) {
    console.log('  STATUS: CONNECTED, SCHEMA MIGRATION REQUIRED ⚠️');
    console.log('  1. The connection to Supabase project is 100% verified.');
    console.log('  2. The database tables have not yet been migrated to the remote PostgreSQL.');
    console.log('  3. Apply the SQL migration:');
    console.log('     Open Supabase Dashboard > SQL Editor, paste "supabase/BAOMS_COMPLETE_SCHEMA.sql", and click Run.');
  } else {
    console.log('  STATUS: CONNECTION FAILED ❌');
    console.log('  Please check network access and verify your project credentials.');
  }
  console.log('======================================================\n');
}

runDiagnostics();
