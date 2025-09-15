import type { BudgetBand } from '../budget';

export type Mall = 'rakuten' | 'yahoo';

export type BandDistance = -1 | 0 | 1;

export type SearchItem = {
  id: string;          // オリジンの一意キー（itemCode 等）
  mall: Mall;
  title: string;
  url: string;
  image: string | null;
  price: number;       // 数値化済み
  shop?: string | null;
  bandId?: BudgetBand['id'];    // 価格帯ID
  bandDistance?: BandDistance;  // 基準バンドからの距離（-1=下位, 0=同じ, 1=上位）
};
