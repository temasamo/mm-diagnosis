"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import type { Questionnaire } from "@core/mm";
import QuestionRenderer from "../../../../components/QuestionRenderer";
import Link from "next/link";
import { useDiagStore } from "../../../../lib/state/diagStore";

// セクション定義
const SECTIONS: { title: string; ids: string[] }[] = [
  {
    title: "基本情報",
    ids: [
      "sex",                // 性別（任意）
      "age_band",           // 年齢（任意）
    ],
  },
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
      "cur_issues",         // 気になる点（複数選択可）
    ],
  },
  {
    title: "C. 今の悩み（複数可）",
    ids: [
      "neck_shoulder_issues", // 首・肩まわりで抱えている問題
      "snore",               // いびき
      "fatigue",             // 起床時の疲れ
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

  // ローカルストレージ初期化（念のため）
  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(location.search).get("reset") === "1") {
      localStorage.removeItem("pillow-diag");
    }
  }, []);

  // ハイドレーション完了検知
  useEffect(() => {
    setMounted(true);               // ← 必ず TRUE にする
    console.debug("[diag] mounted");
  }, []);

  // 質問データ取得
  useEffect(() => {
    if (!mounted) return;
    fetch("/questions.pillow.v2.json").then(r => r.json()).then(setQ).catch(console.error);
  }, [mounted]);

  // デバッグ用ログ
  useEffect(() => { 
    console.log("[diag] mounted, rendering form", { mounted, hasHydrated, hasQuestions: !!q }); 
  }, [mounted, hasHydrated, q]);

  if (!mounted || !hasHydrated) return null;        // ← ハイドレーション完了まで待つ

  if (!q) return null;              // 質問データがない場合もnullを返す

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">質問</h1>
      
      {SECTIONS.map((sec) => (
        <section key={sec.title} className="mb-10">
          <h2 className="text-xl font-semibold mb-4">{sec.title}</h2>
          <div className="space-y-6">
            {sec.ids.map((qid) => {
              const question = q.items.find((x) => x.id === qid);
              if (!question) return null;
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