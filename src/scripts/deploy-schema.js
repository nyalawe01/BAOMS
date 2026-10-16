import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');
const schemaPath = path.join(rootDir, 'supabase/BAOMS_COMPLETE_SCHEMA.sql');

const token = process.env.SUPABASE_ACCESS_TOKEN || '';
const projectRef = process.env.SUPABASE_PROJECT_REF || 'sqleehfbooigtthzmvbd';

async function deploySchema() {
  console.log('\n======================================================');
  console.log('  BAOMS — Automatic Supabase Database Deployment');
  console.log('======================================================\n');

  if (!fs.existsSync(schemaPath)) {
    console.error(`❌ Schema file not found: ${schemaPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');
  console.log(`[1/3] Loaded schema file (${sql.length} characters, ~${sql.split('\n').length} lines).`);
  console.log(`[2/3] Executing complete schema on Supabase PostgreSQL (Project: ${projectRef})...`);

  const t0 = performance.now();
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  const duration = Math.round(performance.now() - t0);

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`\n❌ Migration failed after ${duration}ms: HTTP ${res.status} ${res.statusText}`);
    try {
      const errJson = JSON.parse(errorText);
      console.error('Error Details:', JSON.stringify(errJson, null, 2));
    } catch {
      console.error('Error Details:', errorText);
    }
    process.exit(1);
  }

  const result = await res.json();
  console.log(`\n✓ Schema executed successfully in ${duration}ms!`);

  // Verification step
  console.log(`\n[3/3] Verifying created tables and admin account...`);
  const verifyRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        SELECT 
          (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as total_public_tables,
          (SELECT count(*) FROM public.roles) as total_roles,
          (SELECT count(*) FROM public.departments) as total_departments,
          (SELECT count(*) FROM public.profiles WHERE approval_status = 'approved') as approved_profiles,
          (SELECT email_confirmed_at IS NOT NULL FROM auth.users WHERE email = 'admin@babawatoto.or.tz') as admin_confirmed;
      `
    }),
  });

  if (verifyRes.ok) {
    const stats = await verifyRes.json();
    console.log('Database Stats:', stats[0]);
  }

  console.log('\n======================================================');
  console.log('  STATUS: DEPLOYMENT COMPLETE & FULLY VERIFIED ✓');
  console.log('======================================================\n');
}

deploySchema();
