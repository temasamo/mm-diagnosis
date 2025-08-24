import { NextRequest, NextResponse } from 'next/server';
import { searchRakuten } from '../../../../lib/malls/rakuten';
import { searchYahoo } from '../../../../lib/malls/yahoo';
import { cacheGet, cacheSet } from '../../../../lib/cache';
import { dedupeAndPickCheapest } from '../../../../lib/dedupe';
import { getBandById, inBand } from '../../../../lib/budget';
import { priceDistanceToBand } from '../../../../lib/price';
import type { SearchItem } from '../../../../lib/malls/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TTL_MS = 15 * 60 * 1000;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '';
  const limit = Number(req.nextUrl.searchParams.get('limit') || 30);
  const bandId = req.nextUrl.searchParams.get('band');
  const band = bandId ? getBandById(bandId) : null;
  const key = `cross:${q}:${limit}:${bandId || 'none'}`;

  const debug = !!(process.env.MALLS_DEBUG || process.env.NEXT_PUBLIC_DEBUG_MALLS);

  if (!q) return NextResponse.json([], { status: 200 });

  const cached = cacheGet<SearchItem[]>(key);
  if (cached) return NextResponse.json(cached, { status: 200 });

  if (debug) console.time('[search-cross total]');

  // 1) 取得
  const [rkt, yho] = await Promise.allSettled([
    searchRakuten(q, limit * 2), // 余裕めに取る
    searchYahoo(q, limit * 2),
  ]);

  // 正規化済み: { id, mall, title, url, price:number|null, image, shop }
  const all: SearchItem[] = [
    ...(rkt.status === 'fulfilled' ? rkt.value : []),
    ...(yho.status === 'fulfilled' ? yho.value : []),
  ];

  // 2) 予算で厳密フィルタ
  let inBudgetItems = band ? all.filter(i => i.price != null && inBand(i.price!, band)) : all;
  // 価格が近い順に並べておく（同額帯の中での並び安定）
  if (band) {
    const center = (band.min + band.max) / 2;
    inBudgetItems = inBudgetItems.sort(
      (a, b) => Math.abs((a.price ?? center) - center) - Math.abs((b.price ?? center) - center)
    );
  }

  // 3) 足りないぶんは予算外から距離の近い順に補充
  let picked = inBudgetItems.slice(0, limit);
  const inBudgetHits = inBudgetItems.length;

  if (picked.length < limit && band) {
    const out = all
      .filter(i => i.price == null || !inBand(i.price!, band))
      .map(i => {
        const distance = priceDistanceToBand(i.price, band);
        const budgetDirection =
          i.price == null ? "unknown" : i.price < band.min ? "under" : "over";
        return { ...i, _distance: distance, outOfBudget: true, budgetDirection };
      })
      .sort((a, b) => a._distance - b._distance);

    for (const i of out) {
      if (picked.length >= limit) break;
      picked.push(i);
    }
  }

  // 4) ヘッダで状況通知
  const fallbackUsed = band ? picked.every(i => (i as any).outOfBudget === true) : false;
  const headers = new Headers();
  headers.set("x-budget-hits", String(inBudgetHits));
  headers.set("x-budget-fallback", fallbackUsed ? "1" : "0");

  // クライアントで使いやすいように内部フィールドは除去
  picked = picked.map(({ _distance, ...rest }: any) => rest);

  if (debug) {
    console.log('[search-cross] rakuten:', rkt.status === 'fulfilled' ? rkt.value.length : `ERR:${(rkt as any).reason}`);
    console.log('[search-cross] yahoo  :', yho.status === 'fulfilled' ? yho.value.length : `ERR:${(yho as any).reason}`);
    console.log('[search-cross] merged :', picked.length);
    console.log('[search-cross] budget hits:', inBudgetHits);
    console.log('[search-cross] fallback used:', fallbackUsed);
    console.timeEnd('[search-cross total]');
  }

  cacheSet(key, picked, TTL_MS);
  
  return new NextResponse(JSON.stringify(picked), {
    status: 200,
    headers,
  });
} 