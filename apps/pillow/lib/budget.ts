export type BudgetBand = {
  min: number;
  max: number;
};

const BUDGET_BANDS: Record<string, BudgetBand> = {
  "lt3000": { min: 0, max: 3000 },
  "3k-6k": { min: 3000, max: 6000 },
  "6k-10k": { min: 6000, max: 10000 },
  "10k-20k": { min: 10000, max: 20000 },
  "20kplus": { min: 20000, max: Infinity }
};

// 古い予算選択肢を新しい選択肢にマッピング
const BUDGET_MIGRATION: Record<string, string> = {
  "lt5k": "3k-6k",      // 〜5,000円 → 3,000円〜6,000円
  "5k-15k": "6k-10k",   // 5,000〜15,000円 → 6,000円〜10,000円未満
  "15k-30k": "10k-20k", // 15,000〜30,000円 → 10,000円〜20,000円未満
  "30k+": "20kplus",    // 30,000円以上 → 20,000円以上
};

export function getBandById(bandId: string): BudgetBand | null {
  return BUDGET_BANDS[bandId] || null;
}

export function migrateBudget(budgetId: string): string {
  return BUDGET_MIGRATION[budgetId] || budgetId;
}

export function inBand(price: number, band: BudgetBand): boolean {
  return price >= band.min && price <= band.max;
} 