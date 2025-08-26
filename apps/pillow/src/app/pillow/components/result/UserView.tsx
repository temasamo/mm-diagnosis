'use client';

import React from 'react';
import { pickTopChips, problemsToBullets, buildComment } from './presenters';
import { useHydrated } from '../../../../../src/lib/react/useHydrated';

type Props = {
  // 既存ストア/結果から受け取る想定
  scores?: Record<string, number>;
  problems?: string[];             // 「あなたのお悩み」
  heightKey?: 'low_height'|'middle_height'|'high_height';
  firmnessKey?: 'soft_feel'|'firm_support';
  matchPercent?: number;           // 適合度（%）
};

export default function UserView({ scores = {}, problems = [], heightKey, firmnessKey, matchPercent }: Props) {
  const hydrated = useHydrated();
  const chips = pickTopChips(scores);
  const bullets = problemsToBullets(problems);
  const comment = buildComment({ heightKey, firmnessKey });

  return (
    <div className="space-y-8">
      {/* 適合度（%） */}
      {matchPercent !== undefined && (
        <section className="rounded-2xl border border-white/15 p-5">
          <h2 className="text-xl font-semibold mb-4">ご提案する枕の適合性</h2>
          <div className="text-5xl font-bold font-mono">{matchPercent} <span className="text-2xl">%</span></div>
          <p className="text-sm mt-3 opacity-80">
            ※ 無料版のわかりやすいスコアです。詳細コンサル診断ではより精密に判定します。
          </p>
        </section>
      )}

      {/* 診断サマリー */}
      <section className="rounded-2xl border border-white/15 p-5">
        <h3 className="text-lg font-semibold mb-3">あなたの診断サマリー</h3>
        <div className="flex flex-wrap gap-2">
          {chips.map(c => (
            <span key={c.key} className="rounded-full border border-white/20 px-3 py-1 text-sm">
              {c.label}
            </span>
          ))}
        </div>
        <p className="mt-4 text-sm text-white/80">
          {comment}
        </p>
      </section>



      {/* あなたのお悩み */}
      <section className="rounded-2xl border border-white/15 p-5" aria-label="あなたのお悩み">
        <h3 className="text-xl md:text-2xl font-semibold mb-3">あなたのお悩み</h3>
        {hydrated ? (
          <ul className="list-disc pl-6 space-y-2" suppressHydrationWarning>
            {bullets.map((b, i) => <li key={i} className="text-sm md:text-base">{b.replace(/^・/,'')}</li>)}
          </ul>
        ) : (
          <div className="h-6" aria-hidden /> // 同一HTMLを維持（スケルトン）
        )}
      </section>
    </div>
  );
} 