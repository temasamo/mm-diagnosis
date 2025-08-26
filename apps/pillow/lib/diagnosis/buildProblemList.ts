type Snap = any;

export function buildProblemList(snap: Snap): string[] {
  const a = snap?.answers ?? snap ?? {};

  const list: string[] = [];

  // 首・肩まわり（配列）
  const ns =
    a.neck_shoulder_issues ??
    a.neckShoulderIssues ??
    a.neckShoulder ??
    a["首・肩まわりで抱えている問題"] ??
    [];

  const nsMap: Record<string, string> = {
    // 英語キー
    am_neck_pain: "朝起きると首が痛い",
    shoulder_stiff: "肩こりがひどい",
    straight_neck: "ストレートネック",
    // 日本語がそのまま来る場合
    "朝起きると首が痛い": "朝起きると首が痛い",
    "肩こりがひどい": "肩こりがひどい",
    "ストレートネックと診断": "ストレートネック",
    "ストレートネック": "ストレートネック",
  };
  if (Array.isArray(ns)) {
    for (const v of ns) {
      const key = typeof v === "string" ? v : v?.value ?? v?.id;
      if (!key) continue;
      const mapped = nsMap[key] ?? nsMap[String(key).trim()];
      if (mapped && mapped !== "特に問題なし") list.push(mapped);
    }
  }

  // いびき（単一）
  const snore =
    a.snore ??
    a.snoring ??
    a["いびき"];

  if (snore === "often" || snore === "よくかく") list.push("いびきをよくかく");
  else if (snore === "sometimes" || snore === "時々") list.push("いびきをかくことがある");

  // 起床時の疲れ（単一）
  const fatigue =
    a.morning_fatigue ??
    a.wakeup_fatigue ??
    a["起床時の疲れ"];

  if (fatigue === "remain" || fatigue === "疲れが残る") list.push("起床時に疲れが残る");

  // 暑がり（単一）
  const hot =
    a.hot_sweaty ??
    a.sweaty ??
    a["暑がり・汗かきですか？"];
  if (hot === "yes" || hot === "はい") list.push("暑がり・汗をかきやすい");

  if (list.length === 0) return ["現在の枕に関する不満をお聞かせください"];
  return Array.from(new Set(list));
} 