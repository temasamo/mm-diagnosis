import { MallAdapter, MallQuery, RawMallItem } from './adapter';
import { withRetry, fetchWithTimeout } from './retry';

export const rakutenAdapter: MallAdapter = {
  name: 'rakuten',
  isConfigured(){ return !!process.env.RAKUTEN_APP_ID; },
  async search(q: MallQuery){
    const appId=process.env.RAKUTEN_APP_ID!;
    const url=new URL('https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601');
    url.searchParams.set('applicationId', appId);
    url.searchParams.set('keyword', q.q);
    url.searchParams.set('hits', String(q.limit ?? 20));
    if(q.budgetMin) url.searchParams.set('minPrice', String(q.budgetMin));
    if(q.budgetMax) url.searchParams.set('maxPrice', String(q.budgetMax));

    const run = async()=> {
      const res = await fetchWithTimeout(url.toString(), {}, Number(process.env.MALL_FETCH_TIMEOUT_MS));
      if(!res.ok) { const err:any=new Error('rakuten error'); err.status=res.status; throw err; }
      const json:any = await res.json();
      const items: RawMallItem[] = (json.Items ?? []).map((wrap:any)=>{
        const it = wrap.Item;
        
        // アフィリエイトURLの有効性をチェック
        let url = '';
        if (it.affiliateUrl && it.affiliateUrl.includes('item.rakuten.co.jp')) {
          url = it.affiliateUrl;
        } else if (it.itemUrl) {
          url = it.itemUrl;
        }
        
        return {
          id: String(it.itemCode),
          title: it.itemName,
          url: url,
          price: Number(it.itemPrice),
          image: it.mediumImageUrls?.[0]?.imageUrl?.replace('?_ex=128x128','') ?? undefined,
          mall: 'rakuten'
        };
      });
      return items;
    };

    return withRetry(run);
  }
};
