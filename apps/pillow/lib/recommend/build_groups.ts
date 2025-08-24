import { CATEGORY_LABEL, type CategoryId } from "../scoring/config";
import { CATEGORY_QUERIES, buildQueryWords } from "../catalog/category_query";
import { searchAllMalls, type MallProduct } from "../catalog/mall_search";
import type { Provisional } from "../scoring/engine";

export type ProductItem = {
  id: string;
  title: string;
  url: string;
  image?: string | null;
  price?: number | null;
  mall?: "rakuten" | "yahoo" | string;
  shop?: string | null;
};

export type GroupedRecommendations = {
  primary: ProductItem[];               // 上位3件
  secondaryBuckets: ProductItem[][];    // a,b,c の順（各最大3件）
};

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * 診断結果順（既にスコア順で並んでいる前提）の配列 items を
 * 1) primary: 先頭3件
 * 2) secondaryBuckets: 残りを3件ずつ a,b,c に分割（最大3バケット）
 */
export function buildGroups(
  items: ProductItem[],
  primarySize = 3,
  bucketSize = 3,
  bucketCount = 3
): GroupedRecommendations {
  const primary = items.slice(0, primarySize);
  const rest = items.slice(primarySize);
  const buckets = chunk(rest, bucketSize).slice(0, bucketCount);
  return { primary, secondaryBuckets: buckets };
}

// 既存のAPI呼び出し部分は残す（後方互換性のため）
const PRODUCTS_PER_CATEGORY = 3;

async function fetchByCategory(cat: CategoryId, budgetBandId?: string): Promise<MallProduct[]> {
  const spec = CATEGORY_QUERIES[cat];
  if (!spec) return [];
  const queries = buildQueryWords(spec);
  let collected: MallProduct[] = [];
  for (const phrase of queries) {
    const items = await searchAllMalls(phrase, PRODUCTS_PER_CATEGORY, budgetBandId);
    collected = [...collected, ...items];
    if (collected.length >= PRODUCTS_PER_CATEGORY) break;
  }
  if (collected.length < PRODUCTS_PER_CATEGORY && spec.fallback?.length) {
    for (const phrase of spec.fallback) {
      const items = await searchAllMalls(phrase, PRODUCTS_PER_CATEGORY, budgetBandId);
      collected = [...collected, ...items];
      if (collected.length >= PRODUCTS_PER_CATEGORY) break;
    }
  }
  if (spec.tags?.length) {
    collected.sort((a, b) => {
      const score = (p: MallProduct) => spec.tags!.reduce((s, t) => s + (p.title.includes(t) ? 1 : 0), 0);
      return score(b) - score(a);
    });
  }
  const seen = new Set<string>();
  const uniq = collected.filter(it => {
    const k = it.url || it.title;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return uniq.slice(0, PRODUCTS_PER_CATEGORY);
}

// 既存のAPI呼び出し関数（後方互換性のため残す）
export async function buildGroupsFromAPI(provisional: Provisional[], topN = 6, budgetBandId?: string): Promise<GroupedRecommendations> {
  const top = provisional.slice(0, topN);
  const firstCats = top.slice(0, Math.ceil(topN / 2));
  const secondCats = top.slice(Math.ceil(topN / 2), topN);

  const [firstProducts, secondProducts] = await Promise.all([
    Promise.all(firstCats.map(p => fetchByCategory(p.category, budgetBandId))),
    Promise.all(secondCats.map(p => fetchByCategory(p.category, budgetBandId))),
  ]);

  const ensure = (xs: MallProduct[][]) => {
    const flat = xs.flat();
    if (flat.length === 0) {
      // フェイルセーフ：調整系を追加で叩く
      return Promise.all([fetchByCategory("adjustable" as any, budgetBandId)]);
    }
    return xs;
  };

  const flatten = (arr: MallProduct[][]) => {
    const max = PRODUCTS_PER_CATEGORY * Math.ceil(topN / 2);
    const seen = new Set<string>();
    const out: MallProduct[] = [];
    for (const item of arr.flat()) {
      const k = item.url || item.title;
      if (!seen.has(k)) {
        seen.add(k);
        out.push(item);
        if (out.length >= max) break;
      }
    }
    return out;
  };

  const allProducts = [...flatten(firstProducts), ...flatten(secondProducts)];
  
  // 新しいグルーピングロジックを使用
  return buildGroups(allProducts);
} 