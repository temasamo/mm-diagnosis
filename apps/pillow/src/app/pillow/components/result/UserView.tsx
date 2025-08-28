'use client';

import React from 'react';
import { pickTopChips, problemsToBullets, buildComment } from './presenters';

type Props = {
  // 既存ストア/結果から受け取る想定
  scores?: Record<string, number>;
  problems?: string[];             // 「あなたのお悩み」
  heightKey?: 'low_height'|'middle_height'|'high_height';
  firmnessKey?: 'soft_feel'|'firm_support';
  mattressFirmness?: 'soft'|'firm'|'mid';
  matchPercent?: number;           // 適合度（%）
};

export default function UserView({ scores = {}, problems = [], heightKey, firmnessKey, mattressFirmness, matchPercent }: Props) {
  const chips = pickTopChips(scores);
  const bullets = problemsToBullets(problems);
  const comment = buildComment({ heightKey, firmnessKey, mattressFirmness });

  return (
    <div className="space-y-8">
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
      {bullets.length > 0 && (
        <section className="rounded-2xl border border-white/15 p-5">
          <h3 className="text-lg font-semibold mb-3">あなたのお悩み</h3>
          <ul className="list-disc list-inside space-y-1">
            {bullets.map((b, i) => <li key={i}>{b.replace(/^・/,'')}</li>)}
          </ul>
        </section>
      )}
    </div>
  );
} 