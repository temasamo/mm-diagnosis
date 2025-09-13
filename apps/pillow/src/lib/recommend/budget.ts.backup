export type BudgetBandKey = "lt3k" | "3k-6k" | "6k-10k" | "10k-20k" | "20k+";

export const BANDS: Array<{ key: BudgetBandKey; min: number; max: number }> = [
  { key: "lt3k",    min: 0,     max: 2999 },
  { key: "3k-6k",   min: 3000,  max: 5999 },
  { key: "6k-10k",  min: 6000,  max: 9999 },
  { key: "10k-20k", min: 10000, max: 19999 },
  { key: "20k+",    min: 20000, max: 999999 },
];

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