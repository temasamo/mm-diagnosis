/**
 * Yahoo!ショッピング 商品検索 API (V3)
 * https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch
 * 必須: YAHOO_APP_ID
 * 任意: YAHOO_AFFILIATE_ID (設定内容によりパラメータが異なる場合あり)
 */
export type MallProduct = {
  id: string;
  title: string;
  url: string;
  image: string | null;
  price: number | null;
  mall: "yahoo";
  shop?: string | null;
};

const API = "https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch";

function httpsify(u?: string | null): string | null {
  if (!u) return null;
  return u.replace(/^http:/, "https:");
}

export async function searchYahoo(query: string, limit = 6): Promise<MallProduct[]> {
  const appId = process.env.YAHOO_APP_ID;
  if (!appId) {
    console.warn("[yahoo] YAHOO_APP_ID missing");
    return [];
  }

  const affiliateId = process.env.YAHOO_AFFILIATE_ID || "";

  const url = new URL(API);
  url.searchParams.set("appid", appId);
  url.searchParams.set("query", query);
  url.searchParams.set("results", String(Math.min(Math.max(limit, 1), 30)));
  // 必要に応じて並び順: url.searchParams.set("sort", "-score");

  if (affiliateId) {
    // アカウント設定に合わせて調整
    url.searchParams.set("affiliate_type", "vc");
    url.searchParams.set("affiliate_id", affiliateId);
  }

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.warn("[yahoo] bad response", res.status, text.slice(0, 200));
    return [];
  }
  const json: any = await res.json();
  if (json?.error) {
    console.warn("[yahoo] api error:", json);
    return [];
  }
  const hits: any[] = json?.hits ?? [];
  if (process.env.NEXT_PUBLIC_DEBUG_MALL === "1") {
    console.log(`[yahoo] ${hits.length} raw items for "${query}"`);
  }

  const out: MallProduct[] = hits.map((h: any) => {
    const name = h?.name ?? "";
    const price = (() => {
      const raw = h?.price ?? h?.priceLabel?.rawPrice ?? h?.minPrice ?? h?.maxPrice;
      const price = Number(String(raw).replace(/[^\d.]/g, ''));
      return Number.isFinite(price) ? Math.round(price) : null;
    })();
    const url = h?.url ?? h?.urlOversea ?? "#";
    const img =
      h?.image?.medium ||
      h?.image?.small ||
      (Array.isArray(h?.images) ? h.images[0] : null) ||
      null;

    const seller =
      h?.seller?.name ?? h?.store?.name ?? h?.seller?.id ?? h?.sellerId ?? null;

    return {
      id: String(h?.code ?? h?.jan ?? url ?? crypto.randomUUID?.() ?? Math.random()),
      title: String(name),
      url: String(url),
      image: httpsify(typeof img === "string" ? img : img?.url ?? null),
      price,
      mall: "yahoo" as const,
      shop: seller,
    };
  })
  .filter(p => p.title);

  const seen = new Set<string>();
  const ranked = out
    .sort((a, b) => {
      const ai = a.image ? 1 : 0, bi = b.image ? 1 : 0;
      const ap = a.price ?? 0, bp = b.price ?? 0;
      return (bi - ai) || (bp - ap);
    })
    .filter(p => {
      const k = p.url || p.title.slice(0, 80);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

  return ranked.slice(0, limit);
} 