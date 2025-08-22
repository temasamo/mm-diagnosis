export type Mall = "rakuten" | "yahoo" | "amazon" | "mock";
export type MallProduct = {
  id: string;
  title: string;
  url: string;
  image: string | null;
  price: number | null;
  mall: Mall;
  shop?: string | null;
};

/**
 * クライアント/サーバどちらから呼ばれてもOK:
 * - サーバ: adapters直接（将来的な最適化のための余地）
 * - クライアント: 常に /api/search-cross を経由（環境変数を漏らさない）
 */
export async function searchAllMalls(query: string, limit = 6): Promise<MallProduct[]> {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    const res = await fetch(`/api/search-cross?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as MallProduct[];
  } else {
    // サーバ側（現時点はAPIへ委譲で統一）
    const { NextResponse } = await import("next/server");
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/search-cross?${params.toString()}`, { cache: "no-store" })
      .catch(() => null as any);
    if (res?.ok) return (await res.json()) as MallProduct[];
    return [];
  }
} 