import type { Choice } from "./questionnaire";
import type { ProvisionalResult, FinalResult } from "./results";

/**
 * すごく簡易なスコアリング:
 * - 選択肢の weight を合計してカテゴリを割り当てるダミー実装
 */
export function scoreByChoices(selected: Array<Pick<Choice, "id" | "weight">>): ProvisionalResult {
  const total = selected.reduce((s, c) => s + (c.weight ?? 0), 0);
  const category =
    total <= 1 ? "soft" :
    total <= 3 ? "middle" : "hard";

  const confidence = Math.min(1, Math.max(0.3, total / 5)); // 適当な係数

  return {
    category,
    confidence,
    insight: {
      summary: `合計スコア ${total} → 推定カテゴリ: ${category}`,
      reasons: selected.map(c => `choice:${c.id} weight:${c.weight ?? 0}`)
    }
  };
}

export function finalizeResult(primaryIds: string[], secondaryIds: string[], reasons: string[]): FinalResult {
  return {
    primaryGroup: primaryIds,
    secondaryGroup: secondaryIds,
    reasons,
  };
}
