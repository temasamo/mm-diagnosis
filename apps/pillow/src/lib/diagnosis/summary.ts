// ユーザー回答から表示用の簡易まとめを作る
export type ProblemsSummary = {
  bullets: string[];
};

export function deriveProblems(a: any): ProblemsSummary {
  const b: string[] = [];
  // ↓ storeの実キー名に合わせて置換してください
  if (a.neckOrShoulderPain) b.push("首・肩が痛い");
  if (a.pillowTooHigh)      b.push("高さが合わない（高すぎ）");
  if (a.pillowTooLow)       b.push("高さが合わない（低すぎ）");
  if (a.pillowTooHard)      b.push("硬すぎる");
  if (a.pillowTooSoft)      b.push("柔らかすぎる");
  if (a.getsHot)            b.push("蒸れる/暑い");
  if (a.materialMismatch)   b.push("素材が合わない");
  return { bullets: b };
}

function labelHeight(v?: string) {
  if (!v) return "";
  // storeの値 → 表示ラベル
  const map: Record<string,string> = { low:"低め", mid:"標準", high:"高め", standard:"標準" };
  return map[v] ?? v;
}
function labelFirmness(v?: string) {
  if (!v) return "";
  const map: Record<string,string> = { soft:"柔らかめ", medium:"普通", hard:"硬め", normal:"普通" };
  return map[v] ?? v;
}

export function buildDiagnosticComment(a: any): string {
  const parts: string[] = [];
  const h = labelHeight(a.prefHeight);
  const f = labelFirmness(a.prefFirmness);
  const m = a.prefMaterial && a.prefMaterial !== "指定なし" ? a.prefMaterial : "";

  if (h && h !== "指定なし") parts.push(`高さ：${h}`);
  if (f && f !== "指定なし") parts.push(`硬さ：${f}`);
  if (m)                     parts.push(`素材：${m}`);

  if (parts.length === 0) return ""; // 何も指定が無いときは表示しない
  return `あなたにおすすめの枕は ${parts.join(" / ")} タイプです。`;
} 