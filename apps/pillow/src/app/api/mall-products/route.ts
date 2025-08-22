import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mall = searchParams.get("mall") || "rakuten";
  const q = searchParams.get("q") || "";
  const limit = Number(searchParams.get("limit") || "6");

  // デモ用モック（IDをクエリ込みでユニークに）
  const slug = q.replace(/\s+/g, "-").slice(0, 40) || "q";
  const mock = Array.from({ length: limit }).map((_, i) => ({
    id: `${mall}-${slug}-${i}`,
    title: `[${mall}] ${q} #${i + 1}`,
    url: `https://example.com/${mall}?q=${encodeURIComponent(q)}&i=${i}`,
    image: null,
    price: null,
    mall,
    shop: null,
  }));
  return NextResponse.json(mock);
} 