import { NextRequest, NextResponse } from 'next/server';
import { generateReason } from '@/lib/ai/generateReason';
import type { Answers } from '../../../../../lib/recommend/buildProblemList';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const answers: Answers = body;

    // 基本的な入力値の検証
    if (!answers) {
      return NextResponse.json(
        { error: '診断データが不足しています' },
        { status: 400 }
      );
    }

    const aiReason = await generateReason(answers);

    return NextResponse.json({ reason: aiReason });
  } catch (error) {
    console.error('AI理由文生成エラー:', error);
    return NextResponse.json(
      { error: 'AI理由文の生成に失敗しました' },
      { status: 500 }
    );
  }
} 