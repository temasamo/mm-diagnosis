import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  // TODO: Supabase 連携。今はログだけ残す。
  console.log("[track]", body);
  return NextResponse.json({ ok: true });
} 