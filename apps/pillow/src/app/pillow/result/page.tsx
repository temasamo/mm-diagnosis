"use client";

import { useEffect, useState } from "react";
import { DIAG_VERSION } from "../../../../lib/DIAG_VERSION";
import { buildProblemList } from "../../../../lib/diagnosis/buildProblemList";
import { buildGroupsFromAPI, BUILD_GROUPS_VERSION } from "../../../../lib/recommend/build_groups";
import { useDiagStore } from "@lib/state/diagStore";

export default function ResultPage() {
  const store = useDiagStore();
  const [problems, setProblems] = useState<string[]>([]);
  const [groups, setGroups] = useState<any>(null);

  useEffect(() => {
    const snap = store?.getSnapshot ? store.getSnapshot() : {};
    console.groupCollapsed("[RESULT]", DIAG_VERSION);
    console.log("answers:", (snap as any)?.answers);
    console.groupEnd();

    setProblems(buildProblemList(snap));

    const provisional = Array.isArray((snap as any)?.provisional)
      ? (snap as any).provisional
      : ((snap as any)?.provisional ? [(snap as any).provisional] : []);

    const budgetBandId =
      (snap as any)?.answers?.budgetBandId ??
      (snap as any)?.budgetBandId ??
      (snap as any)?.answers?.budget ??
      undefined;

    (async () => {
      const g = await buildGroupsFromAPI(provisional, 12, budgetBandId);
      console.groupCollapsed("[recommend] groups.raw");
      console.log("debugVersion:", BUILD_GROUPS_VERSION);
      console.log("primary:", g?.primary?.length ?? 0,
                  "A:", g?.secondaryA?.length ?? 0,
                  "B:", g?.secondaryB?.length ?? 0,
                  "C:", g?.secondaryC?.length ?? 0);
      console.groupEnd();
      setGroups(g);
    })();
  }, [store]);

  return (
    <div className="p-6">
      <div className="text-xs opacity-60 mb-3">
        DEBUG: {DIAG_VERSION} / {BUILD_GROUPS_VERSION}
      </div>

      <div className="tabs mb-4">
        <button className="btn">診断内容</button>
        <button className="btn">商品提案</button>
      </div>

      {/* 診断内容 */}
      <section className="border rounded-xl p-6 mb-8">
        <h3 className="text-xl font-semibold mb-2">あなたの診断サマリー</h3>
        <p>あなたにおすすめの枕は「高さは中程度・柔らかさは標準」タイプです。</p>
      </section>

      <section className="border rounded-xl p-6 mb-8">
        <h3 className="text-xl font-semibold mb-2">あなたのお悩み</h3>
        <ul className="list-disc pl-6">
          {problems.map((p) => <li key={p}>{p}</li>)}
        </ul>
      </section>

      {/* 商品提案（簡易 / まずは件数が出ることを確認） */}
      <section className="border rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-2">商品提案（件数）</h3>
        {!groups ? (
          <div>候補を取得中…</div>
        ) : (
          <div className="space-y-1 text-sm">
            <div>第1候補: {groups?.primary?.length ?? 0} 件</div>
            <div>第二候補A: {groups?.secondaryA?.length ?? 0} 件</div>
            <div>第二候補B: {groups?.secondaryB?.length ?? 0} 件</div>
            <div>第二候補C: {groups?.secondaryC?.length ?? 0} 件</div>
            {!!groups?.message && <div className="mt-2 opacity-75">{groups.message}</div>}
          </div>
        )}
      </section>
    </div>
  );
}
