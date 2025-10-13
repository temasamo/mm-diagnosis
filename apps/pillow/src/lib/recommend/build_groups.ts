import { type GroupKey } from '@/lib/ui/labels';
import { searchAllMalls } from '../../../lib/catalog/mall_search';

// 返却は必ず安定キー
export type RecGroup = { id: GroupKey; items: any[]; reasonTags: string[] };

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

/**
 * 診断結果から第2候補の検索キーワードを生成
 * 提案された改善案に基づいて実装
 */
function generateSecondaryKeywords(answers: any): { keywords: string[][], labels: string[] } {
  const keywords: string[][] = [];
  const labels: string[] = [];
  
  // Aセクション（寝姿勢・寝返り）とBセクション（気になる点）を主にマッチング
  // 姿勢情報を正しく取得（複数のフィールド名に対応）
  let posture = answers?.posture;
  if (!posture && answers?.postures && Array.isArray(answers.postures) && answers.postures.length > 0) {
    posture = answers.postures[0]; // 最初の姿勢を使用
  }
  if (!posture && answers?.sleepingPosition) {
    posture = answers.sleepingPosition;
  }
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
    let postureLabel = "Aタイプ";
    
    if (posture === "side") {
      postureKeywords = ["横向き 枕", "横向き寝 枕", "波型 枕", "サイドサポート 枕", "横向き専用 枕", "ウェーブ 枕"];
      
      // マットレス硬さと枕の高さの組み合わせ
      if (mattressFirmness && mattressFirmness !== "unknown") {
        if (mattressFirmness === "soft") {
          // 柔らかめマットレス → 低め枕
          postureKeywords.push("低め 枕", "横向き 低め 枕", "波型 低め 枕");
        } else if (mattressFirmness === "firm") {
          // 硬めマットレス → 高め枕
          postureKeywords.push("高め 枕", "横向き 高め 枕", "波型 高め 枕");
        }
      }
    } else if (posture === "supine") {
      postureKeywords = ["仰向け 枕", "仰向け寝 枕", "頸椎 枕", "首サポート 枕", "バックサポート 枕", "頸椎サポート 枕"];
      
      // マットレス硬さを考慮
      if (mattressFirmness && mattressFirmness !== "unknown") {
        if (mattressFirmness === "soft") {
          postureKeywords.push("仰向け 低め 枕", "頸椎 低め 枕");
        } else if (mattressFirmness === "firm") {
          postureKeywords.push("仰向け 高め 枕", "頸椎 高め 枕");
        }
      }
    } else if (posture === "prone") {
      postureKeywords = ["うつ伏せ 枕", "うつ伏せ寝 枕", "薄め 枕", "低め 枕", "うつ伏せ専用 枕"];
      
      // うつ伏せの場合は低め枕が基本
      if (mattressFirmness && mattressFirmness !== "unknown") {
        if (mattressFirmness === "soft") {
          postureKeywords.push("うつ伏せ 低め 枕", "薄め 低め 枕");
        } else if (mattressFirmness === "firm") {
          postureKeywords.push("うつ伏せ 枕", "薄め 枕", "低め 枕");
        }
      }
    }
    
    // 素材の好みを組み合わせ
    if (materialPref && materialPref !== "unknown" && materialPref !== "none") {
      if (materialPref === "lp") {
        postureKeywords.push("低反発");
      } else if (materialPref === "hp") {
        postureKeywords.push("高反発");
      } else if (materialPref === "feather") {
        postureKeywords.push("羽毛");
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
    const remedyLabel = "Bタイプ";
    
    keywords.push(remedyKeywords);
    labels.push(remedyLabel);
  }
  
  // 第2候補C: 悩みベースの代替案（マットレス硬さを考慮）
  if (concerns.length > 0 || neckIssues.length > 0) {
    let problemKeywords = [];
    let problemLabel = "Cタイプ";
    
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
        } else if (mattressFirmness === "firm") {
          // 硬めマットレス + 肩こり → 高め枕で首肩サポート
          problemKeywords.push("首肩 サポート 枕", "肩こり 高め 枕");
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
      } else if (mattressFirmness === "firm") {
        problemKeywords.push("硬めマットレス 対応 枕");
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
  }
  
  if (answers?.heat_sweat === "yes") {
    specialKeywords.push("涼しい 枕", "通気性 枕", "冷却 枕");
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
    } else if (mattressFirmness === "firm") {
      specialKeywords.push("硬めマットレス 調整 枕");
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
      labels.push("Aタイプ");
    } else if (keywords.length === 1) {
      keywords.push(["低反発 枕", "高反発 枕"]);
      labels.push("Bタイプ");
    } else {
      keywords.push(["首 肩 枕", "調整 枕"]);
      labels.push("Cタイプ");
    }
  }
  
  return { keywords: keywords.slice(0, 3), labels: labels.slice(0, 3) };
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

type SearchOpts = {
  budgetBandId?: string | null;
  allowNoImage?: boolean;
  anyOfKeywords?: string[]; // OR 条件
  allOfKeywords?: string[]; // AND 条件（弱め）
  limit?: number;
};

async function searchWithFallback(opts: SearchOpts) {
  // ここは既存の searchCross / searchRakuten / searchYahoo に合わせて実装
  // 例）searchCross({ anyOfKeywords, allOfKeywords, budgetBandId, allowNoImage, limit })
  return await searchAllMalls(opts.anyOfKeywords?.[0] || "枕", opts.limit || 3, opts.budgetBandId || undefined);
}

export type GroupedRecommendations = {
  primary: any[];
  secondaryBuckets: any[][];
  secondaryA: any[];
  secondaryB: any[];
  secondaryC: any[];
  secondaryLabels?: string[];
  message?: string;
};

export async function buildGroupsFromAPI(
  provisional: any,
  limit: number = 12,
  budgetBandId?: string,
  strict: boolean = true,
  answers?: any
): Promise<GroupedRecommendations> {
  try {
    console.log("[build] provisional(raw)", provisional, "limit", limit, "budgetBandId", budgetBandId);
    
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
      limit: limit,
    });

    // 0件なら順に緩める
    if (!primary || primary.length === 0) {
      // ② 予算緩和
      primary = await searchWithFallback({
        budgetBandId: null,              // 予算を一旦外す
        anyOfKeywords: base.map(x => x?.keyword).filter(Boolean),
        limit: limit,
      });
    }

    if (!primary || primary.length === 0) {
      // ③ キーワード拡張（カテゴリから生成したゆるい語）
      const loose = deriveLooseKeywords(base.map(x => x?.category).filter(Boolean));
      primary = await searchWithFallback({
        budgetBandId: null,
        anyOfKeywords: loose,            // OR 条件
        limit: limit,
      });
    }

    if (!primary || primary.length === 0) {
      // ④ 画像なし許容（サムネが無くても返す）
      const loose = deriveLooseKeywords(base.map(x => x?.category).filter(Boolean));
      primary = await searchWithFallback({
        budgetBandId: null,
        anyOfKeywords: loose,
        allowNoImage: true,
        limit: limit,
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
    primary = Array.isArray(primary) ? primary.slice(0, limit) : [];
    secondaryA = Array.isArray(secondaryA) ? secondaryA.slice(0, 3) : [];
    secondaryB = Array.isArray(secondaryB) ? secondaryB.slice(0, 3) : [];
    secondaryC = Array.isArray(secondaryC) ? secondaryC.slice(0, 3) : [];

    // 第一候補が空の場合のフォールバック処理
    if (primary.length === 0) {
      // 第二候補から第一候補に移動
      const allSecondary = [...secondaryA, ...secondaryB, ...secondaryC];
      if (allSecondary.length > 0) {
        primary = allSecondary.slice(0, 3);
        // 第二候補を再構築（残りの商品から）
        const remaining = allSecondary.slice(3);
        secondaryA = remaining.slice(0, 3);
        secondaryB = remaining.slice(3, 6);
        secondaryC = remaining.slice(6, 9);
      } else {
        // 全て空の場合は汎用検索でフォールバック
        const fallbackResults = await searchWithFallback({
          budgetBandId: null,
          anyOfKeywords: ["枕", "ピロー"],
          limit: 3
        });
        primary = Array.isArray(fallbackResults) ? fallbackResults.slice(0, 3) : [];
      }
    }

    // 重複除去は既にsearch-cross APIで実行済み
    const emptyAll = primary.length + secondaryA.length + secondaryB.length + secondaryC.length === 0;
    const message = emptyAll ? "候補を取得できませんでした" : undefined;

    return { 
      primary, 
      secondaryBuckets: [secondaryA, secondaryB, secondaryC], 
      secondaryA, 
      secondaryB, 
      secondaryC, 
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