import 'server-only';
import OpenAI from "openai";

type ReasonInput = {
  problems: string[];            // 例: ["首が痛い","蒸れる"]
  loft: string;                  // 例: "中くらい"
  firmness: string;              // 例: "標準"
  material: string;              // 例: "パイプ" / "ラテックス" など
  budget: string;                // 例: "6,000円〜10,000円"
  extras?: { age_band?: string; gender?: string }; // 将来用（未使用でもOK）
};

const FALLBACK = (i: ReasonInput) =>
  `あなたの回答から、首の支えと通気性の両立が重要と判断しました。${i.loft}の高さ・${i.firmness}の硬さに${i.material}素材を組み合わせることで、負担の分散とムレ対策の両面で改善が期待できます。`;

export async function generateReasonText(input: ReasonInput): Promise<string> {
  // 環境変数による切り替え機能
  const enableAiReason = process.env.PILLOW_ENABLE_AI_REASON !== 'false';
  if (!enableAiReason) return FALLBACK(input);

  // 安全装置：キー未設定・ビルド時でも落とさない
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return FALLBACK(input);

  const client = new OpenAI({ apiKey });

  const prompt = `
あなたは睡眠の専門AIです。以下の診断結果をもとに、ユーザーにパーソナルな診断理由を説明してください。

診断結果:
- 主なお悩み: ${input.problems.length ? input.problems.join("、") : "特になし"}
- 推奨される枕の高さ: ${input.loft}
- 硬さ: ${input.firmness}
- 素材: ${input.material}
- 予算帯: ${input.budget}

出力条件:
1. 日本語で100〜150文字程度
2. 「あなた」という呼びかけを含める
3. 科学的・実用的な根拠を1つ入れる（例: 首をしっかり支える、通気性がよい 等）
4. 医療断定は避け、「〜しやすい」「〜が期待できます」と表現
`;

  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 220,
      temperature: 0.7,
    });
    const text = res.choices[0]?.message?.content?.trim();
    return text && text.length > 30 ? text : FALLBACK(input);
  } catch {
    return FALLBACK(input);
  }
} 