import { readBudgetMaxJPY, splitByBudget } from './budget';

type Scored<T = any> = { product: T; score: number };
type AnswersLike = Record<string, any>;

/** scoredItems を予算でフィルタし、必要時のみ予算外にフォールバック */
export function applyBudget<T extends { id?: string; price?: number | string | null; mall?: string }>(
  scoredItems: Scored<T>[],
  answers: AnswersLike,
  tol = 0.0 // 例: 0.05 (5%) まで超過許容
) {
  const budgetMax = readBudgetMaxJPY(answers);
  if (typeof budgetMax !== 'number') {
    return { items: scoredItems, usedBudgetFallback: false };
  }

  const { inBudget, outBudget } = splitByBudget(
    scoredItems.map(s => ({ id: s.product?.id || '', price: s.product?.price, mall: s.product?.mall })),
    budgetMax,
    tol
  );

  if (inBudget.length > 0) return { items: inBudget, usedBudgetFallback: false };
  return { items: outBudget, usedBudgetFallback: true };
} 