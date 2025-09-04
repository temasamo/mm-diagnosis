import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isValidAbsoluteHttpUrl(s: string) {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get('url');
  const mall = (req.nextUrl.searchParams.get('mall') || '').toLowerCase();

  if (!urlParam) {
    return new NextResponse('Missing "url" query parameter', { status: 400 });
  }
  if (!isValidAbsoluteHttpUrl(urlParam)) {
    return new NextResponse('Invalid absolute URL', { status: 400 });
  }

  let dest = urlParam;

  // Yahoo は ValueCommerce 経由に強制（SID/PID は本番の環境変数に設定済み前提）
  if (mall === 'yahoo') {
    const sid = process.env.VC_SID;
    const pid = process.env.VC_PID;
    if (sid && pid) {
      dest =
        `https://ck.jp.ap.valuecommerce.com/servlet/referral` +
        `?sid=${encodeURIComponent(sid)}&pid=${encodeURIComponent(pid)}` +
        `&vc_url=${encodeURIComponent(urlParam)}`;
    }
  }
  // 楽天は search 側で affiliateId 付き URL を返す想定。素の URL でもそのまま通す。

  const res = NextResponse.redirect(dest, 302);
  res.headers.set('cache-control', 'no-store');
  return res;
}
