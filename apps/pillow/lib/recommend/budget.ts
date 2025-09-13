export type BudgetBandKey = "lt3k" | "3k-6k" | "6k-10k" | "10k-20k" | "20k+";

export const BANDS: Array<{ key: BudgetBandKey; min: number; max: number }> = [
  { key: "lt3k",    min: 0,     max: 2999 },
  { key: "3k-6k",   min: 3000,  max: 5999 },
  { key: "6k-10k",  min: 6000,  max: 9999 },
  { key: "10k-20k", min: 10000, max: 19999 },
  { key: "20k+",    min: 20000, max: 999999 },
];

export type Budget = { min?: number; max?: number };

// 例: '3k-6k' / '5k-10k' / '10k-20k' / '20k+' / '50k+' / 'under-3k' / 'over-20k'
export function toBudgetRange(a: any): Budget | undefined {
  const raw = String(a?.budgetBand ?? a?.budget ?? '').trim();

  // '3k-6k'
  const m = raw.match(/^(\d+)k-(\d+)k$/i);
  if (m) return { min: +m[1] * 1000, max: +m[2] * 1000 };

  // '20k+' / '50k+'
  const plus = raw.match(/^(\d+)k\+$/i);
  if (plus) return { min: +plus[1] * 1000 };

  // 'under-3k'
  const under = raw.match(/^under-(\d+)k$/i);
  if (under) return { max: +under[1] * 1000 };

  // 'over-20k'
  const over = raw.match(/^over-(\d+)k$/i);
  if (over) return { min: +over[1] * 1000 };

  // 直接数値（min/max）を answers に持っている場合もケア
  const min = a?.budget?.min ?? a?.min;
  const max = a?.budget?.max ?? a?.max;
  if (min || max) return { min, max };

  return undefined;
}

export function bandIndexOf(key: BudgetBandKey): number {
  return Math.max(0, BANDS.findIndex(b => b.key === key));
}

export function bandIndexForPrice(price?: number): number | undefined {
  if (!price) return;
  const idx = BANDS.findIndex(b => price >= b.min && price <= b.max);
  return idx >= 0 ? idx : undefined;
}

export function buildBudgetMeta(userBand: BudgetBandKey, price?: number) {
  const uIdx = bandIndexOf(userBand);
  const pIdx = bandIndexForPrice(price);
  if (pIdx == null) {
    return { outOfBudget: false, withinAdjacency: true, productBandIndex: undefined };
  }
  const diff = Math.abs(pIdx - uIdx);
  return {
    outOfBudget: diff > 0,                 // ユーザ帯から外れていれば true
    withinAdjacency: diff <= 1,            // ±1レンジ以内か？
    productBandIndex: pIdx,
  };
}
