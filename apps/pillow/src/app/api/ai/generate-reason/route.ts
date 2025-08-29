import { NextRequest, NextResponse } from 'next/server';
import { generateReasonText } from '@/lib/ai/generateReason';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { problems, loft, firmness, material, budget, extras } = body;

    // 入力値の検証
    if (!problems || !loft || !firmness || !material || !budget) {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      );
    }

    const reasonInput = {
      problems: Array.isArray(problems) ? problems : [problems],
      loft,
      firmness,
      material,
      budget,
      extras
    };

    const aiReason = await generateReasonText(reasonInput);

    return NextResponse.json({ reason: aiReason });
  } catch (error) {
    console.error('AI理由文生成エラー:', error);
    return NextResponse.json(
      { error: 'AI理由文の生成に失敗しました' },
      { status: 500 }
    );
  }
} 