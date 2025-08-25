import { fetchJsonWithRetry } from '../http';
import { normalizePriceToNumber } from '../price';
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

export async function searchRakuten(query: string, limit: number): Promise<SearchItem[]> {
  const appId = process.env.RAKUTEN_APP_ID;
  if (!appId) return [];

  const url = new URL(RAKUTEN_ENDPOINT);
  url.searchParams.set('applicationId', appId);
  url.searchParams.set('keyword', query);
  url.searchParams.set('hits', String(Math.min(Math.max(limit, 1), 30)));
  url.searchParams.set('imageFlag', '1');
  url.searchParams.set('availability', '1'); // 在庫あり

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

  const data = await fetchJsonWithRetry<R>(url.toString());
  const items: SearchItem[] = (data.Items || []).map(({ Item }) => ({
    id: Item.itemCode || Item.itemUrl,
    mall: 'rakuten' as const,
    title: Item.itemName,
    url: Item.itemUrl,
    image: pickImage(Item.mediumImageUrls || Item.smallImageUrls || null),
    price: normalizePriceToNumber(Item.itemPrice),
    shop: Item.shopName ?? null,
  })).filter(i => i.price > 0);

  return items;
} 