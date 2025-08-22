import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 追加: 自由記述の保存
    if (body?.type === 'best_pillow_note' && typeof body?.note === 'string') {
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        console.warn('supabase client not configured');
        return NextResponse.json({ ok: true });
      }
      const payload = {
        note: body.note.slice(0, 2000),
        session_id: body.sessionId ?? null,
        user_agent: req.headers.get('user-agent'),
        source: 'freeform',
        created_at: new Date().toISOString(),
      };
      // テーブル: pillow_feedback（id, created_at, session_id, note, source, user_agent）
      await supabase.from('pillow_feedback').insert(payload);
      return NextResponse.json({ ok: true });
    }

    // 既存ロジック（汎用）
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 503 }
      );
    }

    const { data, error } = await supabase.from('feedback').insert({
      payload: body,
      created_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id: data?.[0]?.id ?? null });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 200 }); // UIは失敗でも進める
  }
} 