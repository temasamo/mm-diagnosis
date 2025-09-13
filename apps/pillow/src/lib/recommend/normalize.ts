// --- ItemMeta 定義 ---
export type ItemMeta = {
  id: string;
  title: string;
  url?: string;
  imageUrl?: string | null;
  priceYen?: number;
  material?: string;            // 'latex'|'high-rebound'|'low-rebound'|'pipe'|'feather'|'polyester'|'beads'|'buckwheat'|'other'
  firmness?: string;            // 'soft'|'medium'|'firm'
  heightCm?: number | { head?: number; neck?: number };
  shape?: string;               // 'center-dent'|'wave'|'flat'
  breathable?: boolean;
  washable?: boolean;
  tags?: string[];
  comment?: string;
};

// --- テキストから属性推定（タイトル/説明を渡す） ---
export function enrichFromText(base: ItemMeta, text: string): ItemMeta {
  const t = (text || '').toLowerCase();
  const set = (k: keyof ItemMeta, v: any) => (base as any)[k] ??= v;

  if (/ラテックス|latex/.test(t)) set('material','latex');
  else if (/高反発/.test(t)) set('material','high-rebound');
  else if (/低反発/.test(t)) set('material','low-rebound');
  else if (/パイプ/.test(t)) set('material','pipe');
  else if (/羽毛|ﾌｪｻﾞ|feather/.test(t)) set('material','feather');
  else if (/ﾎﾟﾘｴｽﾃﾙ|polyester/.test(t)) set('material','polyester');
  else if (/ﾋﾞｰｽﾞ|beads/.test(t)) set('material','beads');
  else if (/そば殻/.test(t)) set('material','buckwheat');

  if (/中央くぼみ|ｾﾝﾀｰくぼみ/.test(t)) set('shape','center-dent');
  else if (/波型|ｳｪｰﾌﾞ/.test(t)) set('shape','wave');

  if (/通気|ｴｱﾎｰﾙ|ﾒｯｼｭ/.test(t)) set('breathable', true);
  if (/洗える|丸洗い|ｳｫｯｼｬﾌﾞﾙ/.test(t)) set('washable', true);

  if (/硬め|ﾊｰﾄﾞ/.test(t)) set('firmness','firm');
  else if (/やわらか|ｿﾌﾄ/.test(t)) set('firmness','soft');
  else set('firmness', base.firmness ?? 'medium');

  return base;
}

// --- Rakuten → ItemMeta ---
export function rakutenToItem(r: any): ItemMeta {
  const base: ItemMeta = {
    id: r.itemCode,
    title: r.itemName,
    url: r.itemUrl,
    imageUrl: r.mediumImageUrls?.[0]?.imageUrl ?? r.smallImageUrls?.[0]?.imageUrl ?? null,
    priceYen: Number(r.itemPrice),
    tags: r.shopName ? ['shop:' + r.shopName] : [],
  };
  return enrichFromText(base, `${r.itemName} ${r.catchcopy ?? ''}`);
}

// --- Yahoo → ItemMeta ---
export function yahooToItem(y: any): ItemMeta {
  const img = y.images?.[0]?.medium ?? y.images?.[0]?.original ?? null;
  const base: ItemMeta = {
    id: y.code,
    title: y.name,
    url: y.url,
    imageUrl: img,
    priceYen: Number(y.price ?? y.prices?.[0]?.price),
    tags: y.seller?.name ? ['shop:' + y.seller.name] : [],
  };
  return enrichFromText(base, `${y.name} ${y.excerpt ?? ''}`);
}
