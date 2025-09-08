// 簡易メモリキャッシュ（プロセス単位）; 本番はEdge KV/Supabaseに差し替え可
const TTL = Number(process.env.MALL_CACHE_TTL_S ?? 1800) * 1000;
type Entry<T> = { value: T; exp: number };
const mem = new Map<string, Entry<any>>();
export function getCache<T>(key:string): T|undefined {
  const ent = mem.get(key); if(!ent) return;
  if(Date.now()>ent.exp){ mem.delete(key); return; }
  return ent.value as T;
}
export function setCache<T>(key:string, value:T){ mem.set(key,{value,exp:Date.now()+TTL}); }
export function keyOf(q:any){ return JSON.stringify(q); }
