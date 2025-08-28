// apps/pillow/src/i18n/problems.ts

export type ProblemKey =
  | "neck_pain"
  | "height_mismatch"
  | "poor_turn"
  | "sweat"
  | "sagging"
  | "morning_neck_pain"
  | "severe_shoulder_stiffness"
  | "headache"
  | "straight_neck"
  | "often"
  | "sometimes"
  | "yes"
  | "soft"
  | "firm"
  | "low_rebound"
  | "high_rebound"
  | "latex"
  | "pipe"
  | "beads"
  | "feather"
  | "poly_cotton"
  | "sobakawa";

export const JP_PROBLEM_LABEL: Record<ProblemKey, string> = {
  // concerns（気になる点）
  neck_pain: "首が痛い",
  height_mismatch: "高さが合わない",
  poor_turn: "寝返りしづらい",
  sweat: "蒸れる",
  sagging: "へたる",

  // neck_shoulder_issues（首・肩の問題）
  morning_neck_pain: "朝起きると首が痛い",
  severe_shoulder_stiffness: "肩こりがひどい",
  headache: "頭痛・偏頭痛持ち",
  straight_neck: "ストレートネック",

  // snore（いびき）
  often: "いびきをよくかく",
  sometimes: "いびきを時々かく",

  // heat_sweat（暑がり）
  yes: "暑がり・汗かき",

  // mattress_firmness（マットレス硬さ）
  soft: "柔らかめマットレス",
  firm: "硬めマットレス",

  // current_pillow_material（現在の枕の素材）
  low_rebound: "低反発ウレタン枕",
  high_rebound: "高反発ウレタン枕",
  latex: "ラテックス枕",
  pipe: "パイプ枕",
  beads: "ビーズ枕",
  feather: "羽毛・フェザー枕",
  poly_cotton: "ポリエステル綿枕",
  sobakawa: "そば殻枕",
};
