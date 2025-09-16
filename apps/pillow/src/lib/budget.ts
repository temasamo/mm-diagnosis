export type BudgetBand = { id: string; min: number; max: number | null };

export const BANDS: BudgetBand[] = [
  { id: "<3000",   min: 0,     max: 2999 },
  { id: "3k-6k",   min: 3000,  max: 5999 },
  { id: "6k-10k",  min: 6000,  max: 9999 },
  { id: "10k-20k", min: 10000, max: 19999 },
  { id: ">=20k",   min: 20000, max: null },
];

export function toBandId(price: number): string | null {
  const b = BANDS.find(b => price >= b.min && (b.max === null || price <= b.max));
  return b?.id ?? null;
}

export function findBandById(id: string): BudgetBand | null {
  return BANDS.find(b => b.id === id) ?? null;
}

export function adjacentFor30Plus30(primary: BudgetBand): BudgetBand | null {
  const idx = BANDS.findIndex(b => b.id === primary.id);
  if (idx < 0) return null;
  return primary.min >= 20000
    ? (idx > 0 ? BANDS[idx - 1] : null)           // ≥20k は下位を補完
    : (idx < BANDS.length - 1 ? BANDS[idx + 1] : null); // それ以外は上位を補完
}
