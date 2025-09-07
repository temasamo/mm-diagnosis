import type { MaterialKey, StructureKey, BrandKey, AvoidList } from "./signals";

// モールの型定義
export type Mall = 'rakuten' | 'yahoo' | 'amazon';

// 商品アイテムの型（stub用）
export type Item = {
  id: string;
  title: string;
  price?: number | null;
  url: string;
  image?: string;
  material?: MaterialKey;
  structure?: StructureKey;
  brand?: BrandKey;
  
  // 後方互換性を保つため optional で追加
  mall?: Mall;
  adjustable?: boolean;
  breathable?: boolean;
  snoreSupport?: boolean;
  neckSupport?: boolean;
};

// ban（除外）フィルタを適用
export function applyBanFilter(items: Item[], avoid?: AvoidList): Item[] {
  if (!avoid) return items;
  
  const mats = new Set(avoid.materials ?? []);
  const strc = new Set(avoid.structures ?? []);
  const brds = new Set((avoid.brands ?? []).map(b => b.toLowerCase()));

  return items.filter(it => {
    if (it.material && mats.has(it.material)) return false;
    if (it.structure && strc.has(it.structure)) return false;
    if (it.brand && it.brand.toLowerCase() && brds.has(it.brand.toLowerCase())) return false;
    return true;
  });
}
