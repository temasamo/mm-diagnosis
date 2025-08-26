import { searchRakuten } from "../malls/rakuten";
import { searchYahoo } from "../malls/yahoo";
import { priceInRange, getItemPrice } from "./price";

// ふるさと除外
function isFurusato(item: any) {
  const t = `${item?.title ?? ""} ${item?.shopName ?? ""} ${item?.link ?? item?.url ?? ""}`;
  return /(ふるさと|納税|furusato|返礼品)/i.test(t);
}

export async function searchCross(opts: {
  queries: string[];
  minPrice?: number;
  maxPrice?: number;
  excludeFurusato?: boolean;
  countOnly?: boolean;
}) {
  const { queries, minPrice, maxPrice, excludeFurusato, countOnly } = opts;

  const [rk, yh] = await Promise.allSettled([
    searchRakuten({ queries, minPrice, maxPrice }),
    searchYahoo({ queries, minPrice, maxPrice }),
  ]);

  const rkItems = rk.status === "fulfilled" ? rk.value.items ?? [] : [];
  const yhItems = yh.status === "fulfilled" ? yh.value.items ?? [] : [];
  const merged = [...rkItems, ...yhItems];

  // ① API後（サーバ側）で念のため**最終価格フィルタ**
  const afterPrice = (typeof minPrice === "number" || typeof maxPrice === "number")
    ? merged.filter((it) => priceInRange(getItemPrice(it), minPrice, maxPrice))
    : merged;

  // ② ふるさと除外
  const afterMall = excludeFurusato ? afterPrice.filter((it) => !isFurusato(it)) : afterPrice;

  // ★ 見えるログ
  console.groupCollapsed("[searchCross] queries & band", { queries, minPrice, maxPrice });
  console.log("rakuten:", rkItems.length, "yahoo:", yhItems.length, "merged:", merged.length);
  console.log("after price:", afterPrice.length, "after furusato:", afterMall.length);
  console.groupEnd();

  if (countOnly) return { total: afterMall.length };
  return { items: afterMall };
} 