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

// 商品の重複を除去するユーティリティ

export interface Product {
  id?: string;
  title?: string;
  price?: number;
  retailer?: string;
  url?: string;
  image?: string;
  [key: string]: any;
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
  if (!product.title) return `unknown-${product.id || Math.random()}`;
  
  // タイトルを正規化
  const normalized = product.title
    .toLowerCase()
    .replace(/[【】［］()（）]/g, '') // 括弧を除去
    .replace(/[^\w\s]/g, '') // 特殊文字を除去
    .replace(/\s+/g, ' ') // 複数スペースを単一スペースに
    .trim();
  
  // 価格帯も考慮（±20%以内は同じ商品として扱う）
  const priceKey = product.price ? Math.floor(product.price / 1000) * 1000 : 0;
  
  return `${normalized}-${priceKey}`;
}

/**
 * 商品グループの重複を除去
 */
export function dedupeProductGroups(groups: {
  primary?: Product[];
  secondaryA?: Product[];
  secondaryB?: Product[];
  secondaryC?: Product[];
  [key: string]: any;
}) {
  const result: any = {};
  
  for (const [key, products] of Object.entries(groups)) {
    if (Array.isArray(products)) {
      result[key] = dedupeProducts(products);
    } else {
      result[key] = products;
    }
  }
  
  return result;
} 