"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readAnswersFromSearchParams } from "@/lib/answers/ssr";
import { buildProblemList } from "@lib/recommend/buildProblemList";

// 商品候補取得のためのヘルパー関数
function isEmptyGroups(groups: any): boolean {
  return !groups || (!groups.primary?.length && !groups.secondaryA?.length);
}

// 仮のrawProv（実際の実装に合わせて調整）
const rawProv = "枕";

export default function Page({ searchParams }: { searchParams: Promise<Record<string, any>> }) {
  const [answers, setAnswers] = useState<any>(null);
  const [problems, setProblems] = useState<any>(null);
  const [groups, setGroups] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [triedFallback, setTriedFallback] = useState(false);

  // SSRデータの初期化
  useEffect(() => {
    (async () => {
      const resolvedParams = await searchParams;
      const answersData = await readAnswersFromSearchParams(searchParams);
      const problemsData = buildProblemList(answersData);
      setAnswers(answersData);
      setProblems(problemsData);
      setMounted(true);
    })();
  }, [searchParams]);

  // 商品候補取得（簡略化版）
  useEffect(() => {
    if (!mounted || !answers) return;

    let cancelled = false;

    (async () => {
      // 商品候補取得のロジック（簡略化）
      console.log("[recommend] 商品候補取得開始", answers);
      
      // 実際のbuildGroupsFromAPIの代わりにダミーデータ
      const dummyGroups = {
        primary: [],
        secondaryA: []
      };
      
      if (cancelled || !mounted) return;

      if (!isEmptyGroups(dummyGroups)) {
        setGroups(dummyGroups);
        console.log("[recommend] groups.raw", dummyGroups);
        return;
      }

      // 0件 → 未試行なら緩和リトライ（1回だけ）
      if (!triedFallback) {
        setTriedFallback(true);
        console.log("[recommend] フォールバック試行");
      }
    })();

    return () => { cancelled = true; };
    // 依存：予算帯・マウント状態・フォールバック試行フラグ
  }, [answers?.budget, mounted, triedFallback]);

  if (!problems) {
    return <div>読み込み中...</div>;
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-6">診断結果</h1>
      
      {/* 「診断内容」タブ */}
      <section className="rounded-2xl border p-6">
        <h2 className="text-xl md:text-2xl font-semibold mb-4">診断内容</h2>
        
        {/* あなたのお悩み */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">あなたのお悩み</h3>
          {problems.bullets.length ? (
            <ul className="list-disc pl-6 space-y-1">
              {problems.bullets.map((b: string) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">特筆すべきお悩みは選択されていません。</p>
          )}
        </div>

        {/* 商品提案（件数） */}
        <div>
          <h3 className="text-lg font-semibold mb-3">商品提案</h3>
          <p className="text-muted-foreground">候補を取得中…</p>
        </div>
      </section>

      <div className="flex justify-end">
        <Link href="/pillow" className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20">
          トップに戻る
        </Link>
      </div>
    </main>
  );
}
