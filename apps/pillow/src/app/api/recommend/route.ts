export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { ENABLED_MALLS, type MallProduct } from "../../../../lib/types";
import { rankCandidates } from "../../../lib/recommend";

// このAPI専用の受け取り型（影響範囲を局所化）
type RecommendBody = {
  postures?: string[];
  concerns?: string[];
  pillowMaterial?: string[];
};

export async function POST(req: Request) {
  // 追加フィールド（postures/concerns/pillowMaterial）を許容（非破壊のため any 受け）
  const body: any = await req.json();

  // Amazon申請中のため、生成時にフィルタ
  const isEnabledMall = (m: MallProduct["mall"]) => ENABLED_MALLS.includes(m);

  const picks: MallProduct[] = [
    {
      id: "stub-1",
      title: `[Stub] スタンダード / 高反発系`,
      image: "/placeholder.png",
      url: "#",
      price: 32980,
      mall: "rakuten" as const
    },
    {
      id: "stub-2",
      title: "[Stub] 通気重視モデル",
      image: "/placeholder.png",
      url: "#",
      price: 29800,
      mall: "yahoo" as const
    }
  ].filter(p => isEnabledMall(p.mall));

  // ---- RECO_WIRING=1 の時のみ、meta.final を付与（既存 items は変更しない） ----
  if (process.env.RECO_WIRING === "1") {
    try {
      const final = rankCandidates({
        postures: Array.isArray(body?.postures) ? body.postures : [],
        concerns: Array.isArray(body?.concerns) ? body.concerns : [],
        pillowMaterial: Array.isArray(body?.pillowMaterial) ? body.pillowMaterial : [],
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
