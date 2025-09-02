import { asArray } from "../util/asArray";
import type { FinalResult } from "../../types/types";

export function finalizeResult(answers: any): FinalResult {
  // 既存のロジックを仮実装（実際の実装に合わせて調整が必要）
  const raw = {
    primaryGroup: "standard",
    secondaryGroup: "comfort",
    reasons: "good support",
    insight: {
      summary: "適切な枕を選択",
      reasons: "姿勢改善"
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