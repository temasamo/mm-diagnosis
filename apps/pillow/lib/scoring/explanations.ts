import type { CategoryId } from "./config";
import { CATEGORY_LABEL } from "./config";

export type ExplanationTemplate = {
  title: string;
  description: string;
  benefits: string[];
  considerations: string[];
};

export const EXPLANATION_TEMPLATES: Record<CategoryId, ExplanationTemplate> = {
  "low-loft": {
    title: "低め枕があなたに合う理由",
    description: "あなたの睡眠スタイルと体の特徴から、低めの枕が最適だと判断しました。",
    benefits: [
      "首の自然な角度を保ち、頸椎への負担を軽減",
      "寝返りがしやすく、睡眠中の姿勢変化に対応",
      "肩こりや首の痛みを軽減する効果が期待できます"
    ],
    considerations: [
      "横向き寝の場合は少し物足りない可能性があります",
      "高反発マットレスとの組み合わせで効果が増します"
    ]
  },
  "mid-loft": {
    title: "標準高さの枕があなたに合う理由",
    description: "バランスの取れた睡眠スタイルのあなたには、標準高さの枕が最適です。",
    benefits: [
      "様々な睡眠姿勢に対応できる汎用性",
      "首と肩の自然な位置関係をサポート",
      "長期間使用しても疲れにくい設計"
    ],
    considerations: [
      "個人差があるため、実際の使用感で調整が必要な場合があります",
      "マットレスの硬さによって最適な高さが変わることがあります"
    ]
  },
  "high-loft": {
    title: "高め枕があなたに合う理由",
    description: "あなたの体型と睡眠スタイルから、高めの枕が最適だと判断しました。",
    benefits: [
      "横向き寝での首の自然な角度をサポート",
      "肩幅に合わせた適切な高さで安定感を提供",
      "首の痛みや肩こりの軽減効果が期待できます"
    ],
    considerations: [
      "仰向け寝の場合は少し高すぎる可能性があります",
      "寝返りが多い場合は調整機能付きがおすすめです"
    ]
  },
  "side-contour": {
    title: "横向きサポート枕があなたに合う理由",
    description: "横向き寝が主なあなたには、専用のサポート枕が最適です。",
    benefits: [
      "横向き寝に特化した設計で首の角度を最適化",
      "波型やサイド高設計で安定した姿勢をサポート",
      "肩こりや首の痛みを大幅に軽減する効果が期待できます"
    ],
    considerations: [
      "仰向け寝の場合は専用の枕が必要になる場合があります",
      "寝返りが多い場合は調整機能付きがおすすめです"
    ]
  },
  "back-contour": {
    title: "頸椎サポート枕があなたに合う理由",
    description: "首や肩の症状があるあなたには、頸椎をサポートする枕が最適です。",
    benefits: [
      "頸椎の自然なカーブをサポートし、首の痛みを軽減",
      "ストレートネックの改善効果が期待できます",
      "朝の首の痛みや頭痛を軽減する効果があります"
    ],
    considerations: [
      "初期は少し硬く感じる場合がありますが、徐々に慣れます",
      "医療用の設計のため、他の枕より高価になる場合があります"
    ]
  },
  "adjustable": {
    title: "高さ調整枕があなたに合う理由",
    description: "様々な睡眠姿勢や好みの変化に対応できる調整機能付き枕が最適です。",
    benefits: [
      "睡眠姿勢や好みに合わせて高さを自由に調整可能",
      "季節や体調の変化にも対応できる柔軟性",
      "家族で共有しても個人に合わせて調整できます"
    ],
    considerations: [
      "初期設定に時間がかかる場合があります",
      "詰め物の管理が必要になります"
    ]
  },
  "cooling": {
    title: "冷感・通気枕があなたに合う理由",
    description: "暑がりや汗かきのあなたには、放熱・通気機能付きの枕が最適です。",
    benefits: [
      "睡眠中の発汗を軽減し、快適な睡眠環境を提供",
      "通気性により蒸れを防ぎ、清潔さを維持",
      "夏場でも快適に使用できる設計"
    ],
    considerations: [
      "冬場は少し冷たく感じる場合があります",
      "定期的な洗濯が必要になります"
    ]
  },
  "firm-support": {
    title: "高反発・硬め枕があなたに合う理由",
    description: "しっかりとした支持を求めるあなたには、高反発の枕が最適です。",
    benefits: [
      "首と頭をしっかりとサポートし、安定感を提供",
      "頸椎の自然な角度を維持し、首の痛みを軽減",
      "長期間使用してもへたりにくい耐久性"
    ],
    considerations: [
      "初期は硬く感じる場合がありますが、徐々に慣れます",
      "やわらかめのマットレスとの組み合わせがおすすめです"
    ]
  },
  "soft-plush": {
    title: "低反発・やわらか枕があなたに合う理由",
    description: "やわらかさを求めるあなたには、低反発の枕が最適です。",
    benefits: [
      "頭と首をやさしく包み込み、リラックス効果を提供",
      "体圧分散により、肩や首への負担を軽減",
      "寝返りがしやすく、自然な睡眠姿勢をサポート"
    ],
    considerations: [
      "硬めのマットレスとの組み合わせがおすすめです",
      "定期的な交換が必要になる場合があります"
    ]
  },
  "natural-fill": {
    title: "自然素材枕があなたに合う理由",
    description: "自然な素材を求めるあなたには、そば殻や羽毛の枕が最適です。",
    benefits: [
      "自然素材の通気性により、快適な睡眠環境を提供",
      "体に優しい素材で、アレルギー体質の方にも安心",
      "長年愛用されている実績のある素材"
    ],
    considerations: [
      "定期的な天日干しや洗濯が必要になります",
      "初期は素材の匂いが気になる場合があります"
    ]
  }
};

// パーソナライズされた説明を生成
export function generatePersonalizedExplanation(
  category: CategoryId,
  userAnswers: Record<string, any>
): string {
  const template = EXPLANATION_TEMPLATES[category];
  if (!template) return "";

  let explanation = template.description + "\n\n";

  // ユーザーの回答に基づいて説明をカスタマイズ
  if (userAnswers.posture === "side" && category === "side-contour") {
    explanation += "特に横向き寝が主なあなたには、波型やサイド高設計が首の自然な角度を保つのに効果的です。\n\n";
  }

  if (userAnswers.neck_shoulder_issues?.includes("am_neck_pain") && category === "back-contour") {
    explanation += "朝起きると首が痛いという症状があるあなたには、頸椎サポート機能が特に効果的です。\n\n";
  }

  if (userAnswers.heat_sweat === "yes" && category === "cooling") {
    explanation += "暑がり・汗かきのあなたには、放熱・通気機能が睡眠の質向上に大きく貢献します。\n\n";
  }

  if (userAnswers.adjustable_pref === "want_adjustable" && category === "adjustable") {
    explanation += "高さ調整を希望するあなたには、詰め物の増減で細かく調整できる機能が最適です。\n\n";
  }

  return explanation;
}

// 複数カテゴリの組み合わせ説明
export function generateCombinedExplanation(
  categories: CategoryId[],
  userAnswers: Record<string, any>
): string {
  if (categories.length === 0) return "";

  const primaryCategory = categories[0];
  const template = EXPLANATION_TEMPLATES[primaryCategory];
  
  let explanation = `あなたの診断結果では、${template.title.replace("があなたに合う理由", "")}が最も適していると判断しました。\n\n`;

  // 複数カテゴリの組み合わせ効果を説明
  if (categories.includes("adjustable") && categories.includes("side-contour")) {
    explanation += "横向きサポート機能と高さ調整機能の組み合わせにより、より細かくあなたの睡眠スタイルに合わせることができます。\n\n";
  }

  if (categories.includes("cooling") && categories.includes("firm-support")) {
    explanation += "しっかりとした支持力と冷感機能の組み合わせで、快適さと安定感の両方を実現できます。\n\n";
  }

  explanation += "以下のおすすめポイントを参考に、実際の使用感で最適な枕をお選びください。";

  return explanation;
}

// 簡潔な説明（モバイル用）
export function generateShortExplanation(category: CategoryId): string {
  const template = EXPLANATION_TEMPLATES[category];
  if (!template) return "";

  return `${template.title}\n${template.benefits[0]}`;
} 