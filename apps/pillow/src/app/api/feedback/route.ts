import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      session_id, 
      category_id, 
      action, // 'click', 'purchase', 'skip'
      answers, // 診断時の回答データ
      timestamp = new Date().toISOString()
    } = body;

    // バリデーション
    if (!session_id || !category_id || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Supabaseに保存
    const { data, error } = await supabase
      .from('pillow_feedback')
      .insert({
        session_id,
        category_id,
        action,
        answers: answers || {},
        created_at: timestamp
      });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: "Failed to save feedback" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // 重み調整用の集計データを取得
    const { data: clickData, error: clickError } = await supabase
      .from('pillow_feedback')
      .select('category_id, action, created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // 過去30日

    if (clickError) {
      console.error('Supabase error:', clickError);
      return NextResponse.json(
        { error: "Failed to fetch feedback data" },
        { status: 500 }
      );
    }

    // カテゴリ別のアクション集計
    const categoryStats = clickData.reduce((acc: any, item) => {
      if (!acc[item.category_id]) {
        acc[item.category_id] = { clicks: 0, purchases: 0, skips: 0 };
      }
      acc[item.category_id][item.action + 's']++;
      return acc;
    }, {});

    // 重み調整の計算
    const weightAdjustments = Object.entries(categoryStats).map(([category, stats]: [string, any]) => {
      const total = stats.clicks + stats.purchases + stats.skips;
      const purchaseRate = total > 0 ? stats.purchases / total : 0;
      const clickRate = total > 0 ? stats.clicks / total : 0;
      
      // 購入率が高いカテゴリは重みを上げる
      const adjustment = purchaseRate * 0.1 + clickRate * 0.05;
      
      return {
        category,
        current_weight: 0, // 現在の重み（後で実装）
        adjustment,
        new_weight: 0 + adjustment,
        stats
      };
    });

    return NextResponse.json({ 
      success: true, 
      weightAdjustments,
      total_feedback: clickData.length
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 