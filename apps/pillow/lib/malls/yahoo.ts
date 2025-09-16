import { fetchJsonWithRetry } from '../http';
import { normalizePriceToNumber } from '../price';
import type { SearchItem } from './types';
import type { Product } from '../../src/lib/types/product';

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

export async function searchYahoo(
  q: string,
  range?: { min: number; max?: number },
  limit: number = 30,
  meta?: { tag?: "primary" | "adjacent" }
): Promise<Product[]> {
  const appid = process.env.YAHOO_APP_ID;
  if (!appid) return [];

  const url = new URL(YAHOO_ENDPOINT);
  url.searchParams.set('appid', appid);
  url.searchParams.set('q', q);
  url.searchParams.set('results', String(Math.min(Math.max(limit, 1), 30)));
  url.searchParams.set('in_stock', '1');

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

  const data = await fetchJsonWithRetry<R>(url.toString());
  const items: SearchItem[] = (data.hits || []).map(h => ({
    id: h.code || h.url,
    mall: 'yahoo' as const,
    title: h.name,
    url: h.url,
    image: toSafeImageUrl(h.image?.medium || h.image?.small) || null, // 安全化
    price: normalizePriceToNumber(h.price),
    shop: h.seller?.name ?? null,
  })).filter(i => i.price > 0);

  // 返却時に meta を付与
  const normalized: Product[] = items.map((n) => ({
    ...n,
    meta: {
      ...(n as any).meta, // 既存にあれば活かす
      source: "yahoo",
      bandTag: meta?.tag,
    },
  }));

  return normalized.slice(0, limit);
}
