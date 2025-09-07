// ===== 型はこの1箇所だけで定義する =====
export type MaterialKey = "lowRebound" | "highRebound" | "latex" | "pipe" | (string & {});
export type StructureKey = "contour" | "flat" | "water" | "gel" | (string & {});
export type BrandKey = string;

export type AvoidList = {
  materials?: MaterialKey[];
  structures?: StructureKey[];
  brands?: BrandKey[];
};

export type AnswersLite = {
  postures: ("side" | "supine" | "prone")[];
  concerns?: ("neck" | "shoulder" | "headache" | "snore")[];
  materialPref?: "lowRebound" | "highRebound" | "latex" | "pipe" | null;
  currentPillowMaterial?: string[];
  avoid?: AvoidList;
};

import type { SearchItem } from "../../../lib/malls/types";
import { buildReasonTags } from "./finalizeResult";

// 推薦グループのキー（最小セット）
export type GroupKey = "standard" | "comfort";

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

  return { postures, concerns, materialPref, avoid: input?.avoid };
}


// 正規化は既存の normalizeAnswers を利用して一本化
export function makeSignals(input: {
  postures: string[];
  concerns: string[];
  pillowMaterial: string[];
  avoid?: AvoidList;
}): AnswersLite {
  return normalizeAnswers({
    postures: input.postures,
    concerns: input.concerns,
    currentPillowMaterial: input.pillowMaterial,
    avoid: input.avoid,
  });
}

// 既存の AnswersLite / makeSignals がある前提。なければ既存の normalize 関数を利用。
// ここでは「重み」は掛けず、入力からグループ寄与の"有無"を抽出する。
export function deriveSignals(input: {
  postures?: string[];
  concerns?: string[];
  pillowMaterial?: string[];
  avoid?: AvoidList;
}) {
  const postures = Array.isArray(input?.postures) ? input!.postures! : [];
  const concerns = Array.isArray(input?.concerns) ? input!.concerns! : [];
  const materials = Array.isArray(input?.pillowMaterial) ? input!.pillowMaterial! : [];

  // グループ寄与の有無（ここでは論理値のみ）
  const hasPosture = postures.length > 0;
  const hasConcern = concerns.length > 0;
  const hasMaterial = materials.length > 0;

  // 「どのグループに寄与するか」の素点（重み未適用）
  // - 姿勢: standard に寄与
  // - 悩み: comfort に寄与
  // - 素材: standard に"わずかに"寄与（重みは rank.ts で適用）
  const base = {
    standard: (hasPosture ? 1 : 0) + (hasMaterial ? 1 : 0),
    comfort: hasConcern ? 1 : 0,
  } as Record<GroupKey, number>;

  return {
    postures,
    concerns,
    materials,
    base,                // 重み未適用スコア
    flags: {
      hasPosture,
      hasConcern,
      hasMaterial,
    },
    avoid: input.avoid,
  };
}

// UIでそのまま使える短い理由タグ（最大3つ）
export function buildReasons(input: { postures?: string[]; concerns?: string[]; avoid?: AvoidList }) {
  const tags = buildReasonTags({ postures: input.postures ?? [] }) ?? [];

  // 悩み→comfort寄与のラベルを最小追加（足りない分のみ）
  const c = new Set((input.concerns ?? []).map(String));
  if (c.has("stiff_shoulder") && !tags.some(t => /肩|肩こり/.test(t))) {
    tags.push("肩の負担を減らす形状");
  }
  if (c.has("headache") && !tags.some(t => /頭|圧/.test(t))) {
    tags.push("圧が分散しやすい構造");
  }
  if (c.has("straight_neck") && !tags.some(t => /頸椎|首/.test(t))) {
    tags.push("頸椎カーブを支えやすい");
  }

  // 避ける理由を追加（最大3つの上限内で）
  if (input.avoid?.materials?.includes("latex")) {
    tags.push("ラテックス素材を避けています");
  }
  if (input.avoid?.materials?.includes("feather")) {
    tags.push("羽毛素材を避けています");
  }
  if (input.avoid?.materials?.includes("pipe")) {
    tags.push("パイプ素材を避けています");
  }
  if (input.avoid?.structures?.includes("contour")) {
    tags.push("凹凸形状を避けています");
  }
  if (input.avoid?.brands && input.avoid.brands.length > 0) {
    tags.push(`${input.avoid.brands[0]}ブランドを避けています`);
  }

  // 重複除去して最大3件
  const uniq = Array.from(new Set(tags)).slice(0, 3);
  return uniq;
}
