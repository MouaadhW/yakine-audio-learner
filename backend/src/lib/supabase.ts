import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

let supabase: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (supabase) return supabase;

  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env to use Supabase Storage'
    );
  }

  supabase = createClient(url, key);
  return supabase;
}
