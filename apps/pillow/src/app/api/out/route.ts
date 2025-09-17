// apps/pillow/src/app/api/out/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const enc = (s: string) => encodeURIComponent(s);

function isValidAbsoluteHttpUrl(s: string) {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// 公式クエリを除去してクリーンな商品URLに
function sanitizeRakutenUrl(raw: string) {
  const u = new URL(raw);
  ["rafcid", "scid", "sc2id", "linkCode", "icm_agid", "icm_cid"].forEach((k) =>
    u.searchParams.delete(k)
  );
  return u.origin + u.pathname + (u.searchParams.toString() ? `?${u.searchParams}` : "");
}

const ALLOWED_HOSTS = new Set<string>([
  // 商品ページ（素のURL）
  "item.rakuten.co.jp",
  "search.rakuten.co.jp",
  "shopping.yahoo.co.jp",
  "store.shopping.yahoo.co.jp",
  // アフィリエイト遷移先（ラッパー）
  "af.moshimo.com",
  "ck.jp.ap.valuecommerce.com",
  // 誤って渡ってくることがある楽天公式ラッパー
  "hb.afl.rakuten.co.jp",
]);

function isAllowedHost(u: URL) {
  return ALLOWED_HOSTS.has(u.host);
}

// hb.afl の pc= に入っている元URLを取り出す
function tryExtractRakutenPcParam(aflUrl: URL): string | null {
  const pc = aflUrl.searchParams.get("pc") || aflUrl.searchParams.get("m");
  return pc ? decodeURIComponent(pc) : null;
}

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get("url");
  const mall = (req.nextUrl.searchParams.get("mall") || "").toLowerCase();

  if (!urlParam) return new NextResponse('Missing "url"', { status: 400 });
  if (!isValidAbsoluteHttpUrl(urlParam)) return new NextResponse("Invalid URL", { status: 400 });

  // hb.afl を素URLに戻す → 公式トラッキング系を除去
  let targetUrl = urlParam;
  const first = new URL(urlParam);
  if (first.host === "hb.afl.rakuten.co.jp") {
    const orig = tryExtractRakutenPcParam(first);
    if (orig && isValidAbsoluteHttpUrl(orig)) targetUrl = orig;
  }
  if (new URL(targetUrl).host.endsWith("rakuten.co.jp")) {
    targetUrl = sanitizeRakutenUrl(targetUrl);
  }

  const target = new URL(targetUrl);
  if (!isAllowedHost(target)) return new NextResponse("Host not allowed", { status: 400 });

  let dest = target.toString();

  if (mall === "yahoo") {
    // ValueCommerce 固定
    const prefix = process.env.NEXT_PUBLIC_VC_YAHOO_PREFIX;
    const sid = process.env.YAHOO_VC_SID;
    const pid = process.env.YAHOO_VC_PID;
    if (prefix && sid && pid) {
      dest = `${prefix}${enc(target.toString())}`;
    } else if (process.env.NEXT_PUBLIC_YAHOO_DIRECT_BASE) {
      dest = `${process.env.NEXT_PUBLIC_YAHOO_DIRECT_BASE}${enc(target.toString())}`;
    }
  } else if (mall === "rakuten") {
    // もしも or 公式（将来切替用）
    const provider = process.env.RAKUTEN_AFF_PROVIDER; // "moshimo" | "official"
    if (provider === "moshimo") {
      const moshi = process.env.NEXT_PUBLIC_MOSHI_RAKUTEN_PREFIX;
      if (moshi) dest = `${moshi}${enc(target.toString())}`;
    } else if (provider === "official") {
      const entrance = process.env.NEXT_PUBLIC_RAKUTEN_ENTRANCE_URL;
      if (entrance) dest = `${entrance}${enc(target.toString())}`;
    }
    if (dest === target.toString() && process.env.NEXT_PUBLIC_RAKUTEN_DIRECT_BASE) {
      dest = `${process.env.NEXT_PUBLIC_RAKUTEN_DIRECT_BASE}${enc(target.toString())}`;
    }
  }

  const res = NextResponse.redirect(dest, 302);
  res.headers.set("cache-control", "no-store");
  return res;
}

