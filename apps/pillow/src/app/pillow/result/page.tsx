"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useDiagStore } from "../../../../lib/state/diagStore";
import { buildGroups, type GroupedRecommendations } from "../../../../lib/recommend/build_groups";
import { applyBudget } from '@/lib/filters/applyBudget';
import { normalizePriceJPY, readBudgetMaxJPY } from '@/lib/filters/budget';

export default function Page() {
  const { provisional, answers } = useDiagStore();
  const [groups, setGroups] = useState<GroupedRecommendations | null>(null);
  const [loading, setLoading] = useState(false);
  const [usedBudgetFallback, setUsedBudgetFallback] = useState(false);

  useEffect(() => {
    (async () => {
      if (!provisional) return;
      setLoading(true);
      try {
        const g = await buildGroups(provisional.provisional, 6);
        
        // 予算フィルタを適用
        const { items: primaryFiltered, usedBudgetFallback: primaryFallback } = applyBudget(
          g.primaryGroup.map(item => ({ product: item, score: 1 })),
          answers || {},
          0.0
        );
        
        const { items: secondaryFiltered, usedBudgetFallback: secondaryFallback } = applyBudget(
          g.secondaryGroup.map(item => ({ product: item, score: 1 })),
          answers || {},
          0.0
        );
        
        const filteredGroups = {
          primaryGroup: primaryFiltered.map(item => (item as any).product || item),
          secondaryGroup: secondaryFiltered.map(item => (item as any).product || item),
          rationale: g.rationale
        };
        
        setGroups(filteredGroups);
        setUsedBudgetFallback(primaryFallback || secondaryFallback);
      } finally {
        setLoading(false);
      }
    })();
  }, [provisional, answers]);

  if (!provisional) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <p>先に一次診断を実行してください。</p>
        <Link className="px-4 py-2 rounded-xl border inline-block mt-3" href="/pillow/diagnosis">質問へ戻る</Link>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">診断結果 ＋ 商品提案</h1>
      {loading && <div>商品候補を取得中...</div>}
      {usedBudgetFallback && (
        <div className="mb-4 rounded-xl border border-yellow-600/50 bg-yellow-400/10 p-3 text-sm text-yellow-300">
          予算内の商品が見つからなかったため、予算外の商品を表示しています。
          条件を少しゆるめると見つかる可能性があります。
        </div>
      )}
      {!loading && groups && groups.primaryGroup.length===0 && groups.secondaryGroup.length===0 && (
        <div className="text-sm text-gray-400">候補を取得できませんでした。キーワードを緩めるか、少し時間をおいてお試しください。</div>
      )}
      {groups && (
        <>
          <section className="rounded-2xl border p-4 space-y-3">
            <div className="text-lg font-semibold">第一候補グループ</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groups.primaryGroup.map((p, i) => (
                <a key={`primary-${p.url}-${i}`} href={p.url} target="_blank"
                   onClick={() => fetch("/api/track", { method:"POST", body: JSON.stringify({ type:"click", group:"primary", url:p.url, mall:p.mall, ts:Date.now() })})}
                   className="rounded-xl border p-3 hover:shadow-sm">
                  <div className="text-sm text-gray-500">{p.mall.toUpperCase()}</div>
                  <div className="font-medium line-clamp-2">{p.title}</div>
                  {p.image && <img src={p.image} alt="" className="w-full h-28 object-cover rounded-lg mt-2" />}
                  {p.price != null && (
                    <div className="text-sm mt-1 flex items-center">
                      ¥{p.price.toLocaleString()}
                      {(() => {
                        const budgetMax = readBudgetMaxJPY(answers || {});
                        const price = normalizePriceJPY(p.price);
                        const inBudget = (typeof budgetMax === 'number' && price != null) ? (price <= budgetMax) : null;
                        return typeof inBudget === 'boolean' && (
                          <span className={`ml-2 rounded-md px-2 py-0.5 text-xs ${
                            inBudget ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-600/30'
                                     : 'bg-zinc-700/30 text-zinc-300 border border-zinc-600/40'
                          }`}>
                            {inBudget ? '予算内' : '予算外'}
                          </span>
                        );
                      })()}
                    </div>
                  )}
                </a>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border p-4 space-y-3">
            <div className="text-lg font-semibold">第二候補グループ</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groups.secondaryGroup.map((p, i) => (
                <a key={`secondary-${p.url}-${i}`} href={p.url} target="_blank"
                   onClick={() => fetch("/api/track", { method:"POST", body: JSON.stringify({ type:"click", group:"secondary", url:p.url, mall:p.mall, ts:Date.now() })})}
                   className="rounded-xl border p-3 hover:shadow-sm">
                  <div className="text-sm text-gray-500">{p.mall.toUpperCase()}</div>
                  <div className="font-medium line-clamp-2">{p.title}</div>
                  {p.image && <img src={p.image} alt="" className="w-full h-28 object-cover rounded-lg mt-2" />}
                  {p.price != null && (
                    <div className="text-sm mt-1 flex items-center">
                      ¥{p.price.toLocaleString()}
                      {(() => {
                        const budgetMax = readBudgetMaxJPY(answers || {});
                        const price = normalizePriceJPY(p.price);
                        const inBudget = (typeof budgetMax === 'number' && price != null) ? (price <= budgetMax) : null;
                        return typeof inBudget === 'boolean' && (
                          <span className={`ml-2 rounded-md px-2 py-0.5 text-xs ${
                            inBudget ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-600/30'
                                     : 'bg-zinc-700/30 text-zinc-300 border border-zinc-600/40'
                          }`}>
                            {inBudget ? '予算内' : '予算外'}
                          </span>
                        );
                      })()}
                    </div>
                  )}
                </a>
              ))}
            </div>
          </section>
        </>
      )}
      <div className="flex justify-end">
        <Link href="/pillow" className="px-4 py-2 rounded-xl border">最初に戻る</Link>
      </div>
    </main>
  );
} 