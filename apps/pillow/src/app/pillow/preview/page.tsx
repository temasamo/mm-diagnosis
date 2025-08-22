"use client";
import Link from "next/link";
import { useDiagStore } from "../../../../lib/state/diagStore";
import { computeProvisional } from "../../../../lib/scoring/engine";
import { CATEGORY_LABEL } from "../../../../lib/scoring/config";
import { needLastQuestion, pickLastQuestion, applyLastAnswer } from "../../../../lib/lastq/engine";
import { useEffect, useState } from "react";

export default function Page() {
  const { answers, provisional, setProvisional } = useDiagStore();
  const [local, setLocal] = useState<any>(provisional);
  const [lastQ, setLastQ] = useState<any>(null);
  const [lastAnswer, setLastAnswer] = useState<string | null>(null);

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
    }
  }, [local]);

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

      <div className="flex justify-end gap-3">
        <Link href="/pillow/diagnosis" className="px-4 py-2 rounded-xl border">戻る</Link>
        <Link href="/pillow/result" className="px-5 py-2 rounded-xl bg-black text-white">診断結果へ</Link>
      </div>
    </main>
  );
} 