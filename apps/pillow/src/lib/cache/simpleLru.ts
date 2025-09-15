type Key = string;
export function makeSimpleLru<T>(limit = 100, ttlMs = 10 * 60 * 1000) {
  const map = new Map<Key, { v: T; t: number }>();
  const makeKey = (parts: any[]) => JSON.stringify(parts);

  return {
    key: makeKey,
    get(parts: any[]): T | undefined {
      const k = makeKey(parts);
      const hit = map.get(k);
      if (!hit) return;
      if (Date.now() - hit.t > ttlMs) { map.delete(k); return; }
      // promote
      map.delete(k); map.set(k, hit);
      return hit.v;
    },
    set(parts: any[], v: T) {
      const k = makeKey(parts);
      if (map.has(k)) map.delete(k);
      map.set(k, { v, t: Date.now() });
      if (map.size > limit) {
        const first = map.keys().next().value;
        map.delete(first);
      }
    }
  };
}
