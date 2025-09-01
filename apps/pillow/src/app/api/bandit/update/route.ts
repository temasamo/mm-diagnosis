import { NextResponse } from "next/server";

const U = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const K = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
  try {
    const { arm_key, event } = await req.json();
    if (!arm_key || !["imp", "click"].includes(event)) {
      return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
    }
    const body = {
      p_arm: arm_key,
      p_imp: event === "imp" ? 1 : 0,
      p_click: event === "click" ? 1 : 0,
    };
    const r = await fetch(`${U}/rest/v1/rpc/rec_bandit_add`, {
      method: "POST",
      headers: {
        apikey: K,
        Authorization: `Bearer ${K}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const t = await r.text();
      return NextResponse.json({ ok: false, error: `rpc failed: ${t}` }, { status: 500 });
    }
    const data = await r.json();
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "update failed" }, { status: 500 });
  }
} 