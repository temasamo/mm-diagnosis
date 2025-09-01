// 価格バンド定義（必要に応じて境界を調整）
export type PriceBandId = 'lt3k' | '3k-6k' | '6k-10k' | '10k-20k' | '20k+';

export const PRICE_BANDS: { id: PriceBandId; min: number; max: number }[] = [
  { id: 'lt3k',    min: 0,     max: 2999 },
  { id: '3k-6k',   min: 3000,  max: 5999 },
  { id: '6k-10k',  min: 6000,  max: 9999 },
  { id: '10k-20k', min: 10000, max: 19999 },
  { id: '20k+',    min: 20000, max: Number.POSITIVE_INFINITY },
];

export function parsePriceJpy(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return Math.round(v);
  if (typeof v === 'string') {
    const n = Number(v.replace(/[^\d]/g, ''));
    return Number.isFinite(n) ? Math.round(n) : null;
  }
  return null;
}

export function priceToBandId(price: number): PriceBandId {
  const b = PRICE_BANDS.find(b => price >= b.min && price <= b.max);
  return (b?.id ?? '20k+') as PriceBandId;
}

export function bandIndex(id: PriceBandId): number {
  return PRICE_BANDS.findIndex(b => b.id === id);
}

export function bandDistance(a: PriceBandId, b: PriceBandId): number {
  return Math.abs(bandIndex(a) - bandIndex(b));
}

export function budgetRelation(a: PriceBandId, b: PriceBandId): 'within' | 'lower' | 'higher' {
  const ai = bandIndex(a), bi = bandIndex(b);
  if (ai === bi) return 'within';
  return ai < bi ? 'lower' : 'higher';
} 