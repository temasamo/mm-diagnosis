import { parsePriceJpy, priceToBandId, type PriceBandId } from './priceBand';

export type PriceInfo = {
  value?: number;          // 数値(円)
  display?: string;        // "¥8,800" など
  source?: string;         // どのフィールドから取ったか
};

const YEN = (n: number) => "¥" + n.toLocaleString();

function pickNumber(x: any): number | undefined {
  if (x == null) return;
  if (typeof x === "number" && isFinite(x)) return x;
  if (typeof x === "string") {
    // 1) "¥8,800" / "8,800円" / "8800"
    const m = x.replace(/\s/g, "").match(/([0-9][0-9,]{2,7})/);
    if (m) {
      const n = parseInt(m[1].replace(/,/g, ""), 10);
      if (isFinite(n)) return n;
    }
  }
}

export function extractPriceInfo(p: any): PriceInfo {
  // よくある候補を総当たり（順序は信頼度順）
  const candidates: Array<[string, any]> = [
    ["price", p?.price],
    ["price_value", p?.price_value],
    ["itemPrice", p?.itemPrice],
    ["min_price", p?.min_price],
    ["max_price", p?.max_price],
    ["offer.price", p?.offer?.price],
    ["rakuten.price", p?.rakuten?.price],
    ["yahoo.price", p?.yahoo?.price],
    ["amazon.price", p?.amazon?.price],
    ["priceText", p?.priceText],
    ["raw.price", p?.raw?.price],
    ["raw.priceText", p?.raw?.priceText],
    ["title", p?.title], // 最後の最後にタイトルから拾う（誤検出は guard）
  ];

  for (const [source, v] of candidates) {
    const n = pickNumber(v);
    if (typeof n === "number") {
      // 妥当域(300〜150,000円)外は弾く
      if (n >= 300 && n <= 150000) {
        return { value: n, display: YEN(n), source };
      }
    }
  }
  return {};
}

/**
 * 商品データに価格情報を追加する
 */
export function attachPriceInfo(item: any): any {
  const priceInfo = extractPriceInfo(item);
  return {
    ...item,
    ...priceInfo,
  };
} 