import { rakutenAdapter } from '../../../../server/mall/rakuten';
import { yahooAdapter } from '../../../../server/mall/yahoo';

export async function GET() {
  const conf = {
    rakuten: rakutenAdapter.isConfigured(),
    yahoo: yahooAdapter.isConfigured(),
  };
  return Response.json({
    configured: conf,
    flags: {
      MALL_RESILIENCE: process.env.MALL_RESILIENCE ?? '0',
      RETRY_MAX: process.env.MALL_RETRY_MAX ?? '3',
      FETCH_TIMEOUT_MS: process.env.MALL_FETCH_TIMEOUT_MS ?? '5000',
      TOTAL_TIMEOUT_MS: process.env.MALL_TOTAL_TIMEOUT_MS ?? '9000',
    }
  }, { headers: { 'Cache-Control': 'no-store' }});
}
