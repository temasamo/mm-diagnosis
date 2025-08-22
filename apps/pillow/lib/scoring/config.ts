export type CategoryId =
  | "low-loft"            // 低め
  | "mid-loft"            // ふつう
  | "high-loft"           // 高め
  | "side-contour"        // 横向き・サイドサポート/波型
  | "back-contour"        // 仰向け・頸椎支持型
  | "adjustable"          // 高さ調整/詰め物増減
  | "cooling"             // 放熱・通気・冷感
  | "firm-support"        // 高反発・硬め
  | "soft-plush"          // 低反発・ふわふわ
  | "natural-fill";       // そば殻/羽毛など自然素材

export const CATEGORY_LABEL: Record<CategoryId, string> = {
  "low-loft": "低め枕",
  "mid-loft": "中くらいの高さ",
  "high-loft": "高め枕",
  "side-contour": "横向きサポート（波型/サイド高）",
  "back-contour": "仰向け頸椎サポート",
  "adjustable": "高さ調整できる枕",
  "cooling": "通気/冷感タイプ",
  "firm-support": "高反発・しっかり支持",
  "soft-plush": "低反発・やわらか",
  "natural-fill": "自然素材（そば殻/羽毛等）",
};

// 基礎重み（カテゴリのベース人気や汎用性）
export const BASE_WEIGHTS: Partial<Record<CategoryId, number>> = {
  "mid-loft": 0.2,
  "adjustable": 0.15,
};

// 姿勢×寝返りの基礎ルール（最重要）
export const POSTURE_ROLLOVER_WEIGHTS: Record<string, Partial<Record<CategoryId, number>>> = {
  // key: `${posture}|${rollover}`
  "supine|low":        { "back-contour": 0.35, "mid-loft": 0.2 },
  "supine|mid":        { "back-contour": 0.3,  "mid-loft": 0.2 },
  "supine|high":       { "back-contour": 0.25, "mid-loft": 0.15, "adjustable": 0.1 },

  "side|low":          { "side-contour": 0.35, "high-loft": 0.2 },
  "side|mid":          { "side-contour": 0.4,  "high-loft": 0.2 },
  "side|high":         { "side-contour": 0.45, "high-loft": 0.2, "adjustable": 0.1 },

  "prone|low":         { "low-loft": 0.35, "soft-plush": 0.15 },
  "prone|mid":         { "low-loft": 0.3,  "soft-plush": 0.15, "adjustable": 0.1 },
  "prone|high":        { "low-loft": 0.25, "soft-plush": 0.1,  "adjustable": 0.15 },
};

// 首・肩の状態（複数選択）
export const NECK_SHOULDER_WEIGHTS: Record<string, Partial<Record<CategoryId, number>>> = {
  am_neck_pain:     { "back-contour": 0.25, "adjustable": 0.1, "mid-loft": 0.1 },
  shoulder_stiff:   { "side-contour": 0.2,  "firm-support": 0.1, "adjustable": 0.1 },
  headache:         { "low-loft": 0.1, "back-contour": 0.15, "soft-plush": 0.05 },
  straight_neck:    { "back-contour": 0.3, "firm-support": 0.1 },
  none:             {},
};

// 健康・快適性
export const COMFORT_WEIGHTS: Record<string, Partial<Record<CategoryId, number>>> = {
  snore_often:      { "back-contour": 0.15, "side-contour": 0.15, "adjustable": 0.1 },
  snore_sometimes:  { "back-contour": 0.1,  "side-contour": 0.1 },
  snore_rarely:     {},
  fatigue_remain:   { "adjustable": 0.1, "firm-support": 0.1 },
  fatigue_normal:   {},
  fatigue_clear:    {},
  heat_yes:         { "cooling": 0.3 },
  heat_no:          {},
};

// 環境・好み
export const PREF_WEIGHTS = {
  mattress_firmness: {
    soft: { "soft-plush": 0.15 },
    mid:  {},
    firm: { "firm-support": 0.2 },
  },
  adjustable_pref: {
    want_adjustable: { "adjustable": 0.35 },
    no_adjust: {},
  },
  material_pref: {
    lp: { "soft-plush": 0.25 },
    hp: { "firm-support": 0.25 },
    feather: { "natural-fill": 0.2, "soft-plush": 0.1 },
    buckwheat: { "natural-fill": 0.3 },
    none: {},
  },
  size_pref: {
    wide: { "side-contour": 0.05 }, // 寝返り多め/横向きで安定
    std: {}, jr: {}, other: {},
  },
};

// 予算→カテゴリの現実解（あくまで初期の傾向）
export const BUDGET_WEIGHTS = {
  "lt5k":    { "natural-fill": 0.1, "low-loft": 0.05, "mid-loft": 0.05 },
  "5k-15k":  { "mid-loft": 0.1, "adjustable": 0.05, "side-contour": 0.05 },
  "15k-30k": { "adjustable": 0.1, "back-contour": 0.1, "cooling": 0.05 },
  "30k+":    { "cooling": 0.1, "firm-support": 0.1, "back-contour": 0.1 },
};

// ギフト分岐の汎用（情報不足時の安全解）
export const GIFT_DEFAULT = [
  "adjustable",
  "mid-loft",
  "soft-plush",
] as CategoryId[]; 