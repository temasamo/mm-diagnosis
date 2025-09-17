import type { SearchItem } from './malls/types';

export function canonicalUrl(u: string): string {
  try {
    const url = new URL(u);
    // クエリパラメータを除去して正規化
    return url.origin + url.pathname;
  } catch { return u; }
}

export function dedupeAndPickCheapest(items: SearchItem[]): SearchItem[] {
  const map = new Map<string, SearchItem>();
  for (const it of items) {
    // モール別に重複除去を行う（異なるモール間では重複除去しない）
    const key = `${it.mall}:${it.id || canonicalUrl(it.url)}`;
    const exist = map.get(key);
    if (!exist || (it.price > 0 && it.price < exist.price)) {
      map.set(key, { ...it, url: canonicalUrl(it.url) });
    }
  }
  return [...map.values()];
}

// 商品の重複を除去するユーティリティ

export interface Product {
  id?: string
  title?: string
  url?: string
  price?: number
  image?: string;
}

/**
 * 商品の重複を除去する
 * 同じ商品（タイトルが類似、価格が近い）を重複として扱う
 */
export function dedupeProducts(products: Product[]): Product[] {
  if (!products || products.length === 0) return [];

  const seen = new Set<string>();
  const deduped: Product[] = [];

  for (const product of products) {
    // 商品の識別キーを生成（タイトルベース）
    const key = generateProductKey(product);
    
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(product);
    }
  }

  return deduped;
}

/**
 * 商品の識別キーを生成
 * タイトルを正規化して類似商品を検出
 */
function generateProductKey(product: Product): string {
  if (!product.title) return Math.random().toString();
  
  // タイトルを正規化（空白除去、小文字化）
  const normalized = product.title
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[【】\[\]()（）]/g, '')
    .substring(0, 50); // 最初の50文字のみ使用
  
  return normalized;
}
