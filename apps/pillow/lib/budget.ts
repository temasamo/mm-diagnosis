export type BudgetBand = {
  id: 'lt3k' | '3k-6k' | '6k-10k' | '10k-20k' | '20k+';
  label: string;
  min: number;
  max: number; // Infinity 可
};

export const ALL_BANDS: BudgetBand[] = [
  { id: 'lt3k',    label: '〜¥3,000',         min: 0,     max: 3000 },
  { id: '3k-6k',   label: '¥3,000–¥6,000',    min: 3000,  max: 6000 },
  { id: '6k-10k',  label: '¥6,000–¥10,000',   min: 6000,  max: 10000 },
  { id: '10k-20k', label: '¥10,000–¥20,000',  min: 10000, max: 20000 },
  { id: '20k+',    label: '¥20,000〜',        min: 20000, max: Number.POSITIVE_INFINITY },
];

export const toBudgetBand = (priceYen: number): BudgetBand => {
  if (!Number.isFinite(priceYen)) return ALL_BANDS[0];
  return ALL_BANDS.find(b => priceYen >= b.min && priceYen < b.max) ?? ALL_BANDS[0];
};

export const toPriceRange = (bandId: BudgetBand['id']): { min: number; max: number } => {
  const b = ALL_BANDS.find(b => b.id === bandId);
  if (!b) throw new Error(`Unknown band: ${bandId}`);
  return { min: b.min, max: b.max };
};

export const neighborBand = (
  bandId: BudgetBand['id'],
  dir: 'upper' | 'lower',
): BudgetBand | undefined => {
  const idx = ALL_BANDS.findIndex(b => b.id === bandId);
  if (idx < 0) return;
  return dir === 'upper' ? ALL_BANDS[idx + 1] : ALL_BANDS[idx - 1];
};

// 既存の関数との互換性のために残す
export function getBandById(bandId: string): { min: number; max: number } | null {
  const band = ALL_BANDS.find(b => b.id === bandId);
  return band ? { min: band.min, max: band.max } : null;
}

export function migrateBudget(budgetId: string): string {
  const migration: Record<string, string> = {
    "lt5k": "3k-6k",
    "5k-15k": "6k-10k",
    "15k-30k": "10k-20k",
    "30k+": "20k+",
    "lt3000": "lt3k",
    "20kplus": "20k+",
  };
  return migration[budgetId] || budgetId;
}

export function inBand(price: number, band: { min: number; max: number }): boolean {
  return price >= band.min && price <= band.max;
}
