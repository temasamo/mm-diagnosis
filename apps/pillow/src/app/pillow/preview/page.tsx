"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useDiagStore } from "@lib/state/diagStore";
import { computeProvisional } from "@lib/scoring/engine";
import { formatSummary } from "@/app/pillow/components/result/presenters";
import { buildProblemList } from "@lib/recommend/buildProblemList";
import { derivePosture } from "../../../lib/utils/posture";

// お悩みの堅牢化ヘルパー
function deriveProblems(answers: any): string[] {
  const problemList = buildProblemList(answers);
  return Array.isArray((problemList as any).bullets) ? (problemList as any).bullets : [];
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

// 重複排除ユーティリティ（ジェネリクス廃止）

// 素材選択肢
const MATERIAL_OPTIONS = [
  { id: "low_rebound", label: "低反発ウレタン" },
  { id: "high_rebound", label: "高反発ウレタン" },
  { id: "latex", label: "ラテックス" },
  { id: "pipe", label: "パイプ" },
  { id: "beads", label: "ビーズ（マイクロビーズ含む）" },
  { id: "feather", label: "羽毛・フェザー" },
  { id: "poly_cotton", label: "ポリエステル綿" },
  { id: "sobakawa", label: "そば殻" },
  { id: "other", label: "その他 / 不明" }
];

export default function PreviewPage() {
  const router = useRouter();
  const store = useDiagStore();
  const answers = store.answers ?? {};
  const [ready, setReady] = useState(false);
  const [showMaterialPopup, setShowMaterialPopup] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(true);

  // 姿勢の補完（安全ネット）
  const fixedAnswers = useMemo(() => {
    if (!answers.posture && answers.postures) {
      const derived = derivePosture(answers.postures);
      return { ...answers, posture: derived };
    }
    return answers;
  }, [answers]);

  const height = fixedAnswers?.prefHeight ?? fixedAnswers?.heightFeel ?? fixedAnswers?.cur_height_feel ?? "指定なし";
  const soft = fixedAnswers?.prefFirmness ?? fixedAnswers?.firmnessFeel ?? fixedAnswers?.cur_firm ?? "指定なし";
  const summary = formatSummary(height, soft);

  // お悩みの堅牢化
  const problems = deriveProblems(fixedAnswers);

  // TOP3 は scores が無ければ derive
  const scores: Record<string, number> = useMemo(() => {
    return (store as any).scores && Object.keys((store as any).scores).length
      ? (store as any).scores
      : deriveScores(fixedAnswers);
  }, [store, fixedAnswers]);

  const top3 = useMemo(() => {
    return Object.entries(scores)
      .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
      .slice(0, 3);
  }, [scores]);

  // 初回: provisional を必ず作る & scores を store に格納、スナップショット保存
  useEffect(() => {
    setIsProcessing(true);
    
    try {
      if (!store.provisional && fixedAnswers) {
        // computeProvisionalは同期的な関数なので、同期的に実行
        const provisional = computeProvisional(fixedAnswers);
        // zustand の setter があればそれで。無ければ直接代入でも可。
        (store as any).setProvisional
          ? (store as any).setProvisional({ provisional })
          : ((store as any).provisional = { provisional });
      }
      if ((store as any).setScores && !(store as any).scores) {
        (store as any).setScores(scores);
      }
      // 保険: セッション保存（結果側で復旧可能に）
      sessionStorage.setItem(
        "pillow_snapshot",
        JSON.stringify({ answers, scores })
      );
      setReady(true);
      setIsProcessing(false);
    } catch (error) {
      console.error('Error processing provisional:', error);
      setReady(!!store.provisional);
      setIsProcessing(false);
    }
  }, [fixedAnswers]); // 依存配列を fixedAnswers のみに変更

  // ページ表示後に素材質問ポップアップを表示
  useEffect(() => {
    if (ready) {
      const timer = setTimeout(() => {
        setShowMaterialPopup(true);
      }, 1000); // 1秒後に表示
      return () => clearTimeout(timer);
    }
  }, [ready]);

  // 素材選択時の処理
  const handleMaterialSelect = (materialId: string) => {
    setSelectedMaterial(materialId);
    // storeに素材情報を保存
    if ((store as any).setAnswers) {
      (store as any).setAnswers({ ...answers, current_pillow_material: materialId });
    } else {
      (store as any).answers = { ...answers, current_pillow_material: materialId };
    }
    setShowMaterialPopup(false);
  };

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-6">一次診断</h1>
      
      {/* ローディング状態の表示 */}
      {isProcessing && (
        <section className="rounded-2xl border p-6 bg-zinc-900/40">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            <span className="text-lg">診断結果を処理中...</span>
          </div>
        </section>
      )}
      
      <section className="rounded-2xl border p-6">
        <h2 className="text-xl md:text-2xl font-semibold">あなたの診断サマリー</h2>
        <p className="leading-relaxed">
          あなたにおすすめの枕は「中くらい・標準」タイプです。
        </p>
      </section>

      {/* 「あなたのお悩み」 - 重複回避のため無効化 */}
      {false && (
        <section>
          <h2 className="text-lg font-semibold">あなたのお悩み</h2>
          {problems.length ? (
            <ul className="list-disc pl-6 space-y-1">
              {problems.map((b: string) => <li key={b}>{b}</li>)}
            </ul>
          ) : (
            <p className="text-muted-foreground">特筆すべきお悩みは選択されていません。</p>
          )}
        </section>
      )}

      {/* お悩みセクション */}
      {problems.length > 0 && (
        <section className="rounded-2xl border p-6">
          <h3 className="text-lg font-semibold mb-3">あなたのお悩み/使っているマットレス・布団や枕の素材</h3>
          <ul className="list-disc pl-5 space-y-1">
            {Array.from(new Set(problems)).map((problem: string, index: number) => (
              <li key={index} className="text-sm">{problem}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex justify-end">
        <button
          onClick={() => {
            if (ready && !isProcessing) {
              router.push("/pillow/result");
            }
          }}
          disabled={!ready || isProcessing}
          className={`px-6 py-3 rounded-xl transition-all ${
            ready && !isProcessing 
              ? "bg-white/10 hover:bg-white/20" 
              : "bg-white/5 cursor-not-allowed opacity-50"
          }`}
        >
          {isProcessing ? "処理中..." : ready ? "診断結果へ" : "準備中…"}
        </button>
      </section>

      {/* 素材質問ポップアップ */}
      {showMaterialPopup && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">
              AIから追加の質問です
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              現在お使いの枕の素材はなんですか？より良いご提案のためにわかれば教えてください
            </p>
            
            <div className="space-y-2 mb-6">
              {MATERIAL_OPTIONS.map((option) => (
                <label key={option.id} className="flex items-center p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="material"
                    value={option.id}
                    checked={selectedMaterial === option.id}
                    onChange={() => handleMaterialSelect(option.id)}
                    className="mr-3"
                  />
                  <span className="text-sm text-gray-900">{option.label}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => handleMaterialSelect("other")}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                スキップ
              </button>
              <button
                onClick={() => setShowMaterialPopup(false)}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
