"use client";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useDiagStore } from "../../../../lib/state/diagStore";
import { buildGroupsFromAPI, type GroupedRecommendations } from "../../../../lib/recommend/build_groups";
import { buildProfileFromAnswers, type Profile } from "../../../../lib/diag/profile";
import { computeMatchPercent } from "../../../../lib/match/score";
import { deriveProblems, buildDiagnosticComment } from "../../../../src/lib/diagnosis/summary";
import { buildDiagnosisComment, buildProblems } from "../../../../src/lib/result/comment";
import DiagnosisSummary from "../../../components/DiagnosisSummary";

// store → 診断用スナップショットへ正規化する小関数（キー名が揺れても耐性）
function toSnapshot(s: any) {
  // 既存の回答どり（例：s.answers?.xxx）に合わせて拾ってください
  const h =
    s.prefHeight ||
    s.heightFeel ||                   // 例: "低い/普通/高い"
    s.answers?.heightFeel ||
    "指定なし";
  const f =
    s.prefFirmness ||
    s.firmnessFeel ||
    s.answers?.firmnessFeel ||
    "指定なし";
  const m =
    s.prefMaterial ||
    s.answers?.material ||
    "指定なし";

  return {
    prefHeight: h,       // "low/mid/high" or "低い/普通/高い"
    prefFirmness: f,     // "soft/medium/hard" or "柔/普/硬"
    prefMaterial: m,     // e.g. "低反発/高反発/羽毛/そば殻/指定なし"
    // ↓ お悩み系フラグ（存在すれば拾う）
    neckOrShoulderPain: s.neckOrShoulderPain || s.answers?.neckPain || false,
    pillowTooHigh:      s.pillowTooHigh      || s.answers?.tooHigh   || false,
    pillowTooLow:       s.pillowTooLow       || s.answers?.tooLow    || false,
    pillowTooHard:      s.pillowTooHard      || s.answers?.tooHard   || false,
    pillowTooSoft:      s.pillowTooSoft      || s.answers?.tooSoft   || false,
    getsHot:            s.getsHot            || s.answers?.hot       || false,
    materialMismatch:   s.materialMismatch   || s.answers?.matMis    || false,
  };
}

export default function Page() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  
  const store = useDiagStore();
  const { provisional, answers } = store;
  const snap = toSnapshot(store);
  
  // 新しいユーティリティでコメントとお悩みを生成
  const newComment = buildDiagnosisComment(store);
  const newProblems = buildProblems(store);
  
  if (!hydrated) return null;
  const [groups, setGroups] = useState<GroupedRecommendations | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [tab, setTab] = useState<"summary" | "proposals">("summary");
  const [score, setScore] = useState<number | null>(null);
  const [ai, setAi] = useState<string>("");
  const [hasHydrated, setHasHydrated] = useState(false);

  // 再水和完了後に同期計算
  useEffect(() => {
    setHasHydrated(true);
  }, []);

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

  // スコア計算
  useEffect(() => {
    if (!hasHydrated) return;
    try {
      const val = Math.min(85, Math.max(50, topMatch || 0)); // 0-100 を返す想定、内部で85%上限化してOK
      setScore(val);
    } catch {
      setScore(null);
    }
  }, [hasHydrated, topMatch]);

  const oldProblems = useMemo(() => (hasHydrated ? deriveProblems(snap) : { bullets: [] }), [hasHydrated, snap]);
  const oldComment = useMemo(() => (hasHydrated ? buildDiagnosticComment(snap) : ""), [hasHydrated, snap]);

  // デバッグ用ログ（一時的）
  useEffect(() => {
    if (hasHydrated) {
      console.log("[diag] raw store", store);
      console.log("[diag] snapshot", snap);
      console.log("[diag] newProblems", newProblems);
      console.log("[diag] newComment", newComment);
    }
  }, [hasHydrated, store, snap, newProblems, newComment]);

  // AIコメント（15〜20字）取得：brief には簡単な要約
  useEffect(() => {
    if (!hasHydrated) return;
    const brief = `高さ:${answers?.prefHeight ?? "不明"} 硬さ:${answers?.prefFirmness ?? "不明"} 主訴:${newProblems[0] ?? "なし"}`;
    fetch("/api/ai/comment", { method: "POST", body: JSON.stringify({ brief }) })
      .then(r => r.json())
      .then(j => setAi(j.text ?? "首圧分散を優先"))
      .catch(() => setAi("首圧分散を優先"));
  }, [hasHydrated, answers, newProblems]);

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
          診断内容
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
          {/* 適合度カード */}
          {hasHydrated && typeof score === "number" && (
            <section className="rounded-2xl border p-5">
              <h3 className="text-lg mb-2">ご提案する枕の適合性</h3>
              <div className="text-5xl font-bold font-mono">{score} <span className="text-2xl">%</span></div>
              <p className="text-sm mt-3 opacity-80">
                ※ 無料版のわかりやすいスコアです。詳細コンサル診断ではより精密に判定します。
              </p>
            </section>
          )}

          {/* 診断内容 */}
          <section className="rounded-2xl border p-5">
            <h3 className="text-2xl font-semibold mb-4">診断内容</h3>

            {/* あなたのお悩み（空なら非表示） */}
            {newProblems.length > 0 && (
              <div className="rounded-xl border p-4 mb-4">
                <div className="text-sm opacity-80 mb-2">あなたのお悩み</div>
                <ul className="list-disc ml-5 space-y-1">
                  {newProblems.map((t: string, i: number) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            )}

            {/* 診断コメント */}
            {newComment && (
              <div className="rounded-xl border p-4">
                <div className="text-sm opacity-80 mb-1">診断コメント</div>
                <div className="text-base">{newComment}</div>
              </div>
            )}
          </section>
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