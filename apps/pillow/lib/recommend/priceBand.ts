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

// 新しい価格レンジユーティリティ
export type BudgetBandId = 'u5k' | '5-10k' | '10-20k' | '20kplus';

export const PRICE_BANDS: Array<{ id: BudgetBandId; min: number; max: number }> = [
  { id: 'u5k', min: 0, max: 5000 },
  { id: '5-10k', min: 5000, max: 10000 },
  { id: '10-20k', min: 10000, max: 20000 },
  { id: '20kplus', min: 20000, max: Number.POSITIVE_INFINITY },
];

export function bandOf(price: number): BudgetBandId {
  for (const b of PRICE_BANDS) {
    if (price >= b.min && price < b.max) return b.id;
  }
  return '20kplus';
}

export function neighborsOf(id: BudgetBandId, n = 1): BudgetBandId[] {
  const idx = PRICE_BANDS.findIndex(b => b.id === id);
  const out: BudgetBandId[] = [];
  for (let d = 1; d <= n; d++) {
    const left = PRICE_BANDS[idx - d];
    const right = PRICE_BANDS[idx + d];
    if (left) out.push(left.id);
    if (right) out.push(right.id);
  }
  return out;
}

/**
 * 予算レンジでフィルタ。20k+ のときは 1万円未満を除外しつつ、
 * 近傍は 10-20k のみに制限（5-10k は含めない）する。
 */
export function inAllowedBands(
  price: number,
  budget: BudgetBandId,
  opts: { includeNeighbors?: boolean } = {}
): boolean {
  const b = bandOf(price);
  if (b === budget) return true;

  if (!opts.includeNeighbors) return false;

  // 20k+ は下に広げる場合でも 10-20k まで。1万円未満は除外。
  if (budget === '20kplus') {
    if (price < 10000) return false;
    return b === '10-20k'; // 5-10k を許容しない
  }

  // それ以外の帯は ±1 まで許容
  return neighborsOf(budget, 1).includes(b);
}

// === 新しい価格帯ユーティリティ（共通化） ===
export type BandId = "5-10k"|"10-20k"|"20kplus"|"30kplus"
export type Range = { min?: number; max?: number }

export const toRange = (band: BandId): Range => {
  switch (band) {
    case "5-10k":   return { min: 5000,  max: 10000 }
    case "10-20k":  return { min: 10000, max: 20000 }
    case "20kplus": return { min: 20000 }
    case "30kplus": return { min: 30000 }
  }
}

export const inBand = (price: number, band: BandId) => {
  const {min, max} = toRange(band)
  if (min != null && price < min) return false
  if (max != null && price > max) return false
  return true
}

// 近傍レンジ（±n, 必要なら自身含む）を返す
export const neighbors = (
  band: BandId,
  opts: { includeSelf?: boolean; maxDistance?: 1|2 } = {}
): BandId[] => {
  const seq: BandId[] = ["5-10k","10-20k","20kplus","30kplus"]
  const i = seq.indexOf(band)
  const around = new Set<BandId>()
  const dist = opts.maxDistance ?? 1
  if (opts.includeSelf) around.add(seq[i]!)
  for (let d=1; d<=dist; d++){
    if (seq[i-d]) around.add(seq[i-d] as BandId)
    if (seq[i+d]) around.add(seq[i+d] as BandId)
  }
  return Array.from(around)
}

// price が許容近傍か
export const inAllowedBandsNew = (price: number, allowed: BandId[]) =>
  allowed.some(b => inBand(price, b)) 