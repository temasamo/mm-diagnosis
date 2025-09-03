export async function fetchJsonWithRetry<T>(url: string, init: RequestInit = {}, retry = 3): Promise<T> {
  let wait = 400;
  for (let i = 0; i <= retry; i++) {
    const res = await fetch(url, { ...init, cache: 'no-store' });
    if (res.ok) return res.json() as Promise<T>;
    if (res.status === 429 || res.status >= 500) {
      if (i === retry) throw new Error(`fetch failed ${res.status}: ${await res.text()}`);
      await new Promise(r => setTimeout(r, wait));
      wait *= 2;
      continue;
    }
    throw new Error(`fetch failed ${res.status}: ${await res.text()}`);
  }
  throw new Error('unreachable');
} 