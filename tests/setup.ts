import '@testing-library/jest-dom';
import { vi } from 'vitest';

// In automated unit tests, keep Supabase in offline mock mode so tests are fast, deterministic, and network-independent
vi.mock('@/lib/supabase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/supabase')>();
  return {
    ...actual,
    isSupabaseConfigured: false,
  };
});
