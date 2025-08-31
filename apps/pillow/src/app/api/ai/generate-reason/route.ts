import { NextRequest, NextResponse } from 'next/server';
import { generateReason, type Answers } from '@/lib/ai/generateReason';

// route.ts
function normalizeRequest(raw: any) {
  // 新スキーマっぽければそのまま
  if (raw?.posture !== undefined || raw?.postures !== undefined || raw?.turnFreq !== undefined) {
    return raw;
  }
  // 旧スキーマ → マッピング
  const probs: string[] = Array.isArray(raw?.problems) ? raw.problems : [];
  const has = (k: string) => probs.includes(k);

  const concerns = [
    (has("頭痛・偏頭痛持ち") && "headache"),
    (has("いびき") && "snore"),
    (has("へたる") && "flatten"),
    ((has("朝起きると首が痛い") || has("肩こりがひどい")) && "stneck"),
    (has("蒸れる") && "heat"),
  ].filter(Boolean);

  return {
    posture: undefined,          // 旧スキーマでは取れないので未設定（生成側で mixed 扱い）
    postures: [],
    turnFreq: undefined,
    mattress: undefined,
    sweaty: has("蒸れる") || false,
    concerns,
    currentPillowMaterial: raw?.material,
    materialPref: null,
  };
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    console.log("[api] answers.raw", raw);
    
    // API 入口でも受け取れてるか確認
    console.log("[api] answers in", {
      sweaty: raw?.sweaty,
      keys: Object.keys(raw || {})
    });
    
    const payload = normalizeRequest(raw);
    console.log("[api] answers.norm", payload);
    
    // 取りこぼし防止：古い/新しいキーを吸収
    const input = {
      posture: payload.posture,
      postures: payload.postures ?? [],
      turnFreq: payload.turnFreq ?? 'mid',
      mattress: payload.mattress,
      sweaty: !!(payload.sweaty),  // ⬅ そのまま通す
      concerns: payload.concerns ?? [],
    };
    
    const text = await generateReason(input);
    return NextResponse.json({ reason: text });
  } catch (error) {
    console.error('AI理由文生成エラー:', error);
    return NextResponse.json(
      { error: 'AI理由文の生成に失敗しました' },
      { status: 500 }
    );
  }
} 