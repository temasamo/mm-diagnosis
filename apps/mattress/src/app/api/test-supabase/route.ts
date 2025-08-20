export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getServerSupabase } from '../_util/supabase';

export async function GET() {
  try {
    const supabase = getServerSupabase();
    
    // 簡単なクエリで接続テスト
    const { data, error } = await supabase
      .from('diagnosis_events')
      .select('count')
      .limit(1);
    
    if (error) {
      return NextResponse.json({ 
        error: error.message, 
        code: error.code,
        details: error.details 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      ok: true, 
      message: 'Supabase connection successful',
      data: data 
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ 
      error: msg,
      type: e instanceof Error ? e.constructor.name : typeof e
    }, { status: 500 });
  }
} 