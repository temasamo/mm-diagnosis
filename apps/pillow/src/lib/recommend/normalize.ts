export type ItemMeta = {
  id: string; title: string; url?: string;
  imageUrl?: string | null; priceYen?: number;
  material?: string; firmness?: string;
  heightCm?: number | { head?: number; neck?: number };
  shape?: string; breathable?: boolean; washable?: boolean;
  tags?: string[]; comment?: string;
};

const set = <K extends keyof ItemMeta>(b: ItemMeta, k: K, v: ItemMeta[K]) => (b[k] ??= v);

export function enrichFromText(base: ItemMeta, text: string) {
  const t = (text||'').toLowerCase();
  if (/latex|ラテックス/.test(t)) set(base,'material','latex');
  else if (/高反発/.test(t))       set(base,'material','high-rebound');
  else if (/低反発/.test(t))       set(base,'material','low-rebound');
  else if (/パイプ/.test(t))       set(base,'material','pipe');
  else if (/羽毛|ﾌｪｻﾞ/.test(t))   set(base,'material','feather');
  else if (/ﾎﾟﾘｴｽﾃﾙ/.test(t))     set(base,'material','polyester');
  else if (/ﾋﾞｰｽﾞ/.test(t))       set(base,'material','beads');
  else if (/そば殻/.test(t))       set(base,'material','buckwheat');

  if (/中央くぼみ/.test(t))       set(base,'shape','center-dent');
  else if (/波型|ウェーブ/.test(t)) set(base,'shape','wave');

  if (/通気|エアホール|メッシュ/.test(t)) set(base,'breathable', true);
  if (/洗える|丸洗い|ｳｫｯｼｬﾌﾞﾙ/.test(t)) set(base,'washable', true);

  if (/硬め|ﾊｰﾄﾞ/.test(t))         set(base,'firmness','firm');
  else if (/やわらか|ｿﾌﾄ/.test(t)) set(base,'firmness','soft');
  else                              set(base,'firmness', base.firmness ?? 'medium');
  return base;
}

export function rakutenToItem(r: any): ItemMeta {
  const base: ItemMeta = {
    id: r.itemCode, title: r.itemName, url: r.itemUrl,
    imageUrl: r.mediumImageUrls?.[0]?.imageUrl ?? r.smallImageUrls?.[0]?.imageUrl ?? null,
    priceYen: Number(r.itemPrice),
    tags: r.shopName ? ['shop:' + r.shopName] : [],
  };
  return enrichFromText(base, `${r.itemName} ${r.catchcopy ?? ''}`);
}

export function yahooToItem(y: any): ItemMeta {
  const img = y.images?.[0]?.medium ?? y.images?.[0]?.original ?? null;
  const base: ItemMeta = {
    id: y.code, title: y.name, url: y.url, imageUrl: img,
    priceYen: Number(y.price ?? y.prices?.[0]?.price),
    tags: y.seller?.name ? ['shop:' + y.seller.name] : [],
  };
  return enrichFromText(base, `${y.name} ${y.excerpt ?? ''}`);
}
