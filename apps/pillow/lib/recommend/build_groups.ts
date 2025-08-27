import { CATEGORY_LABEL, type CategoryId } from "../scoring/config";
import { CATEGORY_QUERIES, buildQueryWords } from "../catalog/category_query";
import { searchAllMalls, type MallProduct } from "../catalog/mall_search";
import type { Provisional } from "../scoring/engine";

// --- add: normalize helper ---
function normalizeProvisional(input: any): Provisional[] {
  // 正規化
  const list = Array.isArray(input)
    ? input
    : (input ? [input] : []);

  if (!Array.isArray(list)) {
    console.warn("[build] normalized list is not array");
    return [];
  }

  // 0件ならこのあとフォールバック再検索へ進む（早期returnしない）
  const base = list.filter(Boolean);
  
  if (Array.isArray(input)) return input as Provisional[];
  if (Array.isArray(input?.provisional)) return input.provisional as Provisional[];
  if (input && typeof input === "object") return Object.values(input) as Provisional[];
  return [];
}

function normalizeList(
  input: Provisional[] | { provisional?: Provisional[] } | null | undefined
): Provisional[] {
  if (Array.isArray(input)) return input;
  if (input && Array.isArray((input as any).provisional)) {
    return (input as any).provisional;
  }
  return [];
}

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
  secondaryA?: ProductItem[];           // 第二候補A
  secondaryB?: ProductItem[];           // 第二候補B
  secondaryC?: ProductItem[];           // 第二候補C
  message?: string;                     // エラーメッセージ
};

type SearchOpts = {
  budgetBandId?: string | null;
  allowNoImage?: boolean;
  anyOfKeywords?: string[]; // OR 条件
  allOfKeywords?: string[]; // AND 条件（弱め）
  limit?: number;
};

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** フォールバック検索（provisional が空の場合の代替検索） */
async function fallbackSearch(budgetBandId?: string, topN = 6): Promise<GroupedRecommendations> {
  console.log('[diag] fallback search started');
  
  // 段階的フォールバック検索
  const fallbackCategories = [
    "middle_height", "soft_feel", "adjustable_height", 
    "cooling_breathable", "firm_support"
  ];
  
  let allProducts: MallProduct[] = [];
  
  // 1. 予算条件を緩和して再検索
  for (const cat of fallbackCategories.slice(0, 3)) {
    const products = await fetchByCategory(cat as any, undefined); // 予算無視
    allProducts.push(...products);
    if (allProducts.length >= topN) break;
  }
  
  // 2. まだ足りない場合は広めの検索語で再検索
  if (allProducts.length < topN) {
    const broadQueries = ["枕", "高さ調整 枕", "低反発 枕"];
    for (const query of broadQueries) {
      const products = await searchAllMalls(query, 2, budgetBandId);
      allProducts.push(...products);
      if (allProducts.length >= topN) break;
    }
  }
  
  // 重複除去
  const seen = new Set<string>();
  const uniqueProducts = allProducts.filter(item => {
    const key = item.url || item.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  console.log('[diag] fallback search found', uniqueProducts.length, 'products');
  
  // グルーピング
  const result = buildGroups(uniqueProducts);
  
  return result;
}

async function searchWithFallback(opts: SearchOpts) {
  // ここは既存の searchCross / searchRakuten / searchYahoo に合わせて実装
  // 例）searchCross({ anyOfKeywords, allOfKeywords, budgetBandId, allowNoImage, limit })
  return await searchAllMalls(opts.anyOfKeywords?.[0] || "枕", opts.limit || 3, opts.budgetBandId || undefined);
}

function deriveLooseKeywords(scoresOrCats: string[]): string[] {
  // provisional が空のときにカテゴリからゆるい語を作る
  // 必要に応じて調整（まずは安全網）
  const pool = [
    "低反発 枕", "高反発 枕", "横向き 枕", "仰向け 枕",
    "首 肩こり 枕", "いびき 枕", "高さ 調整 枕"
  ];
  // 重複排除して先頭5語
  return Array.from(new Set([...scoresOrCats, ...pool])).slice(0, 5);
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
export async function buildGroupsFromAPI(
  provisional: any,
  topN = 6,
  budgetBandId?: string,
  _allowFallback = true
): Promise<GroupedRecommendations> {
  try {
    console.log("[build] provisional(raw)", provisional, "topN", topN, "budgetBandId", budgetBandId);
    
    // 正規化
    const list = Array.isArray(provisional)
      ? provisional
      : (provisional ? [provisional] : []);

    if (!Array.isArray(list)) {
      console.warn("[build] normalized list is not array");
      return { primary: [], secondaryBuckets: [[], [], []], secondaryA: [], secondaryB: [], secondaryC: [], message: "候補ゼロ" };
    }

    // 0件ならこのあとフォールバック再検索へ進む（早期returnしない）
    const base = list.filter(Boolean);

    let primary: any[] = [];
    let secondaryA: any[] = [];
    let secondaryB: any[] = [];
    let secondaryC: any[] = [];

    // ① 通常検索（既存ロジック）
    primary = await searchWithFallback({
      budgetBandId,
      anyOfKeywords: base.map(x => x?.keyword).filter(Boolean),
      limit: topN,
    });

    // 0件なら順に緩める
    if (!primary || primary.length === 0) {
      // ② 予算緩和
      primary = await searchWithFallback({
        budgetBandId: null,              // 予算を一旦外す
        anyOfKeywords: base.map(x => x?.keyword).filter(Boolean),
        limit: topN,
      });
    }

    if (!primary || primary.length === 0) {
      // ③ キーワード拡張（カテゴリから生成したゆるい語）
      const loose = deriveLooseKeywords(base.map(x => x?.category).filter(Boolean));
      primary = await searchWithFallback({
        budgetBandId: null,
        anyOfKeywords: loose,            // OR 条件
        limit: topN,
      });
    }

    if (!primary || primary.length === 0) {
      // ④ 画像なし許容（サムネが無くても返す）
      const loose = deriveLooseKeywords(base.map(x => x?.category).filter(Boolean));
      primary = await searchWithFallback({
        budgetBandId: null,
        anyOfKeywords: loose,
        allowNoImage: true,
        limit: topN,
      });
    }

    // 第二候補（a/b/c）も同様に、ゆるい語で 3 件ずつ確保（足りなければあるだけ）
    // a
    secondaryA = await searchWithFallback({ budgetBandId: null, anyOfKeywords: ["横向き 枕","高反発 枕"], limit: 3 });
    // b
    secondaryB = await searchWithFallback({ budgetBandId: null, anyOfKeywords: ["低反発 枕","仰向け 枕"], limit: 3 });
    // c
    secondaryC = await searchWithFallback({ budgetBandId: null, anyOfKeywords: ["首 肩こり 枕","高さ 調整 枕"], limit: 3 });

    // null安全
    primary = Array.isArray(primary) ? primary.slice(0, topN) : [];
    secondaryA = Array.isArray(secondaryA) ? secondaryA.slice(0, 3) : [];
    secondaryB = Array.isArray(secondaryB) ? secondaryB.slice(0, 3) : [];
    secondaryC = Array.isArray(secondaryC) ? secondaryC.slice(0, 3) : [];

    const emptyAll = primary.length + secondaryA.length + secondaryB.length + secondaryC.length === 0;
    const message = emptyAll ? "候補を取得できませんでした" : undefined;

    return { 
      primary, 
      secondaryBuckets: [secondaryA, secondaryB, secondaryC], 
      secondaryA, 
      secondaryB, 
      secondaryC, 
      message 
    };
  } catch (e) {
    console.error("[build] error", e);
    return { 
      primary: [], 
      secondaryBuckets: [[], [], []], 
      secondaryA: [], 
      secondaryB: [], 
      secondaryC: [], 
      message: "候補を取得できませんでした" 
    };
  }
}

// 新しいAPI関数（タスク5の要件）
export async function buildGroupsFromAPIv2({ c, snore, heat }: { c: string; snore: number; heat: number }): Promise<GroupedRecommendations> {
  try {
    console.log("[build] v2 params", { c, snore, heat });
    
    // キーワード生成
    const keywords = [];
    if (c) {
      const cKeywords = c.split(',').map(k => k.trim()).filter(Boolean);
      keywords.push(...cKeywords);
    }
    if (snore === 1) keywords.push('いびき 枕');
    if (heat === 1) keywords.push('冷却 枕', '涼感 枕');
    
    // デフォルトキーワード
    if (keywords.length === 0) {
      keywords.push('枕', '高さ調整 枕');
    }

    let primary: any[] = [];
    let secondaryA: any[] = [];
    let secondaryB: any[] = [];
    let secondaryC: any[] = [];

    // 第一候補（上位6件から上位3件）
    primary = await searchWithFallback({
      budgetBandId: null,
      anyOfKeywords: keywords,
      limit: 6,
    });

    // 第二候補（異なるキーワードで3件ずつ）
    secondaryA = await searchWithFallback({ 
      budgetBandId: null, 
      anyOfKeywords: ["横向き 枕", "高反発 枕"], 
      limit: 3 
    });
    secondaryB = await searchWithFallback({ 
      budgetBandId: null, 
      anyOfKeywords: ["低反発 枕", "仰向け 枕"], 
      limit: 3 
    });
    secondaryC = await searchWithFallback({ 
      budgetBandId: null, 
      anyOfKeywords: ["首 肩こり 枕", "高さ 調整 枕"], 
      limit: 3 
    });

    // null安全
    primary = Array.isArray(primary) ? primary.slice(0, 3) : [];
    secondaryA = Array.isArray(secondaryA) ? secondaryA.slice(0, 3) : [];
    secondaryB = Array.isArray(secondaryB) ? secondaryB.slice(0, 3) : [];
    secondaryC = Array.isArray(secondaryC) ? secondaryC.slice(0, 3) : [];

    const emptyAll = primary.length + secondaryA.length + secondaryB.length + secondaryC.length === 0;
    const message = emptyAll ? "候補を取得できませんでした" : undefined;

    return { 
      primary, 
      secondaryBuckets: [secondaryA, secondaryB, secondaryC], 
      secondaryA, 
      secondaryB, 
      secondaryC, 
      message 
    };
  } catch (e) {
    console.error("[build] v2 error", e);
    return { 
      primary: [], 
      secondaryBuckets: [[], [], []], 
      secondaryA: [], 
      secondaryB: [], 
      secondaryC: [], 
      message: "候補を取得できませんでした" 
    };
  }
} 