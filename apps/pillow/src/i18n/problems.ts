export type ProblemKey =
  | "snore"        // いびき
  | "tiredMorning" // 起床時の疲れ
  | "neckPain"     // 首の痛み
  | "shoulderPain" // 肩こり
  | "stiffness"    // 体のこわばり
  | "hotSleep"     // 寝苦しさ（暑さ）
  | "lowSleepQuality"; // 眠りの浅さ

export const JP_PROBLEM_LABEL: Record<ProblemKey, string> = {
  snore: "いびきが気になる",
  tiredMorning: "起床時に疲れが残る",
  neckPain: "首の痛みがある",
  shoulderPain: "肩こりがある",
  stiffness: "体のこわばりを感じる",
  hotSleep: "寝苦しさ（暑さ）で目が覚める",
  lowSleepQuality: "眠りが浅い（睡眠の質が低い）",
}; 