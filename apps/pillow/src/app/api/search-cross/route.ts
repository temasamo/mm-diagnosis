import { NextRequest, NextResponse } from "next/server";
import { findBandById, adjacentFor30Plus30, toBandId, resolveBandId } from "../../../lib/budget";
import { searchRakuten } from "../../../../lib/malls/rakuten";
import { searchYahoo } from "../../../../lib/malls/yahoo";
import { dedupeAndPickCheapest } from "../../../../lib/dedupe";
import type { Product } from "../../../lib/types/product";

// 価格帯での後段フィルタ関数
const inBand = (price: number, band: { min: number; max: number | null }) =>
  typeof price === "number" &&
  price >= band.min &&
  (band.max === null || price <= band.max);

const PRIMARY_LIMIT = 30;
const ADJ_LIMIT = 30;

export async function POST(req: NextRequest) {
  const body = await req.json();
  // body.bandId でも answers?.budget でも拾えるように
  const rawBandId: string | null = body.bandId ?? body.budget ?? null;
  const normalized = resolveBandId(rawBandId);

  const primary = normalized ? findBandById(normalized) : null;
  if (!primary) {
    return NextResponse.json({ error: "invalid bandId", bandId: rawBandId }, { status: 400 });
  }
  const adjacent = adjacentFor30Plus30(primary); // null の場合は補完なし
  console.info("[search-range]", { primary, adjacent, query: body.query });

  // 価格レンジをモール検索引数へ
  const toRange = (b: { min: number; max: number | null }) =>
    ({ min: b.min, max: b.max ?? undefined } as { min: number; max?: number });

  const tasks: Promise<any>[] = [];

  // primary 30件
  tasks.push(searchRakuten(body.query, toRange(primary), PRIMARY_LIMIT, { tag: "primary" }));
  tasks.push(searchYahoo(body.query, toRange(primary), PRIMARY_LIMIT, { tag: "primary" }));

  // adjacent 30件（あれば）
  if (adjacent) {
    tasks.push(searchRakuten(body.query, toRange(adjacent), ADJ_LIMIT, { tag: "adjacent" }));
    tasks.push(searchYahoo(body.query, toRange(adjacent), ADJ_LIMIT, { tag: "adjacent" }));
  }

  const settled = await Promise.allSettled(tasks);

  // 正規化された配列を吸い上げ（各 searchXxx は normalized product[] を返す想定）
  let results: Product[] = [];
  for (const it of settled) {
    if (it.status === "fulfilled" && Array.isArray(it.value)) {
      results.push(...it.value);
    }
  }

  // 収集済み results: Product[]
  let filtered: Product[] = [];

  for (const p of results) {
    const price = (p as any).priceYen ?? (p as any).price ?? 0;

    // meta.bandTag を信じず、価格で厳密判定
    if (inBand(price, primary)) {
      // primary 枠
      p.meta = { ...(p.meta ?? {}), bandTag: "primary", bandId: toBandId(price) };
      filtered.push(p);
    } else if (adjacent && inBand(price, adjacent)) {
      // adjacent 枠
      p.meta = { ...(p.meta ?? {}), bandTag: "adjacent", bandId: toBandId(price) };
      filtered.push(p);
    }
  }

  // 件数が少ない時のフェイルセーフ（任意・最小）
  if (filtered.length === 0 && adjacent) {
    // まずは adjacent だけで再実行
    const fb = await Promise.allSettled([
      searchRakuten(body.query, toRange(adjacent), 30, { tag: "adjacent" }),
      searchYahoo(body.query, toRange(adjacent), 30, { tag: "adjacent" }),
    ]);

    for (const it of fb) {
      if (it.status === "fulfilled" && Array.isArray(it.value)) {
        for (const p of it.value) {
          const price = (p as any).priceYen ?? (p as any).price ?? 0;
          if (inBand(price, adjacent)) {
            p.meta = { ...(p.meta ?? {}), bandTag: "adjacent", bandId: toBandId(price) };
            filtered.push(p);
          }
        }
      }
    }
  }


  // 直前に追加
  function forDedupe<T extends { image?: string | null; imageUrl?: string | null }>(p: T) {
    // image or imageUrl のどちらかに入っているケースも吸収
    const img = p.image ?? p.imageUrl ?? undefined;
    // null を undefined に落として、dedupe が期待する型に合わせる
    return { ...p, image: img } as Omit<T, "image"> & { image?: string };
  }

  // これまでの filtered を正規化してから dedupe に渡す
  const filteredForDedupe = filtered.map(forDedupe);
  console.log("[server] Raw results count:", results.length);
  console.log("[server] Yahoo items in raw results:", results.filter(item => item.mall === 'yahoo').length);
  console.log("[server] Filtered results count:", filtered.length);
  console.log("[server] Yahoo items in filtered:", filtered.filter(item => item.mall === 'yahoo').length);
  const deduped = dedupeAndPickCheapest(filteredForDedupe) as typeof filtered;
  console.log("[server] Deduped results count:", deduped.length);
  console.log("[server] Yahoo items in deduped:", deduped.filter(item => item.mall === 'yahoo').length); // 必要なら as で戻す
  return NextResponse.json({ items: deduped }, { status: 200 });
}

// 既存のGETエンドポイントも保持（後方互換性のため）
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '';
  const limit = Number(req.nextUrl.searchParams.get('limit') || 30);
  const bandId = req.nextUrl.searchParams.get('band');
  
  if (!q) return NextResponse.json([], { status: 200 });

  // 新しいPOSTエンドポイントを内部で呼び出し
  const mockReq = new NextRequest('http://localhost/api/search-cross', {
    method: 'POST',
    body: JSON.stringify({ query: q, bandId: bandId || '10k-20k' })
  });
  
  return POST(mockReq);
}
