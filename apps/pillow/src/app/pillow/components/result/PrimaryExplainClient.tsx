'use client';

import { useEffect } from 'react';
import { useDiagStore } from '@lib/state/diagStore';
import PrimaryExplainSection from './PrimaryExplainSection';
import { fetchRecommendAndStore } from '../../result/service';

type Props = { profile: any };

export default function PrimaryExplainClient({ profile }: Props) {
  const pe = useDiagStore((s) => s.primaryExplain);

  useEffect(() => {
    if (!pe) {
      fetchRecommendAndStore(profile).catch((e) =>
        console.error('[primaryExplain] fetch failed:', e)
      );
    }
  }, [pe, profile]);

  if (!pe || !pe.items?.length) return null;
  return <PrimaryExplainSection data={pe} />;
}

