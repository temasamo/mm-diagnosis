"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useDiagStore } from "../../../../lib/state/diagStore";
import { buildGroups, type GroupedRecommendations } from "../../../../lib/recommend/build_groups";

export default function Page() {
  const { provisional, answers } = useDiagStore();
  const [groups, setGroups] = useState<GroupedRecommendations | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!provisional) return;
      setLoading(true);
      try {
        // 予算バンドIDを渡す
        const budgetBandId = answers?.budget;
        const g = await buildGroups(provisional.provisional, 6, budgetBandId);
        setGroups(g);
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

  // 予算外商品のチェック
  const hasInBudget = (items: any[]) => items.some(i => !(i as any).outOfBudget);
  const primaryHasInBudget = groups ? hasInBudget(groups.primaryGroup) : true;
  const secondaryHasInBudget = groups ? hasInBudget(groups.secondaryGroup) : true;

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">診断結果 ＋ 商品提案</h1>
      {loading && <div>商品候補を取得中...</div>}
      {!loading && groups && groups.primaryGroup.length===0 && groups.secondaryGroup.length===0 && (
        <div className="text-sm text-gray-400">候補を取得できませんでした。キーワードを緩めるか、少し時間をおいてお試しください。</div>
      )}
      {groups && (
        <>
          {!primaryHasInBudget && (
            <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200">
              予算に合う商品がなかったため、予算外の商品をご提案しております。
            </div>
          )}
          
          <section className="rounded-2xl border p-4 space-y-3">
            <div className="text-lg font-semibold">第一候補グループ</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groups.primaryGroup.map((p, i) => (
                <a key={`primary-${p.url}-${i}`} href={p.url} target="_blank"
                   onClick={() => fetch("/api/track", { method:"POST", body: JSON.stringify({ type:"click", group:"primary", url:p.url, mall:p.mall, ts:Date.now() })})}
                   className="rounded-xl border p-3 hover:shadow-sm relative">
                  {(p as any).outOfBudget && (
                    <span className="absolute left-3 top-3 rounded bg-rose-600/90 px-2 py-0.5 text-xs text-white z-10">
                      予算外
                    </span>
                  )}
                  <div className="text-sm text-gray-500">{p.mall.toUpperCase()}</div>
                  <div className="font-medium line-clamp-2">{p.title}</div>
                  <img 
                    src={p.image ?? "/images/mall-placeholder.svg"} 
                    alt={p.title}
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/mall-placeholder.svg'; }}
                    className="w-full h-28 object-cover rounded-lg mt-2" 
                  />
                  {p.price != null && <div className="text-sm mt-1">¥{p.price.toLocaleString()}</div>}
                </a>
              ))}
            </div>
          </section>

          {!secondaryHasInBudget && (
            <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200">
              第二候補グループも予算外の商品となっております。
            </div>
          )}

          <section className="rounded-2xl border p-4 space-y-3">
            <div className="text-lg font-semibold">第二候補グループ</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groups.secondaryGroup.map((p, i) => (
                <a key={`secondary-${p.url}-${i}`} href={p.url} target="_blank"
                   onClick={() => fetch("/api/track", { method:"POST", body: JSON.stringify({ type:"click", group:"secondary", url:p.url, mall:p.mall, ts:Date.now() })})}
                   className="rounded-xl border p-3 hover:shadow-sm relative">
                  {(p as any).outOfBudget && (
                    <span className="absolute left-3 top-3 rounded bg-rose-600/90 px-2 py-0.5 text-xs text-white z-10">
                      予算外
                    </span>
                  )}
                  <div className="text-sm text-gray-500">{p.mall.toUpperCase()}</div>
                  <div className="font-medium line-clamp-2">{p.title}</div>
                  <img 
                    src={p.image ?? "/images/mall-placeholder.svg"} 
                    alt={p.title}
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/mall-placeholder.svg'; }}
                    className="w-full h-28 object-cover rounded-lg mt-2" 
                  />
                  {p.price != null && <div className="text-sm mt-1">¥{p.price.toLocaleString()}</div>}
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