// apps/pillow/src/lib/result/comment.ts
export type Snapshot = Record<string, any>;

const label = (v?: string) =>
  (v ?? "").trim().replace(/^（指定なし）|^指定なし$/, "");

export function buildDiagnosisComment(s: Snapshot): string {
  // できるだけ堅牢に: キーのゆらぎに対応 + 「指定なし」は出さない
  const height =
    s.heightFeel ?? s.pillowHeight ?? s["枕の高さの感じ方"] ?? "";
  const firmness =
    s.firmnessFeel ?? s.pillowFirmness ?? s["枕の硬さの感じ方"] ?? "";
  const material =
    s.material ?? s.sizeMaterial ?? s["サイズ・素材"] ?? "";
  const posture =
    s.posture ?? s.mainPosture ?? s["主な寝姿勢"] ?? "";

  const h = label(height);
  const f = label(firmness);
  const m = label(material);
  const p = label(posture);

  const chunks: string[] = [];

  if (p) chunks.push(`寝姿勢は「${p}」向け`);
  if (h) chunks.push(`高さは「${h}」`);
  if (f) chunks.push(`硬さは「${f}」`);
  if (m) chunks.push(`素材は「${m}」`);

  if (chunks.length === 0) return ""; // 何も情報がない時は非表示にする

  // 例）「寝姿勢は「仰向け」向け・高さは「普通」・硬さは「やわらかめ」」
  const spec = chunks.join("・");
  return `あなたにおすすめの枕は、${spec}のタイプです。`;
}

export function buildProblems(s: Snapshot): string[] {
  // 診断シートの「気になる点」複数選択＋自由記述をまとめる
  const concerns: string[] =
    s.concerns ?? s.problems ?? s["気になる点"] ?? [];
  const freeImprove: string =
    s.freeImprove ?? s.improveNote ?? s["改善したい点"] ?? "";

  const bullets = [...(Array.isArray(concerns) ? concerns : [])]
    .map(x => `${x}`.trim())
    .filter(Boolean);

  if (freeImprove && freeImprove.trim()) bullets.push(freeImprove.trim());

  // 「指定なし」を落とす
  return bullets.filter(b => !/^（?指定なし）?$/.test(b));
} 