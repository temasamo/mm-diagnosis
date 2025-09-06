export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { ENABLED_MALLS, type MallProduct } from "../../../../lib/types";
import { finalizeResult, makeSignals, rankCandidates } from "../../../lib/recommend";

// このAPI専用の受け取り型（影響範囲を局所化）
type RecommendBody = {
  postures?: string[];
  concerns?: string[];
  pillowMaterial?: string[];
};

export async function POST(req: Request) {
  // 追加された postures/concerns/pillowMaterial を許容するため、一旦ゆるい型で受ける
  // （将来は RecommendRequest 側に正式反映する）
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

  // ---- ここから"配線のみ"：デフォルト無効。RECO_WIRING=1 の時だけ meta.final を付与 ----
  let meta: any = undefined;
  try {
    if (process.env.RECO_WIRING === "1") {
      // 1) 入力→信号へ
      const signals = makeSignals({
        postures: Array.isArray(body?.postures) ? body.postures : [],
        concerns: Array.isArray(body?.concerns) ? body.concerns : [],
        pillowMaterial: Array.isArray(body?.pillowMaterial) ? body.pillowMaterial : [],
      });
      // 2) 信号→候補ランク（将来、items 実データへ拡張予定。今は"流れ"の配線のみ）
      const ranked = rankCandidates(signals); // { primary: string[], secondary: string[] } を想定
      // 3) 既存 finalize を併用して形式を統一
      const final = finalizeResult({
        ...body,
        postures: Array.isArray(body?.postures) ? body.postures : [],
        sleepingPosition: body.postures?.[0] // 既存後方互換
      });

      meta = {
        final: {
          primaryGroup: final.primaryGroup?.length ? final.primaryGroup : (ranked.primary ?? []),
          secondaryGroup: final.secondaryGroup?.length ? final.secondaryGroup : (ranked.secondary ?? []),
          reasons: final.reasons ?? []
        }
      };

      // オプション: デバッグ用ヘッダ（本番では NODE_ENV=production で非表示）
      if (process.env.RECO_DEBUG === "1" && process.env.NODE_ENV !== "production") {
        const headers = new Headers();
        headers.set("x-reco-signals", JSON.stringify(signals));
        headers.set("x-picked", "primary=3; secondary=3");
        return new NextResponse(JSON.stringify({ items: picks, meta }), { status: 200, headers });
      }
    }
  } catch (e) {
    console.warn("[recommend:wiring] skip due to error:", e);
  }

  return NextResponse.json(meta ? { items: picks, meta } : { items: picks });
}
