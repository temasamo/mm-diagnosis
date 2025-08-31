'use client';

import React, { useEffect, useState } from 'react';
import { pickTopChips, problemsToBullets, buildComment } from './presenters';

// ❶ 補助: 文字や真偽を yes/true 判定に寄せる
function isYes(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return ['yes','true','1','y','はい','うん','ok'].some(x => s.includes(x));
}

// ❷ 補助: "暑がり/蒸れる"入力を複数ソースから正規化
function normalizeSweaty(a: any): boolean {
  // 新UI: heat_sweat=はい/いいえ
  const byHeatFlag =
    isYes(a?.heat_sweat) ||
    ['はい','high','hot','暑','汗'].some(k => String(a?.heat_sweat ?? a?.heat ?? '').includes(k));

  // 旧UI・別名フォールバック
  const byLegacy =
    isYes(a?.sweaty) ||
    String(a?.heat ?? '').includes('暑') ||
    String(a?.heat ?? '').includes('汗');

  // "気になる点/今の悩み"で「蒸れる」が含まれているか
  const concerns: string[] = (a?.concerns ?? a?.problems ?? []);
  const byConcerns = concerns.some((w) => /蒸れ|ムレ|汗|暑/i.test(String(w)));

  return !!(byHeatFlag || byLegacy || byConcerns);
}

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

        // ユーティリティ（ファイル上部 or 近く）
        const normTurn = (v: any): "low"|"mid"|"high" => {
          const s = String(v ?? "").trim();
          if (["low","mid","high"].includes(s)) return s as any;
          if (/ほとん|少/i.test(s)) return "low";
          if (/よく|多/i.test(s)) return "high";
          return "mid";
        };
        const normMattress = (v:any): "soft"|"normal"|"firm"|undefined => {
          const s = String(v ?? "").trim();
          if (/(柔|soft)/i.test(s)) return "soft";
          if (/(硬|firm)/i.test(s)) return "firm";
          if (!s) return undefined;
          return "normal";
        };
        const derivePosture = (arr?: string[], one?: string) => {
          const map: Record<string,string> = {"横向き":"side","仰向け":"supine","うつ伏せ":"prone"};
          const toE = (x?: string) => !x ? undefined : (map[x] ?? x?.toLowerCase());
          const xs = (arr && arr.length ? arr : (one ? [one] : [])).map(toE).filter(Boolean) as string[];
          if (xs.length === 0) return { postures: [], posture: undefined };
          if (xs.length === 1) return { postures: xs as any, posture: xs[0] as any };
          return { postures: xs as any, posture: "mixed" as const };
        };
        const mapConcerns = (raw: any): string[] => {
          const arr = Array.isArray(raw) ? raw : raw ? [raw] : [];
          const m: Record<string,string> = {
            "ストレートネック":"stneck","stneck":"stneck",
            "朝起きると首が痛い":"stneck","肩こりがひどい":"stneck",
            "頭痛・偏頭痛持ち":"headache","headache":"headache",
            "いびき":"snore","snore":"snore",
            "蒸れる":"heat","暑がり":"heat","heat":"heat",
            "へたる":"flatten","flatten":"flatten",
          };
          const allow = new Set(["stneck","headache","snore","heat","flatten"]);
          return arr.map((x)=>m[String(x)] ?? String(x)).filter((x)=>allow.has(x));
        };

        // AIコメント取得前に payload を構築
        const a = answers ?? {};
        const { postures, posture } = derivePosture(a.postures, a.posture);
        
        // snore (いびき) は別ラジオなので concerns に吸収する
        const snoreFlag = ["時々ある","よくある","sometimes","often","high"].includes(
          String(a.snore ?? a.snoreFreq ?? "").trim()
        );

        // 既存の mapConcerns(...) の後で:
        let concerns = mapConcerns(a.concerns ?? a.problems);
        if (snoreFlag && !concerns.includes("snore")) concerns.push("snore");

        // 正規化した sweaty を載せる
        const sweaty = normalizeSweaty(a);

        const payload = {
          posture: answers?.posture,             // 既存
          postures: answers?.postures ?? [],     // 既存
          turnFreq: answers?.rollover ?? answers?.turnFreq ?? 'mid',
          mattress: answers?.material ?? answers?.mattress,
          // ⬇️ 新規: 正規化した sweaty を載せる
          sweaty: sweaty,
          // （必要なら concerns も送る）
          concerns: answers?.concerns ?? answers?.problems ?? [],
        };

        // デバッグ（開発のみ）
        if (process.env.NODE_ENV !== "production") {
          console.log("[result] payload@generate-reason", { sweaty, payload });
        }

        // AI理由文を生成
        const response = await fetch('/api/ai/generate-reason', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
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