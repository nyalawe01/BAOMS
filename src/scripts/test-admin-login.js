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
  const email = 'admin@babawatoto.or.tz';
  const password = 'Admin@BabaWatoto2026!';
  
  console.log(`Testing Supabase Auth signInWithPassword for ${email}...`);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) {
    console.log(`Sign-in response status: ${error.message} (${error.status || error.code})`);
  } else {
    console.log(`✓ Admin user successfully signed in!`);
    console.log(`Session user:`, data.user.id, data.user.email);
  }
}

main();
