import { createClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_URL = 'https://sqleehfbooigtthzmvbd.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_L2QYbVnAa3XTfImkz99AEg_SOT_zES4';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-ref.supabase.co' &&
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  !supabaseAnonKey.includes('placeholder')
);

/**
 * Shared Supabase Client instance.
 * Client-safe: Only connects with the anonymous publishable key.
 * All data access is governed by PostgreSQL Row-Level Security (RLS).
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'baoms_supabase_auth_token',
    },
    global: {
      headers: {
        'x-application-name': 'BAOMS-Client',
      },
    },
  }
);

export interface SupabaseConnectionStatus {
  isConfigured: boolean;
  connected: boolean;
  authHealthy: boolean;
  schemaReady: boolean;
  latencyMs: number;
  error: string | null;
}

/**
 * Safe, non-destructive connection verification helper.
 * Tests gateway latency, auth endpoint responsiveness, and schema readiness.
 */
export async function testSupabaseConnection(): Promise<SupabaseConnectionStatus> {
  const result: SupabaseConnectionStatus = {
    isConfigured: isSupabaseConfigured,
    connected: false,
    authHealthy: false,
    schemaReady: false,
    latencyMs: 0,
    error: null,
  };

  if (!isSupabaseConfigured) {
    result.error = 'Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not configured.';
    return result;
  }

  const start = performance.now();

  try {
    // 1. Safe Auth heartbeat check
    const { error: authError } = await supabase.auth.getSession();
    if (authError) {
      result.error = `Auth service error: ${authError.message}`;
      result.latencyMs = Math.round(performance.now() - start);
      return result;
    }
    result.authHealthy = true;
    result.connected = true;

    // 2. Safe non-destructive schema readiness check (query core profiles table)
    const { error: dbError, status } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    result.latencyMs = Math.round(performance.now() - start);

    if (dbError) {
      // PGRST205 indicates table not yet migrated
      if (dbError.code === 'PGRST205') {
        result.schemaReady = false;
        result.error = 'Connected to Supabase project, but database tables are not yet created. Migrations must be applied.';
      } else {
        result.error = `Database query returned: [${dbError.code}] ${dbError.message}`;
      }
    } else if (status === 200 || status === 204) {
      result.schemaReady = true;
    }

    return result;
  } catch (err: unknown) {
    result.latencyMs = Math.round(performance.now() - start);
    result.error = err instanceof Error ? err.message : String(err);
    return result;
  }
}

