import { MallAdapter, MallQuery, RawMallItem } from './adapter';
import { rakutenAdapter } from './rakuten';
import { yahooAdapter } from './yahoo';
import { getCache, setCache, keyOf } from './cache';

const adapters: MallAdapter[] = [rakutenAdapter, yahooAdapter];

export type MallSearchResult = { items: RawMallItem[]; offline: boolean; fromCache?: boolean };

export async function mallSearchAll(q: MallQuery): Promise<MallSearchResult> {
  const enabled = adapters.filter(a=>a.isConfigured());
  const cacheKey = 'all:' + keyOf(q);

  if(process.env.MALL_RESILIENCE==='1'){
    const cached = getCache<MallSearchResult>(cacheKey);
    if(cached) return {...cached, fromCache:true};
  }

  const ctrl = new AbortController();
  const totalTimeout = setTimeout(()=>ctrl.abort(), Number(process.env.MALL_TOTAL_TIMEOUT_MS ?? 9000));

  try{
    const results = await Promise.allSettled(enabled.map(a=>a.search(q, ctrl.signal)));
    const items = results.flatMap(r => r.status==='fulfilled' ? r.value : []);
    clearTimeout(totalTimeout);

    if(items.length>0 && process.env.MALL_RESILIENCE==='1'){
      const res = { items, offline:false };
      setCache(cacheKey, res);
      return res;
    }

    // 失敗 or 0件 → キャッシュ/スタブへ
    const cached = getCache<MallSearchResult>(cacheKey);
    if(cached) return {...cached, offline:true, fromCache:true};
    return { items: [], offline: true };
  } catch(_e){
    clearTimeout(totalTimeout);
    const cached = getCache<MallSearchResult>(cacheKey);
    if(cached) return {...cached, offline:true, fromCache:true};
    return { items: [], offline:true };
  }
}
