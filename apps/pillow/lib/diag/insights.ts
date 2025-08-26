import type { DiagSnapshot } from '../../lib/state/diagStore';

const jp = {
  height: (v?: string) =>
    v === '標準' || v === '普通' ? 'ふつう' : v ?? '',
  softness: (v?: string) =>
    v === '標準' || v === '普通' ? 'ふつう' : v ?? '',
  material: (v?: string) => v ?? '',
};
const notSpecified = (v?: string) => !v || v === '指定なし' || v === '未選択';

export function makeComment(d: DiagSnapshot): string {
  const parts: string[] = [];
  if (!notSpecified(d.height))   parts.push(`高さは${jp.height(d.height)}`);
  if (!notSpecified(d.softness)) parts.push(`柔らかさは${jp.softness(d.softness)}`);
  if (!notSpecified(d.material)) parts.push(`素材は${jp.material(d.material)}`);

  return parts.length
    ? `あなたにおすすめの枕は「${parts.join('・')}」タイプです。`
    : '';
}

type Answers = Record<string, any>;

// Cセクションから悩み候補を横断的に拾う（値は value/label どちらでもOKに）
export function collectConcernsFromAnswers(ans: Answers): string[] {
  if (!ans) return [];

  // 候補キー（推測名も含めて広めに拾う）
  const pools: Array<[keyof Answers, string | ((v: any) => string[])]> = [
    // 例: 複数選択の配列
    ["neck_shoulder_issues", (v) => toLabels(v)],
    // 単一選択
    ["snore", (v) => v ? [`いびき：${toLabel(v)}`] : []],
    ["fatigue", (v) => v ? [`起床時の疲れ：${toLabel(v)}`] : []],
    ["heat_sweat", (v) => v != null ? [`暑がり・汗かき：${toLabelYesNo(v)}`] : []],
    // 別名・将来拡張（存在すれば拾う）
    ["jaw_pain", (v) => v ? [`顎や噛みしめ：${toLabel(v)}`] : []],
    ["shoulder_stiffness", (v) => v ? [`肩こり：${toLabel(v)}`] : []],
  ];

  const out: string[] = [];
  for (const [k, fn] of pools) {
    const val = (ans as any)[k];
    if (val === undefined || val === null || (Array.isArray(val) && val.length === 0)) continue;
    try { out.push(...(typeof fn === "function" ? fn(val) : [])); } catch {}
  }
  return dedupe(out).slice(0, 12);
}

function toLabels(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(toLabel).filter(Boolean) as string[];
  return [toLabel(v)].filter(Boolean) as string[];
}

function toLabel(v: any): string {
  // value/labelのどちらが来ても表示文字列にする
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object") return v.label ?? v.text ?? v.value ?? "";
  return String(v);
}

function toLabelYesNo(v: any): string {
  // true/false, "yes"/"no", "はい"/"いいえ" 等を正規化
  const s = typeof v === "string" ? v : (v ? "はい" : "いいえ");
  if (/^(true|はい|yes|y)$/i.test(s)) return "はい";
  if (/^(false|いいえ|no|n)$/i.test(s)) return "いいえ";
  return s;
}

function dedupe<T>(arr: T[]): T[] {
  return Array.from(new Set(arr.filter(Boolean)));
}

export function makeProblems(d: DiagSnapshot | Answers): string[] {
  try {
    // DiagSnapshot の場合
    if ('problems' in d) {
      const base = d.problems ? Array.from(new Set(d.problems.filter(Boolean))) : [];
      const fromAnswers = collectConcernsFromAnswers(d as any);
      const merged = dedupe([...(base ?? []), ...fromAnswers]) as string[];
      return merged.length > 0 ? merged : ["現在の枕に関する不満をお聞かせください"];
    }
    
    // Answers の場合
    const fromAnswers = collectConcernsFromAnswers(d);
    return fromAnswers.length > 0 ? fromAnswers : ["現在の枕に関する不満をお聞かせください"];
  } catch {
    return ["現在の枕に関する不満をお聞かせください"];
  }
} 