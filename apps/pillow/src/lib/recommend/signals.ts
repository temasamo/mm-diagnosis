// ===== 型はこの1箇所だけで定義する =====
export type AnswersLite = {
  postures: ("side" | "supine" | "prone")[];
  concerns?: ("neck" | "shoulder" | "headache" | "snore")[];
  materialPref?: "lowRebound" | "highRebound" | "latex" | "pipe" | null;
  currentPillowMaterial?: string[];
};
import type { SearchItem } from "../../../lib/malls/types";

export type ItemSignals = {
  postures: { side: boolean; supine: boolean; prone: boolean };
  concerns: {
    neck: boolean; shoulder: boolean; headache: boolean; snore: boolean;
  };
  materials: {
    lowRebound: boolean; highRebound: boolean; latex: boolean; pipe: boolean;
  };
  washable: boolean;
};

const JP = (s: string) => (s || "").toLowerCase();

export function extractSignals(item: SearchItem): ItemSignals {
  const t = JP(item.title || "");
  const u = JP(item.url || "");
  const s = JP(item.shop || "");
  const hay = `${t} ${u} ${s}`;

  const postures = {
    side:   /(横向き|サイド|side)/.test(hay),
    supine: /(仰向け|あおむけ|supine|背面)/.test(hay),
    prone:  /(うつ伏せ|俯せ|prone)/.test(hay),
  };
  const concerns = {
    neck:     /(首|頸椎|ストレートネック)/.test(hay),
    shoulder: /(肩|肩こり)/.test(hay),
    headache: /(頭痛)/.test(hay),
    snore:    /(いびき|気道|無呼吸)/.test(hay),
  };
  const materials = {
    lowRebound: /(低反発|memory foam|lr)/.test(hay),
    highRebound:/(高反発|hr)/.test(hay),
    latex:      /(ラテックス|latex)/.test(hay),
    pipe:       /(パイプ|ビーズ|polyethylene)/.test(hay),
  };
  const washable = /(洗える|ウォッシャブル|丸洗い|洗濯)/.test(hay);

  return { postures, concerns, materials, washable };
}


export function normalizeAnswers(input: any): AnswersLite {
  let postures = Array.isArray(input?.postures) ? input.postures : [];
  if (postures.length === 0 && typeof input?.sleepingPosition === "string") {
    const p = input.sleepingPosition;
    if (p === "side" || p === "supine" || p === "prone") postures = [p];
  }
  if (postures.length === 0) postures = ["side"];

  const materialPref = ((): AnswersLite["materialPref"] => {
    const m = (Array.isArray(input?.currentPillowMaterial) ? (input.currentPillowMaterial[0] || "") : (input?.currentPillowMaterial || input?.materialPref || "")).toLowerCase();
    if (/低反発|memory|lr/.test(m)) return "lowRebound";
    if (/高反発|hr/.test(m))       return "highRebound";
    if (/latex|ラテックス/.test(m))return "latex";
    if (/pipe|パイプ/.test(m))     return "pipe";
    return null;
  })();

  const concerns = (input?.concerns || []).map((c: string) => {
    if (/neck|stneck|straight/.test(c)) return "neck";
    if (/shoulder/.test(c)) return "shoulder";
    if (/headache/.test(c)) return "headache";
    if (/snore/.test(c)) return "snore";
    return null;
  }).filter(Boolean) as AnswersLite["concerns"];

  return { postures, concerns, materialPref };
}


// 正規化は既存の normalizeAnswers を利用して一本化
export function makeSignals(input: {
  postures: string[];
  concerns: string[];
  pillowMaterial: string[];
}): AnswersLite {
  return normalizeAnswers({
    postures: input.postures,
    concerns: input.concerns,
    currentPillowMaterial: input.pillowMaterial,
  });
}
