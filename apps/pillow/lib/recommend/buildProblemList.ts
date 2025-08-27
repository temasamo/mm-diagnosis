import { JP_PROBLEM_LABEL, ProblemKey } from "@/i18n/problems";

export type Answers = {
  // Cブロックの複数選択。文字列/配列/カンマ区切りに揺れても吸収
  problems?: ProblemKey[] | string[] | string | null;
  notesC?: string | null;
};

/** 受け取り値を ProblemKey[] に正規化（未知値は捨てる） */
function normalizeProblems(src: Answers["problems"]): ProblemKey[] {
  const KNOWN = new Set<ProblemKey>(Object.keys(JP_PROBLEM_LABEL) as ProblemKey[]);
  const arr = Array.isArray(src)
    ? src
    : typeof src === "string"
      ? src.split(",").map(s => s.trim()).filter(Boolean)
      : [];
  const keys: ProblemKey[] = [];
  for (const v of arr) {
    // "C_snore" など前置詞付き・UI値を許容
    const k = (String(v).replace(/^C[_-]/, "") as ProblemKey);
    if (KNOWN.has(k)) keys.push(k);
  }
  // 重複除去
  return Array.from(new Set(keys));
}

export type ProblemList = {
  bullets: string[];
  sentence: string;
  debugKeys: ProblemKey[];
};

export function buildProblemList(ans: Answers): ProblemList {
  const keys = normalizeProblems(ans?.problems ?? []);
  const bullets = keys.map(k => JP_PROBLEM_LABEL[k]).filter(Boolean);

  const sentence =
    bullets.length > 0
      ? bullets.join("、")
      : "特筆すべきお悩みは選択されていません。";

  return { bullets, sentence, debugKeys: keys };
} 