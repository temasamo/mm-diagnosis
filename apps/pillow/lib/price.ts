export function normalizePriceToNumber(n: unknown): number {
  if (typeof n === 'number') return Number.isFinite(n) ? n : 0;
  if (typeof n === 'string') {
    const m = n.replace(/[^\d.]/g, '');
    const v = Number(m);
    return Number.isFinite(v) ? v : 0;
  }
  return 0;
} 