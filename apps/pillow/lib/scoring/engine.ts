import {
  BASE_WEIGHTS, POSTURE_ROLLOVER_WEIGHTS, NECK_SHOULDER_WEIGHTS,
  COMFORT_WEIGHTS, PREF_WEIGHTS, BUDGET_WEIGHTS,
  CATEGORY_LABEL, type CategoryId
} from "./config";

type Answers = Record<string, any>;

export type Provisional = {
  category: CategoryId;
  score: number;   // 0..1
  reasons: string[];
};

export type Insight = {
  summary: string;
  reasons: string[];
};

export type ProvisionalResult = {
  provisional: Provisional[];
  insight: Insight;
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

function sumWeights(map: Partial<Record<CategoryId, number>>, acc: Map<CategoryId, number>, reason: string, reasonBook: Map<CategoryId, string[]>) {
  for (const [cat, w] of Object.entries(map) as [CategoryId, number][]) {
    const prev = acc.get(cat) ?? 0;
    acc.set(cat, prev + (w ?? 0));
    if (w && reason) {
      const arr = reasonBook.get(cat) ?? [];
      arr.push(`${reason} (+${w.toFixed(2)})`);
      reasonBook.set(cat, arr);
    }
  }
}

export function computeProvisional(answers: Answers): ProvisionalResult {
  const scores = new Map<CategoryId, number>();
  const reasons = new Map<CategoryId, string[]>();

  // ベース重み
  sumWeights(BASE_WEIGHTS, scores, "汎用性が高い初期推奨", reasons);

  // 姿勢×寝返り（最重要）
  const posture = answers.posture;     // supine | side | prone
  const rollover = answers.rollover;   // low | mid | high
  const key = `${posture}|${rollover}`;
  if (POSTURE_ROLLOVER_WEIGHTS[key]) {
    sumWeights(POSTURE_ROLLOVER_WEIGHTS[key], scores, `姿勢×寝返りに基づく適合`, reasons);
  }

  // 首・肩（複数）
  const nsi: string[] = Array.isArray(answers.neck_shoulder_issues) ? answers.neck_shoulder_issues : [];
  for (const tag of nsi) {
    if (NECK_SHOULDER_WEIGHTS[tag]) {
      sumWeights(NECK_SHOULDER_WEIGHTS[tag], scores, `首肩の症状: ${tag}`, reasons);
    }
  }

  // 健康・快適性
  const snore = answers.snore ? `snore_${answers.snore}` : null;
  if (snore && COMFORT_WEIGHTS[snore]) sumWeights(COMFORT_WEIGHTS[snore], scores, "いびき傾向", reasons);

  const fatigue = answers.fatigue ? `fatigue_${answers.fatigue}` : null;
  if (fatigue && COMFORT_WEIGHTS[fatigue]) sumWeights(COMFORT_WEIGHTS[fatigue], scores, "起床時の疲れ", reasons);

  const heat = answers.heat_sweat ? `heat_${answers.heat_sweat}` : null;
  if (heat && COMFORT_WEIGHTS[heat]) sumWeights(COMFORT_WEIGHTS[heat], scores, "暑がり傾向", reasons);

  // 環境・好み
  const mf = answers.mattress_firmness;
  if (mf && PREF_WEIGHTS.mattress_firmness[mf as keyof typeof PREF_WEIGHTS.mattress_firmness]) sumWeights(PREF_WEIGHTS.mattress_firmness[mf as keyof typeof PREF_WEIGHTS.mattress_firmness], scores, "マットレス硬さの適合", reasons);

  const adj = answers.adjustable_pref;
  if (adj && PREF_WEIGHTS.adjustable_pref[adj as keyof typeof PREF_WEIGHTS.adjustable_pref]) sumWeights(PREF_WEIGHTS.adjustable_pref[adj as keyof typeof PREF_WEIGHTS.adjustable_pref], scores, "高さ調整の希望", reasons);

  const mat = answers.material_pref;
  if (mat && PREF_WEIGHTS.material_pref[mat as keyof typeof PREF_WEIGHTS.material_pref]) sumWeights(PREF_WEIGHTS.material_pref[mat as keyof typeof PREF_WEIGHTS.material_pref], scores, "素材の好み", reasons);

  const size = answers.size_pref;
  if (size && PREF_WEIGHTS.size_pref[size as keyof typeof PREF_WEIGHTS.size_pref]) sumWeights(PREF_WEIGHTS.size_pref[size as keyof typeof PREF_WEIGHTS.size_pref], scores, "サイズ希望", reasons);

  // 予算
  const budget = answers.budget;
  if (budget && BUDGET_WEIGHTS[budget as keyof typeof BUDGET_WEIGHTS]) sumWeights(BUDGET_WEIGHTS[budget as keyof typeof BUDGET_WEIGHTS], scores, "予算レンジの現実解", reasons);



  // 正規化（0..1）
  const maxScore = Math.max(0.001, ...Array.from(scores.values()));
  const list: Provisional[] = Array.from(scores.entries())
    .map(([category, raw]) => ({
      category,
      score: clamp01(raw / (maxScore * 1.0)), // 余白を残したければ1.1など
      reasons: reasons.get(category) ?? [],
    }))
    .sort((a, b) => b.score - a.score);

  // insight（一次診断の要約）
  const top = list.slice(0, 3);
  const summaryParts = top.map(t => `${CATEGORY_LABEL[t.category]}（${(t.score*100)|0}%）`);
  const summary = `一次診断では ${summaryParts.join(" / ")} を優先候補として抽出しました。`;

  const flatReasons = Array.from(new Set(top.flatMap(t => t.reasons))).slice(0, 6);

  return {
    provisional: list,
    insight: {
      summary,
      reasons: flatReasons,
    }
  };
} 