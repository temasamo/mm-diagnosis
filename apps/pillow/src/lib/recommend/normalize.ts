export type Product = {
  id: string; title: string; price: number; mall: "rakuten"|"yahoo"|"amazon";
  url: string; thumb?: string;
  heightClass: "low"|"mid"|"high";
  firmness: "soft"|"medium"|"firm";
  materialClass: "HR"|"LR"|"latex"|"pipe"|"feather"|"beads"|"poly"|"gel-grid";
  shape: ("flat"|"contour"|"grid"|"wave"|"ear-dent"|"adjustable")[];
  tags: ("vent"|"cooling"|"washable"|"neck-plain"|"anti-snore"|"wide"|"anti-dust")[];
  review: { stars:number; count:number };
};

const re = (s:string, ...words:string[]) => words.some(w=>new RegExp(w,"i").test(s));

export function normalize(raw:any, mall: Product["mall"]): Product {
  const t = String(raw.title || "");
  const price = Number(raw.price || raw.sellingPrice || 0);
  const tags: Product["tags"] = [];
  const shape: Product["shape"] = [];

  // 高さ
  const height:Product["heightClass"] =
    re(t,"低め","low") ? "low" :
    re(t,"高め","high") ? "high" : "mid";

  // 硬さ
  const firmness:Product["firmness"] =
    re(t,"硬め","firm") ? "firm" :
    re(t,"柔らか","soft") ? "soft" : "medium";

  // 素材
  const material:Product["materialClass"] =
    re(t,"高反発") ? "HR" :
    re(t,"低反発") ? "LR" :
    re(t,"ラテックス") ? "latex" :
    re(t,"パイプ") ? "pipe" :
    re(t,"羽毛|フェザー") ? "feather" :
    re(t,"ビーズ") ? "beads" :
    re(t,"ジェル|格子|グリッド") ? "gel-grid" :
    re(t,"ポリエステル|綿|中綿") ? "poly" : "HR";

  // 形状・特徴
  if (re(t,"グリッド|格子")) shape.push("grid");
  if (re(t,"波|ウェーブ|くぼみ")) shape.push("wave");
  if (re(t,"調整|高さ調整|シート追加")) shape.push("adjustable");
  if (re(t,"通気|メッシュ|エア|COOL|冷感")) tags.push("vent","cooling");
  if (re(t,"洗濯|丸洗い|ウォッシャブル")) tags.push("washable");
  if (re(t,"いびき|スノア")) tags.push("anti-snore");
  if (re(t,"防ダニ|抗菌")) tags.push("anti-dust");
  if (re(t,"面で支える|フラット")) tags.push("neck-plain");

  const review = { stars: Number(raw.stars||raw.rating||4), count: Number(raw.reviews||raw.reviewCount||10) };

  return {
    id: String(raw.id || raw.code || raw.asin || t),
    title: t, price, mall,
    url: raw.url || raw.productUrl || "#",
    thumb: raw.image || raw.thumbnail,
    heightClass: height, firmness, materialClass: material,
    shape: [...new Set(shape)], tags: [...new Set(tags)], review,
  };
} 