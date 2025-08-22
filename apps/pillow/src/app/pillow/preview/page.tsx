"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDiagStore } from "../../../../lib/state/diagStore";
import { computeProvisional } from "../../../../lib/scoring/engine";
import { CATEGORY_LABEL } from "../../../../lib/scoring/config";
import { needLastQuestion, pickLastQuestion, applyLastAnswer } from "../../../../lib/lastq/engine";
import { pickLastQuestion as pickLastQuestionNew, type QuestionSpec } from '@/lib/lastQuestion';
import { LastQuestionCard } from '../components/LastQuestionCard';
import { useEffect, useState } from "react";

export default function Page() {
  const router = useRouter();
  const { answers, provisional, setProvisional } = useDiagStore();
  const [local, setLocal] = useState<any>(provisional);
  const [lastQ, setLastQ] = useState<any>(null);
  const [lastAnswer, setLastAnswer] = useState<string | null>(null);
  const [newLastQuestion, setNewLastQuestion] = useState<QuestionSpec | null>(null);

  useEffect(() => {
    if (!local) {
      const p = computeProvisional(answers);
      setProvisional(p);
      setLocal(p);
    }
  }, [answers, local, setProvisional]);

  useEffect(() => {
    if (local?.provisional) {
      const q = pickLastQuestion(local.provisional);
      console.log("[lastQ] top2:", local.provisional.slice(0,2), "picked:", q);
      setLastQ(q);

      // 新しい最後の一問ロジック
      const questionSpecs: QuestionSpec[] = [
        // 既存の質問定義から7属性の質問を抽出
        { id: 'q-sleep', key: 'sleepPosMain', label: '横向きで寝る割合は？', options: [
          { value: 'back', label: '仰向けが多い' },
          { value: 'side', label: '横向きが多い' },
          { value: 'mix', label: '混在' }
        ], weight: 1.2 },
        { id: 'q-height', key: 'heightAdjustable', label: '高さ調整は必要？', options: [
          { value: 'yes', label: '必要' },
          { value: 'no', label: '不要' }
        ] },
        { id: 'q-firmness', key: 'firmness', label: '硬さの好みは？', options: [
          { value: 'soft', label: '柔らかめ' },
          { value: 'medium', label: 'ふつう' },
          { value: 'firm', label: '硬め' }
        ] },
        { id: 'q-washable', key: 'washable', label: '洗濯可能は必要？', options: [
          { value: 'yes', label: '必要' },
          { value: 'no', label: '不要' }
        ] },
        { id: 'q-budget', key: 'budget', label: '価格帯は？', options: [
          { value: 'low', label: '低価格' },
          { value: 'mid', label: '中価格' },
          { value: 'high', label: '高価格' }
        ] },
        { id: 'q-material', key: 'material', label: '素材の好みは？', options: [
          { value: 'fiber', label: 'ポリエステル' },
          { value: 'latex', label: 'ラテックス' },
          { value: 'down', label: '羽毛' }
        ] },
        { id: 'q-width', key: 'width', label: 'ワイドサイズは必要？', options: [
          { value: 'wide', label: '必要' },
          { value: 'normal', label: '不要' }
        ] }
      ];

      const { question } = pickLastQuestionNew({
        answers: answers as any,
        questions: questionSpecs,
        candidates: local.provisional.map((p: any) => ({ product: { id: p.category, title: p.category, attrs: {} }, score: p.score })),
      });

      setNewLastQuestion(question);
    }
  }, [local, answers]);

  const applyAnswer = () => {
    if (!local || !lastQ || !lastAnswer) return;
    const updated = applyLastAnswer(local.provisional, lastQ, lastAnswer);
    const next = { ...local, provisional: updated };
    setLocal(next);
    setProvisional(next);
    setLastQ(null); // 1問だけ
  };

  if (!local) return <div className="p-6">一次診断を計算中...</div>;

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">一次診断結果</h1>
      <p className="text-sm text-gray-600">{local.insight.summary}</p>
      <ul className="list-disc pl-5 text-sm">
        {local.insight.reasons.map((r: string, i: number) => <li key={i}>{r}</li>)}
      </ul>

      <div className="rounded-2xl border p-4">
        <div className="font-semibold mb-2">上位カテゴリ</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {local.provisional.slice(0,6).map((p: any) => (
            <div key={p.category} className="rounded-xl border p-3">
              <div className="font-medium">{CATEGORY_LABEL[p.category as keyof typeof CATEGORY_LABEL] ?? p.category}</div>
              <div className="text-sm">スコア: {(p.score*100).toFixed(0)}%</div>
            </div>
          ))}
        </div>
      </div>

      {lastQ && (
        <div className="rounded-2xl border p-4 space-y-3">
          <div className="font-semibold">{lastQ.title}</div>
          <div className="flex flex-wrap gap-2">
            {lastQ.choices.map((c:any) => (
              <button
                key={c.id}
                className={`px-3 py-2 rounded-full border ${lastAnswer===c.id ? "border-white bg-white/10" : "border-gray-600"}`}
                onClick={() => setLastAnswer(c.id)}
              >{c.label}</button>
            ))}
          </div>
          <div className="flex justify-end">
            <button disabled={!lastAnswer} onClick={applyAnswer} className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50">
              反映する
            </button>
          </div>
        </div>
      )}

      <LastQuestionCard
        question={newLastQuestion}
        onAnswer={async (value, bestNote) => {
          // 1) 最後の一問の回答が来たら state に反映（必要なら再スコアリング）
          if (newLastQuestion && value != null) {
            // 既存の state/ストアに書き込み
            // setAnswer(newLastQuestion.key, value) など既存の更新関数を呼ぶ
            console.log('Last question answer:', newLastQuestion.key, value);
          }

          // 2) 自由記述は /api/feedback に送信（失敗しても結果に進む）
          if (bestNote) {
            try {
              await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                  type: 'best_pillow_note',
                  note: bestNote,
                  // あるならセッションや診断IDを付与
                  // sessionId, userAgent, etc.
                }),
              });
            } catch (e) {
              console.warn('feedback failed', e);
            }
          }

          // 3) 結果表示へ
          router.push('/pillow/result');
        }}
      />

      <div className="flex justify-end gap-3">
        <Link href="/pillow/diagnosis" className="px-4 py-2 rounded-xl border">戻る</Link>
      </div>
    </main>
  );
} 