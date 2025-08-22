export type ProductLike = {
  id: string;
  price?: number | string | null;  // アダプタから来る値を全部受ける
  mall?: 'rakuten' | 'yahoo' | string;
};

export type AnswersLike = Record<string, any>;

/** 予算上限（円）を回答から読み取る。
 * どちらかを想定：
 * - 数値: answers.priceMax or answers.budgetMax（円）
 * - 区分: answers.budget in ['low','mid','high','premium']
 */
export function readBudgetMaxJPY(ans: AnswersLike): number | null {
  const n = Number(ans.priceMax ?? ans.budgetMax);
  if (!Number.isNaN(n) && n > 0) return Math.round(n);

  const TIER: Record<string, number | null> = {
    low: 4000,
    mid: 9000,
    high: 16000,
    premium: null, // 上限なし
  };
  const key = String(ans.budget ?? '').toLowerCase();
  const v = key in TIER ? TIER[key]! : null;
  return typeof v === 'number' ? v : null;
}

/** 文字列/undefinedを安全に数値化（円） */
export function normalizePriceJPY(raw: ProductLike['price']): number | null {
  if (raw == null) return null;
  const s = String(raw).replace(/[^\d.]/g, '');
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

/** 予算で2分割。tolは許容超過率(0.0=厳密) */
export function splitByBudget<T extends ProductLike>(
  items: T[],
  budgetMaxJPY: number,
  tol = 0.0
) {
  const limit = Math.round(budgetMaxJPY * (1 + tol));
  const inBudget: T[] = [];
  const outBudget: T[] = [];
  for (const it of items) {
    const p = normalizePriceJPY((it as any).price);
    if (p == null) {
      outBudget.push(it); // 価格不明は一旦「予算外」扱い
      continue;
    }
    (p <= limit ? inBudget : outBudget).push(it);
  }
  return { inBudget, outBudget };
} 