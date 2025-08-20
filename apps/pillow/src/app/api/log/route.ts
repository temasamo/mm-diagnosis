export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getServerSupabase } from "../_util/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const supabase = getServerSupabase();
    const { error } = await supabase.from("diagnosis_events").insert({
      app: process.env.NEXT_PUBLIC_APP_NAME ?? "unknown", // 任意
      step: body.step ?? "unknown",
      answers: body.answers ?? null,
      result: body.result ?? null
    });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "unexpected" }, { status: 500 });
  }
} 