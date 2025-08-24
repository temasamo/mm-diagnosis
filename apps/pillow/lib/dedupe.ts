import type { SearchItem } from './malls/types';

const STRIP_PARAMS = ['scid','icm_','rafcid','_ex','affiliate','utm_source','utm_medium','utm_campaign'];

export function canonicalUrl(u: string): string {
  try {
    const url = new URL(u);
    STRIP_PARAMS.forEach(k => url.searchParams.delete(k));
    url.hash = '';
    return url.toString();
  } catch { return u; }
}

export function dedupeAndPickCheapest(items: SearchItem[]): SearchItem[] {
  const map = new Map<string, SearchItem>();
  for (const it of items) {
    // 優先キー: オリジンid or 正規化URL
    const key = `${it.mall}:${it.id || canonicalUrl(it.url)}`;
    const exist = map.get(key);
    if (!exist || (it.price > 0 && it.price < exist.price)) {
      map.set(key, { ...it, url: canonicalUrl(it.url) });
    }
  }
  return [...map.values()];
} 