export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { ENABLED_MALLS, type RecommendRequest, type MallProduct } from "../../../../lib/types";
import { finalizeResult } from "../../../lib/recommend/finalizeResult";
import { normalizeAnswers } from "../../../lib/recommend/signals";
import { pickPrimaryAndSecondary } from "../../../lib/recommend/rank";

export async function POST(req: Request) {
  const body = (await req.json()) as RecommendRequest;

  // Amazon申請中のため、生成時にフィルタ
  const isEnabledMall = (m: MallProduct["mall"]) => ENABLED_MALLS.includes(m);

  const picks: MallProduct[] = [
    {
      id: "stub-1",
      title: `[Stub] ${body.primaryGroup ?? "スタンダード"} / 高反発系`,
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

  // --- ここから "配線のみ"。フラグ OFF なら何もしない ---
  let meta: any = undefined;
  try {
    if (process.env.RECO_WIRING === "1") {
      // 1) 回答を正規化（signals.ts）
      const normalizedAnswers = normalizeAnswers({
        postures: body.answers?.postures ?? [],
        concerns: body.answers?.concerns ?? [],
        currentPillowMaterial: body.answers?.pillowMaterial?.[0],
      });
      
      // 2) 既存の finalizeResult で最終出力形式へ
      const final = finalizeResult({
        ...body.answers,
        postures: body.answers?.postures ?? [],
        sleepingPosition: body.answers?.postures?.[0], // 後方互換ガード
      });
      
      // 3) 今回は "配線" だけ：final の結果を meta に反映（無害なメタ情報）
      meta = {
        final: {
          primaryGroup: final.primaryGroup ?? [],
          secondaryGroup: final.secondaryGroup ?? [],
          reasons: final.reasons ?? [],
        }
      };
    }
  } catch (e) {
    // 配線失敗は握りつぶす（非破壊）
    console.warn("[recommend wiring] skipped:", e);
  }

  return NextResponse.json(meta ? { items: picks, meta } : { items: picks });
}
