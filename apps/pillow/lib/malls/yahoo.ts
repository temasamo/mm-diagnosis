import { fetchJsonWithRetry } from '../http';
import { normalizePriceToNumber } from '../price';
import type { SearchItem } from './types';
import type { Product } from '../../src/lib/types/product';

type PriceRange = { min?: number; max?: number };

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
  range?: PriceRange,
  limit = 30,
  meta?: { tag?: "primary" | "adjacent" }
): Promise<Product[]> {
  const appid = process.env.YAHOO_APP_ID;
  if (!appid) {
    console.log('[yahoo] YAHOO_APP_ID not found');
    return [];
  }

  try {
    // Yahoo APIの制限（最大20件）を回避するため、複数回呼び出し
    const maxPerRequest = 20;
    const totalRequests = Math.ceil(limit / maxPerRequest);
    const allItems: SearchItem[] = [];

    for (let i = 0; i < totalRequests; i++) {
      const offset = i * maxPerRequest;
      const currentLimit = Math.min(maxPerRequest, limit - offset);
      
      if (currentLimit <= 0) break;

      const url = new URL(YAHOO_ENDPOINT);
      url.searchParams.set('appid', appid);
      url.searchParams.set('query', q);
      url.searchParams.set('hits', String(currentLimit));
      url.searchParams.set('offset', String(offset));
      url.searchParams.set('in_stock', '1');

      console.log(`[yahoo] API URL (request ${i + 1}/${totalRequests}):`, url.toString());

      const response = await fetchJsonWithRetry(url.toString());
      console.log(`[yahoo] API response (request ${i + 1}):`, {
        totalResultsAvailable: response.totalResultsAvailable,
        totalResultsReturned: response.totalResultsReturned,
        hitsCount: response.hits?.length || 0,
        offset: offset
      });

      const items: SearchItem[] = response.hits ?? [];
      allItems.push(...items);
      
      // 取得したアイテム数が要求数に達した場合、またはこれ以上取得できない場合
      if (items.length < currentLimit || allItems.length >= limit) {
        break;
      }
    }

    console.log('[yahoo] Total items collected:', allItems.length);

    // 価格フィルタは適用せず、search-cross API側で価格帯フィルタを適用
    return allItems.slice(0, limit).map((item: SearchItem): Product => ({
      id: item.code ?? item.index?.toString() ?? '',
      title: item.name ?? '',
      url: item.url ?? '',
      price: normalizePriceToNumber(item.price),
      image: toSafeImageUrl(item.image?.medium ?? item.image?.small),
      mall: 'yahoo',
      shop: item.seller?.name ?? undefined,
    }));
  } catch (error) {
    console.error('[yahoo] API Error:', error);
    return [];
  }
}
