import { CATEGORY_LABEL, type CategoryId } from "../scoring/config";
import { CATEGORY_QUERIES, buildQueryWords } from "../catalog/category_query";
import { searchAllMalls, type MallProduct } from "../catalog/mall_search";
import { searchCross } from "./search";
import type { Provisional } from "../scoring/engine";

export const BUILD_GROUPS_VERSION = "bg-20250826-ix1";

// === 追加: 予算ID→数値レンジのマップ & セーフガード ===
const BUDGET_MAP: Record<string, {min?:number; max?:number}> = {
  // 旧4レンジ
  "u5k": { min: 0, max: 5000 },
  "5k-15k": { min: 5000, max: 15000 },
  "15k-30k": { min: 15000, max: 30000 },
  "30k+": { min: 30000, max: 999999 },
  // 提案5レンジ（入ってきても動くように）
  "u3k": { min: 0, max: 3000 },
  "3-6k": { min: 3000, max: 6000 },
  "6-10k": { min: 6000, max: 10000 },
  "10-20k": { min: 10000, max: 20000 },
  "20p": { min: 20000, max: 999999 },
};

function toBudgetRange(budgetBandId?: string) {
  if (!budgetBandId) return {};               // ← 未指定ならフィルタしない
  return BUDGET_MAP[budgetBandId] ?? {};      // ← 未知IDでもフィルタしない
}

// === 使う検索語のフォールバック ===
function ensureQueriesFromProvisional(provisional: any[]): string[] {
  // provisional からカテゴリ/タグが拾えるなら使う
  const tags = new Set<string>();
  for (const p of provisional) {
    if (p?.tags) for (const t of p.tags) tags.add(String(t));
    if (p?.category) tags.add(String(p.category));
  }

  const derived = Array.from(tags).filter(Boolean);
  // 最低限は"枕"で拾う（必ず1語以上）
  const base = derived.length ? derived.map(v => `${v} 枕`) : ["枕"];
  // 取りこぼし防止に代表ワードを数個足す（重複除去）
  const extras = ["人気 枕", "横向き 枕", "低反発 枕", "高さ 調整 枕"];
  return Array.from(new Set([...base, ...extras])).slice(0, 6);
}

// === 追加: 動的第二候補生成ヘルパー ===
type Answers = Record<string, any>;
type Scores  = Record<string, number>;

function pickPosture(ans: Answers): "side" | "back" | "stomach" | "unknown" {
  const v = (ans?.main_sleep_posture ?? ans?.posture ?? "").toString();
  if (/横|side/i.test(v)) return "side";
  if (/仰|back/i.test(v)) return "back";
  if (/伏|stomach|prone/i.test(v)) return "stomach";
  return "unknown";
}

function pickFirmness(ans: Answers, scores?: Scores): "hard" | "soft" | "lowres" | "unknown" {
  // 明示回答があれば最優先（例: firm/soft）
  const f = (ans?.firmness ?? ans?.feel ?? "").toString().toLowerCase();
  if (/高反発|hard|firm/.test(f)) return "hard";
  if (/低反発|memory|low/.test(f)) return "lowres";
  if (/柔|soft/.test(f)) return "soft";

  // スコアから推定（例: soft_feel が高い → soft）
  if (scores?.soft_feel && scores.soft_feel >= (scores?.hard_feel ?? 0)) return "soft";
  if (scores?.hard_feel && scores.hard_feel > (scores?.soft_feel ?? 0)) return "hard";
  return "unknown";
}

function needNeckSupport(ans: Answers): boolean {
  const arr = (ans?.neck_shoulder_issues ?? []) as any[];
  const text = Array.isArray(arr) ? arr.join(" ") : String(arr ?? "");
  return /首|肩|ストレートネック|neck|shoulder/i.test(text)
    || !!ans?.am_neck_pain
    || !!ans?.shoulder_stiff
    || !!ans?.shoulder_stiffness;
}

// コンボを {label, queries[]} で作る
function makeCombos(ans: Answers, scores?: Scores) {
  const posture = pickPosture(ans);
  const firm = pickFirmness(ans, scores);
  const wantsSupport = needNeckSupport(ans);

  const labelJP = (p: string, f?: string) => {
    const pj = p === "side" ? "横向き" : p === "back" ? "仰向け" : p === "stomach" ? "うつ伏せ" : "姿勢自由";
    const fj = f === "hard" ? "高反発" : f === "lowres" ? "低反発" : f === "soft" ? "ソフト" : "";
    return fj ? `${pj}・${fj}` : pj;
  };

  const qPosture = (p: string) =>
    p === "side" ? ["横向き 枕", "サイドスリーパー 枕"] :
    p === "back" ? ["仰向け 枕"] :
    p === "stomach" ? ["うつ伏せ 枕"] : ["枕 定番"];

  const qFirm = (f: string) =>
    f === "hard" ? ["高反発 枕"] :
    f === "lowres" ? ["低反発 枕", "メモリーフォーム 枕"] :
    f === "soft" ? ["柔らかめ 枕", "ソフト 枕"] : [];

  const combos: Array<{label: string; queries: string[]}> = [];

  // 1) 姿勢×硬さ（回答があれば最優先）
  if (posture !== "unknown" || firm !== "unknown") {
    combos.push({
      label: labelJP(posture, firm !== "unknown" ? firm : undefined),
      queries: [...qPosture(posture), ...qFirm(firm)],
    });
  }

  // 2) 首肩サポート/高さ調整（悩みが強い場合）
  if (wantsSupport) {
    combos.push({
      label: "首肩・調整",
      queries: ["首 肩こり 枕", "頸椎 サポート 枕", "高さ 調整 枕"],
    });
  }

  // 3) 次点の姿勢/硬さ（不足補完）
  if (combos.length < 3) {
    // 足りない方向に応じてサブ候補を用意
    if (posture !== "side") combos.push({ label: "横向き・高反発", queries: ["横向き 枕", "高反発 枕"] });
    if (combos.length < 3 && posture !== "back") combos.push({ label: "仰向け・低反発", queries: ["仰向け 枕", "低反発 枕"] });
  }

  // 3枠にトリム＆重複削除
  const seen = new Set<string>();
  const uniq = combos.filter(c => {
    const k = `${c.label}|${c.queries.join(",")}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  return uniq.slice(0, 3);
}

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
  secondaryATitle?: string;             // 第二候補Aのタイトル
  secondaryBTitle?: string;             // 第二候補Bのタイトル
  secondaryCTitle?: string;             // 第二候補Cのタイトル
  message?: string;                     // エラーメッセージ
  debugVersion?: string;                // デバッグ用バージョン
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
  provisionalRaw: any,
  topN = 12,
  budgetBandId?: string,
  ctx?: { answers?: any; scores?: any }
): Promise<GroupedRecommendations> {
  console.groupCollapsed("[buildGroupsFromAPI]", BUILD_GROUPS_VERSION);
  console.log("topN:", topN, "budgetBandId:", budgetBandId);

  const provisional = Array.isArray(provisionalRaw)
    ? provisionalRaw
    : (provisionalRaw ? [provisionalRaw] : []);

  const queries = ensureQueriesFromProvisional(provisional);
  const { min, max } = toBudgetRange(budgetBandId);

  let items: any[] = [];

  // 1) 予算あり + ふるさと除外
  let res = await searchCross({ queries, minPrice: min, maxPrice: max, excludeFurusato: true });
  items = (res as any)?.items ?? [];
  console.log("[budget][probe]", min, max, "->", items.length);

  // 2) 予算無し + ふるさと除外
  if (items.length === 0) {
    res = await searchCross({ queries, excludeFurusato: true });
    items = (res as any)?.items ?? [];
  }

  // 3) クエリ最小化 + ふるさと除外
  if (items.length === 0) {
    res = await searchCross({ queries: ["枕"], excludeFurusato: true });
    items = (res as any)?.items ?? [];
  }

  // 4) 最終手段：枕のみ + ふるさと許容
  if (items.length === 0) {
    res = await searchCross({ queries: ["枕"], excludeFurusato: false });
    items = (res as any)?.items ?? [];
  }

  const primary = items.slice(0, 3);
  const secondaryA = items.slice(3, 6);
  const secondaryB = items.slice(6, 9);
  const secondaryC = items.slice(9, 12);

  console.log("resolved queries:", queries);
  console.log("counts => P:", primary.length, "A:", secondaryA.length, "B:", secondaryB.length, "C:", secondaryC.length);
  console.groupEnd();

  return {
    primary, secondaryA, secondaryB, secondaryC,
    secondaryBuckets: [secondaryA, secondaryB, secondaryC],
    secondaryATitle: "横向き",
    secondaryBTitle: "首肩・調整",
    secondaryCTitle: "仰向け・低反発",
    debugVersion: BUILD_GROUPS_VERSION,
    message: primary.length ? undefined : "候補を取得できませんでした",
  };
} 