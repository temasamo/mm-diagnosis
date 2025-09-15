// apps/pillow/lib/malls/rakuten.ts
import { fetchJsonWithRetry } from '../http';
import { normalizePriceToNumber } from '../price';
import type { SearchItem, Mall } from './types';

export type PriceRange = { min: number; max: number };

const RAKUTEN_ENDPOINT =
  'https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601';

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
  limit = 30
): Promise<SearchItem[]> {
  const appId = process.env.RAKUTEN_APP_ID;
  if (!appId) return [];

  const url = new URL(RAKUTEN_ENDPOINT);
  url.searchParams.set('applicationId', appId);
  url.searchParams.set('keyword', q);
  url.searchParams.set('hits', String(Math.min(Math.max(limit, 1), 30)));
  url.searchParams.set('imageFlag', '1');
  url.searchParams.set('availability', '1');

  // 価格帯フィルタ（安全に）
  if (range) {
    if (range.min !== undefined) url.searchParams.set('minPrice', String(range.min));
    if (range.max !== undefined && Number.isFinite(range.max))
      url.searchParams.set('maxPrice', String(range.max));
  }

  // アフィID（任意）
  const aff = process.env.RAKUTEN_AFFILIATE_ID;
  if (aff) url.searchParams.set('affiliateId', aff);

  type R = {
    Items: {
      Item: {
        itemCode: string;
        itemName: string;
        itemUrl?: string;
        affiliateUrl?: string;
        mediumImageUrls?: { imageUrl: string }[];
        smallImageUrls?: { imageUrl: string }[];
        shopName?: string;
        itemPrice?: number | string;
      };
    }[];
  };

  const data = await fetchJsonWithRetry<R>(url.toString());

  const mappedItems = (data.Items || [])
    .map(({ Item }) => {
      const link = Item.affiliateUrl || Item.itemUrl || '';
      if (!link) return null; // ★ URL が無いものは捨てる（/api/out 400 の根本回避）

      return {
        id: Item.itemCode || link,
        mall: 'rakuten' as Mall, // Mall の union 型に合わせる（小文字想定）
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

  return items;
}
