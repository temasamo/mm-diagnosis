import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { brief } = await req.json(); // 例: { brief: "高さ:標準, 硬さ:普通, 主訴:首こり" }
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return NextResponse.json({ text: "首を支える枕が良い" }, { status: 200 });
    }

    // OpenAI Chat Completions
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "あなたは枕と睡眠の世界的権威。日本語で助言。20文字以内、専門的かつ簡潔、句読点最少。" },
          { role: "user", content: `ユーザー要約: ${brief}\n15〜20文字で一言アドバイス` }
        ],
        temperature: 0.2,
        max_tokens: 60,
      })
    });

    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() || "首圧分散を優先";
    // 20字超なら丸め
    const clipped = [...text].slice(0, 20).join("");
    return NextResponse.json({ text: clipped }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ text: "首圧分散を優先" }, { status: 200 });
  }
} 