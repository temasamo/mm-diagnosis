'use client';
import { useEffect, useMemo } from 'react';
import { useDiagStore } from '@/lib/state/diagStore';
import PrimaryExplainSection from './PrimaryExplainSection';
import { fetchRecommendAndStore } from '../result/service';

type Props = { profile: any };

export default function PrimaryExplainClient({ profile }: Props) {
  const pe = useDiagStore(s => s.primaryExplain);
  const setPE = useDiagStore(s => s.setPrimaryExplain);

  // 依存を "プロフィールのJSON" に固定（深い比較の代替）
  const profileKey = useMemo(() => JSON.stringify(profile ?? {}), [profile]);

  useEffect(() => {
    // 回答が変わったら一旦クリア → 再フェッチ
    setPE(undefined);
    fetchRecommendAndStore(profile).catch((e) => {
      console.error('[primaryExplain] fetch failed:', e);
      setPE({ layout:'primary-explain-v1', items: [] });
    });
  }, [profileKey, setPE]);     // ★ ここが肝（旧: [pe, profile] だと再取得されにくい）

  if (!pe || !pe.items?.length) return null;
  return <PrimaryExplainSection data={pe} />;
}
