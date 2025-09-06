import type { SearchItem } from "../../../lib/malls/types";
import { extractSignals, normalizeAnswers, AnswersLite, ItemSignals } from "./signals";
import type { GroupKey } from "./signals";
import { deriveSignals, buildReasons } from "./signals";

export type RankedPick = {
  item: SearchItem;
  sig: ItemSignals;
  // 選定の根拠の断片（UIで理由文に組み立てる）
  why: string[];
};

function postureScore(sig: ItemSignals, answers: AnswersLite): number {
  // 姿勢 > 悩み > 素材 の "最重要" を強調するため、マッチ数を返す
  let m = 0;
  if (answers.postures.includes("side")   && sig.postures.side) m++;
  if (answers.postures.includes("supine") && sig.postures.supine) m++;
  if (answers.postures.includes("prone")  && sig.postures.prone) m++;
  return m;
}
function concernScore(sig: ItemSignals, answers: AnswersLite): number {
  let m = 0;
  for (const c of answers.concerns || []) {
    if (c === "neck"     && sig.concerns.neck) m++;
    if (c === "shoulder" && sig.concerns.shoulder) m++;
    if (c === "headache" && sig.concerns.headache) m++;
    if (c === "snore"    && sig.concerns.snore) m++;
  }
  return m;
}
function materialScore(sig: ItemSignals, answers: AnswersLite): number {
  const p = answers.materialPref;
  if (!p) return 0;
  return sig.materials[p] ? 1 : 0;
}

function cmpByPriority(a: {ps:number;cs:number;ms:number;price?:number}, b:{ps:number;cs:number;ms:number;price?:number}) {
  // 姿勢 > 悩み > 素材 > 価格（中央値に近い順は外部で並べ済み想定だが念のため昇順）
  if (a.ps !== b.ps) return b.ps - a.ps;
  if (a.cs !== b.cs) return b.cs - a.cs;
  if (a.ms !== b.ms) return b.ms - a.ms;
  return (a.price ?? Infinity) - (b.price ?? Infinity);
}

export function pickPrimaryAndSecondary(all: SearchItem[], rawAnswers: any) {
  const answers = normalizeAnswers(rawAnswers);
  const enriched = all.map((item) => {
    const sig = extractSignals(item);
    const ps = postureScore(sig, answers);
    const cs = concernScore(sig, answers);
    const ms = materialScore(sig, answers);
    const why: string[] = [];
    if (ps>0) why.push("姿勢に合致");
    if (cs>0) why.push("お悩みに合致");
    if (ms>0) why.push("素材の好みに合致");
    return { item, sig, ps, cs, ms, why };
  });

  // 第一候補＝優先順位の辞書式で上位
  const sorted = enriched.sort(cmpByPriority);
  const primary = sorted.slice(0, 3).map(({item, sig, why}) => ({ item, sig, why })) as RankedPick[];

  // 第二候補＝"第一候補に近いが微調整"を3つ
  // - 同じ姿勢合致（ps 同等以上）
  // - 悩み/素材で差分（cs or ms が異なる）または mall/shop が異なる
  const topRef = sorted[0];
  const secondaryPool = sorted.filter(e => {
    if (!topRef) return false;
    const similarPosture = e.ps >= Math.max(1, topRef.ps - 0); // 姿勢レベルは維持
    const diffAxis = (e.cs !== topRef.cs) || (e.ms !== topRef.ms) ||
                     (e.item.mall !== topRef.item.mall) || (e.item.shop !== topRef.item.shop);
    return similarPosture && diffAxis && e.item.id !== topRef.item.id;
  });
  const secondary = secondaryPool.slice(0, 3).map(({item, sig, why}) => ({ item, sig, why })) as RankedPick[];

  return { primary, secondary };
}

// --- 重み（確定値） ---
export const WEIGHTS = {
  posture: 5,   // 最重要: 姿勢
  concern: 3,   // 次点: 悩み
  material: 1,  // 参照: 素材
} as const;

// --- 閾値・差分（確定値） ---
export const THRESHOLDS = {
  primaryMin: 5,   // primary に採用する最低スコア
  secondaryMin: 4, // secondary 採用の最低スコア
  tieGap: 2,       // primary と secondary のスコア差がこの値以下なら僅差
} as const;

export type FinalPick = {
  primaryGroup: string[];
  secondaryGroup: string[];
  reasons: string[];
};

export function rankCandidates(input: {
  postures?: string[];
  concerns?: string[];
  pillowMaterial?: string[];
}): FinalPick {
  // まずは論理シグナルを抽出（重みはまだ掛けない）
  const sig = deriveSignals({
    postures: input.postures ?? [],
    concerns: input.concerns ?? [],
    pillowMaterial: input.pillowMaterial ?? [],
  });

  // 重み適用
  const weighted: Record<GroupKey, number> = {
    standard:
      (sig.flags.hasPosture ? WEIGHTS.posture : 0) +
      (sig.flags.hasMaterial ? WEIGHTS.material : 0),
    comfort: sig.flags.hasConcern ? WEIGHTS.concern : 0,
  };

  // スコア上位2つ（今回は standard/comfort の二択想定）
  const entries = (Object.entries(weighted) as [GroupKey, number][])
    .sort((a, b) => b[1] - a[1]);

  const [topKey, topScore] = entries[0] ?? ["standard", 0];
  const [secondKey, secondScore] = entries[1] ?? ["comfort", 0];

  // primary 判定
  let primary: GroupKey | null = null;
  if (topScore >= THRESHOLDS.primaryMin) {
    primary = topKey;
  } else {
    // 弱い場合は standard にフォールバック
    primary = "standard";
  }

  // secondary 判定（条件付きで1件だけ採用）
  let secondary: GroupKey | null = null;
  const scoreGap = topScore - secondScore;
  if (
    secondKey !== primary &&
    secondScore >= THRESHOLDS.secondaryMin &&
    scoreGap <= THRESHOLDS.tieGap
  ) {
    secondary = secondKey;
  }

  // 理由（最大3件）
  const reasons = buildReasons({
    postures: input.postures ?? [],
    concerns: input.concerns ?? [],
  });

  return {
    primaryGroup: [primary],
    secondaryGroup: secondary ? [secondary] : [],
    reasons,
  };
}
