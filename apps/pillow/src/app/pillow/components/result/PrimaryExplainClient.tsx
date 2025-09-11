'use client';
import { useEffect } from 'react';
import { useDiagStore } from '../../../../../lib/state/diagStore'; // ← 相対に統一
import PrimaryExplainSection from './PrimaryExplainSection';
import { fetchRecommendAndStore } from '../../result/service';

type Props = { profile: any };

export default function PrimaryExplainClient({ profile }: Props) {
  const pe = useDiagStore((s) => s.primaryExplain);

  useEffect(() => {
    if (!pe) fetchRecommendAndStore(profile).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  if (!pe || !pe.items?.length) return null;
  return <PrimaryExplainSection data={pe} />;
}
