'use client';

import React, { useEffect, useState } from 'react';
import { pickTopChips, problemsToBullets, buildComment } from './presenters';

type Props = {
  // 既存ストア/結果から受け取る想定
  scores?: Record<string, number>;
  problems?: string[];             // 「あなたのお悩み」
  heightKey?: 'low_height'|'middle_height'|'high_height';
  firmnessKey?: 'soft_feel'|'firm_support';
  mattressFirmness?: 'soft'|'firm'|'mid';
  currentMaterial?: string;        // 現在の枕の素材
  answers?: any;                   // AI診断用の全回答データ
  matchPercent?: number;           // 適合度（%）
};

export default function UserView({ scores = {}, problems = [], heightKey, firmnessKey, mattressFirmness, currentMaterial, answers, matchPercent }: Props) {
  const chips = pickTopChips(scores);
  const bullets = problemsToBullets(problems);
  const comment = buildComment({ heightKey, firmnessKey, mattressFirmness, currentMaterial, answers });

  // AI診断の理由を取得
  let aiReasons: string[] = [];
  if (answers) {
    try {
      const { buildDiagnosisText } = require('@lib/diagnosis_text');
      const targetLoft = heightKey === 'low_height' ? 'low' as const
                        : heightKey === 'high_height' ? 'high' as const
                        : 'mid' as const;
      const targetFirm = firmnessKey === 'soft_feel' ? 'soft' as const
                        : firmnessKey === 'firm_support' ? 'firm' as const
                        : 'mid' as const;
      
      const result = buildDiagnosisText({
        targetLoft,
        targetFirm,
        mattressFirmness,
        answers
      });
      aiReasons = result.reasons;
    } catch (error) {
      console.warn('AI診断理由の取得に失敗:', error);
    }
  }

  // AI理由文の状態
  const [aiReason, setAiReason] = useState<string>('');
  const [aiReasonLoading, setAiReasonLoading] = useState(false);

  // AI理由文を生成
  useEffect(() => {
    if (!answers || !problems.length) return;

    const generateAiReason = async () => {
      setAiReasonLoading(true);
      try {
        // 推奨値を取得
        let loftLabel = '中くらい';
        let firmnessLabel = '標準';
        let materialLabel = 'パイプ';
        let budgetLabel = '6,000円〜10,000円';

        if (answers) {
          try {
            const { buildDiagnosisText } = require('@lib/diagnosis_text');
            const targetLoft = heightKey === 'low_height' ? 'low' as const
                              : heightKey === 'high_height' ? 'high' as const
                              : 'mid' as const;
            const targetFirm = firmnessKey === 'soft_feel' ? 'soft' as const
                              : firmnessKey === 'firm_support' ? 'firm' as const
                              : 'mid' as const;
            
            const result = buildDiagnosisText({
              targetLoft,
              targetFirm,
              mattressFirmness,
              answers
            });

            // 診断結果からラベルを抽出
            const headline = result.headline;
            const heightMatch = headline.match(/高さは([^・]+)/);
            const firmnessMatch = headline.match(/柔らかさは([^・]+)/);
            const materialMatch = headline.match(/素材は([^」]+)/);

            if (heightMatch) loftLabel = heightMatch[1];
            if (firmnessMatch) firmnessLabel = firmnessMatch[1];
            if (materialMatch) materialLabel = materialMatch[1];
          } catch (error) {
            console.warn('推奨値の取得に失敗:', error);
          }
        }

        // 予算ラベルを取得
        if (answers.budget) {
          const budgetMap: Record<string, string> = {
            '5k-10k': '5,000円〜10,000円',
            '10k-20k': '10,000円〜20,000円',
            '20k-30k': '20,000円〜30,000円',
            '30k-50k': '30,000円〜50,000円',
            '50k+': '50,000円以上'
          };
          budgetLabel = budgetMap[answers.budget] || budgetLabel;
        }

        // AI理由文を生成
        const response = await fetch('/api/ai/generate-reason', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            problems: problems,
            loft: loftLabel,
            firmness: firmnessLabel,
            material: materialLabel,
            budget: budgetLabel
          })
        });

        if (response.ok) {
          const data = await response.json();
          setAiReason(data.reason);
        } else {
          console.warn('AI理由文の生成に失敗');
        }
      } catch (error) {
        console.warn('AI理由文の生成エラー:', error);
      } finally {
        setAiReasonLoading(false);
      }
    };

    generateAiReason();
  }, [answers, problems, heightKey, firmnessKey, mattressFirmness]);

  return (
    <div className="space-y-8">
      {/* 診断結果 */}
      <section className="rounded-2xl border border-white/15 p-5">
        <h3 className="text-lg font-semibold mb-3">あなたの診断結果</h3>
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
        
        {/* AI診断の理由 */}
        {aiReasons.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <h4 className="text-sm font-medium mb-2 text-white/90">診断理由</h4>
            <ul className="list-disc list-inside space-y-1 text-xs text-white/70">
              {aiReasons.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* AIからのコメント */}
      {(aiReason || aiReasonLoading) && (
        <section className="rounded-xl border border-neutral-700 p-6">
          <h3 className="text-lg font-semibold mb-2">AIからのコメント</h3>
          {aiReasonLoading ? (
            <p className="text-neutral-200 leading-relaxed">AIが診断理由を分析中...</p>
          ) : (
            <p className="text-neutral-200 leading-relaxed">{aiReason}</p>
          )}
        </section>
      )}

      {/* あなたのお悩み */}
      {bullets.length > 0 && (
        <section className="rounded-2xl border border-white/15 p-5">
          <h3 className="text-lg font-semibold mb-3">あなたのお悩み/使っているマットレス・布団や枕の素材</h3>
          <ul className="list-disc list-inside space-y-1">
            {bullets.map((b, i) => <li key={i}>{b.replace(/^・/,'')}</li>)}
          </ul>
        </section>
      )}
    </div>
  );
} 