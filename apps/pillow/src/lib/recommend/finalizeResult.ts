import { asArray } from "../util/asArray";
import type { FinalResult } from "../../types/types";

// 理由付けタグを生成する関数
export function buildReasonTags(input: { postures: string[]; /* ... */ }) {
  const tags: string[] = [];
  if (input.postures?.includes('side'))   tags.push('横向き寝に合う形状');
  if (input.postures?.includes('supine')) tags.push('仰向け寝の首カーブ対応');
  if (input.postures?.includes('prone'))  tags.push('うつ伏せ派向け薄め/柔らかめ');
  return tags;
}

export function finalizeResult(answers: any): FinalResult {
  // 値の想定外を握りつぶさないガード（posturesフィールド対応）
  let postures = answers?.postures;
  if (!Array.isArray(postures) || postures.length === 0) {
    // 既存のsleepingPositionとの互換性
    const legacyPos = answers?.sleepingPosition;
    if (legacyPos === 'supine' || legacyPos === 'prone' || legacyPos === 'side') {
      postures = [legacyPos];
    } else {
      console.warn('[diagnosis] invalid postures/sleepingPosition', postures, legacyPos);
      postures = ['side']; // デフォルト
    }
  }
  
  // 理由付けタグを生成
  const reasonTags = buildReasonTags({ postures });

  // 既存のロジックを仮実装（実際の実装に合わせて調整が必要）
  const raw = {
    primaryGroup: "standard",
    secondaryGroup: "comfort",
    reasons: reasonTags, // 理由付けタグを使用
    insight: {
      summary: "適切な枕を選択",
      reasons: reasonTags // 理由付けタグを使用
    }
  };

  return {
    primaryGroup: asArray<string>(raw.primaryGroup),
    secondaryGroup: asArray<string>(raw.secondaryGroup),
    reasons: asArray<string>(raw.reasons),
    insight: raw.insight
      ? { summary: raw.insight.summary ?? "", reasons: asArray<string>(raw.insight.reasons) }
      : undefined,
  };
} 
// --- 追加：商品用の「理由文（最大4行）」を合成するユーティリティ ---
export type ProductReasonInput = {
  matched: { posture?: boolean; concern?: boolean; material?: boolean; washable?: boolean };
  notes?: string[];  // rank.ts からの why など
  priceBand?: string; // 表示用(任意)
};

export function buildProductReasons(input: ProductReasonInput): string[] {
  const out: string[] = [];
  if (input.matched.posture)  out.push("寝姿勢に合わせた高さ・形状で、負担をかけにくい構造です。");
  if (input.matched.concern)  out.push("お悩みに対応しやすいサポート（頸椎/面で支える 等）を備えています。");
  if (input.matched.material) out.push("好みに近い素材特性（反発/復元性/当たり）を選べます。");
  if (input.matched.washable) out.push("洗える仕様で清潔を保ちやすく、日々の手入れが簡単です。");
  for (const n of input.notes || []) {
    if (out.length >= 4) break;
    if (!out.includes(n)) out.push(n);
  }
  // 上限4行
  return out.slice(0, 4);
}
