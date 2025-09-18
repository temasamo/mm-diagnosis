// apps/pillow/lib/malls/rakuten.ts
import { fetchJsonWithRetry } from '../http';
import { normalizePriceToNumber } from '../price';
import type { SearchItem, Mall } from './types';
import type { Product } from '../../src/lib/types/product';

const RAKUTEN_ENDPOINT =
  'https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601';

type PriceRange = { min?: number; max?: number };

function toSafeImageUrl(u?: string): string | undefined {
  if (!u) return undefined;
  try {
    const url = new URL(u.replace(/^http:/, 'https:'));
    // Rakuten CDN は query の _ex= を見てくれる（無ければ付与）
    if (!url.searchParams.has('_ex')) url.searchParams.set('_ex', '300x300');
    return url.toString();
  } catch {
    return undefined;
  }
}

function pickImage(
  medium?: { imageUrl: string }[] | null,
  small?: { imageUrl: string }[] | null
): string | null {
  const cand =
    medium?.[0]?.imageUrl ??
    small?.[0]?.imageUrl ??
    null;
  const safe = toSafeImageUrl(cand || undefined);
  return safe ?? null;
}

export async function searchRakuten(
  q: string,
  range?: PriceRange,
  limit = 30,
  meta?: { tag?: "primary" | "adjacent" }
): Promise<Product[]> {
  const appId = process.env.RAKUTEN_APP_ID;
  if (!appId) return [];

  const url = new URL(RAKUTEN_ENDPOINT);
  url.searchParams.set('applicationId', appId);
  url.searchParams.set('keyword', q);
  url.searchParams.set('hits', String(Math.min(Math.max(limit, 1), 30)));
  url.searchParams.set('imageFlag', '1');
  url.searchParams.set('availability', '1');

  // アフィID（任意）
  const aff = process.env.RAKUTEN_AFFILIATE_ID;
  if (aff) url.searchParams.set('affiliateId', aff);

  // ★ 価格レンジの厳密な処理：数値のときだけ付与
  if (typeof range?.min === "number") {
    url.searchParams.set('minPrice', String(range.min));
  }
  if (typeof range?.max === "number") {
    url.searchParams.set('maxPrice', String(range.max));
  }
  // typeof が number でない（undefined/null）の場合は **絶対に付与しない**

  type R = {
    Items: {
      Item: {
        itemCode: string;
        itemName: string;
        itemUrl: string;
        affiliateUrl?: string;
        itemPrice: number | string;
        shopName?: string;
        mediumImageUrls?: { imageUrl: string }[];
        smallImageUrls?: { imageUrl: string }[];
      };
    }[];
  };

  const data = await fetchJsonWithRetry<R>(url.toString());

  const mappedItems = (data.Items || [])
    .map(({ Item }) => {
      // アフィリエイトURLの有効性をチェック
      let link = '';
      
      // デバッグログを追加
      console.log('[rakuten] URL debug:', {
        affiliateUrl: Item.affiliateUrl,
        itemUrl: Item.itemUrl,
        itemCode: Item.itemCode
      });
      
      // アフィリエイトURLが存在し、有効な形式かチェック（より柔軟に）
      if (Item.affiliateUrl && 
          (Item.affiliateUrl.includes('rakuten.co.jp') || 
           Item.affiliateUrl.includes('item.rakuten.co.jp') ||
           Item.affiliateUrl.startsWith('http'))) {
        link = Item.affiliateUrl;
        console.log('[rakuten] Using affiliateUrl:', link);
      } else if (Item.itemUrl) {
        // アフィリエイトURLが無効な場合は通常のitemUrlを使用
        link = Item.itemUrl;
        console.log('[rakuten] Using itemUrl:', link);
      }
      
      if (!link) return null; // URL が無いものは捨てる

      return {
        id: Item.itemCode || link,
        mall: 'rakuten' as Mall,
        title: Item.itemName,
        url: link,
        image: pickImage(Item.mediumImageUrls || null, Item.smallImageUrls || null),
        price: normalizePriceToNumber(Item.itemPrice),
        shop: Item.shopName ?? null,
      } as SearchItem;
    });

  const items: SearchItem[] = mappedItems
    .filter((v): v is SearchItem => v !== null)
    .filter(i => typeof i.price === 'number' && i.price > 0);

  // 返却時に meta を付与
  const normalized: Product[] = items.map((n) => ({
    ...n,
    meta: {
      ...(n as any).meta, // 既存にあれば活かす
      source: "rakuten",
      bandTag: meta?.tag,
    },
  }));

  return normalized.slice(0, limit);
}
