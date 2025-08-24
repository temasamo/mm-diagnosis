export type Profile = {
  height?: "low" | "normal" | "high" | "adjustable";
  firmness?: "soft" | "medium" | "hard";
  material?: "memory" | "latex" | "buckwheat" | "feather" | "poly" | "gel" | "towel" | "unknown";
  posture?: "supine" | "side" | "prone"; // 仰向け/横向き/うつ伏せ
  complaints: string[]; // 例: ["首・肩が痛い","蒸れる/暑い"]
  purchaseReason?: string; // 使っている枕が合わない / より質の良いものを探したい
  budgetBand?: "low" | "mid" | "high"; // 任意: 価格帯を使うなら
};

// diagStore（既存）の回答からプロファイル作成
export function buildProfileFromAnswers(a: any): Profile {
  const p: Profile = { complaints: [] };

  // 例: a.heightChoice, a.firmnessChoice, a.materialChoice は既存の回答キーに合わせて調整
  switch (a?.heightChoice) {
    case "低い": p.height = "low"; break;
    case "ちょうど良い": p.height = "normal"; break;
    case "高い": p.height = "high"; break;
    case "高さ調整可": p.height = "adjustable"; break;
  }

  switch (a?.firmnessChoice) {
    case "柔らかい": p.firmness = "soft"; break;
    case "普通": p.firmness = "medium"; break;
    case "硬い": p.firmness = "hard"; break;
  }

  // 素材（ボタンや自由入力の両対応: タイトル文字列で判定することも可）
  const mat = a?.materialChoice || a?.sizeMaterialChoice;
  if (typeof mat === "string") {
    if (/低反発/.test(mat)) p.material = "memory";
    else if (/高反発|ラテックス/.test(mat)) p.material = "latex";
    else if (/そば殻|そばがら/.test(mat)) p.material = "buckwheat";
    else if (/羽毛/.test(mat)) p.material = "feather";
    else if (/ジェル|冷感/.test(mat)) p.material = "gel";
    else if (/タオル/.test(mat)) p.material = "towel";
    else p.material = "poly";
  } else {
    p.material = "unknown";
  }

  switch (a?.posture) {
    case "仰向け": p.posture = "supine"; break;
    case "横向き": p.posture = "side"; break;
    case "うつ伏せ": p.posture = "prone"; break;
  }

  // 悩み（複数選択）
  if (Array.isArray(a?.problems)) p.complaints = a.problems;

  p.purchaseReason = a?.purchaseReason;
  p.budgetBand = a?.budgetBand; // 任意

  return p;
} 