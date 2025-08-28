export type Material =
  | "low_rebound"   // 低反発ウレタン
  | "high_rebound"  // 高反発ウレタン
  | "latex"         // ラテックス
  | "pipe"          // パイプ(ポリエチレン等)
  | "beads"         // ビーズ/マイクロビーズ
  | "feather"       // 羽毛/フェザー
  | "poly_cotton"   // ポリエステル綿/綿
  | "sobakawa"      // そば殻
  | "mixed";        // 複合

export const MATERIAL_PROPS: Record<Material, {
  support: "soft"|"mid"|"firm";      // 支え
  breath: "low"|"mid"|"high";        // 通気
  shapeKeep: "low"|"mid"|"high";     // 形状保持
  notes: string[];                   // 説明テンプレに使う短文
}> = {
  low_rebound:  { support:"soft", breath:"low",  shapeKeep:"mid",  notes:["圧力分散","沈み込みやすい"] },
  high_rebound: { support:"firm", breath:"mid",  shapeKeep:"high", notes:["反発力が高い","形状保持に強い"] },
  latex:        { support:"firm", breath:"mid",  shapeKeep:"high", notes:["弾性が高い","しっかり支える"] },
  pipe:         { support:"firm", breath:"high", shapeKeep:"high", notes:["通気性◎","調整しやすい"] },
  beads:        { support:"soft", breath:"mid",  shapeKeep:"mid",  notes:["体に沿う","軽め"] },
  feather:      { support:"soft", breath:"mid",  shapeKeep:"low",  notes:["ふんわり","へたりやすい"] },
  poly_cotton:  { support:"mid",  breath:"mid",  shapeKeep:"low",  notes:["汎用","コスパ"] },
  sobakawa:     { support:"firm", breath:"high", shapeKeep:"mid",  notes:["通気性◎","やや硬め","音がすることあり"] },
  mixed:        { support:"mid",  breath:"mid",  shapeKeep:"mid",  notes:["複合素材"] },
};

export function labelMaterial(m: Material): string {
  switch(m){
    case "low_rebound":  return "低反発ウレタン";
    case "high_rebound": return "高反発ウレタン";
    case "latex":        return "ラテックス";
    case "pipe":         return "パイプ";
    case "beads":        return "ビーズ";
    case "feather":      return "羽毛・フェザー";
    case "poly_cotton":  return "ポリエステル綿";
    case "sobakawa":     return "そば殻";
    case "mixed":        return "複合";
  }
} 