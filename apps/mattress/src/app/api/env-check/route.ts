export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function GET() {
  const hasUrl = !!process.env.SUPABASE_URL;
  const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  return NextResponse.json({
    ok: hasUrl && hasKey,
    hasUrl,
    hasKey,
    urlPreview: hasUrl ? `${process.env.SUPABASE_URL?.substring(0, 20)}...` : null,
    keyPreview: hasKey ? `${process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20)}...` : null
  });
} 