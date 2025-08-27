// UIで使っている日本語ラベル → 内部キー(ProblemKey) へのマップ
export const PROBLEM_VALUE_TO_KEY: Record<string, string> = {
  "朝起きると首が痛い": "neckPain",
  "肩こりがひどい": "shoulderPain",
  "頭痛・偏頭痛持ち": "stiffness",
  "ストレートネックと診断": "neckPain",
  "特に問題なし": "",

  "よくかく": "snore",
  "時々": "snore",
  "ほぼない": "",           // 空文字は無視

  "疲れが残る": "tiredMorning",
  "普通": "",
  "スッキリ": "",

  // 必要に応じて追加
};

export function toProblemKeys(values: string[]): string[] {
  const keys = values
    .map(v => PROBLEM_VALUE_TO_KEY[v] ?? v) // 既にキーならそのまま
    .map(s => String(s).replace(/^C[_-]/,"")) // "C_"接頭辞のノイズ除去
    .filter(Boolean);
  return Array.from(new Set(keys)); // 重複除去
} 