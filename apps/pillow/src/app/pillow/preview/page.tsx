"use client";
import { useSearchParams, useRouter } from 'next/navigation';

export default function Page() {
  const sp = useSearchParams();
  const router = useRouter();
  const c = sp.get('c') ?? '';
  const s = sp.get('s') ?? '0';
  const h = sp.get('h') ?? '0';

  function setParam(key: 's'|'h', val: '0'|'1') {
    const qs = new URLSearchParams(sp.toString());
    qs.set(key, val);
    router.replace(`/pillow/preview?${qs.toString()}`); // 自ページにGET反映
  }

  function goResult() {
    const qs = new URLSearchParams({ c, s, h });
    router.push(`/pillow/result?${qs.toString()}`);
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h2 className="text-xl font-semibold">最後に、教えてください</h2>
      <div className="space-y-4">
        <fieldset>
          <legend>いびき</legend>
          <div className="flex gap-3">
            <button 
              className={`px-4 py-2 rounded border ${s==='0'?'bg-blue-500 text-white':'bg-gray-100'}`} 
              onClick={()=>setParam('s','0')}
            >
              気にならない
            </button>
            <button 
              className={`px-4 py-2 rounded border ${s==='1'?'bg-blue-500 text-white':'bg-gray-100'}`} 
              onClick={()=>setParam('s','1')}
            >
              気になる
            </button>
          </div>
        </fieldset>
        <fieldset>
          <legend>暑がり</legend>
          <div className="flex gap-3">
            <button 
              className={`px-4 py-2 rounded border ${h==='0'?'bg-blue-500 text-white':'bg-gray-100'}`} 
              onClick={()=>setParam('h','0')}
            >
              いいえ
            </button>
            <button 
              className={`px-4 py-2 rounded border ${h==='1'?'bg-blue-500 text-white':'bg-gray-100'}`} 
              onClick={()=>setParam('h','1')}
            >
              はい
            </button>
          </div>
        </fieldset>
      </div>

      <div className="flex items-center gap-3">
        <a className="px-4 py-2 rounded border" href={`/pillow/preview?c=${c}&s=${s}&h=${h}`}>反映</a>
        <button className="px-5 py-2 rounded bg-black text-white" onClick={goResult}>診断結果へ</button>
      </div>
    </main>
  );
}
