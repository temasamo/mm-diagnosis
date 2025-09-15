// スロットリング: 連続呼び出し間隔を保証（モール別に1スロット）
export function makeThrottler(minIntervalMs: number) {
  let last = 0;
  return async <T>(task: () => Promise<T>): Promise<T> => {
    const now = Date.now();
    const wait = Math.max(0, minIntervalMs - (now - last));
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    const res = await task();
    last = Date.now();
    return res;
  };
}

// 429/5xx 対応の指数バックオフ（+ジッター）
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  {
    retries = 3,
    baseMs = 400,
    isRetryable = (e: any) =>
      e?.status === 429 || (e?.status >= 500 && e?.status < 600)
  }: { retries?: number; baseMs?: number; isRetryable?: (e: any) => boolean } = {}
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (e: any) {
      if (attempt >= retries || !isRetryable(e)) throw e;
      const jitter = Math.random() * 120;
      const delay = Math.round(baseMs * Math.pow(2, attempt) + jitter);
      await new Promise(r => setTimeout(r, delay));
      attempt++;
    }
  }
}
