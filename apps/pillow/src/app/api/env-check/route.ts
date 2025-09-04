export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
export async function GET() {
  // 楽天・YahooのAPI設定をチェック
  const hasRakutenAppId = !!process.env.RAKUTEN_APP_ID && process.env.RAKUTEN_APP_ID!.length > 10;
  const hasYahooAppId = !!process.env.YAHOO_APP_ID && process.env.YAHOO_APP_ID!.length > 10;
  
  return NextResponse.json({ 
    ok: hasRakutenAppId || hasYahooAppId, 
    hasUrl: hasRakutenAppId || hasYahooAppId, 
    hasKey: hasRakutenAppId || hasYahooAppId,
    rakuten: hasRakutenAppId,
    yahoo: hasYahooAppId
  });
}
