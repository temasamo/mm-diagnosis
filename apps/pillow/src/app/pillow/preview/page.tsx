"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useDiagStore } from "@lib/state/diagStore";
import { computeProvisional } from "@lib/scoring/engine";
import { formatSummary } from "@/app/pillow/components/result/presenters";
import { buildProblemList } from "@lib/recommend/buildProblemList";

// お悩みの堅牢化ヘルパー
function deriveProblems(answers: any): string[] {
  const problemList = buildProblemList(answers);
  return problemList.bullets;
}

// --- 小さなヘルパ: 回答→高さ/硬さの日本語 ---
function toHeightLabel(v?: string) {
  if (v === "low") return "低め";
  if (v === "high") return "高め";
  return "中くらい";
}
function toSoftnessLabel(v?: string) {
  if (v === "soft") return "やわらかめ";
  if (v === "hard") return "硬め";
  return "標準";
}

// 回答から最低限のカテゴリスコアを作る（既に store.scores があれば使う）
function deriveScores(ans: any) {
  const s: Record<string, number> = {};
  const h = ans?.prefHeight ?? ans?.heightFeel ?? ans?.cur_height_feel;
  const f = ans?.prefFirmness ?? ans?.firmnessFeel ?? ans?.cur_firm;
  // 高さ系
  if (h === "high") s.high_height = 1;
  else if (h === "low") s.low_height = 1;
  else s.middle_height = 1;
  // 硬さ系
  if (f === "hard") s.firm_support = 1;
  else if (f === "soft") s.soft_feel = 1;
  // 代表的なタイプも少しだけ点火（UI 用なので 0.75 で十分）
  if (s.high_height) s.adjustable_height = 0.75;
  return s;
}

export default function PreviewPage() {
  const store = useDiagStore();
  const answers = store.answers ?? {};
  const [ready, setReady] = useState(false);

  const height = toHeightLabel(
    answers?.prefHeight ?? answers?.heightFeel ?? answers?.cur_height_feel
  );
  const soft = toSoftnessLabel(
    answers?.prefFirmness ?? answers?.firmnessFeel ?? answers?.cur_firm
  );
  const summary = formatSummary(height, soft);

  // お悩みの堅牢化
  const problems = deriveProblems(answers);

  // TOP3 は scores が無ければ derive
  const scores: Record<string, number> =
    (store as any).scores && Object.keys((store as any).scores).length
      ? (store as any).scores
      : deriveScores(answers);

  const top3 = useMemo(() => {
    return Object.entries(scores)
      .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
      .slice(0, 3);
  }, [scores]);

  // 初回: provisional を必ず作る & scores を store に格納、スナップショット保存
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!store.provisional && answers) {
          const provisional = await computeProvisional(answers);
          if (!cancelled) {
            // zustand の setter があればそれで。無ければ直接代入でも可。
            (store as any).setProvisional
              ? (store as any).setProvisional({ provisional })
              : ((store as any).provisional = { provisional });
          }
        }
        if ((store as any).setScores) {
          (store as any).setScores(scores);
        }
        // 保険: セッション保存（結果側で復旧可能に）
        sessionStorage.setItem(
          "pillow_snapshot",
          JSON.stringify({ answers, scores })
        );
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) setReady(!!store.provisional);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [answers, store, scores]);

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-6">一次診断</h1>
      
      <section className="rounded-2xl border p-6">
        <h2 className="text-xl md:text-2xl font-semibold">あなたの診断サマリー</h2>
        <p className="leading-relaxed">
          あなたにおすすめの枕は「{summary}」タイプです。
        </p>
      </section>

      {/* --- おすすめタイプTOP3: TEMP OFF --- */}
      {false && (
        <section aria-label="type-top3" className="rounded-2xl border p-6">
          <h3 className="text-lg font-semibold mb-3">おすすめタイプ TOP3</h3>
          <ul className="grid gap-3 sm:grid-cols-3">
            {top3.map(([key, val]) => (
              <li key={key} className="rounded-xl border p-4">
                <div className="text-sm opacity-70">{key}</div>
                <div className="text-2xl font-bold">{Math.round((val ?? 0) * 100)}%</div>
              </li>
            ))}
            {top3.length === 0 && (
              <li className="text-sm opacity-70">入力が少ないため、タイプ抽出は次ページで行います。</li>
            )}
          </ul>
        </section>
      )}

      {/* お悩みセクション */}
      {problems.length > 0 && (
        <section className="rounded-2xl border p-6">
          <h3 className="text-lg font-semibold mb-3">あなたのお悩み</h3>
          <ul className="list-disc pl-5 space-y-1">
            {problems.map((problem, index) => (
              <li key={index} className="text-sm">{problem}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex justify-end">
        <Link
          href="/pillow/result"
          aria-disabled={!ready}
          className={`px-6 py-3 rounded-xl ${ready ? "bg-white/10 hover:bg-white/20" : "bg-white/5 cursor-not-allowed opacity-50"}`}
          onClick={(e) => {
            if (!ready) e.preventDefault();
          }}
        >
          {ready ? "診断結果へ" : "準備中…"}
        </Link>
      </section>
    </main>
  );
}
