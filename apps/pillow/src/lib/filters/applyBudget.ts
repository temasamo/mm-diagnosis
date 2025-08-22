import { readBudgetRangeJPY, splitByBudgetRange } from './budget';

type Scored<T = any> = { product: T; score: number };
type AnswersLike = Record<string, any>;

/** scoredItems を予算範囲でフィルタし、必要時のみ予算外にフォールバック */
export function applyBudgetRange<T extends { id?: string; price?: number | string | null; mall?: string }>(
  scoredItems: Scored<T>[],
  answers: AnswersLike,
  tolBelow = 0.0,
  tolAbove = 0.0
) {
  const range = readBudgetRangeJPY(answers);
  const noBudget =
    range.min == null && range.max == null;

  if (noBudget) {
    return { items: scoredItems, usedBudgetFallback: false, range };
  }

  // price を持つスコア付き配列で分割（並び順は維持）
  const { inRange, belowMin, aboveMax } = splitByBudgetRange(
    scoredItems.map(s => ({ id: s.product?.id || '', price: s.product?.price, mall: s.product?.mall })),
    range,
    tolBelow,
    tolAbove
  );

  if (inRange.length > 0) {
    return { items: inRange, usedBudgetFallback: false, range };
  }
  // 範囲内ゼロ → 予算外（下限未満 + 上限超え）でフォールバック
  return { items: [...belowMin, ...aboveMax], usedBudgetFallback: true, range };
} 