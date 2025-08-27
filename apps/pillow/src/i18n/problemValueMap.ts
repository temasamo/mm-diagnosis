// UIの日本語ラベル → 内部キー（buildProblemListの ProblemKey）
// 未対応ラベルは "" にして無視
export const PROBLEM_VALUE_TO_KEY: Record<string, string> = {
  // 首・肩まわり
  "朝起きると首が痛い": "neckPain",
  "肩こりがひどい": "shoulderPain",
  "頭痛・偏頭痛持ち": "stiffness",           // 暫定で stiffness に寄せる
  "ストレートネックと診断": "neckPain",
  "特に問題なし": "",

  // いびき（頻度に関わらず「あり」を1つのキーへ寄せる）
  "よくかく": "snore",
  "時々": "snore",
  "ほぼない": "",
  "不明 / 指定なし": "",

  // 起床時の疲れ
  "疲れが残る": "tiredMorning",
  "普通": "",
  "スッキリ": "",
  // 予備：別表記が来ても吸収
  "疲れが残ります": "tiredMorning",

  // 暑がり・汗かき
  "はい": "hotSleep",
  "いいえ": "",
};

export function toProblemKeys(values: string[]): string[] {
  const keys = values
    .map((v) => PROBLEM_VALUE_TO_KEY[v] ?? v) // 既にキーならそのまま
    .map((s) => String(s).replace(/^C[_-]/, "")) // 先頭のノイズ除去
    .filter(Boolean);
  return Array.from(new Set(keys));
} 