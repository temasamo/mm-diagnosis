import { useDiagStore } from '../../../../lib/state/diagStore';

function ensureItems(pe: any) {
  // 今はそのまま返す。将来 items=0 のときランキング1件を補うならここで加工。
  return pe;
}

export async function fetchRecommendAndStore(body: any) {
  try {
    const res = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    });

    let json: any = null;
    try {
      json = await res.json();            // 500でもJSONが返れば読む
    } catch (e) {
      console.error('recommend parse failed', e);
    }

    if (!res.ok) {
      console.error('recommend fetch failed', res.status);
    }

    // primaryExplain が無ければ null で埋める（UIは非表示になる）
    useDiagStore.getState().setPrimaryExplain(json?.primaryExplain ?? null);
    return json;
  } catch (e) {
    console.error('recommend fetch failed (network)', e);
    useDiagStore.getState().setPrimaryExplain(null);
    return null;
  }
}
