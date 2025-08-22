export type ProductLike = {
  id: string;
  price?: number | string | null;  // アダプタから来る値を全部受ける
  mall?: 'rakuten' | 'yahoo' | string;
};

export type AnswersLike = Record<string, any>;

export type BudgetRange = { min: number | null; max: number | null };

/** 予算下限・上限（円）を回答から読み取る
 * 優先キー:
 *  - 数値: answers.priceMin / answers.priceMax もしくは answers.budgetMin / answers.budgetMax
 *  - 区分: answers.budget in ['low','mid','high','premium']
 *     low:    [0, 4000]
 *     mid:    [0, 9000]
 *     high:   [0, 16000]
 *     premium:[16000, null] // 上限なし
 */
export function readBudgetRangeJPY(ans: AnswersLike): BudgetRange {
  const rawMin = ans.priceMin ?? ans.budgetMin ?? null;
  const rawMax = ans.priceMax ?? ans.budgetMax ?? null;

  const minNum = rawMin != null ? Number(rawMin) : null;
  const maxNum = rawMax != null ? Number(rawMax) : null;

  const hasMinNum = typeof minNum === 'number' && Number.isFinite(minNum) && minNum >= 0;
  const hasMaxNum = typeof maxNum === 'number' && Number.isFinite(maxNum) && maxNum >= 0;

  if (hasMinNum || hasMaxNum) {
    return {
      min: hasMinNum ? Math.round(minNum!) : 0,
      max: hasMaxNum ? Math.round(maxNum!) : null,
    };
  }

  // 区分
  const key = String(ans.budget ?? '').toLowerCase();
  switch (key) {
    case 'low':     return { min: 0,     max: 4000 };
    case 'mid':     return { min: 0,     max: 9000 };
    case 'high':    return { min: 0,     max: 16000 };
    case 'premium': return { min: 16000, max: null };
    default:        return { min: null,  max: null }; // 予算指定なし
  }
}

/** 文字列/undefinedを安全に数値化（円） */
export function normalizePriceJPY(raw: ProductLike['price']): number | null {
  if (raw == null) return null;
  const s = String(raw).replace(/[^\d.]/g, '');
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

/** 予算範囲で3分割。
 * tolBelow/tolAbove はゆるめ率（例: 0.05 で5%ゆるめ）
 */
export function splitByBudgetRange<T extends ProductLike>(
  items: T[],
  range: BudgetRange,
  tolBelow = 0.0,
  tolAbove = 0.0
) {
  const lowerLimit = typeof range.min === 'number'
    ? Math.max(0, Math.floor(range.min * (1 - tolBelow)))
    : 0;
  const upperLimit = typeof range.max === 'number'
    ? Math.ceil(range.max * (1 + tolAbove))
    : Number.POSITIVE_INFINITY;

  const inRange: T[] = [];
  const belowMin: T[] = [];
  const aboveMax: T[] = [];

  for (const it of items) {
    const p = normalizePriceJPY((it as any).price);
    if (p == null) { // 価格不明は範囲外扱い
      aboveMax.push(it);
      continue;
    }
    if (p < lowerLimit) belowMin.push(it);
    else if (p > upperLimit) aboveMax.push(it);
    else inRange.push(it);
  }
  return { inRange, belowMin, aboveMax, lowerLimit, upperLimit };
} 