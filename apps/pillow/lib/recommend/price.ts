export function toNumber(x: any): number | null {
  if (x === null || x === undefined) return null;
  const n = typeof x === "number" ? x : parseInt(String(x).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

// 楽天/ヤフー/自前正規化のどれでも拾えるように
export function getItemPrice(it: any): number | null {
  return (
    toNumber(it?.price) ??
    toNumber(it?.itemPrice) ??
    toNumber(it?.salePrice) ??
    toNumber(it?.priceTaxIncluded)
  );
}

export function priceInRange(price: number | null, min?: number, max?: number) {
  if (price == null) return false;
  if (typeof min === "number" && price < min) return false;
  if (typeof max === "number" && price > max) return false;
  return true;
} 