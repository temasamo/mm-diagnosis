export function normalizePriceToNumber(n: unknown): number {
  if (typeof n === 'number') return Number.isFinite(n) ? n : 0;
  if (typeof n === 'string') {
    const m = n.replace(/[^\d.]/g, '');
    const v = Number(m);
    return Number.isFinite(v) ? v : 0;
  }
  return 0;
}

export function priceDistanceToBand(
  price: number | null | undefined,
  band: { min: number; max: number }
) {
  if (price == null || Number.isNaN(price)) return Number.POSITIVE_INFINITY;
  if (price < band.min) return band.min - price; // いくら足りないか
  if (price > band.max) return price - band.max; // いくら超えているか
  return 0; // 予算内
} 