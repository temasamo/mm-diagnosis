'use client';

import { useEffect, useMemo, useState } from 'react';
import PrimaryExplainSection from '@/components/result/PrimaryExplainSection';
// ↓ プロジェクトの store 位置に合わせて。既存の import に揃えてOK
import { useDiagStore } from '@lib/state/diagStore';

type Item = any;

const mapPostureToCode = (v?: string) =>
  v === '横向き' ? 'side' : v === '仰向け' ? 'supine' : v === 'うつ伏せ' ? 'prone' : undefined;

const mapConcernToCode = (v: string) =>
  v === '首痛' ? 'neck'
: v === '肩こり' ? 'shoulder'
: v === '頭痛' ? 'headache'
: v === 'いびき' ? 'snore'
: v === '蒸れ' ? 'heat_sweat'
: v; // 既知以外はそのまま

const mapMaterialToCode = (v?: string) =>
  v === '高反発' ? 'highRebound'
: v === '低反発' ? 'lowRebound'
: v === '羽毛'   ? 'feather'
: v === 'そば殻' ? 'buckwheat'
: undefined;

export default function PrimaryExplainClient() {
  const s = useDiagStore();

  // 回答を一箇所でまとめる（不足があっても空配列でOK）
  const payload = useMemo(() => {
    const postureCode = mapPostureToCode(s?.posture);
    const concerns = Array.isArray(s?.issues) ? s!.issues.map(mapConcernToCode).filter(Boolean) : [];
    const materialCode = mapMaterialToCode(s?.material ?? s?.preferences?.material);
    const budgetMax = s?.budgetMax ?? s?.budget?.max ?? 20000; // 既定 2万円（必要なら調整）

    return {
      postures: postureCode ? [postureCode] : [],
      concerns,
      pillowMaterial: materialCode ? [materialCode] : [],
      budget: { max: budgetMax },
    };
  }, [s?.posture, s?.issues, s?.material, s?.preferences?.material, s?.budgetMax, s?.budget?.max]);

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let canceled = false;

    async function run() {
      try {
        const res = await fetch('/api/recommend', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!canceled) {
          setItems(data?.primaryExplain?.items ?? []);
        }
      } catch {
        if (!canceled) setItems([]);
      } finally {
        if (!canceled) setLoading(false);
      }
    }

    run();
    return () => {
      canceled = true;
    };
  }, [payload]);

  // 読み込み中は何も出さない（既存UIのちらつき防止）
  if (loading) return null;
  if (!items?.length) return null;

  return <PrimaryExplainSection items={items} />;
}
