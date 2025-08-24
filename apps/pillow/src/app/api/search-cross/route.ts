import { NextRequest, NextResponse } from 'next/server';
import { searchRakuten } from '../../../../lib/malls/rakuten';
import { searchYahoo } from '../../../../lib/malls/yahoo';
import { cacheGet, cacheSet } from '../../../../lib/cache';
import { dedupeAndPickCheapest } from '../../../../lib/dedupe';
import type { SearchItem } from '../../../../lib/malls/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TTL_MS = 15 * 60 * 1000;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '';
  const limit = Number(req.nextUrl.searchParams.get('limit') || 30);
  const key = `cross:${q}:${limit}`;

  const debug = !!(process.env.MALLS_DEBUG || process.env.NEXT_PUBLIC_DEBUG_MALLS);

  if (!q) return NextResponse.json([], { status: 200 });

  const cached = cacheGet<SearchItem[]>(key);
  if (cached) return NextResponse.json(cached, { status: 200 });

  if (debug) console.time('[search-cross total]');

  const [rkt, yho] = await Promise.allSettled([
    searchRakuten(q, limit),
    searchYahoo(q, limit),
  ]);

  const items: SearchItem[] = [
    ...(rkt.status === 'fulfilled' ? rkt.value : []),
    ...(yho.status === 'fulfilled' ? yho.value : []),
  ];

  const merged = dedupeAndPickCheapest(items).sort((a,b) => a.price - b.price);

  if (debug) {
    console.log('[search-cross] rakuten:', rkt.status === 'fulfilled' ? rkt.value.length : `ERR:${(rkt as any).reason}`);
    console.log('[search-cross] yahoo  :', yho.status === 'fulfilled' ? yho.value.length : `ERR:${(yho as any).reason}`);
    console.log('[search-cross] merged :', merged.length);
    console.timeEnd('[search-cross total]');
  }

  cacheSet(key, merged, TTL_MS);
  return NextResponse.json(merged, { status: 200 });
} 