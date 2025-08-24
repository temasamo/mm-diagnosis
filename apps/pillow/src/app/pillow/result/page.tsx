"use client";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useDiagStore } from "../../../../lib/state/diagStore";
import { buildGroupsFromAPI, type GroupedRecommendations } from "../../../../lib/recommend/build_groups";
import { buildProfileFromAnswers, type Profile } from "../../../../lib/diag/profile";
import { computeMatchPercent } from "../../../../lib/match/score";
import DiagnosisSummary from "../../../../src/components/DiagnosisSummary";

export default function Page() {
  const { provisional, answers } = useDiagStore();
  const [groups, setGroups] = useState<GroupedRecommendations | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [tab, setTab] = useState<"summary" | "proposals">("summary");

  useEffect(() => {
    (async () => {
      if (!provisional) return;
      setLoading(true);
      try {
        // 予算バンドIDを渡す
        const budgetBandId = answers?.budget;
        const g = await buildGroupsFromAPI(provisional.provisional, 12, budgetBandId);
        setGroups(g);
      } finally {
        setLoading(false);
      }
    })();
  }, [provisional, answers]);

  // プロファイル作成とマッチング度計算
  const profile = useMemo(() => buildProfileFromAnswers(answers), [answers]);
  
  const itemsWithMatch = useMemo(() => {
    if (!groups) return [];
    const allItems = [...groups.primary, ...groups.secondaryBuckets.flat()];
    return allItems.map(item => {
      const { score } = computeMatchPercent(item.title ?? "", profile);
      return { ...item, match: score };
    });
  }, [groups, profile]);

  const topMatch = useMemo(
    () => Math.max(...itemsWithMatch.map(i => i.match ?? 0), 0),
    [itemsWithMatch]
  );

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
  const primaryHasInBudget = groups ? hasInBudget(groups.primary) : true;
  const secondaryHasInBudget = groups ? groups.secondaryBuckets.some(bucket => hasInBudget(bucket)) : true;

  const hasA = groups?.secondaryBuckets && groups.secondaryBuckets[0]?.length > 0;
  const hasB = groups?.secondaryBuckets && groups.secondaryBuckets[1]?.length > 0;
  const hasC = groups?.secondaryBuckets && groups.secondaryBuckets[2]?.length > 0;

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">診断結果 ＋ 商品提案</h1>
      
      {/* タブ */}
      <div className="flex gap-2">
        <button
          className={`rounded-2xl px-4 py-2 ${tab==="summary" ? "bg-white/10" : "bg-white/5 hover:bg-white/10"}`}
          onClick={() => setTab("summary")}
        >
          診断結果
        </button>
        <button
          className={`rounded-2xl px-4 py-2 ${tab==="proposals" ? "bg-white/10" : "bg-white/5 hover:bg-white/10"}`}
          onClick={() => setTab("proposals")}
        >
          商品提案
        </button>
      </div>

      {loading && <div>商品候補を取得中...</div>}
      {!loading && groups && groups.primary.length===0 && groups.secondaryBuckets.every(b => b.length === 0) && (
        <div className="text-sm text-gray-400">候補を取得できませんでした。キーワードを緩めるか、少し時間をおいてお試しください。</div>
      )}

      {tab === "summary" ? (
        <section className="space-y-6">
          {/* マッチング度のハイライト */}
          <div className="rounded-2xl border border-white/10 p-4">
            <div className="text-sm opacity-80">ご提案する枕のマッチング度（最大85%）</div>
            <div className="mt-1 text-3xl font-semibold">{topMatch}%</div>
            <div className="mt-1 text-xs opacity-70">
              ※ 無料版の概算スコアです。詳細コンサル診断ではより精密に判定します。
            </div>
          </div>

          {/* 診断結果コメント */}
          <DiagnosisSummary profile={profile} answers={answers} />
        </section>
      ) : (
        <section className="space-y-8">
          {/* 予算外メッセージ */}
          {!primaryHasInBudget && (
            <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200">
              予算に合う商品がなかったため、予算外の商品をご提案しております。
            </div>
          )}
          
          {/* 第一候補グループ（上位3件） */}
          <section className="rounded-2xl border p-4 space-y-3">
            <div className="text-lg font-semibold">第一候補グループ</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groups?.primary.map((p, i) => (
                <ProductCard key={`primary-${p.url}-${i}`} item={p} />
              ))}
            </div>
          </section>

          {/* 第二候補グループ a */}
          {hasA && (
            <section className="rounded-2xl border p-4 space-y-3">
              <div className="text-lg font-semibold">第二候補グループ a</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {groups?.secondaryBuckets[0].map((p, i) => (
                  <ProductCard key={`secondary-a-${p.url}-${i}`} item={p} />
                ))}
              </div>

              {(hasB || hasC) && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => setShowMore((v) => !v)}
                    className="rounded-2xl border border-white/20 px-4 py-2 text-sm hover:bg-white/5"
                  >
                    {showMore ? "候補を閉じる" : "他の候補を見る"}
                  </button>
                </div>
              )}
            </section>
          )}

          {/* 第二候補グループ b / c（初期は非表示、トグルで展開） */}
          {showMore && (
            <>
              {hasB && (
                <section className="rounded-2xl border p-4 space-y-3">
                  <div className="text-lg font-semibold">第二候補グループ b</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {groups?.secondaryBuckets[1].map((p, i) => (
                      <ProductCard key={`secondary-b-${p.url}-${i}`} item={p} />
                    ))}
                  </div>
                </section>
              )}
              {hasC && (
                <section className="rounded-2xl border p-4 space-y-3">
                  <div className="text-lg font-semibold">第二候補グループ c</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {groups?.secondaryBuckets[2].map((p, i) => (
                      <ProductCard key={`secondary-c-${p.url}-${i}`} item={p} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </section>
      )}
      
      <div className="flex justify-end">
        <Link href="/pillow" className="px-4 py-2 rounded-xl border">最初に戻る</Link>
      </div>
    </main>
  );
}

// 商品カードコンポーネント
function ProductCard({ item }: { item: any }) {
  const mallLabel =
    item.mall === "rakuten" ? "RAKUTEN" :
    item.mall === "yahoo"   ? "YAHOO"   : (item.mall ?? "").toUpperCase();

  return (
    <a 
      href={item.url} 
      target="_blank"
      onClick={() => fetch("/api/track", { method:"POST", body: JSON.stringify({ type:"click", group:"primary", url:item.url, mall:item.mall, ts:Date.now() })})}
      className="rounded-xl border p-3 hover:shadow-sm relative"
    >
      {(item as any).outOfBudget && (
        <span className="absolute left-3 top-3 rounded bg-rose-600/90 px-2 py-0.5 text-xs text-white z-10">
          予算外
        </span>
      )}
      <div className="font-medium line-clamp-2">{item.title}</div>
      <img 
        src={item.image ?? "/images/mall-placeholder.svg"} 
        alt={item.title}
        loading="lazy"
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/mall-placeholder.svg'; }}
        className="w-full h-28 object-cover rounded-lg mt-2" 
      />
      {/* 画像下・中央にモール名 */}
      <div className="mt-2 text-center text-[10px] uppercase tracking-[0.08em] opacity-80">
        {mallLabel}
      </div>
      {/* 適合度表示 */}
      {typeof (item as any).match === "number" && (
        <div className="mt-1 text-center text-[11px] opacity-80">
          適合度 <span className="font-semibold">{(item as any).match}%</span>
        </div>
      )}
      {item.price != null && <div className="text-sm mt-1">¥{item.price.toLocaleString()}</div>}
    </a>
  );
} 