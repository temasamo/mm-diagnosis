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

// 基礎重み（カテゴリのベース人気や汎用性）- 姿勢別カテゴリを強化
export const BASE_WEIGHTS: Partial<Record<CategoryId, number>> = {
  "mid-loft": 0.1,
  "adjustable": 0.1,
  "side-contour": 0.05,  // 横向き専用カテゴリを追加
  "back-contour": 0.05,  // 仰向け専用カテゴリを追加
};

// 姿勢×寝返りの基礎ルール（最重要）- 重みを大幅強化
export const POSTURE_ROLLOVER_WEIGHTS: Record<string, Partial<Record<CategoryId, number>>> = {
  // key: `${posture}|${rollover}`
  "supine|low":        { "back-contour": 0.6, "mid-loft": 0.3 },
  "supine|mid":        { "back-contour": 0.55, "mid-loft": 0.3 },
  "supine|high":       { "back-contour": 0.5, "mid-loft": 0.25, "adjustable": 0.2 },

  "side|low":          { "side-contour": 0.6, "high-loft": 0.3 },
  "side|mid":          { "side-contour": 0.65, "high-loft": 0.3 },
  "side|high":         { "side-contour": 0.7, "high-loft": 0.3, "adjustable": 0.2 },

  "prone|low":         { "low-loft": 0.6, "soft-plush": 0.3 },
  "prone|mid":         { "low-loft": 0.55, "soft-plush": 0.3, "adjustable": 0.2 },
  "prone|high":        { "low-loft": 0.5, "soft-plush": 0.25, "adjustable": 0.25 },
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
  "lt3000":  { "natural-fill": 0.1, "low-loft": 0.05, "mid-loft": 0.05 },
  "3k-6k":   { "mid-loft": 0.1, "adjustable": 0.05, "side-contour": 0.05 },
  "6k-10k":  { "adjustable": 0.1, "back-contour": 0.1, "cooling": 0.05 },
  "10k-20k": { "adjustable": 0.15, "back-contour": 0.15, "cooling": 0.1, "firm-support": 0.1 },
  "20kplus": { "cooling": 0.15, "firm-support": 0.15, "back-contour": 0.15 },
};

 