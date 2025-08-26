type Snap = any; // あなたの store の型に合わせて調整OK

export function buildProblemList(snap: Snap): string[] {
  const a = snap?.answers ?? snap ?? {};

  const list: string[] = [];

  // A-1 首肩まわりの問題（複数選択）
  // 例: answers.neck_shoulder_issues = ["am_neck_pain","shoulder_stiff","straight_neck"]
  const ns = a.neck_shoulder_issues ?? a.neckShoulderIssues ?? [];
  const nsMap: Record<string,string> = {
    am_neck_pain: "朝起きると首が痛い",
    shoulder_stiff: "肩こりがひどい",
    straight_neck: "ストレートネック",
    none: "特に問題なし",
  };
  if (Array.isArray(ns)) {
    for (const key of ns) {
      if (key && key !== "none" && nsMap[key]) list.push(nsMap[key]);
    }
  }

  // C-1 いびき
  // 例: answers.snore = "often" | "sometimes" | "seldom" | "unknown"
  const snore = a.snore ?? a.snoring;
  if (snore === "often") list.push("いびきをよくかく");
  else if (snore === "sometimes") list.push("いびきをかくことがある");
  // "seldom" は悩みでないので非追加

  // C-2 起床時の疲れ
  // 例: answers.morning_fatigue = "remain" | "normal" | "refresh" | "unknown"
  const fatigue = a.morning_fatigue ?? a.wakeup_fatigue;
  if (fatigue === "remain") list.push("起床時に疲れが残る");

  // C-3 暑がり・汗かき
  const hot = a.hot_sweaty ?? a.sweaty;
  if (hot === "yes") list.push("暑がり・汗をかきやすい");

  // Fallback
  if (list.length === 0) {
    return ["現在の枕に関する不満をお聞かせください"];
  }
  return Array.from(new Set(list));
} 