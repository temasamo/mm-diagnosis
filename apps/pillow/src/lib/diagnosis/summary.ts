// ユーザー回答から表示用の簡易まとめを作る
export type ProblemsSummary = {
  bullets: string[];   // 「首・肩が痛い」「高さが合わない」など
};

export function deriveProblems(a: any): ProblemsSummary {
  const b: string[] = [];

  // 例: store のフラグ名は適宜読み替え
  if (a.pillowTooHigh) b.push("高さが合わない（高すぎ）");
  if (a.pillowTooLow)  b.push("高さが合わない（低すぎ）");
  if (a.pillowTooHard) b.push("硬すぎる");
  if (a.pillowTooSoft) b.push("柔らかすぎる");
  if (a.getsHot)       b.push("蒸れる/暑い");
  if (a.neckOrShoulderPain) b.push("首・肩が痛い");
  if (a.materialMismatch)   b.push("素材が合わない");
  // 何もなければ空配列のまま返す
  return { bullets: b };
}

export function buildDiagnosticComment(a: any): string {
  // 例: 高さ/硬さ/素材の選好を読み、短い一文に
  const height = a.prefHeight ?? "標準";
  const feel   = a.prefFirmness ?? "普通";
  const mat    = a.prefMaterial ?? "（指定なし）";
  return `あなたにおすすめの枕は「${height}」「${feel}」「${mat}」タイプです。`;
} 