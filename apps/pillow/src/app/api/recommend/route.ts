export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { ENABLED_MALLS, type MallProduct } from "../../../../lib/types";
import { rankCandidates } from "../../../lib/recommend";
import { applyBanFilter, type Item } from "../../../lib/recommend/filter";

// このAPI専用の受け取り型（影響範囲を局所化）
type RecommendBody = {
  postures?: string[];
  concerns?: string[];
  pillowMaterial?: string[];
  avoid?: {
    materials?: string[];
    structures?: string[];
    brands?: string[];
  };
};

export async function POST(req: Request) {
  // 追加フィールド（postures/concerns/pillowMaterial/avoid）を許容（非破壊のため any 受け）
  const body: any = await req.json();

  // Amazon申請中のため、生成時にフィルタ
  const isEnabledMall = (m: MallProduct["mall"]) => ENABLED_MALLS.includes(m);

  // stubデータに仮想フィールドを追加（テスト用）
  const stubItems: Item[] = [
    {
      id: "stub-1",
      title: `[Stub] スタンダード / 高反発系`,
      image: "/placeholder.png",
      url: "#",
      price: 32980,
      mall: "rakuten" as const,
      material: "highRebound",
      structure: "flat",
      brand: "StandardBrand"
    },
    {
      id: "stub-2",
      title: "[Stub] 通気重視モデル",
      image: "/placeholder.png",
      url: "#",
      price: 29800,
      mall: "yahoo" as const,
      material: "latex",
      structure: "contour",
      brand: "ComfortBrand"
    }
  ];

  // banフィルタを適用
  const filteredItems = applyBanFilter(stubItems, body?.avoid);

  // MallProduct型に変換（既存互換性のため）
  const picks: MallProduct[] = filteredItems
    .filter(p => isEnabledMall(p.mall))
    .map(item => ({
      id: item.id,
      title: item.title,
      image: item.image || "/placeholder.png",
      url: item.url,
      price: item.price || 0,
      mall: item.mall
    }));

  // ---- RECO_WIRING=1 の時のみ、meta.final を付与（既存 items は変更しない） ----
  if (process.env.RECO_WIRING === "1") {
    try {
      const final = rankCandidates({
        postures: Array.isArray(body?.postures) ? body.postures : [],
        concerns: Array.isArray(body?.concerns) ? body.concerns : [],
        pillowMaterial: Array.isArray(body?.pillowMaterial) ? body.pillowMaterial : [],
        avoid: body?.avoid,
      });
      return NextResponse.json({ items: picks, meta: { final } });
    } catch (e) {
      console.warn("[recommend] meta.final wiring skipped:", e);
      return NextResponse.json({ items: picks });
    }
  }
  // 既存どおり
  return NextResponse.json({ items: picks });
}
