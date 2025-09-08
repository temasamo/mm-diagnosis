function sleep(ms:number){ return new Promise(r=>setTimeout(r,ms)); }
export async function withRetry<T>(fn:()=>Promise<T>, max=Number(process.env.MALL_RETRY_MAX??3), base=Number(process.env.MALL_RETRY_BASE_MS??300)){
  let lastErr:any;
  for(let i=0;i<max;i++){
    try{ return await fn(); }catch(e:any){
      lastErr=e;
      const status = e?.status || e?.response?.status;
      if(status && status<500 && status!==429) break; // 同期エラー/4xxは即中断（429除く）
      const backoff = base * Math.pow(2,i) + Math.floor(Math.random()*base);
      await sleep(backoff);
    }
  }
  throw lastErr;
}
export class TimeoutError extends Error {}
export function fetchWithTimeout(url:string, opts:RequestInit={}, ms=Number(process.env.MALL_FETCH_TIMEOUT_MS??5000)){
  const ctrl=new AbortController(); const id=setTimeout(()=>ctrl.abort(),ms);
  return fetch(url,{...opts,signal:ctrl.signal}).finally(()=>clearTimeout(id));
}
