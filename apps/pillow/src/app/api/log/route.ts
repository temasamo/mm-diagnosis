export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '../_util/supabase';

type ResultPayload = { primaryGroup: string[]; secondaryGroup: string[]; reasons: string[]; };
type LogPayload = {
  step: 'greet' | 'questions' | 'insights' | 'lastQuestion' | 'results' | string;
  answers?: Record<string, unknown>;
  result?: ResultPayload | null;
  session_id?: string | null;
  ab_bucket?: string | null;
  latency_ms?: number | null;
  mall_clicks?: Record<string, number> | null;
};
function isLogPayload(x: unknown): x is LogPayload {
  if (typeof x !== 'object' || x === null) return false;
  return typeof (x as any).step === 'string';
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown;
    if (!isLogPayload(body)) return NextResponse.json({ error: 'invalid payload' }, { status: 400 });

    const supabase = getServerSupabase();
    const appName = process.env.APP_NAME ?? 'unknown';
    const { data, error } = await supabase
      .from('diagnosis_events')
      .insert({
        app_name: appName,
        step: body.step,
        answers: body.answers ?? {},
        result: body.result ?? null,
        session_id: body.session_id ?? null,
        ab_bucket: body.ab_bucket ?? null,
        latency_ms: body.latency_ms ?? null,
        mall_clicks: body.mall_clicks ?? null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: data?.id ?? null });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
} 