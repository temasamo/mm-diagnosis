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