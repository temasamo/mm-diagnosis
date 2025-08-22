import type { CategoryId } from "../scoring/config";

/**
 * 各カテゴリで使う検索語。まず primary を順に試し、足りなければ fallback。
 * tags は簡易スコアリング用（タイトルに含むものを優先）。
 */
export type QuerySpec = {
  primary: string[];
  fallback?: string[];
  tags?: string[];
};

export const CATEGORY_QUERIES: Record<CategoryId, QuerySpec> = {
  "low-loft":        { primary: ["枕 低い", "低め 枕"], fallback: ["薄い 枕", "フラット 枕"] },
  "mid-loft":        { primary: ["枕 高さ 普通", "標準 高さ 枕"] },
  "high-loft":       { primary: ["枕 高め", "ハイ 枕"] },
  "side-contour":    { primary: ["横向き 枕", "波型 枕"], tags: ["サイド高", "横向き"] },
  "back-contour":    { primary: ["頸椎 枕", "首 サポート 枕"], tags: ["仰向け", "頸椎"] },
  "adjustable":      { primary: ["高さ 調整 枕", "中材 調整 枕"] },
  "cooling":         { primary: ["冷感 枕", "接触冷感 枕"], tags: ["通気", "メッシュ", "冷感"] },
  "firm-support":    { primary: ["高反発 枕", "硬め 枕"] },
  "soft-plush":      { primary: ["低反発 枕", "ふわふわ 枕"] },
  "natural-fill":    { primary: ["そば殻 枕", "羽根 枕", "羽毛 枕"] },
};

/** 必要なら tags を AND 結合してクエリを増やす拡張も可能。今は primary をそのまま返す。 */
export function buildQueryWords(spec: QuerySpec): string[] {
  return spec.primary;
} 