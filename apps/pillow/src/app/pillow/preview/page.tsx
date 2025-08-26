"use client";

import { useEffect, useState } from "react";
import { DIAG_VERSION } from "../../../../lib/DIAG_VERSION";
import { buildProblemList } from "../../../../lib/diagnosis/buildProblemList";
import { useDiagStore } from "@lib/state/diagStore";

export default function PreviewPage() {
  const store = useDiagStore();
  const [problems, setProblems] = useState<string[]>([]);

  useEffect(() => {
    const snap = store?.getSnapshot ? store.getSnapshot() : {};
    console.groupCollapsed("[PREVIEW]", DIAG_VERSION);
    console.log("answers:", (snap as any)?.answers);
    console.groupEnd();
    setProblems(buildProblemList(snap));
  }, [store]);

  return (
    <div className="p-6">
      <div className="text-xs opacity-60 mb-2">DEBUG: {DIAG_VERSION}</div>

      <section className="border rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold mb-2">あなたの診断サマリー</h2>
        <p>あなたにおすすめの枕は「高さは中くらい・柔らかさはやわらかめ」タイプです。</p>
      </section>

      <section className="border rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-2">あなたのお悩み</h3>
        <ul className="list-disc pl-6">
          {problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>

      {/* 既存の「診断結果へ」ボタンなどはそのまま */}
    </div>
  );
}
