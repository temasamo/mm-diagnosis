export type BudgetBand = {
  min: number;
  max: number;
};

const BUDGET_BANDS: Record<string, BudgetBand> = {
  "lt5k": { min: 0, max: 5000 },
  "5k-15k": { min: 5000, max: 15000 },
  "15k-30k": { min: 15000, max: 30000 },
  "30k+": { min: 30000, max: Infinity }
};

export function getBandById(bandId: string): BudgetBand | null {
  return BUDGET_BANDS[bandId] || null;
}

export function inBand(price: number, band: BudgetBand): boolean {
  return price >= band.min && price <= band.max;
} 