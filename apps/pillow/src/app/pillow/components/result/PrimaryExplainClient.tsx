'use client';
import { useEffect, useMemo } from 'react';
import { useDiagStore } from '@/lib/state/diagStore';
import PrimaryExplainSection from './PrimaryExplainSection';
import { fetchRecommendAndStore } from '../result/service';

export default function PrimaryExplainClient({ profile }: { profile:any }) {
  const pe   = useDiagStore(s => s.primaryExplain);
  const setP = useDiagStore(s => s.setPrimaryExplain);
  const key  = useMemo(() => JSON.stringify(profile ?? {}), [profile]);

  useEffect(() => {
    setP(undefined);
    fetchRecommendAndStore(profile).catch(e => {
      console.error('[primaryExplain] fetch failed:', e);
      setP({ layout:'primary-explain-v1', items:[] });
    });
  }, [key, setP]);

  if (!pe || !pe.items?.length) return null;
  return <PrimaryExplainSection data={pe} />;
}
