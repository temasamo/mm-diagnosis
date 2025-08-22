export type AttrKey =
  | 'sleepPosMain'     // 寝姿勢メイン: back/side/mix
  | 'heightAdjustable' // 高さ調整: yes/no
  | 'firmness'         // 硬さ: soft/medium/firm
  | 'washable'         // 洗濯可: yes/no
  | 'budget'           // 価格帯: low/mid/high
  | 'material'         // 素材: fiber/latex/down/...
  | 'width';           // ワイド: wide/normal

export type AnswerMap = Partial<Record<AttrKey, string | number | boolean>>;
export type Product = {
  id: string;
  title: string;
  attrs: Partial<Record<AttrKey, string | boolean | number>>;
};
export type Scored = { product: Product; score: number };

export type QuestionSpec = {
  id: string;
  key: AttrKey;
  label: string;
  options: { value: string; label: string }[];
  weight?: number; // 任意の優先度（例: sleepPosMain=1.3 など）
};

// ---- helpers
function softmax(xs: number[]): number[] {
  const m = Math.max(...xs);
  const exps = xs.map((x) => Math.exp(x - m));
  const s = exps.reduce((a, b) => a + b, 0) || 1;
  return exps.map((e) => e / s);
}
function entropy(counts: Map<string, number>) {
  const total = [...counts.values()].reduce((a, b) => a + b, 0) || 1;
  let h = 0;
  for (const c of counts.values()) {
    const p = c / total;
    if (p > 0) h += -p * Math.log2(p);
  }
  return h;
}

type PickOpts = { topK?: number; marginCutoff?: number; minCoverage?: number };

export function pickLastQuestion(params: {
  answers: AnswerMap;
  questions: QuestionSpec[];   // 既存の質問定義から必要キーを抽出して渡す
  candidates: Scored[];        // 一次スコア済み上位候補
  options?: PickOpts;
}) {
  const { answers, questions, candidates, options } = params;
  const opt: Required<PickOpts> = {
    topK: options?.topK ?? 10,
    marginCutoff: options?.marginCutoff ?? 0.12,
    minCoverage: options?.minCoverage ?? 0.6,
  };

  if (!candidates.length) return { question: null, margin: 1, reason: 'no candidates', entropyByKey: {} as Record<string, number> };

  const top = candidates.slice().sort((a, b) => b.score - a.score).slice(0, opt.topK);
  const probs = softmax(top.map((c) => c.score));
  const margin = probs.length >= 2 ? probs[0] - probs[1] : 1;

  // 十分確信があるときは質問しない
  if (margin >= opt.marginCutoff) return { question: null, margin, reason: 'confident', entropyByKey: {} as Record<string, number> };

  // 未回答の推奨属性のみ対象
  const unanswered = new Set(
    questions.filter(q => answers[q.key] === undefined).map(q => q.key)
  );

  const entropyByKey: Record<string, number> = {};
  let best: { q: QuestionSpec; eff: number; why: string } | null = null;

  for (const q of questions) {
    if (!unanswered.has(q.key)) continue;

    let withValue = 0;
    const counts = new Map<string, number>();
    for (const c of top) {
      const v = c.product.attrs[q.key];
      if (v !== undefined && v !== null) {
        withValue++;
        const k = String(v);
        counts.set(k, (counts.get(k) ?? 0) + 1);
      }
    }
    const coverage = withValue / top.length;
    if (coverage < opt.minCoverage) continue;

    const h = entropy(counts);
    entropyByKey[q.key] = h;
    const eff = h * (q.weight ?? 1);

    if (!best || eff > best.eff) {
      best = { q, eff, why: `entropy=${h.toFixed(2)} coverage=${Math.round(coverage*100)}%` };
    }
  }

  if (!best) return { question: null, margin, reason: 'no effective key', entropyByKey };

  return { question: best.q, margin, reason: best.why, entropyByKey };
} 