import { MallAdapter, MallQuery, RawMallItem } from './adapter';
import { withRetry, fetchWithTimeout } from './retry';

export const yahooAdapter: MallAdapter = {
  name: 'yahoo',
  isConfigured(){ return !!process.env.YAHOO_APP_ID; },
  async search(q: MallQuery){
    const appId=process.env.YAHOO_APP_ID!;
    const url=new URL('https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch');
    url.searchParams.set('appid', appId);
    url.searchParams.set('query', q.q);
    url.searchParams.set('hits', String(q.limit ?? 20));
    if(q.budgetMin) url.searchParams.set('price_from', String(q.budgetMin));
    if(q.budgetMax) url.searchParams.set('price_to', String(q.budgetMax));

    const run = async()=> {
      const res = await fetchWithTimeout(url.toString());
      if(!res.ok){ const err:any=new Error('yahoo error'); err.status=res.status; throw err; }
      const json:any = await res.json();
      const items: RawMallItem[] = (json.hits ?? []).map((it:any)=>({
        id: String(it.code ?? it.id),
        title: it.name,
        url: it.url,
        price: Number(it.price),
        image: it.image?.medium ?? it.image?.small ?? undefined,
        mall: 'yahoo'
      }));
      return items;
    };

    return withRetry(run);
  }
};
