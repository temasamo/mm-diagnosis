export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
export async function GET() {
  const hasUrl = !!process.env.SUPABASE_URL && process.env.SUPABASE_URL!.startsWith('http');
  const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY!.length > 20;
  return NextResponse.json({ ok: hasUrl && hasKey, hasUrl, hasKey });
} 