import { useDiagStore } from '@/lib/state/diagStore';

export async function fetchRecommendAndStore(profile: any) {
  const res = await fetch('/api/recommend', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    cache: 'no-store',                           // ★ キャッシュ無効
    body: JSON.stringify(profile),
  });
  const json = await res.json().catch(() => ({ primaryExplain: { layout:'primary-explain-v1', items: [] } }));
  useDiagStore.getState().setPrimaryExplain(json?.primaryExplain);
  return json?.primaryExplain;
}
