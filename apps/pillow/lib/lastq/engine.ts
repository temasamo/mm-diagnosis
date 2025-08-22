import type { Provisional } from "../scoring/engine";
import { computeProvisional } from "../scoring/engine";

/** 上位2カテゴリの差が閾値以下なら「最後の質問」を出す */
// しきい値をデフォルト 0.2 に引き上げ（出やすく）
export function needLastQuestion(provisional: Provisional[], threshold = 0.2) {
  if (provisional.length < 2) return false;
  return (provisional[0].score - provisional[1].score) < threshold;
}

export type LastQuestion =
  | { id: "side_ratio"; title: "横向きの割合は？"; choices: {id:string;label:string;delta:{side:number;back:number}}[] }
  | { id: "room_hot"; title: "寝室は暑い？（夏場の体感）"; choices: {id:string;label:string;delta:{cooling:number}}[] };

export function pickLastQuestion(provisional: Provisional[]): LastQuestion | null {
  if (!Array.isArray(provisional) || provisional.length === 0) return null;
  // テスト用：needLastQuestion が false でも最低1問は出すフォールバック
  const forceAsk = process.env.NEXT_PUBLIC_LASTQ_FORCE === "1";
  if (!needLastQuestion(provisional) && !forceAsk) return null;
  const top2 = provisional.slice(0,2).map(p => p.category);
  // 競ってるのが side-contour vs back-contour なら「横向き割合」
  if (top2.includes("side-contour" as any) && top2.includes("back-contour" as any)) {
    return {
      id: "side_ratio",
      title: "横向きの割合は？",
      choices: [
        { id: "low",  label: "ほとんど横向きにならない",     delta: { side: -0.08, back: +0.08 } },
        { id: "mid",  label: "半々くらい",                   delta: { side: +0.00, back: +0.00 } },
        { id: "high", label: "横向きが多い/ほぼ横向き",       delta: { side: +0.10, back: -0.05 } },
      ]
    };
  }
  // cooling が絡む競合（cooling vs その他）なら室温の質問
  if (top2.includes("cooling" as any)) {
    return {
      id: "room_hot",
      title: "寝室は暑い？（夏場の体感）",
      choices: [
        { id: "no",   label: "特に暑くない",  delta: { cooling: -0.08 } },
        { id: "some", label: "少し暑い",      delta: { cooling: +0.02 } },
        { id: "yes",  label: "とても暑い",    delta: { cooling: +0.10 } },
      ]
    };
  }
  return null;
}

/** 回答を provisional に反映（再計算せず差分ブーストだけ与える簡易版） */
export function applyLastAnswer(
  provisional: Provisional[],
  lastq: LastQuestion,
  choiceId: string
): Provisional[] {
  const choice = lastq.choices.find(c => c.id === choiceId);
  if (!choice) return provisional;
  const delta = choice.delta as any;
  const out = provisional.map(p => {
    let add = 0;
    if (lastq.id === "side_ratio") {
      if (p.category === "side-contour") add += (delta.side ?? 0);
      if (p.category === "back-contour") add += (delta.back ?? 0);
    }
    if (lastq.id === "room_hot") {
      if (p.category === "cooling") add += (delta.cooling ?? 0);
    }
    return { ...p, score: Math.max(0, Math.min(1, p.score + add)) };
  });
  // 再正規化
  const max = Math.max(0.001, ...out.map(o => o.score));
  return out
    .map(o => ({ ...o, score: o.score / max }))
    .sort((a,b) => b.score - a.score);
} 