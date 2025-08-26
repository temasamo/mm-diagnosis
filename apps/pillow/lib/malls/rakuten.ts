import { fetchJsonWithRetry } from '../http';
import { normalizePriceToNumber } from '../price';
import { getItemPrice } from '../recommend/price';
import type { SearchItem } from './types';

const RAKUTEN_ENDPOINT = 'https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601';

function toSafeImageUrl(u?: string): string | undefined {
  if (!u) return undefined;
  try {
    const url = new URL(u.replace(/^http:/, "https:"));
    // サムネイルの `_ex=` を 300x300 に揃える
    url.searchParams.set('_ex', '300x300');
    return url.toString();
  } catch {
    return undefined;
  }
}

function pickImage(urls?: { imageUrl: string }[] | null): string | null {
  const u = urls?.[0]?.imageUrl || null;
  if (!u) return null;
  return toSafeImageUrl(u) || null;
}

type RakutenOpts = {
  queries: string[];
  minPrice?: number;
  maxPrice?: number;
  hits?: number;
};

export async function searchRakuten({ queries, minPrice, maxPrice, hits = 30 }: RakutenOpts) {
  const appId = process.env.RAKUTEN_APP_ID;
  if (!appId) return { items: [] };

  const keyword = queries.join(" ");
  const url = new URL(RAKUTEN_ENDPOINT);
  url.searchParams.set('applicationId', appId);
  url.searchParams.set('keyword', keyword);
  url.searchParams.set('hits', String(Math.min(Math.max(hits, 1), 30)));
  url.searchParams.set('imageFlag', '1');
  url.searchParams.set('availability', '1'); // 在庫あり

  if (typeof minPrice === "number") url.searchParams.set("minPrice", String(minPrice));
  if (typeof maxPrice === "number") url.searchParams.set("maxPrice", String(maxPrice));

  // ★ ログ（サーバ側に出ます）
  console.log("[rakuten] GET", url.toString());

  type R = {
    Items: { Item: {
      itemCode: string;
      itemName: string;
      itemUrl: string;
      mediumImageUrls?: { imageUrl: string }[];
      smallImageUrls?: { imageUrl: string }[];
      shopName?: string;
      itemPrice?: number | string;
    }}[];
  };

  try {
    const data = await fetchJsonWithRetry<R>(url.toString());
    const items: SearchItem[] = (data.Items || []).map(({ Item }) => {
      const price = getItemPrice({ itemPrice: Item.itemPrice });
      return {
        id: Item.itemCode || Item.itemUrl,
        mall: 'rakuten' as const,
        title: Item.itemName,
        url: Item.itemUrl,
        image: pickImage(Item.mediumImageUrls || Item.smallImageUrls || null),
        price: price || 0,
        shop: Item.shopName ?? null,
      };
    }).filter(i => i.price > 0);

    return { items };
  } catch (error) {
    console.warn("[rakuten] error:", error);
    return { items: [] };
  }
}

// 後方互換性のため既存の関数も残す
export async function searchRakutenLegacy(query: string, limit: number): Promise<SearchItem[]> {
  const result = await searchRakuten({ queries: [query], hits: limit });
  return result.items;
} 