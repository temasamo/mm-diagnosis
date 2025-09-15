import { NextRequest, NextResponse } from 'next/server';
import { searchRakuten } from '../../../../lib/malls/rakuten';
import { searchYahoo } from '../../../../lib/malls/yahoo';
import { cacheGet, cacheSet } from '../../../../lib/cache';
import { dedupeAndPickCheapest } from '../../../../lib/dedupe';
import { ALL_BANDS, toPriceRange, neighborBand, toBudgetBand, type BudgetBand } from '../../../../lib/budget';
import type { SearchItem, BandDistance } from '../../../../lib/malls/types';
import { applyFilters } from './filters';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TTL_MS = 15 * 60 * 1000;
const PER_BAND_LIMIT = 30;

type BandPlan = {
  id: BudgetBand['id'];
  range: { min: number; max: number };
  distance: BandDistance;
};

function buildBandPlan(baseId: BudgetBand['id']): BandPlan[] {
  const base = { id: baseId, range: toPriceRange(baseId), distance: 0 as BandDistance };
  const upper = neighborBand(baseId, 'upper');
  const lower = neighborBand(baseId, 'lower');

  const plan: BandPlan[] = [base];
  
  if (upper) {
    plan.push({ id: upper.id, range: toPriceRange(upper.id), distance: 1 });
  }
  
  // 基準が2万円以上のときのみ下位も検索
  if (base.range.min >= 20000 && lower) {
    plan.push({ id: lower.id, range: toPriceRange(lower.id), distance: -1 });
  }
  
  return plan;
}

async function searchBand(
  query: string, 
  range: { min: number; max: number }, 
  limit: number
): Promise<SearchItem[]> {
  const [rkt, yho] = await Promise.allSettled([
    searchRakuten(query, range, limit),
    searchYahoo(query, range, limit),
  ]);

  const items: SearchItem[] = [
    ...(rkt.status === 'fulfilled' ? rkt.value : []),
    ...(yho.status === 'fulfilled' ? yho.value : []),
  ];

  return applyFilters(items);
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '';
  const limit = Number(req.nextUrl.searchParams.get('limit') || 30);
  const bandId = req.nextUrl.searchParams.get('band') as BudgetBand['id'] | null;
  
  if (!q) return NextResponse.json([], { status: 200 });
  
  // デフォルトバンドを設定（指定がない場合）
  const baseBandId = bandId || '6k-10k';
  const key = `cross-multi:${q}:${limit}:${baseBandId}`;

  const debug = !!(process.env.MALLS_DEBUG || process.env.NEXT_PUBLIC_DEBUG_MALLS);

  const cached = cacheGet<SearchItem[]>(key);
  if (cached) return NextResponse.json(cached, { status: 200 });

  if (debug) console.time('[search-cross total]');

  try {
    // 1) バンド計画を立てる
    const plan = buildBandPlan(baseBandId);
    
    if (debug) {
      console.log('[search-cross] plan:', plan.map(p => `${p.id}(${p.distance})`).join(', '));
    }

    // 2) 各バンドで並列検索
    const tasks = plan.map(p => searchBand(q, p.range, PER_BAND_LIMIT));
    const results = await Promise.all(tasks);

    // 3) 各結果にbandIdとbandDistanceを付与
    const allItems: SearchItem[] = [];
    for (let i = 0; i < results.length; i++) {
      const bandPlan = plan[i];
      const items = results[i];
      
      for (const item of items) {
        // 価格から実際のbandIdを決定
        const actualBandId = toBudgetBand(item.price).id;
        
        allItems.push({
          ...item,
          bandId: actualBandId,
          bandDistance: bandPlan.distance,
        });
      }
    }

    // 4) 重複排除
    const deduped = dedupeAndPickCheapest(allItems);

    // 5) 基準バンド優先でソート
    const sorted = deduped.sort((a, b) => {
      // 基準バンド（distance: 0）を最優先
      if (a.bandDistance !== b.bandDistance) {
        return Math.abs(a.bandDistance || 0) - Math.abs(b.bandDistance || 0);
      }
      // 同じdistance内では価格順
      return (a.price || 0) - (b.price || 0);
    });

    // 6) 指定件数に制限
    const limited = sorted.slice(0, limit);

    // 7) 統計情報をヘッダーに設定
    const inBudgetCount = limited.filter(item => item.bandDistance === 0).length;
    const headers = new Headers();
    headers.set("x-budget-hits", String(inBudgetCount));
    headers.set("x-bands-searched", String(plan.length));

    if (debug) {
      console.log('[search-cross] total items:', allItems.length);
      console.log('[search-cross] after dedup:', deduped.length);
      console.log('[search-cross] budget hits:', inBudgetCount);
      console.log('[search-cross] bands:', plan.length);
      console.timeEnd('[search-cross total]');
    }

    cacheSet(key, limited, TTL_MS);
    
    return new NextResponse(JSON.stringify(limited), {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('[search-cross] Error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
