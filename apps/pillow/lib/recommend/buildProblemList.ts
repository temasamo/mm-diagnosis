import { JP_PROBLEM_LABEL, ProblemKey } from "../../src/i18n/problems";

export type Answers = {
  // Cブロックの複数選択。文字列/配列/カンマ区切りに揺れても吸収
  problems?: ProblemKey[] | string[] | string | null;
  notesC?: string | null;
  // いびきと暑がりの情報を追加
  snore?: string | null;
  hot?: string | null;
  heat_sweat?: string | null;
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

type ProblemBullet = string;

const LABELS = {
  snore: "いびきが気になる",
  hot: "寝苦しさ（暑さ）で目が覚める",
  tired: "起床時に疲れが残る", // 使わないなら残してOK（将来用）
};

export function buildProblemList(ans: Answers): ProblemList {
  // ★重複を防ぐ
  const set = new Set<ProblemBullet>();
  const push = (cond: boolean, label: ProblemBullet) => {
    if (cond) set.add(label);
  };

  // === 既存のproblemsから取得 ===
  const keys = normalizeProblems(ans?.problems ?? []);
  const existingBullets = keys.map(k => JP_PROBLEM_LABEL[k]).filter(Boolean);
  existingBullets.forEach(bullet => set.add(bullet));

  // === 追加確認の2項目 ===
  // いびき
  push(
    ans?.snore === "often" ||
      ans?.snore === "sometimes" ||
      ans?.snore === "yes" ||
      ans?.snore === "あり" ||
      ans?.snore === "1",
    LABELS.snore
  );

  // 暑がり・汗かき
  push(
    ans?.hot === "yes" ||
      ans?.hot === "はい" ||
      ans?.heat_sweat === "yes" ||
      ans?.heat_sweat === "はい" ||
      ans?.hot === "1",
    LABELS.hot
  );

  // ★重複なしの配列に
  const bullets = Array.from(set);

  const sentence =
    bullets.length > 0
      ? bullets.join("、")
      : "特筆すべきお悩みは選択されていません。";

  return { bullets, sentence, debugKeys: keys };
} 