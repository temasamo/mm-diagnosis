import { warn, err } from '@/lib/util/logger';

export async function fetchWith429<T>(
  task: () => Promise<T>,
  {
    retries = 2,
    baseDelayMs = 500,
    label = 'rakuten',
  }: { retries?: number; baseDelayMs?: number; label?: string } = {}
): Promise<T> {
  let lastErr: any;
  for (let i = 0; i <= retries; i++) {
    try {
      return await task();
    } catch (e: any) {
      const code = e?.status || e?.code;
      const is429 = code === 429 || /429/.test(String(code)) || /too_many/i.test(String(e?.message));
      if (!is429) throw e;
      const delay = baseDelayMs * Math.pow(2, i);
      warn(`[429:${label}] retry ${i + 1}/${retries} in ${delay}ms`);
      await new Promise(r => setTimeout(r, delay));
      lastErr = e;
    }
  }
  err(`[429:${label}] give up after ${retries} retries`);
  throw lastErr;
}
