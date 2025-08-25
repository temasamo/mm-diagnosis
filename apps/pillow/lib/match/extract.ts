export type ProductFeatures = {
  height?: "low" | "normal" | "high" | "adjustable";
  firmness?: "soft" | "medium" | "hard";
  material?: "memory" | "latex" | "buckwheat" | "feather" | "poly" | "gel" | "towel" | "unknown";
  cooling?: boolean; // 冷感/通気
  neckSupport?: boolean; // 頸椎/ストレートネック/サポート
};

export function extractFeaturesFromTitle(title: string): ProductFeatures {
  const t = title ?? "";
  const f: ProductFeatures = {};

  // 高さ
  if (/低め|低い/.test(t)) f.height = "low";
  else if (/高め|高い/.test(t)) f.height = "high";
  else if (/高さ調整|調整可能|スタンダード/.test(t)) f.height = "adjustable";
  else f.height = "normal";

  // 硬さ
  if (/低反発|やわらか|柔らか/.test(t)) f.firmness = "soft";
  else if (/高反発|硬め|堅/.test(t)) f.firmness = "hard";
  else f.firmness = "medium";

  // 素材
  if (/低反発/.test(t)) f.material = "memory";
  else if (/高反発|ラテックス/.test(t)) f.material = "latex";
  else if (/そば殻|そばがら/.test(t)) f.material = "buckwheat";
  else if (/羽毛/.test(t)) f.material = "feather";
  else if (/ジェル/.test(t)) f.material = "gel";
  else if (/タオル/.test(t)) f.material = "towel";
  else f.material = /綿|ポリ|ポリエステル/.test(t) ? "poly" : "unknown";

  // 機能
  f.cooling = /冷感|接触冷感|通気|メッシュ|ひんやり/.test(t);
  f.neckSupport = /頸椎|首|ストレートネック|ネック|サポート/.test(t);

  return f;
} 