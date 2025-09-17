export type BaseCtx = {
  ts: number;
  session_id: string;
  diag_id?: string;
  rec_set_id?: string;
  page?: string;
  ua?: string;
};

function now(){ return Date.now(); }

export function getSessionId(){
  // クライアントサイドでのみ実行
  if (typeof window === 'undefined') return 'server-session';
  
  try{
    const k='mm.session';
    let v = localStorage.getItem(k);
    if(!v){ v = (globalThis.crypto?.randomUUID?.() ?? `${now()}-${Math.random()}`); localStorage.setItem(k,v); }
    return v;
  }catch{
    return 'no-storage';
  }
}

export async function track(name: string, payload: Record<string, any> = {}){
  // クライアントサイドでのみ実行
  if (typeof window === 'undefined') return;
  
  const ctx: BaseCtx = {
    ts: now(),
    session_id: getSessionId(),
    ua: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    page: typeof location !== 'undefined' ? location.pathname : 'server',
    diag_id: payload?.diag_id,
    rec_set_id: payload?.rec_set_id,
  };

  // 開発時の見える化
  // eslint-disable-next-line no-console
  console.log('[track]', name, { ...ctx, ...payload });

  try{
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ name, ...ctx, payload })
    });
  }catch{
    // 失敗は握り潰し（UXを阻害しない）
  }
}

/** 重複発火防止 */
const fired = new Set<string>();
export function trackOnce(key: string, name: string, payload: Record<string, any> = {}){
  if(fired.has(key)) return;
  fired.add(key);
  void track(name, payload);
} 