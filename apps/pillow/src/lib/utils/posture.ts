export type Posture = "side" | "supine" | "prone";

/**
 * 姿勢配列から派生姿勢を計算
 * @param arr 姿勢配列
 * @returns 0件=undefined / 1件=その値 / 2件以上="mixed"
 */
export function derivePosture(arr?: Posture[]) {
  if (!arr || arr.length === 0) return undefined;
  return arr.length === 1 ? arr[0] : "mixed";
} 