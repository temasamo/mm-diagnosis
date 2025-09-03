type Entry<T> = { value: T; exp: number };
const store = new Map<string, Entry<unknown>>();

export function cacheGet<T>(key: string): T | null {
  const e = store.get(key);
  if (!e) return null;
  if (Date.now() > e.exp) { store.delete(key); return null; }
  return e.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number) {
  store.set(key, { value, exp: Date.now() + ttlMs });
} 