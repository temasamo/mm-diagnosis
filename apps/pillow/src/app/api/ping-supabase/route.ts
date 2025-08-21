export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export async function GET() {
  try {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await supabase.from('diagnosis_events').select('id').limit(1);
    if (error) return NextResponse.json({ ok:false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok:true, rows: (data?.length ?? 0) });
  } catch (e) { return NextResponse.json({ ok:false, error: String(e) }, { status: 500 }); }
} 