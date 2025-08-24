import { CATEGORY_LABEL, type CategoryId } from "../scoring/config";
import { CATEGORY_QUERIES, buildQueryWords } from "../catalog/category_query";
import { searchAllMalls, type MallProduct } from "../catalog/mall_search";
import type { Provisional } from "../scoring/engine";

export type GroupedRecommendations = {
  primaryGroup: MallProduct[];   // 第一候補
  secondaryGroup: MallProduct[]; // 第二候補
  rationale: {
    categoryRanks: Array<{ id: CategoryId; label: string; score: number }>;
    notes: string[];
  }
};

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

export async function buildGroups(provisional: Provisional[], topN = 6, budgetBandId?: string): Promise<GroupedRecommendations> {
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

  return {
    primaryGroup: flatten(firstProducts),
    secondaryGroup: flatten(secondProducts),
    rationale: {
      categoryRanks: top.map(t => ({ id: t.category, label: CATEGORY_LABEL[t.category], score: t.score })),
      notes: [
        "スコアは一次診断（姿勢×寝返り＋症状/快適性/好み/予算）の合算を0..1正規化したものです。",
        "各カテゴリの代表語でモール横断検索し、重複除去→上位を提示しています。",
      ],
    },
  };
} 