import { NextRequest, NextResponse } from "next/server";
import { findBandById, adjacentFor30Plus30, toBandId } from "../../../lib/budget";
import { searchRakuten } from "../../../../lib/malls/rakuten";
import { searchYahoo } from "../../../../lib/malls/yahoo";
import { dedupeAndPickCheapest } from "../../../../lib/dedupe";
import type { Product } from "../../../lib/types/product";

const PRIMARY_LIMIT = 30;
const ADJ_LIMIT = 30;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { query, bandId } = body as { query: string; bandId: string };

  const primary = findBandById(bandId);
  if (!primary) {
    return NextResponse.json({ error: "invalid bandId" }, { status: 400 });
  }
  const adjacent = adjacentFor30Plus30(primary); // null の場合は補完なし

  // 価格レンジをモール検索引数へ
  const toRange = (b: { min: number; max: number | null }) =>
    ({ min: b.min, max: b.max ?? undefined } as { min: number; max?: number });

  const tasks: Promise<any>[] = [];

  // primary 30件
  tasks.push(searchRakuten(query, toRange(primary), PRIMARY_LIMIT, { tag: "primary" }));
  tasks.push(searchYahoo(query, toRange(primary), PRIMARY_LIMIT, { tag: "primary" }));

  // adjacent 30件（あれば）
  if (adjacent) {
    tasks.push(searchRakuten(query, toRange(adjacent), ADJ_LIMIT, { tag: "adjacent" }));
    tasks.push(searchYahoo(query, toRange(adjacent), ADJ_LIMIT, { tag: "adjacent" }));
  }

  const settled = await Promise.allSettled(tasks);

  // 正規化された配列を吸い上げ（各 searchXxx は normalized product[] を返す想定）
  const results: Product[] = [];
  for (const it of settled) {
    if (it.status === "fulfilled" && Array.isArray(it.value)) {
      results.push(...it.value);
    }
  }

  // どの帯から来たかのメタを保持（searchRakuten/Yahoo 側で meta.bandId/meta.bandTier を付与して返すのが理想）
  // もし付けていない場合はここで fallback で埋める
  for (const p of results) {
    if (!p.meta) p.meta = {};
    if (!p.meta.bandId) p.meta.bandId = toBandId(p.price ?? 0);
    if (!p.meta.bandTag) {
      // 価格から primary/adjacent を推定（誤差許容）
      const inPrimary = (primary.max ?? Infinity) >= (p.price ?? 0) && (p.price ?? 0) >= primary.min;
      p.meta.bandTag = inPrimary ? "primary" : "adjacent";
    }
  }

  const deduped = dedupeAndPickCheapest(results);
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
