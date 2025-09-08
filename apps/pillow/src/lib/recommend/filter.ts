// apps/pillow/src/lib/recommend/filter.ts
import type { Item, Mall, MallProduct } from "../../types/product";

const PLACEHOLDER_IMG = "/placeholder.png";
const ENABLED_MALLS: readonly Mall[] = ["rakuten", "yahoo"]; // amazonは承認後に追加

// ---- 除外フィルタ（素材/構造/ブランド/汎用NG） ----
export type BanFlags = {
  materialNg?: string[];
  structureNg?: string[];
  brandNg?: string[];
};

export function applyBanFilter(items: Item[], flags?: BanFlags): Item[] {
  if (!flags) return items;
  const mng = new Set((flags.materialNg ?? []).map(s => s.toLowerCase()));
  const sng = new Set((flags.structureNg ?? []).map(s => s.toLowerCase()));
  const bng = new Set((flags.brandNg ?? []).map(s => s.toLowerCase()));

  return items.filter(i => {
    const material = (i.material ?? "").toLowerCase();
    const structure = (i.structure ?? "").toLowerCase();
    const brand = (i.brand ?? "").toLowerCase();

    if (mng.size && mng.has(material)) return false;
    if (sng.size && sng.has(structure)) return false;
    if (bng.size && bng.has(brand)) return false;
    return true;
  });
}

// ---- mall を必須化する型ガード ----
export function hasValidMall(item: Item): item is Item & { mall: Mall } {
  return Boolean(item.mall && (ENABLED_MALLS as readonly Mall[]).includes(item.mall as Mall));
}

// ---- Item[] -> MallProduct[] 変換（null安全） ----
export function toMallProducts(items: Item[]): MallProduct[] {
  return items
    .filter(hasValidMall)
    .map<MallProduct>(i => ({
      id: i.id,
      title: i.title ?? "",
      image: i.image ?? PLACEHOLDER_IMG,
      url: i.url,
      price: i.price ?? 0,
      mall: i.mall!, // hasValidMallで保証済み
    }));
}
