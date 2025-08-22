export const runtime = "nodejs"; // Edgeだと一部fetch挙動が不安定なため
export const dynamic = "force-dynamic"; // 常に生リクエスト

import { NextResponse } from "next/server";

function withTimeout<T>(p: Promise<T>, ms = 7000) {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
  ]) as Promise<T>;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const limit = Number(searchParams.get("limit") || "6");
  const debug = searchParams.get("debug") === "1" || process.env.NEXT_PUBLIC_DEBUG_MALL === "1";
  const mallFilter = (searchParams.get("mall") || "").toLowerCase(); // "rakuten" | "yahoo" | "amazon" | ""

  const enableAmazon = process.env.ENABLE_AMAZON === "1";

  // 実アダプタ（存在しなければ安全に空配列）
  let rakuten: any, yahoo: any; // Removed amazon
  try { rakuten = await import("../../../../lib/malls/rakuten"); } catch {}
  try { yahoo   = await import("../../../../lib/malls/yahoo"); } catch {}

  const jobs: Promise<any[]>[] = [];
  const tasks: { name: string; p: Promise<any[]> }[] = [];
  if (rakuten?.searchRakuten && (!mallFilter || mallFilter === "rakuten"))
    tasks.push({ name: "rakuten", p: rakuten.searchRakuten(q, limit) });
  if (yahoo?.searchYahoo && (!mallFilter || mallFilter === "yahoo"))
    tasks.push({ name: "yahoo",   p: yahoo.searchYahoo(q, limit) });
  // Removed amazon?.searchAmazon
  for (const t of tasks) jobs.push(t.p);

  if (jobs.length === 0) {
    // 何も無ければモックを返す（開発継続用）
    const slug = q.replace(/\s+/g, "-").slice(0, 40) || "q";
    const mock = Array.from({ length: limit }).map((_, i) => ({
      id: `mock-${slug}-${i}`,
      title: `[mock] ${q} #${i + 1}`,
      url: `https://example.com/mock?q=${encodeURIComponent(q)}&i=${i}`,
      image: null,
      price: null,
      mall: "mock",
      shop: null,
    }));
    return NextResponse.json(mock);
  }

  const settled = await Promise.allSettled(jobs.map(j => withTimeout(j, 7000)));
  const items = settled.flatMap((s, i) => {
    const name = tasks[i]?.name ?? `m${i}`;
    if (s.status === "fulfilled") {
      if (debug) console.log(`[search-cross] ${name}: ${s.value.length} items for "${q}"`);
      return s.value;
    } else {
      console.warn(`[search-cross] ${name} failed:`, s.reason);
      return [];
    }
  });

  // デデュープ
  const seen = new Set<string>();
  const uniq = items.filter((p: any) => {
    const k = p.url || p.title;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  return NextResponse.json(uniq.slice(0, limit));
} 