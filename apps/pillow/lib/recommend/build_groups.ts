import { CATEGORY_LABEL, type CategoryId } from "../scoring/config";
import { CATEGORY_QUERIES, buildQueryWords } from "../catalog/category_query";
import { searchAllMalls, type MallProduct } from "../catalog/mall_search";
import type { Provisional } from "../scoring/engine";
import { dedupeProductGroups } from "../dedupe";
import { getBandById } from "../budget";
import { inAllowedBands, bandOf, type BudgetBandId, neighbors, inAllowedBandsNew, type BandId } from "./priceBand";

// 第二候補の埋めロジック用の型定義
type Item = {
  id: string;
  url: string;
  title: string;
  price: number; // 円
  image?: string | null;
  mall?: "rakuten" | "yahoo" | string;
  shop?: string | null;
};

// 価格 → band を判定（priceBand.tsと閾値を合わせる）
const bands = [0, 10000, 20000, Infinity]; // priceBand.tsの境界値と一致
const getBandIndex = (price: number) =>
  Math.max(0, bands.findIndex((b, i) => price >= b && price < bands[i + 1]));

// 重複判定（ID or URL で）
const makeDupSet = (arr: Item[]) => new Set(arr.map(x => x.id || x.url));
const dedupPush = (dst: Item[], src: Item[], used: Set<string>, n: number) => {
  for (const it of src) {
    const key = it.id || it.url;
    if (!key || used.has(key)) continue;
    dst.push(it);
    used.add(key);
    if (dst.length >= n) break;
  }
};

// 第二候補の埋めロジック
const fillSecondaryGroups = (
  primary: Item[],
  secondaryA: Item[],
  secondaryB: Item[],
  secondaryC: Item[],
  allCandidates: Item[],
  context: { budgetMin?: number; suggestedPrice?: number }
) => {
  const used = makeDupSet([...primary, ...secondaryA, ...secondaryB, ...secondaryC]);

  // 近傍価格帯プール（±1 band 許容）
  const targetBand = getBandIndex(context.budgetMin ?? context.suggestedPrice ?? 20000);
  const nearPool = allCandidates
    .filter(x => Math.abs(getBandIndex(x.price) - targetBand) <= 1)
    .filter(x => !used.has(x.id || x.url));

  // スコア/人気順などがあればそのキーで並べ替え（なければ価格昇順などで安定化）
  nearPool.sort((a, b) => a.price - b.price);

  const fill = (group: Item[], need: number) => {
    if (group.length >= 1) return group;            // 0 件のときだけ埋める（基準は任意）
    dedupPush(group, nearPool, used, need);         // 例：3件狙い
    return group;
  };

  secondaryA = fill(secondaryA, 3);
  secondaryB = fill(secondaryB, 3);
  secondaryC = fill(secondaryC, 3);

  console.debug('[rec] secondary fill', {
    nearPool: nearPool.length,
    A: secondaryA.length,
    B: secondaryB.length,
    C: secondaryC.length,
  });

  return { secondaryA, secondaryB, secondaryC };
};

// 第二候補の穴埋め強化ロジック
const MIN_PER_GROUP = 2; // 体裁として "各グループ最低2件" にする

async function buildSecondaryGroups(ctx: {
  query: string;
  budgetBandId: BandId;
  category: string;
  existingItems: any[];
}) {
  const { query, budgetBandId, existingItems } = ctx;
  const allowed = neighbors(budgetBandId, { includeSelf: true, maxDistance: 1 });

  // 第一候補で使ったプールとは独立に、第二候補用のプールを取得
  // 既存の検索ロジックを活用
  const pool = existingItems.filter((p: any) => 
    p && p.price != null && p.price > 0 && inAllowedBandsNew(p.price, allowed)
  );

  // 価格近傍で抽出（±1レンジ）: まずここで候補を作る
  const nearby = pool.filter((p: any) => inAllowedBandsNew(p.price, allowed));

  // brand/ショップなどで軽い多様性を付けて3分割
  const diversify = (items: any[]) => {
    const seen = new Set<string>();
    return items.filter(x => {
      const k = `${x.brand ?? ""}/${x.shop ?? ""}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };

  const seed = diversify(nearby);

  const groups = { A: [] as any[], B: [] as any[], C: [] as any[] };

  // ラウンドロビンで A/B/C に配る
  seed.forEach((it, i) => {
    const g = (["A","B","C"] as const)[i % 3];
    groups[g].push(it);
  });

  // 足りないところを全体プール（価格外含む）から埋める（ただし1万円未満は除外）
  const safeFillPool = pool.filter((p: any) => p.price >= 10000);

  (["A","B","C"] as const).forEach(g => {
    let i = 0;
    while (groups[g].length < MIN_PER_GROUP && i < safeFillPool.length) {
      const cand = safeFillPool[i++];
      if (!groups[g].some(x => x.id === cand.id)) groups[g].push(cand);
    }
  });

  return {
    secondaryA: groups.A,
    secondaryB: groups.B,
    secondaryC: groups.C
  };
}

// 第2候補の絞り込みフィルタ
function filterForSecondary(items: Array<{ price?: number }>, budget: BudgetBandId) {
  return items.filter(it => {
    const p = Number(it.price ?? 0);
    // 価格が無い/0 は弾く
    if (!Number.isFinite(p) || p <= 0) return false;
    // 近傍を許容しつつ、20k+ のときは 1万円未満を除外 & 10-20k だけを近傍に
    return inAllowedBands(p, budget, { includeNeighbors: true });
  });
}

// --- 予算のワンランク上を計算する関数 ---
function getExtendedBudgetBandId(budgetBandId?: string | null): string | null {
  if (!budgetBandId) return null;
  
  // 予算バンドのマッピング（ワンランク上まで拡張）
  const budgetMapping: Record<string, string> = {
    "3k-6k": "3k-10k",      // 3k-6k → 3k-10k（6k-10kまで含める）
    "6k-10k": "6k-20k",     // 6k-10k → 6k-20k（10k-20kまで含める）
    "10k-20k": "10k-20k",   // 10k-20k → 変更なし（上限なし）
    "20k+": "10k-20k",      // 20k+ → 10k-20k（1万円以上に拡張）
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
  const budget = answers?.budget;
  
  // 高級枕向けの検索クエリ（予算が2万円以上の場合）
  const isLuxuryBudget = budget === "20kplus" || budget === "30k+";
  
  // 高級枕で確実に結果が得られる具体的な検索クエリ
  const getLuxuryPillowQueries = (baseKeywords: string[]) => {
    if (!isLuxuryBudget) return baseKeywords;
    
    // 高級枕で確実に結果が得られる具体的なキーワード
    const luxuryKeywords = [
      "テンピュール 枕",
      "メモリーフォーム 枕 高級",
      "羽毛 枕 高級",
      "ラテックス 枕 高級",
      "枕 ホテル 高級",
      "枕 高級 ブランド"
    ];
    
    // ベースキーワードと高級キーワードを組み合わせ
    const combined = [...baseKeywords];
    luxuryKeywords.forEach(luxury => {
      if (!combined.includes(luxury)) {
        combined.push(luxury);
      }
    });
    
    return combined;
  };
  
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
      // 高級予算の場合は高級枕向けの検索クエリを追加
      if (isLuxuryBudget) {
        postureKeywords = ["横向き 枕 高級", "横向き寝 枕 ホテル 高級"];
      } else {
        postureKeywords = ["横向き 枕", "横向き寝 枕"];
      }
      postureLabel = "横向き寝向け";
      
      // 高級予算の場合は具体的な高級枕キーワードを追加
      if (isLuxuryBudget) {
        postureKeywords = getLuxuryPillowQueries(postureKeywords);
      }
      
      // マットレス硬さと枕の高さの組み合わせ
      if (mattressFirmness && mattressFirmness !== "unknown") {
        if (mattressFirmness === "soft") {
          // 柔らかめマットレス → 低め枕
          if (isLuxuryBudget) {
            postureKeywords.push("低め 枕 高級", "横向き 低め 枕 ホテル");
          } else {
            postureKeywords.push("低め 枕", "横向き 低め 枕");
          }
          postureLabel += " × 低め枕";
        } else if (mattressFirmness === "firm") {
          // 硬めマットレス → 高め枕
          if (isLuxuryBudget) {
            postureKeywords.push("高め 枕 高級", "横向き 高め 枕 ホテル");
          } else {
            postureKeywords.push("高め 枕", "横向き 高め 枕");
          }
          postureLabel += " × 高め枕";
        }
      }
    } else if (posture === "supine") {
      if (isLuxuryBudget) {
        postureKeywords = ["仰向け 枕 高級", "仰向け寝 枕 ホテル 高級"];
      } else {
        postureKeywords = ["仰向け 枕", "仰向け寝 枕"];
      }
      postureLabel = "仰向け寝向け";
      
      // 高級予算の場合は具体的な高級枕キーワードを追加
      if (isLuxuryBudget) {
        postureKeywords = getLuxuryPillowQueries(postureKeywords);
      }
      
      // マットレス硬さを考慮
      if (mattressFirmness && mattressFirmness !== "unknown") {
        if (mattressFirmness === "soft") {
          if (isLuxuryBudget) {
            postureKeywords.push("仰向け 低め 枕 高級");
          } else {
            postureKeywords.push("仰向け 低め 枕");
          }
          postureLabel += " × 低め枕";
        } else if (mattressFirmness === "firm") {
          if (isLuxuryBudget) {
            postureKeywords.push("仰向け 高め 枕 高級");
          } else {
            postureKeywords.push("仰向け 高め 枕");
          }
          postureLabel += " × 高め枕";
        }
      }
    } else if (posture === "prone") {
      if (isLuxuryBudget) {
        postureKeywords = ["うつ伏せ 枕 高級", "うつ伏せ寝 枕 ホテル 高級"];
      } else {
        postureKeywords = ["うつ伏せ 枕", "うつ伏せ寝 枕"];
      }
      postureLabel = "うつ伏せ寝向け";
      
      // 高級予算の場合は具体的な高級枕キーワードを追加
      if (isLuxuryBudget) {
        postureKeywords = getLuxuryPillowQueries(postureKeywords);
      }
      
      // うつ伏せの場合は低め枕が基本
      if (mattressFirmness && mattressFirmness !== "unknown") {
        if (mattressFirmness === "soft") {
          if (isLuxuryBudget) {
            postureKeywords.push("うつ伏せ 低め 枕 高級");
          } else {
            postureKeywords.push("うつ伏せ 低め 枕");
          }
          postureLabel += " × 低め枕";
        } else if (mattressFirmness === "firm") {
          if (isLuxuryBudget) {
            postureKeywords.push("うつ伏せ 枕 高級", "薄め 枕 ホテル");
          } else {
            postureKeywords.push("うつ伏せ 枕", "薄め 枕");
          }
          postureLabel += " × 薄め枕";
        }
      }
    }
    
    // 素材の好みを組み合わせ
    if (materialPref && materialPref !== "unknown" && materialPref !== "none") {
      if (materialPref === "lp") {
        if (isLuxuryBudget) {
          postureKeywords.push("低反発 枕 高級");
        } else {
          postureKeywords.push("低反発");
        }
        postureLabel += " × 低反発";
      } else if (materialPref === "hp") {
        if (isLuxuryBudget) {
          postureKeywords.push("高反発 枕 高級");
        } else {
          postureKeywords.push("高反発");
        }
        postureLabel += " × 高反発";
      } else if (materialPref === "feather") {
        if (isLuxuryBudget) {
          postureKeywords.push("羽毛 枕 高級", "羽毛 枕 ホテル");
        } else {
          postureKeywords.push("羽毛");
        }
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
    let remedyKeywords: string[];
    
    if (isLuxuryBudget) {
      // 高級予算の場合は高級枕向けの検索クエリを生成
      remedyKeywords = remedyMaterials.map(material => `${material} 枕 高級`);
      // ホテル向けの検索クエリも追加
      remedyKeywords.push(...remedyMaterials.map(material => `${material} 枕 ホテル 高級`));
      // 具体的な高級枕キーワードを追加
      remedyKeywords = getLuxuryPillowQueries(remedyKeywords);
    } else {
      remedyKeywords = remedyMaterials.map(material => `${material} 枕`);
    }
    
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
      if (isLuxuryBudget) {
        problemKeywords.push("首痛 枕 高級", "首 痛み 枕 ホテル");
      } else {
        problemKeywords.push("首痛 枕", "首 痛み 枕");
      }
    }
    if (concerns.includes("height_mismatch")) {
      if (isLuxuryBudget) {
        problemKeywords.push("高さ調整 枕 高級", "調整可能 枕 ホテル");
      } else {
        problemKeywords.push("高さ調整 枕", "調整可能 枕");
      }
    }
    if (concerns.includes("poor_turn")) {
      if (isLuxuryBudget) {
        problemKeywords.push("寝返り しやすい 枕 高級");
      } else {
        problemKeywords.push("寝返り しやすい 枕");
      }
    }
    if (concerns.includes("sweat")) {
      if (isLuxuryBudget) {
        problemKeywords.push("通気性 枕 高級", "涼しい 枕 ホテル");
      } else {
        problemKeywords.push("通気性 枕", "涼しい 枕");
      }
    }
    
    // 首・肩の問題からキーワード生成
    if (neckIssues.includes("morning_neck_pain")) {
      if (isLuxuryBudget) {
        problemKeywords.push("朝 首痛 枕 高級", "起床時 首痛 枕 ホテル");
      } else {
        problemKeywords.push("朝 首痛 枕", "起床時 首痛 枕");
      }
    }
    if (neckIssues.includes("severe_shoulder_stiffness")) {
      if (isLuxuryBudget) {
        problemKeywords.push("肩こり 枕 高級", "肩 こり 枕 ホテル");
      } else {
        problemKeywords.push("肩こり 枕", "肩 こり 枕");
      }
      
      // 肩こり + マットレス硬さの組み合わせ
      if (mattressFirmness && mattressFirmness !== "unknown") {
        if (mattressFirmness === "soft") {
          // 柔らかめマットレス + 肩こり → 首肩サポート重視
          if (isLuxuryBudget) {
            problemKeywords.push("首肩 サポート 枕 高級", "肩こり 低め 枕 ホテル");
          } else {
            problemKeywords.push("首肩 サポート 枕", "肩こり 低め 枕");
          }
          problemLabel += " × 首肩サポート";
        } else if (mattressFirmness === "firm") {
          // 硬めマットレス + 肩こり → 高め枕で首肩サポート
          if (isLuxuryBudget) {
            problemKeywords.push("首肩 サポート 枕 高級", "肩こり 高め 枕 ホテル");
          } else {
            problemKeywords.push("首肩 サポート 枕", "肩こり 高め 枕");
          }
          problemLabel += " × 首肩サポート";
        }
      }
    }
    if (neckIssues.includes("straight_neck")) {
      if (isLuxuryBudget) {
        problemKeywords.push("ストレートネック 枕 高級", "首 矯正 枕 ホテル");
      } else {
        problemKeywords.push("ストレートネック 枕", "首 矯正 枕");
      }
    }
    
    // マットレス硬さを組み合わせ
    if (mattressFirmness && mattressFirmness !== "unknown") {
      if (mattressFirmness === "soft") {
        if (isLuxuryBudget) {
          problemKeywords.push("柔らかマットレス 対応 枕 高級");
        } else {
          problemKeywords.push("柔らかマットレス 対応 枕");
        }
        problemLabel += " × 柔らかマットレス対応";
      } else if (mattressFirmness === "firm") {
        if (isLuxuryBudget) {
          problemKeywords.push("硬めマットレス 対応 枕 高級");
        } else {
          problemKeywords.push("硬めマットレス 対応 枕");
        }
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
    if (isLuxuryBudget) {
      specialKeywords.push("調整可能 枕 高級", "高さ調整 枕 ホテル");
    } else {
      specialKeywords.push("調整可能 枕", "高さ調整 枕");
    }
  }
  
  // いびき・暑がり情報を追加
  if (answers?.snore === "often" || answers?.snore === "sometimes") {
    if (isLuxuryBudget) {
      specialKeywords.push("いびき 枕 高級", "いびき 対策 枕 ホテル");
    } else {
      specialKeywords.push("いびき 枕", "いびき 対策 枕");
    }
    specialLabel += " × いびき対策";
  }
  
  if (answers?.heat_sweat === "yes") {
    if (isLuxuryBudget) {
      specialKeywords.push("涼しい 枕 高級", "通気性 枕 ホテル", "冷却 枕 高級");
    } else {
      specialKeywords.push("涼しい 枕", "通気性 枕", "冷却 枕");
    }
    specialLabel += " × 涼感";
  }
  
  // 寝返り頻度を考慮
  if (rollover === "often") {
    if (isLuxuryBudget) {
      specialKeywords.push("寝返り しやすい 枕 高級");
    } else {
      specialKeywords.push("寝返り しやすい 枕");
    }
  } else if (rollover === "rare") {
    if (isLuxuryBudget) {
      specialKeywords.push("安定 枕 高級", "固定 枕 ホテル");
    } else {
      specialKeywords.push("安定 枕", "固定 枕");
    }
  }
  
  // マットレス硬さと調整機能の組み合わせ
  if (adjustablePref === "yes" && mattressFirmness && mattressFirmness !== "unknown") {
    if (mattressFirmness === "soft") {
      if (isLuxuryBudget) {
        specialKeywords.push("柔らかマットレス 調整 枕 高級");
      } else {
        specialKeywords.push("柔らかマットレス 調整 枕");
      }
      specialLabel += " × 柔らかマットレス対応";
    } else if (mattressFirmness === "firm") {
      if (isLuxuryBudget) {
        specialKeywords.push("硬めマットレス 調整 枕 高級");
      } else {
        specialKeywords.push("硬めマットレス 調整 枕");
      }
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
      if (isLuxuryBudget) {
        const fallbackKeywords = ["枕 高級", "快眠 枕 ホテル 高級"];
        keywords.push(getLuxuryPillowQueries(fallbackKeywords));
      } else {
        keywords.push(["枕", "快眠 枕"]);
      }
      labels.push("快眠重視");
    } else if (keywords.length === 1) {
      if (isLuxuryBudget) {
        const fallbackKeywords = ["低反発 枕 高級", "高反発 枕 ホテル"];
        keywords.push(getLuxuryPillowQueries(fallbackKeywords));
      } else {
        keywords.push(["低反発 枕", "高反発 枕"]);
      }
      labels.push("素材重視");
    } else {
      if (isLuxuryBudget) {
        const fallbackKeywords = ["首 肩 枕 高級", "調整 枕 ホテル"];
        keywords.push(getLuxuryPillowQueries(fallbackKeywords));
      } else {
        keywords.push(["首 肩 枕", "調整 枕"]);
      }
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

// 重複除去のヘルパー関数
function uniqById<T extends {id?: string}>(xs: T[]) {
  const seen = new Set<string>();
  return xs.filter(x => {
    const k = x.id ?? "";
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

async function searchWithFallback(opts: SearchOpts) {
  const debug = process.env.NEXT_PUBLIC_DEBUG === "1";
  const d = (...args: any[]) => { if (debug) console.log("[searchWithFallback]", ...args); };
  
  d("searchWithFallback called with:", opts);
  
  // 多段フォールバック検索
  const buckets = await Promise.all([
    // 1. 厳密検索: 予算制限 + 厳しめキーワード
    searchAllMalls(opts.anyOfKeywords?.[0] || "枕", opts.limit || 3, opts.budgetBandId || undefined),
    // 2. 緩和検索: 予算制限 + 緩和キーワード  
    searchAllMalls(opts.anyOfKeywords?.[1] || "枕", opts.limit || 3, opts.budgetBandId || undefined),
    // 3. 広域検索: 予算制限のみ（キーワード緩め）
    searchAllMalls("枕", opts.limit || 3, opts.budgetBandId || undefined),
  ]);
  
  d("buckets results:", buckets.map(b => b.length));
  
  // フラット化して不正値を除去
  const flat = buckets.flat().filter(v =>
    v && v.price != null && v.price > 0 && v.image
  );
  
  d("flat filtered:", flat.length);
  
  // 重複除去
  const uniq = uniqById(flat);
  d("unique items:", uniq.length);
  
  // 上限で切り取り
  const result = uniq.slice(0, opts.limit || 30);
  d("final result:", result.length);
  
  return result;
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
      
      // 予算「20k+」の場合は、第2候補でも最低価格を1万円以上に制限
      // 新しい価格帯ユーティリティを使用
      const secondaryBudgetBandId: BandId = (() => {
        if (budgetBandId === "20kplus" || budgetBandId === "30k+") return "20kplus";
        if (budgetBandId === "10k-20k") return "10-20k";
        if (budgetBandId === "6k-10k") return "5-10k";
        if (budgetBandId === "3k-6k" || budgetBandId === "lt3000") return "5-10k";
        return "20kplus"; // デフォルト
      })();
      
      // 第2候補A
      if (keywords[0] && keywords[0].length > 0) {
        secondaryA = await searchWithFallback({ 
          budgetBandId: secondaryBudgetBandId, 
          anyOfKeywords: keywords[0], 
          limit: 3 
        });
      }
      
      // 第2候補B
      if (keywords[1] && keywords[1].length > 0) {
        secondaryB = await searchWithFallback({ 
          budgetBandId: secondaryBudgetBandId, 
          anyOfKeywords: keywords[1], 
          limit: 3 
        });
      }
      
      // 第2候補C
      if (keywords[2] && keywords[2].length > 0) {
        secondaryC = await searchWithFallback({ 
          budgetBandId: secondaryBudgetBandId, 
          anyOfKeywords: keywords[2], 
          limit: 3 
        });
      }
    } else {
      // フォールバック: 従来の固定カテゴリ検索（予算制限あり）
      const extendedBudgetBandId = getExtendedBudgetBandId(budgetBandId);
      
      // 予算「20k+」の場合は、第2候補でも最低価格を1万円以上に制限
      // 新しい価格帯ユーティリティを使用
      const secondaryBudgetBandId: BandId = (() => {
        if (budgetBandId === "20kplus" || budgetBandId === "30k+") return "20kplus";
        if (budgetBandId === "10k-20k") return "10-20k";
        if (budgetBandId === "6k-10k") return "5-10k";
        if (budgetBandId === "3k-6k" || budgetBandId === "lt3000") return "5-10k";
        return "20kplus"; // デフォルト
      })();
      
      secondaryA = await searchWithFallback({ budgetBandId: secondaryBudgetBandId, anyOfKeywords: ["横向き 枕","高反発 枕"], limit: 3 });
      secondaryB = await searchWithFallback({ budgetBandId: secondaryBudgetBandId, anyOfKeywords: ["低反発 枕","仰向け 枕"], limit: 3 });
      secondaryC = await searchWithFallback({ budgetBandId: secondaryBudgetBandId, anyOfKeywords: ["首 肩こり 枕","高さ 調整 枕"], limit: 3 });
      secondaryLabels = ["横向き × 高反発", "低反発 × 仰向け", "首肩サポート"];
    }

    // null安全
    primary = Array.isArray(primary) ? primary.slice(0, topN) : [];
    secondaryA = Array.isArray(secondaryA) ? secondaryA.slice(0, 3) : [];
    secondaryB = Array.isArray(secondaryB) ? secondaryB.slice(0, 3) : [];
    secondaryC = Array.isArray(secondaryC) ? secondaryC.slice(0, 3) : [];

    // === 第二候補の埋めロジックを適用 ===
    // 全候補を収集（NG除外・重複削除後の母集団）
    const allCandidates = [
      ...primary,
      ...secondaryA,
      ...secondaryB,
      ...secondaryC
    ].filter(item => item && item.price != null && item.price > 0);

    // 予算情報を取得
    const budgetMin = budgetBandId ? getBandById(budgetBandId)?.min : undefined;
    const suggestedPrice = budgetMin ?? 20000; // デフォルト値

    // 第二候補グループを埋める
    const filled = fillSecondaryGroups(
      primary,
      secondaryA,
      secondaryB,
      secondaryC,
      allCandidates,
      { budgetMin, suggestedPrice }
    );

    secondaryA = filled.secondaryA;
    secondaryB = filled.secondaryB;
    secondaryC = filled.secondaryC;

    // === 新しい穴埋めロジックを適用 ===
    // 各グループが最低2件になるように穴埋め
    if (secondaryA.length < MIN_PER_GROUP || secondaryB.length < MIN_PER_GROUP || secondaryC.length < MIN_PER_GROUP) {
      const allItems = [
        ...primary,
        ...secondaryA,
        ...secondaryB,
        ...secondaryC
      ].filter(item => item && item.price != null && item.price > 0);

      // 新しい価格帯ユーティリティを使用して穴埋め
      const budgetBandIdForFill: BandId = (() => {
        if (budgetBandId === "20kplus" || budgetBandId === "30k+") return "20kplus";
        if (budgetBandId === "10k-20k") return "10-20k";
        if (budgetBandId === "6k-10k") return "5-10k";
        if (budgetBandId === "3k-6k" || budgetBandId === "lt3000") return "5-10k";
        return "20kplus"; // デフォルト
      })();

      const filledEnhanced = await buildSecondaryGroups({
        query: "枕",
        budgetBandId: budgetBandIdForFill,
        category: "寝具",
        existingItems: allItems
      });

      // 既存のアイテムを保持しつつ、不足分を補充
      secondaryA = [...secondaryA, ...filledEnhanced.secondaryA.slice(0, Math.max(0, MIN_PER_GROUP - secondaryA.length))];
      secondaryB = [...secondaryB, ...filledEnhanced.secondaryB.slice(0, Math.max(0, MIN_PER_GROUP - secondaryB.length))];
      secondaryC = [...secondaryC, ...filledEnhanced.secondaryC.slice(0, Math.max(0, MIN_PER_GROUP - secondaryC.length))];

      console.debug('[rec] after enhanced fill', {
        A: secondaryA.length,
        B: secondaryB.length,
        C: secondaryC.length,
        budgetBandId: budgetBandIdForFill,
      });
    }

    // === 第2候補の絞り込みフィルタを適用 ===
    // 予算バンドIDを新しい形式に変換
    const budgetBandIdForFilter: BudgetBandId = (() => {
      if (budgetBandId === "20kplus" || budgetBandId === "30k+") return "20kplus";
      if (budgetBandId === "10k-20k") return "10-20k";
      if (budgetBandId === "6k-10k") return "5-10k";
      if (budgetBandId === "3k-6k" || budgetBandId === "lt3000") return "u5k";
      return "20kplus"; // デフォルト
    })();

    // 各第2候補グループに厳格フィルタを適用
    secondaryA = filterForSecondary(secondaryA, budgetBandIdForFilter);
    secondaryB = filterForSecondary(secondaryB, budgetBandIdForFilter);
    secondaryC = filterForSecondary(secondaryC, budgetBandIdForFilter);

    console.debug('[rec] after strict filter', {
      A: secondaryA.length,
      B: secondaryB.length,
      C: secondaryC.length,
      budgetBandId: budgetBandIdForFilter,
    });

    // 重複除去を適用
    const dedupedGroups = dedupeProductGroups({
      primary,
      secondaryA,
      secondaryB,
      secondaryC
    });

    // 結果ページ描画直前のログ
    console.debug('[rec] final counts', {
      primary: dedupedGroups.primary.length,
      secondaryA: dedupedGroups.secondaryA.length,
      secondaryB: dedupedGroups.secondaryB.length,
      secondaryC: dedupedGroups.secondaryC.length,
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