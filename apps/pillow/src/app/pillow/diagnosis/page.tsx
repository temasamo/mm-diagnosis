"use client";
import { useEffect, useState } from "react";
import type { Questionnaire } from "@core/mm";
import QuestionRenderer from "../../../../components/QuestionRenderer";
import Link from "next/link";
import { useDiagStore } from "../../../../lib/state/diagStore";

export default function Page() {
  const [q, setQ] = useState<Questionnaire | null>(null);
  const answers = useDiagStore((s: any) => s.answers);
  const setAnswers = useDiagStore((s: any) => s.setAnswers);

  useEffect(() => {
    fetch("/questions.pillow.v2.json").then(r => r.json()).then(setQ).catch(console.error);
  }, []);

  if (!q) return <div className="p-6">読み込み中...</div>;

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">質問</h1>
      <QuestionRenderer
        questions={q.items}
        answers={answers}
        onChange={(id, v) => setAnswers({ [id]: v })}
      />
      <div className="flex justify-end gap-3 pt-4">
        <Link href="/pillow" className="px-4 py-2 rounded-xl border">戻る</Link>
        <Link href="/pillow/preview" className="px-5 py-2 rounded-xl bg-black text-white">一次診断へ</Link>
      </div>
    </main>
  );
} 