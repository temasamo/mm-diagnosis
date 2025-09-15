// いったん橋渡しファイル(互換のため残す運用でOK)
export * from '../../../lib/budget';

// 旧コードで使われている互換関数があるので薄いシムを置くと楽です
import { ALL_BANDS, type BudgetBand } from '../../../lib/budget';

export const buildBudgetMeta = (id: BudgetBand['id']) => {
  const b = ALL_BANDS.find(x => x.id === id);
  if (!b) return { id, label: id, min: 0, max: 0 };
  return { id: b.id, label: b.label, min: b.min, max: b.max };
};

// 既存の互換性のために残す
export const BANDS = ALL_BANDS;
export const bandIndexOf = (key: BudgetBand['id']): number => {
  return Math.max(0, ALL_BANDS.findIndex(b => b.id === key));
};
export type BudgetBandKey = BudgetBand['id'];
