import type { Profile } from "../../lib/diag/profile";

function jpHeight(h?: Profile["height"]) {
  return h === "low" ? "低め" : h === "high" ? "高め" : h === "adjustable" ? "高さ調整可能" : "標準";
}
function jpFirm(f?: Profile["firmness"]) {
  return f === "soft" ? "柔らかめ" : f === "hard" ? "硬め" : "ふつう";
}
function jpMat(m?: Profile["material"]) {
  switch (m) {
    case "memory": return "低反発";
    case "latex": return "高反発（ラテックス）";
    case "buckwheat": return "そば殻";
    case "feather": return "羽毛";
    case "gel": return "ジェル/冷感";
    case "towel": return "タオル";
    case "poly": return "ポリエステル系";
    default: return "（指定なし）";
  }
}
function jpPosture(p?: Profile["posture"]) {
  return p === "supine" ? "仰向け" : p === "side" ? "横向き" : p === "prone" ? "うつ伏せ" : "（指定なし）";
}

export default function DiagnosisSummary({ profile, answers }: { profile: Profile; answers: any }) {
  const rec = `あなたにおすすめの枕は「${jpHeight(profile.height)}」「${jpFirm(profile.firmness)}」「${jpMat(profile.material)}」タイプです。主な寝姿勢は「${jpPosture(profile.posture)}」として最適化しています。`;

  const reasons: string[] = [];
  if (profile.purchaseReason) reasons.push(`購入理由：${profile.purchaseReason}`);
  if (profile.complaints?.length) reasons.push(`気になる点：${profile.complaints.join("／")}`);
  if (profile.height) reasons.push(`高さの好み：${jpHeight(profile.height)}`);
  if (profile.firmness) reasons.push(`硬さの好み：${jpFirm(profile.firmness)}`);
  if (profile.material && profile.material !== "unknown") reasons.push(`素材の希望：${jpMat(profile.material)}`);
  if (profile.posture) reasons.push(`主な寝姿勢：${jpPosture(profile.posture)}`);

  return (
    <div className="rounded-2xl border border-white/10 p-4">
      <h3 className="mb-2 text-lg font-semibold">診断結果</h3>
      <p className="leading-relaxed">{rec}</p>
      {!!reasons.length && (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm opacity-90">
          {reasons.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      )}
    </div>
  );
} 