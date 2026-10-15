import { createClient, SupabaseClient } from '@supabase/supabase-js';
let client: SupabaseClient | null = null;
export function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase environment variables are missing. Copy .env.example to .env.local and add your project URL and publishable key.');
  if (!client) client = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storage: typeof window !== 'undefined' ? window.localStorage : undefined } });
  return client;
}
