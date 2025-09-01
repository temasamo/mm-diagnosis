export type TargetHeight = { min: number; max: number; base: number };

type Payload = {
  posture?: "side" | "back" | "stomach" | string;
  mattressFirmness?: "soft" | "medium" | "hard" | "unknown" | string;
  shoulderThickness?: "thin" | "normal" | "thick" | string;
};

/**
 * 目標高さの簡易レンジ計算（後から調整しやすい係数設計）
 * ※ 値は暫定。運用しつつ係数を詰めていきましょう。
 */
export function calcTargetHeightRange(p?: Payload): TargetHeight {
  const posture = (p?.posture ?? "side") as string;
  const firmness = (p?.mattressFirmness ?? "medium") as string;
  const shoulder = (p?.shoulderThickness ?? "normal") as string;

  // 姿勢の基準値（cm）
  let base =
    posture === "back"   ? 6.0 :
    posture === "stomach"? 5.0 :
    8.0; // side(横向き)をデフォルト

  // マットレス硬さの補正
  if (firmness === "soft")  base -= 0.5;
  if (firmness === "hard")  base += 0.5;

  // 肩厚の補正
  if (shoulder === "thin")   base -= 0.3;
  if (shoulder === "thick")  base += 0.3;

  // レンジを±0.7cmで提示（好みの幅）
  const min = clamp(base - 0.7, 4.0, 12.0);
  const max = clamp(base + 0.7, 4.0, 12.0);

  return { min: round1(min), max: round1(max), base: round1(base) };
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
function round1(n: number) {
  return Math.round(n * 10) / 10;
} 