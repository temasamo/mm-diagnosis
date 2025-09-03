"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import { useDiagStore } from "@lib/state/diagStore";
import {
  buildGroupsFromAPI,
  type GroupedRecommendations,
} from "@lib/recommend/build_groups";
import { buildProfileFromAnswers } from "@lib/diag/profile";
import { computeMatchPercent } from "@lib/match/score";
import UserView from "../components/result/UserView";
import { buildProblemList } from "@lib/recommend/buildProblemList";
import { track, trackOnce } from "@/lib/analytics/track";
import { type PriceBandId } from "@/lib/recommend/priceBand";
import { extractPriceInfo } from "@/lib/recommend/extractPrice";
import { buildBudgetMeta, BANDS, bandIndexOf, type BudgetBandKey } from "@/lib/recommend/budget";
import { GROUP_LABEL } from "@/lib/ui/labels";

// セグメントキー： sweaty × posture(3)
function segmentOf({ sweaty, posture }: { sweaty?: boolean; posture?: string }) {
  const s = sweaty ? "sweaty_yes" : "sweaty_no";
  const p = ["side", "supine", "prone"].includes(String(posture)) ? posture : "mixed";
  return `${s}+posture_${p}`;
}

/** store から診断向けスナップショットに正規化（deriveProblems 互換想定） */
function toSnapshot(s: any) {
  const a = s?.answers ?? {};

  return {
    // ユーザー嗜好・回答（キーは環境に合わせて拾えるだけ拾う）
    prefHeight:
      s.prefHeight ??
      s.heightFeel ??
      a.prefHeight ??
      a.heightFeel ??
      "指定なし",
    prefFirmness:
      s.prefFirmness ??
      s.firmnessFeel ??
      a.prefFirmness ??
      a.firmnessFeel ??
      "指定なし",
    prefMaterial:
      s.prefMaterial ??
      a.material ??
      "指定なし",

    // お悩みフラグ（あるものだけ）
    neckOrShoulderPain: s.neckOrShoulderPain || a.neckPain || false,
    pillowTooHigh: s.pillowTooHigh || a.tooHigh || false,
    pillowTooLow: s.pillowTooLow || a.tooLow || false,
    pillowTooHard: s.pillowTooHard || a.tooHard || false,
    pillowTooSoft: s.pillowTooSoft || a.tooSoft || false,
    getsHot: s.getsHot || a.hot || false,
    materialMismatch: s.materialMismatch || a.matMis || false,
  };
}

/** 問題点を人間可読にする（UserView で bullets 表示するための簡易版） */
function deriveProblemsHuman(snap: any): string[] {
  const out: string[] = [];
  if (snap.neckOrShoulderPain) out.push("首・肩の痛みやコリがある");
  if (snap.pillowTooHigh) out.push("枕が高すぎる");
  if (snap.pillowTooLow) out.push("枕が低すぎる");
  if (snap.pillowTooHard) out.push("枕が硬すぎる");
  if (snap.pillowTooSoft) out.push("枕が柔らかすぎる");
  if (snap.getsHot) out.push("枕が蒸れて暑い");
  if (snap.materialMismatch) out.push("素材が合っていない");
  return out;
}

/** お悩みの堅牢化ヘルパー */
function deriveProblemsRobust(store: any): string[] {
  const answers = store?.answers ?? {};
  const problemList = buildProblemList(answers);
  return problemList.bullets.length > 0 
    ? problemList.bullets 
    : ["現在の枕に関する不満をお聞かせください"];
}

function decorateItemsWithPriceAndBudget(items: any[], userBand: BudgetBandKey) {
  return items.map((it) => {
    const _price = extractPriceInfo(it);
    const _budget = buildBudgetMeta(userBand, _price.value);
    return { ...it, _price, _budget };
  });
}

function filterSecondaryByAdjacency(buckets: any[][], userBand: BudgetBandKey) {
  // ±1レンジ外のものは第二候補では出さない
  return buckets.map(bucket =>
    bucket.filter(it => it?._budget?.withinAdjacency !== false)
  );
}

/** 商品カード（モール名は画像の下・中央） */
function ProductCard({ item, onCardClick }: { item: any; onCardClick?: (productId: string, position: number) => void }) {
  const mallLabel =
    item.mall === "rakuten"
      ? "RAKUTEN"
      : item.mall === "yahoo"
      ? "YAHOO"
      : (item.mall ?? "").toUpperCase();

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      onClick={() => {
        // 既存のtrack呼び出し
        fetch("/api/track", {
          method: "POST",
          body: JSON.stringify({
            type: "click",
            group: "primary",
            url: item.url,
            mall: item.mall,
            ts: Date.now(),
          }),
        });
        // 新しいtrack呼び出し
        onCardClick?.(item.id || item.url, 0);
      }}
      className="rounded-xl border p-3 hover:shadow-sm relative"
    >
      <div className="font-medium line-clamp-2">{item.title}</div>
      <img
        src={item.image ?? "/images/mall-placeholder.svg"}
        alt={item.title ?? ""}
        loading="lazy"
        onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "/images/mall-placeholder.svg";
        }}
        className="w-full h-28 object-cover rounded-lg mt-2"
      />
      {/* 画像下・中央にモール名 */}
      <div className="mt-2 text-center text-[10px] uppercase tracking-[0.08em]">
        {mallLabel}
      </div>
      {/* 適合度（マッチ%） */}
      {typeof item.match === "number" && (
        <div className="mt-1 text-center text-[11px]">
          適合度 <span className="font-semibold">{item.match}%</span>
        </div>
      )}
      {item.price != null && (
        <div className="text-sm mt-1">¥{Number(item.price).toLocaleString()}</div>
      )}
    </a>
  );
}



/** 予算外バッジ付き商品カード */
function ProductCardWithBudget({ item, userBudget, onCardClick }: { 
  item: any; 
  userBudget?: PriceBandId;
  onCardClick?: (productId: string, position: number) => void;
}) {
  const mallLabel =
    item.mall === "rakuten"
      ? "RAKUTEN"
      : item.mall === "yahoo"
      ? "YAHOO"
      : (item.mall ?? "").toUpperCase();

  const priceText =
    item?._price?.display ??
    (typeof item?.price === "number" ? "¥" + item.price.toLocaleString() : undefined);

  const isOut = item?._budget?.outOfBudget === true;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      onClick={() => {
        // 既存のtrack呼び出し
        fetch("/api/track", {
          method: "POST",
          body: JSON.stringify({
            type: "click",
            group: "secondary",
            url: item.url,
            mall: item.mall,
            ts: Date.now(),
          }),
        });
        // 新しいtrack呼び出し
        onCardClick?.(item.id || item.url, 0);
      }}
      className="rounded-xl border p-3 hover:shadow-sm relative"
    >
      <div className="mb-2 flex items-center gap-2">
        {isOut && <span className="inline-block rounded-full border border-red-400/50 bg-red-400/10 px-2 py-0.5 text-xs text-red-300">予算外</span>}
      </div>
      <div className="font-medium line-clamp-2">{item.title}</div>
      <img
        src={item.image ?? "/images/mall-placeholder.svg"}
        alt={item.title ?? ""}
        loading="lazy"
        onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "/images/mall-placeholder.svg";
        }}
        className="w-full h-28 object-cover rounded-lg mt-2"
      />
      {/* 画像下・中央にモール名 */}
      <div className="mt-2 text-center text-[10px] uppercase tracking-[0.08em]">
        {mallLabel}
      </div>
      {/* 適合度（マッチ%） */}
      {typeof item.match === "number" && (
        <div className="mt-1 text-center text-[11px]">
          適合度 <span className="font-semibold">{item.match}%</span>
        </div>
      )}
      {/* 価格表示 */}
      <div className="mt-2 text-lg font-medium">
        {priceText ? priceText : <span className="text-gray-400">価格情報なし</span>}
      </div>
    </a>
  );
}

export default function ResultPage() {
  const store = useDiagStore();
  
  // デバッグモードの確認
  const isDebug = typeof window !== 'undefined' && window.location.search.includes('debug=1');
  let { provisional, answers } = store;
  // 既定タブ: diagnosis → recommend
  const [activeTab, setActiveTab] = useState<"diagnosis" | "recommend">("diagnosis");
  // 第二候補: 既定で a を展開
  const [secondaryOpen, setSecondaryOpen] = useState<"a" | "b" | "c">("a");
  const [groups, setGroups] = useState<any|null>(null);
  const [loading, setLoading] = useState(false);
  const [triedFallback, setTriedFallback] = useState(false);
  const [topMatch, setTopMatch] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const recSetRef = useRef<string | null>(null);

  // バンディット関連の状態
  const segment = useMemo(() => segmentOf({ 
    sweaty: !!answers?.heat_sweat || answers?.sweaty, 
    posture: answers?.posture 
  }), [answers]);
  const slot = "1";
  const candidates: string[] = ["A", "B"]; // 1位枠の候補（variant識別子）
  const [armKey, setArmKey] = useState<string | null>(null);
  const [variant, setVariant] = useState<string>(candidates[0]);

  // ユーザー予算を取得
  const userBudget: PriceBandId | undefined = (answers?.budget ?? answers?.budgetBandId) as any;

  // 初回インプレッション
  useEffect(() => {
    const rec_set_id = (globalThis as any).__REC_SET_ID__ ?? crypto.randomUUID();
    recSetRef.current = rec_set_id;
    trackOnce(`rec_imp_${rec_set_id}`, 'rec_impression', {
      rec_set_id,
      diag_id: (globalThis as any).__DIAG_ID__,
      variant: (globalThis as any).__REC_VARIANT__, // 後続T3で利用可
    });
  }, []);

  // バンディット選定 → imp
  useEffect(() => {
    const qs = new URLSearchParams({ slot, segment, candidates: candidates.join(",") });
    fetch(`/api/bandit/select?${qs}`)
      .then(r => r.json())
      .then(j => {
        const key: string | undefined = j?.arm_key;
        if (j?.ok && key) {
          setArmKey(key);
          const v = key.split("variant:")[1] ?? candidates[0];
          setVariant(v);
          // imp
          fetch("/api/bandit/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ arm_key: key, event: "imp" }),
          }).catch(() => {});
          trackOnce(`bandit_imp_${key}`, "bandit_impression", { arm_key: key, slot, segment, variant: v });
        } else {
          // fail-open: 既定variant
          setVariant(candidates[0]);
        }
      })
      .catch(() => {
        setVariant(candidates[0]); // fail-open
      });
  }, [slot, segment, candidates]);

  // AIコメント描画時（サーバで生成→props渡し済み想定）
  useEffect(() => {
    const meta = (globalThis as any).__AI_COMMENT_META__; // {version, prompt_hash, model, tags, length}
    if (meta) {
      track('ai_comment_rendered', {
        diag_id: (globalThis as any).__DIAG_ID__,
        rec_set_id: recSetRef.current,
        ...meta,
      });
    }
  }, []);

  // 推薦カードクリックで発火（カードコンポーネント側で利用）
  function onCardClick(productId: string, position: number) {
    const item = groups?.primary?.[position] || 
                 groups?.secondaryA?.[position - 3] || 
                 groups?.secondaryB?.[position - 3] || 
                 groups?.secondaryC?.[position - 3];
    
                    const budget_rel = (userBudget && item?._budget?.outOfBudget !== undefined)
                  ? (item._budget.outOfBudget ? 'out' : 'within')
                  : 'unknown';

    track('rec_click', {
      diag_id: (globalThis as any).__DIAG_ID__,
      rec_set_id: recSetRef.current,
      product_id: productId,
      position,
      budget_rel
    });
  }

  // バンディットクリック時
  function onTop1Click(productId: string) {
    if (armKey) {
      fetch("/api/bandit/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ arm_key: armKey, event: "click" }),
      }).catch(() => {});
      track("bandit_click", { arm_key: armKey, slot, segment, variant, product_id: productId });
    }
  }

  // 空配列検査ヘルパー
  const isEmptyGroups = (g: any) => {
    if (!g) return true;
    const p = Array.isArray(g.primary) ? g.primary.length : 0;
    const a = Array.isArray(g.secondaryA) ? g.secondaryA.length : 0;
    const b = Array.isArray(g.secondaryB) ? g.secondaryB.length : 0;
    const c = Array.isArray(g.secondaryC) ? g.secondaryC.length : 0;
    return p + a + b + c === 0;
  };

  // provisional を配列/オブジェクト両対応で正規化
  const rawProv = useMemo<unknown[]>(() => {
    const p = store.provisional;
    if (Array.isArray(p)) return p;
    if (Array.isArray((p as any)?.provisional)) return (p as any).provisional;
    if (p && typeof p === "object") return Object.values(p as any);
    return [];
  }, [store.provisional]);

  // 「あなたのお悩み」を answers から人間可読に
  const humanProblems = useMemo(() => {
    const a = answers ?? {};
    const src = Array.isArray(a?.neck_shoulder_issues)
      ? a.neck_shoulder_issues
      : a?.neck_shoulder_issues
        ? [a.neck_shoulder_issues]
        : [];
    const M: Record<string, string> = {
      am_neck_pain: "朝起きると首が痛い",
      shoulder_stiff: "肩こりがひどい",
      headache: "頭痛・偏頭痛持ち",
      straight_neck: "ストレートネック",
    };
    return src.map((k: string) => M[k]).filter(Boolean);
  }, [answers]);

  // プレビュー経由で来ていない場合の復旧
  useEffect(() => {
    if (answers && Object.keys(answers).length) return;
    try {
      const raw = sessionStorage.getItem("pillow_snapshot");
      if (!raw) return;
      const snap = JSON.parse(raw);
      if (snap?.answers && (store as any).setAnswers) {
        (store as any).setAnswers(snap.answers);
      }
      if (snap?.scores && (store as any).setScores) {
        (store as any).setScores(snap.scores);
      }
    } catch {}
  }, [answers, store]);

  // 商品候補の取得（正規化した rawProv を利用）
  useEffect(() => {
    if (!rawProv.length) { setGroups({ primary: [], secondaryBuckets: [[], [], []] }); return; }
    setLoading(true);
    (async () => {
      try {
        let mounted = true;
        
        // 既存の取得（例）
        const budgetBandId = answers?.budget;
        const g1 = await buildGroupsFromAPI(rawProv, 12, budgetBandId, true, answers);
        if (!mounted) return;

        if (!isEmptyGroups(g1)) {
          // ユーザーの予算帯キー（answers / payload から取得している既存値を流用）
          const userBand: BudgetBandKey = (answers?.budget ?? "3k-6k") as BudgetBandKey;

          // 1) まず全配列にメタ付与
          const primaryDecorated = decorateItemsWithPriceAndBudget(g1.primary ?? [], userBand);
          const secondaryBucketsDecorated = (g1.secondaryBuckets ?? []).map((arr: any[]) =>
            decorateItemsWithPriceAndBudget(arr ?? [], userBand)
          );

          // 2) 第二候補は ±1 レンジのみ残す
          const secondaryBucketsFiltered = filterSecondaryByAdjacency(secondaryBucketsDecorated, userBand);

          // 3) state へ「付与済みの配列」をそのまま採用（コピーで失わない）
          const filteredGroups = {
            ...g1,
            primary: primaryDecorated,
            secondaryBuckets: secondaryBucketsFiltered,
            // 二段構造を個別に持っているUIなら、ここで同期
            secondaryA: secondaryBucketsFiltered[0] ?? [],
            secondaryB: secondaryBucketsFiltered[1] ?? [],
            secondaryC: secondaryBucketsFiltered[2] ?? [],
          };

          setGroups(filteredGroups);
          console.log("[recommend] groups.raw", filteredGroups);
          console.log("[recommend] primary", filteredGroups?.primary?.length, "secondaryA", filteredGroups?.secondaryA?.length);
          
          // デバッグ: 第二候補の価格情報を確認
          if (isDebug) {
            console.log("[recommend] secondaryA prices:", filteredGroups?.secondaryA?.map((item: any) => ({
              title: item.title?.substring(0, 30),
              _price: item._price,
              _budget: item._budget,
              originalPrice: item.price
            })));
          }
          return;
        }

        // 0件 → 未試行なら緩和リトライ（1回だけ）
        if (!triedFallback) {
          setTriedFallback(true);
          const g2 = await buildGroupsFromAPI(rawProv, 12, undefined, false, answers); // 予算無視・ゆる語・画像なし許容など
          if (!mounted) return;
          setGroups(g2);
          console.log("[recommend] fallback groups.raw", g2);
          return;
        }

        // フォールバック済みでも0件
        setGroups(g1);
        console.log("[recommend] groups.raw", g1);
        console.log("[recommend] primary", g1?.primary?.length, "secondaryA", g1?.secondaryA?.length);
      } finally {
        setLoading(false);
      }
    })();
  }, [rawProv, answers, triedFallback, userBudget]);

  // 適合度は「候補が1件以上あるときだけ」計算・表示（MAX85%）
  useEffect(() => {
    // 商品候補がなくても、answersから基本的な適合度を計算
    if (answers && Object.keys(answers).length > 0) {
      // より動的で意味のあるスコア計算
      let baseScore = 30; // 基本スコアを下げる
      
      // 回答の充実度に応じてスコアを調整
      const answeredFields = Object.keys(answers).filter(key => 
        answers[key] && answers[key] !== "" && 
        (!Array.isArray(answers[key]) || (Array.isArray(answers[key]) && answers[key].length > 0))
      ).length;
      
      // 回答数に応じてスコアを調整（より細かく）
      const completenessBonus = Math.min(25, answeredFields * 2);
      
      // 特定の回答に基づくボーナス
      let specificBonus = 0;
      
      // 身長・寝姿勢の組み合わせによるボーナス
      if (answers.height_band && answers.posture) {
        specificBonus += 5;
      }
      
      // 予算設定によるボーナス
      if (answers.budget) {
        specificBonus += 3;
      }
      
      // 素材の好み設定によるボーナス
      if (answers.material_pref && answers.material_pref !== "unknown") {
        specificBonus += 3;
      }
      
      // 調整可能な枕の希望によるボーナス
      if (answers.adjustable_pref && answers.adjustable_pref !== "unknown") {
        specificBonus += 2;
      }
      
      // 現在の枕の問題点の詳細によるボーナス
      if (Array.isArray(answers.concerns) && answers.concerns.length > 0) {
        specificBonus += Math.min(8, answers.concerns.length * 2);
      }
      
      // 首・肩の問題の詳細によるボーナス
      if (Array.isArray(answers.neck_shoulder_issues) && answers.neck_shoulder_issues.length > 0) {
        specificBonus += Math.min(8, answers.neck_shoulder_issues.length * 2);
      }
      
      // いびき・暑がり情報によるボーナス
      if (answers.snore && answers.snore !== "unknown") {
        specificBonus += 2;
      }
      if (answers.heat_sweat && answers.heat_sweat !== "unknown") {
        specificBonus += 2;
      }
      
      const totalScore = Math.min(85, baseScore + completenessBonus + specificBonus);
      setScore(totalScore);
    } else {
      // 商品候補がある場合は従来の計算
      const hasAny = (groups?.primary.length ?? 0) > 0 ||
                     (groups?.secondaryBuckets.some((b: any) => b.length > 0) ?? false);
      if (!hasAny) { 
        setScore(30); // デフォルトスコアを下げる
        return; 
      }

      const val = Math.min(85, Math.max(30, Math.round(topMatch || 0)));
      setScore(Number.isFinite(val) ? val : 30);
    }
  }, [groups, topMatch, answers]);

  // 「あなたのお悩み」は堅牢化されたヘルパーを使用
  useEffect(() => {
    const robustProblems = deriveProblemsRobust(store);
    setProblems(robustProblems);
  }, [store]);

  const disableProposals = !provisional;

  const scores: Record<string, number> =
    (store as any).scores ?? (store as any).topCategories ?? {};
  const heightKey =
    (store as any).heightKey ??
    (scores.high_height ? "high_height" : scores.low_height ? "low_height" : "middle_height");
  const firmnessKey =
    (store as any).firmnessKey ??
    (scores.firm_support ? "firm_support" : scores.soft_feel ? "soft_feel" : undefined);

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">診断結果 ＋ 商品提案</h1>

      <div className="flex gap-2">
        <button
          className={`rounded-2xl px-4 py-2 ${activeTab==="diagnosis" ? "bg-white/10" : "bg-white/5 hover:bg-white/10"}`}
          onClick={() => setActiveTab("diagnosis")}
        >
          診断内容
        </button>
        <button
          className={`rounded-2xl px-4 py-2 ${disableProposals ? "bg-white/5 opacity-50 cursor-not-allowed" : activeTab==="recommend" ? "bg-white/10" : "bg-white/5 hover:bg-white/10"}`}
          onClick={() => !disableProposals && setActiveTab("recommend")}
          aria-disabled={disableProposals}
          title={disableProposals ? "プレビューで候補準備中です" : undefined}
        >
          商品提案
        </button>
      </div>

      {activeTab === "diagnosis" ? (
        <section className="space-y-6">
          {/* --- Suitability(適合度) Card --- */}
          <section aria-label="suitability-card">
            {score !== null && typeof score === "number" && (
              <section className="rounded-2xl border p-5">
                <h3 className="text-lg mb-2">ご提案する枕の適合性</h3>
                <div className="text-5xl font-bold font-mono">
                  {score} <span className="text-2xl">%</span>
                </div>
                <p className="text-sm mt-3">
                  ※ 無料版のわかりやすいスコアです。詳細コンサル診断ではより精密に判定します。
                </p>
              </section>
            )}
          </section>
          {/* 診断内容（answers だけで描画可能） */}
          <UserView
            scores={scores}
            problems={problems}
            heightKey={heightKey as any}
            firmnessKey={firmnessKey as any}
            mattressFirmness={answers?.mattress_firmness as any}
            currentMaterial={answers?.current_pillow_material}
            answers={answers}
            matchPercent={typeof score === "number" ? score : 0}
          />
          
          <button
            className="mt-6 inline-flex items-center rounded-xl border px-4 py-2"
            onClick={() => {
              setActiveTab("recommend");
              const el = document.getElementById("recommend-section");
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            商品提案へ
          </button>
        </section>
              ) : (
          <section id="recommend-section" aria-label="recommendations" className="scroll-mt-20 space-y-6">
          {disableProposals && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200">
              まずはプレビューで商品候補の準備を行ってください。
              <Link href="/pillow/preview" className="underline ml-2">プレビューへ</Link>
            </div>
          )}
          {!disableProposals && loading && <div>商品候補を取得中...</div>}
          {!disableProposals && !loading && (
            (() => {
              const noCandidates = !groups || isEmptyGroups(groups);

              if (noCandidates) {
                return (
                  <div className="text-sm text-gray-400">
                    候補を取得できませんでした。<br />
                    ・予算条件を緩める／時間をおいて再実行する<br />
                    ・検索語（カテゴリ）が厳しすぎる可能性があります
                  </div>
                );
              }

              return (
                <div>
                  {/* --- 第一候補グループ --- */}
                  {Array.isArray(groups.primary) && groups.primary.length > 0 && (
                    <>
                      <h3 className="text-lg md:text-xl font-semibold mt-8 mb-3">
                        第一候補グループ
                        {variant && <span className="text-sm font-normal ml-2">(variant: {variant})</span>}
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-3 mb-6">
                        {groups.primary.slice(0, 3).map((item: any, index: number) => (
                          <ProductCard 
                            key={item.id} 
                            item={item} 
                            onCardClick={(productId) => {
                              onCardClick(productId, index);
                              // バンディットクリック（1位のみ）
                              if (index === 0) {
                                onTop1Click(productId);
                              }
                            }} 
                          />
                        ))}
                      </div>
                    </>
                  )}
                  
                  {/* --- 第二候補グループ --- */}
                  <h3 className="text-lg md:text-xl font-semibold mt-10 mb-3">第二候補グループ</h3>
                  {(() => {
                    const secondaryCount = (groups?.secondaryBuckets ?? []).flat().length;
                    const showAdjNote = secondaryCount > 0 && secondaryCount < 3;
                    return showAdjNote && (
                      <div className="text-sm text-gray-500 mb-3">該当が少ないため、近い価格帯（±1レンジ）も表示しています。</div>
                    );
                  })()}
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <button
                        className={`px-3 py-1 rounded ${secondaryOpen === "a" ? "bg-white/10" : "bg-white/5"}`}
                        onClick={() => setSecondaryOpen("a")}
                      >
                        {GROUP_LABEL.A}
                      </button>
                      <button
                        className={`px-3 py-1 rounded ${secondaryOpen === "b" ? "bg-white/10" : "bg-white/5"}`}
                        onClick={() => setSecondaryOpen("b")}
                      >
                        {GROUP_LABEL.B}
                      </button>
                      <button
                        className={`px-3 py-1 rounded ${secondaryOpen === "c" ? "bg-white/10" : "bg-white/5"}`}
                        onClick={() => setSecondaryOpen("c")}
                      >
                        {GROUP_LABEL.C}
                      </button>
                    </div>
                    
                    <div className="grid gap-4 sm:grid-cols-3">
                      {(secondaryOpen === "a" ? groups.secondaryA : 
                        secondaryOpen === "b" ? groups.secondaryB : 
                        groups.secondaryC)?.map((item: any, index: number) => (
                        <ProductCardWithBudget 
                          key={item.id} 
                          item={item} 
                          userBudget={userBudget}
                          onCardClick={(productId) => onCardClick(productId, index + 3)} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()
          )}
          {/* …（以降は既存の商品カード描画をそのまま）… */}
        </section>
      )}

      <div className="flex justify-end">
        <Link href="/pillow" className="px-4 py-2 rounded-xl border">最初に戻る</Link>
      </div>
    </main>
  );
}
