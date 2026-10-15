/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_SHORT_NAME?: string;
  readonly VITE_DEFAULT_LANGUAGE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
