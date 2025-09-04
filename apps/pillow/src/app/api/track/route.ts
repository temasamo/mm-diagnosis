import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try { await req.json(); } catch {}
  return new Response(null, {
    status: 204,
    headers: { 'Cache-Control': 'no-store' },
  });
} 