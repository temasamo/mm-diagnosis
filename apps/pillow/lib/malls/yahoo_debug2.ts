import { fetchJsonWithRetry } from '../http';
import { normalizePriceToNumber } from '../price';
import type { SearchItem } from './types';
import type { Product } from '../../src/lib/types/product';

type PriceRange = { min?: number; max?: number };

function toSafeImageUrl(u?: string | { small?: string; medium?: string }): string | null {
  if (!u) return null;
  
  try {
    let imageUrl: string;
    
    // オブジェクト形式の場合（Yahoo APIの画像データ）
    if (typeof u === 'object' && u !== null) {
      // mediumがあればそれを使用、なければsmallを使用
      imageUrl = u.medium || u.small || '';
    } else if (typeof u === 'string') {
      imageUrl = u;
    } else {
      return null;
    }
    
    // 空文字列をチェック
    if (imageUrl.trim() === '') return null;
    
    // http:をhttps:に変換
    const httpsUrl = imageUrl.replace(/^http:/, "https:");
    
    // URLの妥当性をチェック
    const url = new URL(httpsUrl);
    
    // 有効な画像URLかチェック
    if (url.protocol !== 'https:') return null;
    
    return url.toString();
  } catch (error) {
    console.log('[yahoo] Invalid image URL:', u, error);
    return null;
  }
}

const YAHOO_ENDPOINT = 'https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch';

// Yahoo API レスポンスの型定義
interface YahooApiResponse {
  totalResultsAvailable: number;
  totalResultsReturned: number;
  hits?: SearchItem[];
}

export async function searchYahoo(
  q: string,
  range?: PriceRange,
  limit = 30,
  meta?: { tag?: "primary" | "adjacent" }
): Promise<Product[]> {
  console.log('[yahoo] ★★★ searchYahoo called with:', { q, range, limit, meta });
  
  const appid = process.env.YAHOO_APP_ID;
  if (!appid) {
    console.log('[yahoo] YAHOO_APP_ID not found');
    return [];
  }

  console.log('[yahoo] ★★★ YAHOO_APP_ID found, starting API calls...');

  try {
    // Yahoo APIの制限（最大20件）を回避するため、複数回呼び出し
    const maxPerRequest = 20;
    const totalRequests = Math.ceil(limit / maxPerRequest);
    const allItems: SearchItem[] = [];

    console.log('[yahoo] ★★★ Total requests needed:', totalRequests);

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

      // 価格フィルタを追加
      if (typeof range?.min === "number") {
        url.searchParams.set('minPrice', String(range.min));
        console.log('[yahoo] ★★★ minPrice set:', range.min);
      }
      if (typeof range?.max === "number") {
        url.searchParams.set('maxPrice', String(range.max));
        console.log('[yahoo] ★★★ maxPrice set:', range.max);
      }

      console.log(`[yahoo] ★★★ API URL (request ${i + 1}/${totalRequests}):`, url.toString());

      const response = await fetchJsonWithRetry(url.toString()) as YahooApiResponse;
      console.log(`[yahoo] ★★★ API response (request ${i + 1}):`, {
        totalResultsAvailable: response.totalResultsAvailable,
        totalResultsReturned: response.totalResultsReturned,
        hitsCount: response.hits?.length || 0,
        offset: offset
      });

      // ★ デバッグログ追加：実際のレスポンス構造を確認
      if (response.hits && response.hits.length > 0) {
        console.log('[yahoo] ★★★ First item structure:', JSON.stringify(response.hits[0], null, 2));
      }

      const items: SearchItem[] = response.hits ?? [];
      allItems.push(...items);
      
      // 取得したアイテム数が要求数に達した場合、またはこれ以上取得できない場合
      if (items.length < currentLimit || allItems.length >= limit) {
        break;
      }
    }

    console.log('[yahoo] ★★★ Total items collected:', allItems.length);

    // 価格フィルタは適用せず、search-cross API側で価格帯フィルタを適用
    return allItems.slice(0, limit).map((item: SearchItem): Product => {
      const originalImage = item.image;
      const processedImage = toSafeImageUrl(item.image ?? undefined);
      
      // デバッグ用ログ
      if (originalImage && !processedImage) {
        console.log('[yahoo] Image URL processing failed:', {
          original: originalImage,
          processed: processedImage,
          itemId: item.id,
          title: item.title?.substring(0, 50)
        });
      }
      
      return {
        id: item.id,
        title: item.title,
        url: item.url,
        price: normalizePriceToNumber(item.price),
        image: processedImage,
        mall: 'yahoo',
        shop: item.shop ?? undefined,
      };
    });
  } catch (error) {
    console.error('[yahoo] ★★★ API Error:', error);
    return [];
  }
}
