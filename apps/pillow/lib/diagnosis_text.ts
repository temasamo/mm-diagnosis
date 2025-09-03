import { recommendMaterial } from "./material_recommend";
import { labelMaterial } from "./materials";

type Height = "low"|"mid"|"high";
type Firm = "soft"|"mid"|"firm";

export function buildDiagnosisText(input: {
  targetLoft: Height;   // 既存 computeSignals の結果
  targetFirm: Firm;
  mattressFirmness?: "soft"|"mid"|"firm"|"unknown";
  answers: any;         // Answers
}) {
  // 既存のsleepingPositionとの互換性を保つ
  let postures = input.answers?.postures;
  if (!Array.isArray(postures) || postures.length === 0) {
    const legacyPos = input.answers?.sleepingPosition;
    if (legacyPos === 'supine' || legacyPos === 'prone' || legacyPos === 'side') {
      postures = [legacyPos];
    } else {
      postures = ['side']; // デフォルト
    }
  }

  const { material, reasons: matReasons } = recommendMaterial(input.answers);

  const heightLabel = input.targetLoft === "low" ? "低め"
                     : input.targetLoft === "high" ? "高め" : "中くらい";
  const firmLabel   = input.targetFirm === "soft" ? "やわらかめ"
                     : input.targetFirm === "firm" ? "しっかりめ" : "標準";

  // マットレス硬さの補足（"AIらしさ"を一文）
  const matt =
    input.mattressFirmness === "firm"   ? "（硬めマットレスのため高さはやや高め寄りで推定）" :
    input.mattressFirmness === "soft"   ? "（柔らかめマットレスに合わせ高さを抑えめに推定）" :
    "";

  const materialLabel = labelMaterial(material);

  const headline = `あなたにおすすめの枕は「高さは${heightLabel}・柔らかさは${firmLabel}・素材は${materialLabel}」タイプです。${matt}`;

  // 理由（3つまで）
  const reasons = [
    `寝姿勢とマットレスの硬さから目標の高さを算出`,
    ...matReasons,
    // posturesフィールドから理由付けタグを追加
    ...(postures?.includes('side') ? ['横向き寝に合う形状'] : []),
    ...(postures?.includes('supine') ? ['仰向け寝の首カーブ対応'] : []),
    ...(postures?.includes('prone') ? ['うつ伏せ派向け薄め/柔らかめ'] : []),
  ].slice(0,3);

  return { headline, reasons, material };
} 