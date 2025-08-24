import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { profile } = await req.json();
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    // キーが無ければ黙って空文字で返す（画面側は非表示）
    if (!apiKey) return NextResponse.json({ comment: "" });

    const openai = new OpenAI({ apiKey });

    const hintLines: string[] = [];
    if (profile?.height) hintLines.push(`高さ: ${profile.height}`);
    if (profile?.firmness) hintLines.push(`硬さ: ${profile.firmness}`);
    if (profile?.material) hintLines.push(`素材: ${profile.material}`);
    if (profile?.posture) hintLines.push(`姿勢: ${profile.posture}`);
    if (Array.isArray(profile?.complaints) && profile.complaints.length) {
      hintLines.push(`悩み: ${profile.complaints.join(" / ")}`);
    }

    const system = `あなたは枕と睡眠に関する世界的権威です。日本語で、15文字以内の短い励まし・示唆を返してください。句点は不要。絵文字・顔文字は使わない。誇張や医療断定は禁止。`;
    const user = `ユーザー概要:
${hintLines.join("\n") || "情報なし"}
→ ユーザーに向けた一言（15文字以内）を返答。`;

    const resp = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.5,
      max_tokens: 50,
    });

    let comment =
      resp.choices?.[0]?.message?.content?.trim()?.replaceAll("\n", "") || "";

    // 念のため15文字にトリム（全角想定でざっくり）
    if (comment.length > 15) comment = comment.slice(0, 15);

    return NextResponse.json({ comment });
  } catch (e) {
    // 失敗時は静かに空文字
    return NextResponse.json({ comment: "" });
  }
} 