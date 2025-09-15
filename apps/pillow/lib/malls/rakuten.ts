// apps/pillow/src/lib/malls/rakuten.ts
import { fetchJsonWithRetry } from '../http';
import { normalizePriceToNumber } from '../price';
import type { SearchItem, Mall } from './types';
import { pLimit } from '../../src/lib/util/limit';
import { fetchWith429 } from '../../src/lib/util/fetch429';

const RAKUTEN_ENDPOINT =
  'https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601';

// スロットリング制限（環境フラグで制御）
const pLimitFn = pLimit(process.env.NEXT_PUBLIC_RAKUTEN_THROTTLE ? 2 : 6);

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

export async function searchRakuten(query: string, limit: number): Promise<SearchItem[]> {
  const appId = process.env.RAKUTEN_APP_ID;
  if (!appId) return [];

  const url = new URL(RAKUTEN_ENDPOINT);
  url.searchParams.set('applicationId', appId);
  url.searchParams.set('keyword', query);
  url.searchParams.set('hits', String(Math.min(Math.max(limit, 1), 30)));
  url.searchParams.set('imageFlag', '1');
  url.searchParams.set('availability', '1');

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

  // スロットリング＋429リトライで実行
  const data = await pLimitFn(() => 
    fetchWith429(() => fetchJsonWithRetry<R>(url.toString()), { 
      label: 'rakuten' 
    })
  );

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
