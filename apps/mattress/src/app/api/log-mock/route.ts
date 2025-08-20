export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

type ResultPayload = {
  primaryGroup: string[];
  secondaryGroup: string[];
  reasons: string[];
};

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
  const o = x as Record<string, unknown>;
  return typeof o.step === 'string';
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown;
    if (!isLogPayload(body)) {
      return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
    }

    // モックレスポンス（Supabase接続なし）
    console.log('Mock log received:', {
      step: body.step,
      answers: body.answers,
      result: body.result,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ 
      ok: true, 
      id: 'mock-' + Date.now(),
      message: 'Mock log entry created (Supabase connection bypassed)'
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
} 