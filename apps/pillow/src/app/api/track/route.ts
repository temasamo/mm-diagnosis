import { NextResponse } from 'next/server';

export async function POST(req: Request){
  try{
    const body = await req.json();
    const { name, payload } = body || {};
    if(!name || typeof payload !== 'object'){
      return NextResponse.json({ ok:false, error:'invalid payload' }, { status:400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if(!supabaseUrl || !serviceKey){
      return NextResponse.json({ ok:false, error:'supabase env missing' }, { status:500 });
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/events`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify([{
        ts: new Date().toISOString(),
        session_id: body.session_id ?? 'unknown',
        diag_id: body.diag_id ?? null,
        rec_set_id: body.rec_set_id ?? null,
        name,
        payload,
        algo_version: body.algo_version ?? null,
        page: body.page ?? null,
        ua: body.ua ?? null
      }])
    });

    if(!res.ok){
      const t = await res.text();
      return NextResponse.json({ ok:false, error:`supabase insert failed: ${t}` }, { status:500 });
    }

    const json = await res.json();
    return NextResponse.json({ ok:true, data: json });
  }catch(e:any){
    return NextResponse.json({ ok:false, error: e?.message ?? 'unknown' }, { status:500 });
  }
} 