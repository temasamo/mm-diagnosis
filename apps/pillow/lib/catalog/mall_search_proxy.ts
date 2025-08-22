import type { Mall, MallProduct } from "./mall_search";

/** 実アダプタが未実装の間、/api を叩いてモックを返す */
export function proxySearch(mall: Mall) {
  return async (q: string, limit = 6): Promise<MallProduct[]> => {
    const params = new URLSearchParams({ mall, q, limit: String(limit) });
    const res = await fetch(`/api/mall-products?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as MallProduct[];
  };
} 