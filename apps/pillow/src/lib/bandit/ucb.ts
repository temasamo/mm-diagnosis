export type Arm = { key: string; impressions: number; clicks: number };

const C = 1.2; // 調整係数（やや探索寄り）

export function ucbScore(a: Arm, total: number) {
  const imp = Math.max(1, a.impressions);
  const mean = a.clicks / imp;
  const bonus = C * Math.sqrt(Math.log(Math.max(2, total)) / imp);
  return mean + bonus;
}

export function selectArm(arms: Arm[]): Arm {
  // 未露出の腕を優先（コールドスタート）
  const cold = arms.find(a => a.impressions === 0);
  if (cold) return cold;

  const total = arms.reduce((s, a) => s + a.impressions, 0) || 1;
  return arms.slice().sort((x, y) => ucbScore(y, total) - ucbScore(x, total))[0];
} 