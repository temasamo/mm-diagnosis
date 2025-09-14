// 既存の band 型/定数をインポート（重複定義しないこと）
import { BudgetBandKey, BANDS } from '@/lib/recommend/budget';

// BAND_ORDER を BANDS から生成
export const BAND_ORDER: BudgetBandKey[] = BANDS.map(b => b.key);

type PickParams = {
  desired?: BudgetBandKey | null;  // ユーザー希望帯（既存ロジックから渡す）
};

export function pickBands({ desired }: PickParams): BudgetBandKey[] {
  // 未指定 → すべて（互換維持）
  if (!desired) return BAND_ORDER;

  const idx = BAND_ORDER.indexOf(desired);
  if (idx < 0) return BAND_ORDER;

  // 20k+ の場合は 1 つ下も
  if (desired === '20k+') {
    const down = BAND_ORDER[idx - 1];
    return down ? [desired, down] : [desired];
  }

  // それ以外: 希望＋1つ上
  const up = BAND_ORDER[idx + 1];
  return up ? [desired, up] : [desired];
}
