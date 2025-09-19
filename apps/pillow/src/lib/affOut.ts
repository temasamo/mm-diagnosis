const OUT_BASE = process.env.NEXT_PUBLIC_OUT_BASE || "https://www.marketsupporter-ai.com/api/out";

type Mall = "rakuten" | "yahoo";

export function buildAffUrl(mall: Mall, p: { url?: string; brand?: string }) {
  const sp = new URLSearchParams({ mall });
  if (p.url)   sp.set("url", p.url);
  if (p.brand) sp.set("brand", p.brand);
  return `${OUT_BASE}?${sp.toString()}`;
}

// タイトルなどから検索語を作る（絵文字/記号/ショップ名などを削る）
export function toSearchQuery(title: string, brand?: string) {
  const base = (brand ? `${brand} ${title}` : title)
    .replace(/[【】\[\]\(\)（）⭐️★☆♪!！?？]/g, " ")  // 記号除去
    .replace(/【PR】/g, " ")  // PR除去
    .replace(/【広告】/g, " ")  // 広告除去
    .replace(/楽天市場店/g, " ")  // ショップ名除去
    .replace(/公式/g, " ")  // 公式除去
    .replace(/限定/g, " ")  // 限定除去
    .replace(/最安/g, " ")  // 最安除去
    .replace(/送料無料/g, " ")  // 送料無料除去
    .replace(/ポイント\d+倍/g, " ")  // ポイント倍率除去
    .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")   // その他記号除去
    .replace(/\s+/g, " ")
    .trim();
  return base.slice(0, 60); // URLが長くなりすぎないよう適度に短縮
}
