'use client';

import { useDiagStore } from '@lib/state/diagStore';

type RecommendBody = any;
type RecommendJson = { primaryExplain?: any; items?: any[]; [k: string]: any };

export async function fetchRecommendAndStore(body: RecommendBody) {
  try {
    const res = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    });

    let json: RecommendJson | null = null;
    try {
      json = await res.json(); // 500 でも JSON を返すよう API を実装済み
    } catch (e) {
      console.error('recommend parse failed', e);
    }

    if (!res.ok) {
      console.error('recommend fetch failed', res.status);
    }

    // store へ反映（なければ null を入れて UI 非表示に）
    useDiagStore.getState().setPrimaryExplain(json?.primaryExplain ?? null);
    return json;
  } catch (e) {
    console.error('recommend fetch failed (network)', e);
    useDiagStore.getState().setPrimaryExplain(null);
    return null;
  }
}
