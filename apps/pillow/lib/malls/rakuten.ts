/**
 * 楽天市場 商品検索 API アダプタ
 * https://app.rakuten.co.jp/services/api/IchibaItem/Search/20170706
 * 必須: RAKUTEN_APP_ID
 * 任意: RAKUTEN_AFFILIATE_ID
 */
export type MallProduct = {
  id: string;
  title: string;
  url: string;
  image: string | null;
  price: number | null;
  mall: "rakuten";
  shop?: string | null;
};

const API = "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601";

function httpsify(u?: string | null): string | null {
  if (!u) return null;
  return u.replace(/^http:/, "https:");
}

export async function searchRakuten(q: string, limit: number = 6): Promise<MallProduct[]> {
  const appId = process.env.RAKUTEN_APP_ID;
  if (!appId) {
    console.error("Rakuten: Missing RAKUTEN_APP_ID in env");
    return [];
  }

  const url = new URL(API);
  url.searchParams.set("applicationId", appId);
  url.searchParams.set("format", "json");
  url.searchParams.set("keyword", q);
  url.searchParams.set("hits", String(limit));
  url.searchParams.set("imageFlag", "1"); // 画像必須

  if (process.env.DEBUG) {
    console.log("[rakuten] url:", url.toString());
  }

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) {
      console.error("[rakuten] bad response:", res.status, await res.text());
      return [];
    }
    const json = await res.json();
    if (!json.Items) {
      console.warn("[rakuten] no items:", json);
      return [];
    }

    return json.Items.map((it: any, i: number) => {
      const item = it.Item;
      return {
        id: `rakuten-${item.itemCode || i}`,
        title: item.itemName,
        url: item.itemUrl,
        image: httpsify(item.mediumImageUrls?.[0]?.imageUrl) || undefined,
        price: item.itemPrice,
        mall: "rakuten",
      };
    });
  } catch (err) {
    console.error("[rakuten] fetch error:", err);
    return [];
  }
} 