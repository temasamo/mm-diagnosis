import 'server-only';
import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    // ビルドエラーを避けるため、実行時に 503 ハンドリングする
    return null as any;
  }
  return createClient(url, key, { auth: { persistSession: false } });
} 