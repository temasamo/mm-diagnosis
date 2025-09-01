import { NextResponse } from "next/server";
import { selectArm } from "@/lib/bandit/ucb";

const U = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const K = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function loadStats(keys: string[]) {
  const url = new URL(`${U}/rest/v1/rec_bandit_stats`);
  url.searchParams.set("select", "arm_key,impressions,clicks");
  url.searchParams.set("arm_key", `in.(${keys.map(k => `"${k}"`).join(",")})`);
  const r = await fetch(url, { headers: { apikey: K, Authorization: `Bearer ${K}` }});
  if (!r.ok) return [];
  return r.json() as Promise<Array<{ arm_key: string; impressions: number; clicks: number }>>;
}

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const slot = u.searchParams.get("slot") ?? "1";
    const segment = u.searchParams.get("segment") ?? "default";
    const candidates = (u.searchParams.get("candidates") ?? "")
      .split(",").map(s => s.trim()).filter(Boolean);

    if (!candidates.length) {
      return NextResponse.json({ ok: false, error: "no candidates" }, { status: 400 });
    }

    const keys = candidates.map(v => `slot:${slot}|segment:${segment}|variant:${v}`);
    const stats = await loadStats(keys);
    const map = new Map(stats.map(s => [s.arm_key, s]));
    const arms = keys.map(k => ({
      key: k,
      impressions: map.get(k)?.impressions ?? 0,
      clicks: map.get(k)?.clicks ?? 0,
    }));

    const chosen = selectArm(arms);
    return NextResponse.json({ ok: true, arm_key: chosen.key });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "select failed" }, { status: 500 });
  }
} 