"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import type { Questionnaire } from "@core/mm";
import QuestionRenderer from "../../../../components/QuestionRenderer";
import Link from "next/link";
import { useDiagStore } from "../../../../lib/state/diagStore";

// セクション定義
const SECTIONS: { title: string; ids: string[] }[] = [
  {
    title: "A. 体・寝姿勢",
    ids: [
      "posture",            // 主な寝姿勢
      "rollover",           // 寝返り頻度
      "height_band",        // 身長
      "shoulder_width",     // 肩幅（あれば）
    ],
  },
  {
    title: "B. 今使っている枕",
    ids: [
      "cur_years",          // 使用年数
      "cur_height_feel",    // 今の枕の高さはどうですか？
      "cur_firm",           // 今の枕の硬さはどうですか？
      "current_pillow_size",      // 今の枕のサイズは？（わかれば）
      "current_pillow_material",  // 今の枕の素材は？（わかれば）
      "concerns",           // 気になる点（複数選択可）
    ],
  },
  {
    title: "C. 今の悩み（複数可）",
    ids: [
      "neck_shoulder_issues", // 首・肩まわりで抱えている問題
      "snore",               // いびき
      "heat_sweat",          // 暑がり・汗かきですか？
    ],
  },
  {
    title: "D. 好み・希望",
    ids: [
      "mattress_firmness",   // マットレスの硬さ
      "adjustable_pref",     // 枕の高さや硬さを調整できる方が良いですか？
      "material_pref",       // 素材の好み
      "size_pref",           // サイズ希望
      "budget",              // ご予算
    ],
  },
];

export default function Page() {
  // ❗ Hooks は常にトップレベルで宣言
  const [mounted, setMounted] = useState(false);
  const [q, setQ] = useState<Questionnaire | null>(null);
  const answers = useDiagStore((s: any) => s.answers);
  const setAnswers = useDiagStore((s: any) => s.setAnswers);
  const hasHydrated = useDiagStore((s: any) => s.hasHydrated);

  console.log("[diag] Component rendered", { mounted, hasHydrated, hasQuestions: !!q });

  // ローカルストレージ初期化（念のため）
  useEffect(() => {
    console.log("[diag] Initial useEffect");
    if (typeof window !== "undefined" && new URLSearchParams(location.search).get("reset") === "1") {
      localStorage.removeItem("pillow-diag");
    }
  }, []);

  // ハイドレーション完了検知
  useEffect(() => {
    console.log("[diag] Setting mounted to true");
    setMounted(true);               // ← 必ず TRUE にする
    console.debug("[diag] mounted");
  }, []);

  // 質問データ取得
  useEffect(() => {
    console.log("[diag] Fetch effect", { mounted });
    if (!mounted) return;
    console.log("[diag] Fetching questions...");
    fetch("/questions.pillow.v2.json").then(r => r.json()).then(data => {
      console.log("[diag] Questions loaded:", data);
      console.log("[diag] Concerns question:", data.items.find((x: any) => x.id === "concerns"));
      console.log("[diag] Neck issues question:", data.items.find((x: any) => x.id === "neck_shoulder_issues"));
      setQ(data);
    }).catch(error => {
      console.error("[diag] Failed to load questions:", error);
    });
  }, [mounted]);

  // デバッグ用ログ
  useEffect(() => { 
    console.log("[diag] mounted, rendering form", { mounted, hasHydrated, hasQuestions: !!q }); 
  }, [mounted, hasHydrated, q]);

  console.log("[diag] Before return", { mounted, hasHydrated, hasQuestions: !!q });

  if (!mounted || !hasHydrated) {
    console.log("[diag] Early return - not ready");
    return null;        // ← ハイドレーション完了まで待つ
  }

  if (!q) {
    console.log("[diag] Early return - no questions");
    return null;              // 質問データがない場合もnullを返す
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">質問</h1>
      
      {SECTIONS.map((sec) => (
        <section key={sec.title} className="mb-10">
          <h2 className="text-xl font-semibold mb-4">{sec.title}</h2>
          <div className="space-y-6">
            {sec.ids.map((qid) => {
              const question = q.items.find((x) => x.id === qid);
              if (!question) {
                console.warn(`[diag] Question not found: ${qid}`);
                return null;
              }
              console.log(`[diag] Rendering question: ${qid}`, question);
              return (
                <QuestionRenderer
                  key={question.id}
                  questions={[question]}
                  answers={answers}
                  onChange={(id, v) => setAnswers({ [id]: v })}
                />
              );
            })}
          </div>
        </section>
      ))}
      
      <div className="flex justify-end gap-3 pt-4">
        <Link href="/pillow" className="px-4 py-2 rounded-xl border">戻る</Link>
        <Link href="/pillow/preview" className="px-5 py-2 rounded-xl bg-black text-white">一次診断へ</Link>
      </div>
    </main>
  );
} 