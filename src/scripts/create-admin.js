import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');
const envPath = path.join(rootDir, '.env.local');

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

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

async function main() {
  const email = process.argv[2] || 'admin@babawatoto.or.tz';
  const password = process.argv[3] || 'Admin@BabaWatoto2026!';
  
  console.log(`Attempting to register admin user in Supabase Auth...`);
  console.log(`Email: ${email}`);
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'System Administrator',
        role: 'system_admin',
        department: 'ADMIN',
      }
    }
  });

  if (error) {
    console.error('Error signing up admin:', error.message, error.status);
  } else {
    console.log('Successfully registered admin user in Supabase Auth!');
    console.log('User ID:', data.user?.id);
    console.log('Email:', data.user?.email);
    console.log('Identities:', data.user?.identities?.length);
    console.log('Confirmation sent / Confirmed at:', data.user?.confirmed_at);
  }
}

main();
