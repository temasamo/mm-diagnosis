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
  const store = useDiagStore();
  const answers = store.answers ?? {};
  const [ready, setReady] = useState(false);
  const [showMaterialPopup, setShowMaterialPopup] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");

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

  // ページ表示後に素材質問ポップアップを表示
  useEffect(() => {
    if (ready && !answers.current_pillow_material) {
      const timer = setTimeout(() => {
        setShowMaterialPopup(true);
      }, 1000); // 1秒後に表示
      return () => clearTimeout(timer);
    }
  }, [ready, answers.current_pillow_material]);

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
          <h3 className="text-lg font-semibold mb-3">あなたのお悩み/使っているマットレス・布団や枕の素材</h3>
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

      {/* 素材質問ポップアップ */}
      {showMaterialPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">
              AIから追加の質問です
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              あなたのお使いの枕の素材はなんですか？より良いご提案のためにわかれば教えてください
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
