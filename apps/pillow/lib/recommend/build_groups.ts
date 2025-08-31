import { CATEGORY_LABEL, type CategoryId } from "../scoring/config";
import { CATEGORY_QUERIES, buildQueryWords } from "../catalog/category_query";
import { searchAllMalls, type MallProduct } from "../catalog/mall_search";
import type { Provisional } from "../scoring/engine";
import { dedupeProductGroups } from "../dedupe";

// --- 予算のワンランク上を計算する関数 ---
function getExtendedBudgetBandId(budgetBandId?: string | null): string | null {
  if (!budgetBandId) return null;
  
  // 予算バンドのマッピング（ワンランク上まで拡張）
  const budgetMapping: Record<string, string> = {
    "3k-6k": "3k-10k",      // 3k-6k → 3k-10k（6k-10kまで含める）
    "6k-10k": "6k-20k",     // 6k-10k → 6k-20k（10k-20kまで含める）
    "10k-20k": "10k-20k",   // 10k-20k → 変更なし（上限なし）
    "20k+": "20k+",         // 20k+ → 変更なし（変更なし）
  };
  
  return budgetMapping[budgetBandId] || budgetBandId;
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
  message?: string;                     // エラーメッセージ
  secondaryLabels?: string[];           // 第2候補のラベル
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

/**
 * 診断結果から第2候補の検索キーワードを生成
 * 提案された改善案に基づいて実装
 */
function generateSecondaryKeywords(answers: any): { keywords: string[][], labels: string[] } {
  const keywords: string[][] = [];
  const labels: string[] = [];
  
  // Aセクション（寝姿勢・寝返り）とBセクション（気になる点）を主にマッチング
  const posture = answers?.posture;
  const rollover = answers?.rollover;
  const concerns = Array.isArray(answers?.concerns) ? answers.concerns : [];
  const neckIssues = Array.isArray(answers?.neck_shoulder_issues) ? answers.neck_shoulder_issues : [];
  
  // Bセクション（マットレス硬さ）とDセクション（好み・素材・サイズ・予算）をフィルタ条件として使用
  const materialPref = answers?.material_pref;
  const mattressFirmness = answers?.mattress_firmness;
  const adjustablePref = answers?.adjustable_pref;
  const currentMaterial = answers?.current_pillow_material;
  
  // 素材リメディマッピング（現在の素材→推奨素材）
  const materialRemedyMap: Record<string, string[]> = {
    // 現在 → 推奨素材（悩みを緩和）
    low_rebound: ["高反発", "ラテックス", "パイプ"],         // 首痛/寝返り→反発UP系へ
    high_rebound: ["低反発", "ラテックス", "ビーズ"],        // 硬すぎ→少し柔軟orラテックス
    feather: ["低反発", "高反発", "パイプ"],       // へたり/高さ不足→形状保持
    poly_cotton: ["高反発", "パイプ", "ラテックス"],         // へたり/蒸れ
    sobakawa: ["ラテックス", "高反発", "パイプ"],            // 硬い/音→反発・通気の両立
    beads: ["パイプ", "ラテックス", "高反発"],               // 耐久・支え
    pipe: ["低反発", "ラテックス"],                         // 硬さが不満なら
    latex: ["高反発", "パイプ"],                            // 耐久性向上
  };
  
  // 第2候補A: 姿勢ベースの代替案（マットレス硬さを考慮）
  if (posture) {
    let postureKeywords: string[] = [];
    let postureLabel = "";
    
    if (posture === "side") {
      postureKeywords = ["横向き 枕", "横向き寝 枕"];
      postureLabel = "横向き寝向け";
      
      // マットレス硬さと枕の高さの組み合わせ
      if (mattressFirmness && mattressFirmness !== "unknown") {
        if (mattressFirmness === "soft") {
          // 柔らかめマットレス → 低め枕
          postureKeywords.push("低め 枕", "横向き 低め 枕");
          postureLabel += " × 低め枕";
        } else if (mattressFirmness === "firm") {
          // 硬めマットレス → 高め枕
          postureKeywords.push("高め 枕", "横向き 高め 枕");
          postureLabel += " × 高め枕";
        }
      }
    } else if (posture === "supine") {
      postureKeywords = ["仰向け 枕", "仰向け寝 枕"];
      postureLabel = "仰向け寝向け";
      
      // マットレス硬さを考慮
      if (mattressFirmness && mattressFirmness !== "unknown") {
        if (mattressFirmness === "soft") {
          postureKeywords.push("仰向け 低め 枕");
          postureLabel += " × 低め枕";
        } else if (mattressFirmness === "firm") {
          postureKeywords.push("仰向け 高め 枕");
          postureLabel += " × 高め枕";
        }
      }
    } else if (posture === "prone") {
      postureKeywords = ["うつ伏せ 枕", "うつ伏せ寝 枕"];
      postureLabel = "うつ伏せ寝向け";
      
      // うつ伏せの場合は低め枕が基本
      if (mattressFirmness && mattressFirmness !== "unknown") {
        if (mattressFirmness === "soft") {
          postureKeywords.push("うつ伏せ 低め 枕");
          postureLabel += " × 低め枕";
        } else if (mattressFirmness === "firm") {
          postureKeywords.push("うつ伏せ 枕", "薄め 枕");
          postureLabel += " × 薄め枕";
        }
      }
    }
    
    // 素材の好みを組み合わせ
    if (materialPref && materialPref !== "unknown" && materialPref !== "none") {
      if (materialPref === "lp") {
        postureKeywords.push("低反発");
        postureLabel += " × 低反発";
      } else if (materialPref === "hp") {
        postureKeywords.push("高反発");
        postureLabel += " × 高反発";
      } else if (materialPref === "feather") {
        postureKeywords.push("羽毛");
        postureLabel += " × 羽毛";
      }
    }
    
    if (postureKeywords.length > 0) {
      keywords.push(postureKeywords);
      labels.push(postureLabel);
    }
  }
  
  // 第2候補B: 素材リメディベースの代替案
  if (currentMaterial && currentMaterial !== "other" && materialRemedyMap[currentMaterial]) {
    const remedyMaterials = materialRemedyMap[currentMaterial];
    const remedyKeywords = remedyMaterials.map(material => `${material} 枕`);
    const remedyLabel = `素材改善提案（${currentMaterial === "low_rebound" ? "低反発" : 
      currentMaterial === "high_rebound" ? "高反発" : 
      currentMaterial === "latex" ? "ラテックス" :
      currentMaterial === "pipe" ? "パイプ" :
      currentMaterial === "beads" ? "ビーズ" :
      currentMaterial === "feather" ? "羽毛" :
      currentMaterial === "poly_cotton" ? "ポリエステル綿" :
      currentMaterial === "sobakawa" ? "そば殻" : "現在の素材"}から改善）`;
    
    keywords.push(remedyKeywords);
    labels.push(remedyLabel);
  }
  
  // 第2候補C: 悩みベースの代替案（マットレス硬さを考慮）
  if (concerns.length > 0 || neckIssues.length > 0) {
    let problemKeywords = [];
    let problemLabel = "お悩み対応";
    
    // 気になる点からキーワード生成
    if (concerns.includes("neck_pain")) {
      problemKeywords.push("首痛 枕", "首 痛み 枕");
    }
    if (concerns.includes("height_mismatch")) {
      problemKeywords.push("高さ調整 枕", "調整可能 枕");
    }
    if (concerns.includes("poor_turn")) {
      problemKeywords.push("寝返り しやすい 枕");
    }
    if (concerns.includes("sweat")) {
      problemKeywords.push("通気性 枕", "涼しい 枕");
    }
    
    // 首・肩の問題からキーワード生成
    if (neckIssues.includes("morning_neck_pain")) {
      problemKeywords.push("朝 首痛 枕", "起床時 首痛 枕");
    }
    if (neckIssues.includes("severe_shoulder_stiffness")) {
      problemKeywords.push("肩こり 枕", "肩 こり 枕");
      
      // 肩こり + マットレス硬さの組み合わせ
      if (mattressFirmness && mattressFirmness !== "unknown") {
        if (mattressFirmness === "soft") {
          // 柔らかめマットレス + 肩こり → 首肩サポート重視
          problemKeywords.push("首肩 サポート 枕", "肩こり 低め 枕");
          problemLabel += " × 首肩サポート";
        } else if (mattressFirmness === "firm") {
          // 硬めマットレス + 肩こり → 高め枕で首肩サポート
          problemKeywords.push("首肩 サポート 枕", "肩こり 高め 枕");
          problemLabel += " × 首肩サポート";
        }
      }
    }
    if (neckIssues.includes("straight_neck")) {
      problemKeywords.push("ストレートネック 枕", "首 矯正 枕");
    }
    
    // マットレス硬さを組み合わせ
    if (mattressFirmness && mattressFirmness !== "unknown") {
      if (mattressFirmness === "soft") {
        problemKeywords.push("柔らかマットレス 対応 枕");
        problemLabel += " × 柔らかマットレス対応";
      } else if (mattressFirmness === "firm") {
        problemKeywords.push("硬めマットレス 対応 枕");
        problemLabel += " × 硬めマットレス対応";
      }
    }
    
    if (problemKeywords.length > 0) {
      keywords.push(problemKeywords);
      labels.push(problemLabel);
    }
  }
  
  // 第2候補D: 調整可能・特殊機能ベース
  let specialKeywords = [];
  let specialLabel = "調整・機能重視";
  
  if (adjustablePref === "yes") {
    specialKeywords.push("調整可能 枕", "高さ調整 枕");
  }
  
  // いびき・暑がり情報を追加
  if (answers?.snore === "often" || answers?.snore === "sometimes") {
    specialKeywords.push("いびき 枕", "いびき 対策 枕");
    specialLabel += " × いびき対策";
  }
  
  if (answers?.heat_sweat === "yes") {
    specialKeywords.push("涼しい 枕", "通気性 枕", "冷却 枕");
    specialLabel += " × 涼感";
  }
  
  // 寝返り頻度を考慮
  if (rollover === "often") {
    specialKeywords.push("寝返り しやすい 枕");
  } else if (rollover === "rare") {
    specialKeywords.push("安定 枕", "固定 枕");
  }
  
  // マットレス硬さと調整機能の組み合わせ
  if (adjustablePref === "yes" && mattressFirmness && mattressFirmness !== "unknown") {
    if (mattressFirmness === "soft") {
      specialKeywords.push("柔らかマットレス 調整 枕");
      specialLabel += " × 柔らかマットレス対応";
    } else if (mattressFirmness === "firm") {
      specialKeywords.push("硬めマットレス 調整 枕");
      specialLabel += " × 硬めマットレス対応";
    }
  }
  
  if (specialKeywords.length > 0) {
    keywords.push(specialKeywords);
    labels.push(specialLabel);
  }
  
  // 最低3つになるようにフォールバック
  while (keywords.length < 3) {
    if (keywords.length === 0) {
      keywords.push(["枕", "快眠 枕"]);
      labels.push("快眠重視");
    } else if (keywords.length === 1) {
      keywords.push(["低反発 枕", "高反発 枕"]);
      labels.push("素材重視");
    } else {
      keywords.push(["首 肩 枕", "調整 枕"]);
      labels.push("首肩サポート");
    }
  }
  
  return { keywords: keywords.slice(0, 3), labels: labels.slice(0, 3) };
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
  _allowFallback = true,
  answers?: any // 診断結果を追加
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
    let secondaryLabels: string[] = [];

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

    // 第2候補を診断ベースに変更
    if (answers) {
      const { keywords, labels } = generateSecondaryKeywords(answers);
      secondaryLabels = labels;
      
      // 予算のワンランク上を計算
      const extendedBudgetBandId = getExtendedBudgetBandId(budgetBandId);
      
      // 第2候補A
      if (keywords[0] && keywords[0].length > 0) {
        secondaryA = await searchWithFallback({ 
          budgetBandId: extendedBudgetBandId, 
          anyOfKeywords: keywords[0], 
          limit: 3 
        });
      }
      
      // 第2候補B
      if (keywords[1] && keywords[1].length > 0) {
        secondaryB = await searchWithFallback({ 
          budgetBandId: extendedBudgetBandId, 
          anyOfKeywords: keywords[1], 
          limit: 3 
        });
      }
      
      // 第2候補C
      if (keywords[2] && keywords[2].length > 0) {
        secondaryC = await searchWithFallback({ 
          budgetBandId: extendedBudgetBandId, 
          anyOfKeywords: keywords[2], 
          limit: 3 
        });
      }
    } else {
      // フォールバック: 従来の固定カテゴリ検索（予算制限あり）
      const extendedBudgetBandId = getExtendedBudgetBandId(budgetBandId);
      secondaryA = await searchWithFallback({ budgetBandId: extendedBudgetBandId, anyOfKeywords: ["横向き 枕","高反発 枕"], limit: 3 });
      secondaryB = await searchWithFallback({ budgetBandId: extendedBudgetBandId, anyOfKeywords: ["低反発 枕","仰向け 枕"], limit: 3 });
      secondaryC = await searchWithFallback({ budgetBandId: extendedBudgetBandId, anyOfKeywords: ["首 肩こり 枕","高さ 調整 枕"], limit: 3 });
      secondaryLabels = ["横向き × 高反発", "低反発 × 仰向け", "首肩サポート"];
    }

    // null安全
    primary = Array.isArray(primary) ? primary.slice(0, topN) : [];
    secondaryA = Array.isArray(secondaryA) ? secondaryA.slice(0, 3) : [];
    secondaryB = Array.isArray(secondaryB) ? secondaryB.slice(0, 3) : [];
    secondaryC = Array.isArray(secondaryC) ? secondaryC.slice(0, 3) : [];

    // 重複除去を適用
    const dedupedGroups = dedupeProductGroups({
      primary,
      secondaryA,
      secondaryB,
      secondaryC
    });

    const emptyAll = dedupedGroups.primary.length + dedupedGroups.secondaryA.length + dedupedGroups.secondaryB.length + dedupedGroups.secondaryC.length === 0;
    const message = emptyAll ? "候補を取得できませんでした" : undefined;

    return { 
      primary: dedupedGroups.primary, 
      secondaryBuckets: [dedupedGroups.secondaryA, dedupedGroups.secondaryB, dedupedGroups.secondaryC], 
      secondaryA: dedupedGroups.secondaryA, 
      secondaryB: dedupedGroups.secondaryB, 
      secondaryC: dedupedGroups.secondaryC, 
      secondaryLabels,
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
      secondaryLabels: [],
      message: "候補を取得できませんでした" 
    };
  }
} 