import { getAiComment } from "@/lib/ai/commentService";
"use client";
import { useEffect, useState } from "react";
import type { Profile } from "../../lib/diag/profile";

function jpHeight(h?: Profile["height"]) {
  if (!h) return null;
  return h === "low" ? "低め" : h === "high" ? "高め" : h === "adjustable" ? "高さ調整可" : "標準";
}
function jpFirm(f?: Profile["firmness"]) {
  if (!f) return null;
  return f === "soft" ? "柔らかめ" : f === "hard" ? "硬め" : "普通";
}
function jpMat(m?: Profile["material"]) {
  if (!m || m === "unknown") return null;
  switch (m) {
    case "memory": return "低反発";
    case "latex": return "高反発（ラテックス）";
    case "buckwheat": return "そば殻";
    case "feather": return "羽毛";
    case "gel": return "ジェル/冷感";
    case "towel": return "タオル";
    case "poly": return "ポリエステル系";
    default: return null;
  }
}
function jpPosture(p?: Profile["posture"]) {
  if (!p) return null;
  return p === "supine" ? "仰向け" : p === "side" ? "横向き" : p === "prone" ? "うつ伏せ" : null;
}

export default function DiagnosisSummary({ profile, answers }: { profile: Profile; answers: any }) {
  const parts: string[] = [];
  const h = jpHeight(profile.height);
  const f = jpFirm(profile.firmness);
  const m = jpMat(profile.material);
  const s = jpPosture(profile.posture);

  if (h) parts.push(`「${h}」`);
  if (f) parts.push(`「${f}」`);
  if (m) parts.push(`「${m}」`);
  const lead = parts.length ? `あなたにおすすめの枕は${parts.join("「」が重なる場合は削る")}タイプです。` : "";

  const pos = s ? `主な寝姿勢は「${s}」として最適化しています。` : "";
  // AIひとこと
  const [brief, setBrief] = useState<string>("");
  useEffect(() => {
    const run = async () => {
      try {
        // 統一AIコメントサービスを使用
        const criteria = {
          postures: profile.posture ? [profile.posture] : [],
          concerns: profile.complaints || [],
          sweaty: false, // 簡易版では未対応
        };
        const reasons = profile.complaints || [];
        const aiComment = await getAiComment({ criteria, reasons });
        setBrief(aiComment);
      } catch (error) {
        console.warn("AIコメント生成エラー:", error);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const complaints: string[] = Array.isArray(profile.complaints) ? profile.complaints : [];
  const purchase = profile.purchaseReason ? [`購入理由：${profile.purchaseReason}`] : [];

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 p-4">
      <h3 className="text-lg font-semibold">診断結果</h3>

      {(lead || pos) && (
        <p className="leading-relaxed">
          {lead} {pos}
        </p>
      )}

      {brief && (
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm w-fit">
          {brief}
        </div>
      )}

      {(complaints.length > 0 || purchase.length > 0) && (
        <div className="mt-2">
          <div className="mb-2 font-semibold">診断理由（あなたのお悩み）</div>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {[...purchase, ...complaints].map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 