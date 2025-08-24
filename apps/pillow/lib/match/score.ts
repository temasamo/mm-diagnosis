import type { Profile } from "../diag/profile";
import { extractFeaturesFromTitle } from "./extract";

export function computeMatchPercent(title: string, profile: Profile): { score: number; reasons: string[] } {
  const feat = extractFeaturesFromTitle(title);
  let score = 50; // ベースライン（無料版のため上限バッファあり）
  const reasons: string[] = [];

  // 高さ
  if (profile.height && feat.height) {
    if (profile.height === feat.height) { score += 12; reasons.push("高さが希望と一致"); }
    else if (feat.height === "adjustable") { score += 8; reasons.push("高さ調整が可能"); }
  }

  // 硬さ
  if (profile.firmness && feat.firmness) {
    if (profile.firmness === feat.firmness) { score += 10; reasons.push("硬さが希望と一致"); }
  }

  // 素材
  if (profile.material && feat.material) {
    if (profile.material === feat.material) { score += 8; reasons.push("素材が希望と一致"); }
  }

  // 姿勢ヒント（軽い寄与）
  if (profile.posture) {
    if (profile.posture === "side" && /高め|高さ調整/.test(title)) { score += 4; reasons.push("横向きに配慮（高め/調整）"); }
    if (profile.posture === "supine" && /低め|スタンダード|フィット/.test(title)) { score += 3; reasons.push("仰向けに配慮（低め/標準）"); }
    if (profile.posture === "prone" && /低め|やわらか/.test(title)) { score += 3; reasons.push("うつ伏せに配慮（低め/柔らかめ）"); }
  }

  // 悩み対応
  if (profile.complaints?.some(c => /蒸れる|暑い/.test(c)) && feat.cooling) { score += 4; reasons.push("冷感/通気でムレ対策"); }
  if (profile.complaints?.some(c => /首|肩/.test(c)) && feat.neckSupport) { score += 4; reasons.push("頸椎/首サポート"); }

  // 価格帯は既存フィルタ優先。ここでは重み小さめに（任意）
  // if (inBudget) score += 2;

  // 上限85%にクリップ
  score = Math.min(85, Math.round(score));

  // 下限（見栄え用）
  score = Math.max(50, score);

  return { score, reasons };
} 