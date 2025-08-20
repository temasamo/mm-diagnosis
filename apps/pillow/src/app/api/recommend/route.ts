export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { ENABLED_MALLS, type RecommendRequest, type MallProduct } from "@core/mm";

export async function POST(req: Request) {
  const body = (await req.json()) as RecommendRequest;

  // Amazon申請中のため、生成時にフィルタ
  const isEnabledMall = (m: MallProduct["mall"]) => ENABLED_MALLS.includes(m);

  const picks: MallProduct[] = [
    {
      id: "stub-1",
      title: `[Stub] ${body.primaryGroup[0] ?? "スタンダード"} / 高反発系`,
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

  return NextResponse.json({ items: picks });
} 