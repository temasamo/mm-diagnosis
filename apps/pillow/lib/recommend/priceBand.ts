export type PriceBand = "U10" | "U20" | "O20"; // 1万未満 / 1-2万 / 2万以上

export function bandToMinMax(band: PriceBand) {
  switch (band) {
    case "U10": return { min: 0,     max: 9999 };
    case "U20": return { min: 10000, max: 19999 };
    case "O20": return { min: 20000, max: undefined }; // 上限なし
  }
}

export function withinBand(price?: number, band?: PriceBand) {
  if (price == null || band == null) return true;
  const {min, max} = bandToMinMax(band);
  if (min != null && price < min) return false;
  if (max != null && price > max) return false;
  return true;
}

// 既存のbudget.tsとの互換性のための変換関数
export function budgetBandToPriceBand(budgetBandId: string): PriceBand | null {
  const mapping: Record<string, PriceBand> = {
    "lt3000": "U10",
    "3k-6k": "U10", 
    "6k-10k": "U10",
    "10k-20k": "U20",
    "20kplus": "O20"
  };
  return mapping[budgetBandId] || null;
} 