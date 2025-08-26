import { fetchJsonWithRetry } from '../http';
import { normalizePriceToNumber } from '../price';
import { getItemPrice } from '../recommend/price';
import type { SearchItem } from './types';

function toSafeImageUrl(u?: string): string | undefined {
  if (!u) return undefined;
  try {
    const url = new URL(u.replace(/^http:/, "https:"));
    return url.toString();
  } catch {
    return undefined;
  }
}

const YAHOO_ENDPOINT = 'https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch';

type YahooOpts = {
  queries: string[];
  minPrice?: number;
  maxPrice?: number;
  hits?: number;
};

export async function searchYahoo({ queries, minPrice, maxPrice, hits = 50 }: YahooOpts) {
  const appid = process.env.YAHOO_APP_ID;
  if (!appid) return { items: [] };

  const query = queries.join(" ");
  const url = new URL(YAHOO_ENDPOINT);
  url.searchParams.set('appid', appid);
  url.searchParams.set('query', query);
  url.searchParams.set('results', String(Math.min(Math.max(hits, 1), 30)));
  url.searchParams.set('in_stock', '1');

  if (typeof minPrice === "number") url.searchParams.set("price_from", String(minPrice));
  if (typeof maxPrice === "number") url.searchParams.set("price_to", String(maxPrice));

  console.log("[yahoo] GET", url.toString());

  type R = {
    totalResultsAvailable?: number;
    hits?: {
      name: string;
      url: string;
      price: number | string;
      image?: { medium?: string; small?: string; };
      seller?: { name?: string; id?: string; };
      code?: string; // ある場合
    }[];
  };

  try {
    const data = await fetchJsonWithRetry<R>(url.toString());
    const items: SearchItem[] = (data.hits || []).map(h => {
      const price = getItemPrice({ price: h.price });
      return {
        id: h.code || h.url,
        mall: 'yahoo' as const,
        title: h.name,
        url: h.url,
        image: toSafeImageUrl(h.image?.medium || h.image?.small) || null, // 安全化
        price: price || 0,
        shop: h.seller?.name ?? null,
      };
    }).filter(i => i.price > 0);

    return { items };
  } catch (error) {
    console.warn("[yahoo] error:", error);
    return { items: [] };
  }
}

// 後方互換性のため既存の関数も残す
export async function searchYahooLegacy(query: string, limit: number): Promise<SearchItem[]> {
  const result = await searchYahoo({ queries: [query], hits: limit });
  return result.items;
} 