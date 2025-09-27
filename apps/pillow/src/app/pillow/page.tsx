"use client";
import Link from "next/link";
import { useDiagStore } from "../../../lib/state/diagStore";
import { APP_NAME } from "@/lib/constants";
import { getGreetingJST } from "@/lib/ui/greeting";
import AffiliateNotice from "@/components/AffiliateNotice";
import { useState, useEffect } from "react";

export default function Page() {
  const reset = useDiagStore(s => s.reset);
  const [greet, setGreet] = useState("こんにちは"); // Default value for hydration fix
  
  useEffect(() => { // Hydration fix
    setGreet(getGreetingJST());
  }, []);
  
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="mb-6">
        <p className="text-neutral-300 mb-2">{greet}</p>
        <h1 className="text-3xl font-bold">{APP_NAME}へようこそ</h1>
      </div>
      <AffiliateNotice className="mx-auto max-w-4xl" />
      
      <div className="space-y-4 text-lg text-neutral-200">
        <p className="font-semibold">枕のこんなお悩み解消したくありませんか？</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>「朝起きたら首が痛い」</li>
          <li>「寝返りがしにくい」</li>
          <li>「枕が合わない」</li>
          <li>「もっと合う枕があるはずだが。。。」</li>
        </ul>
        <p className="mt-6">
          枕診断AIでは、そんなお悩みを解決するために、あなたにぴったりの枕を診断します。
        </p>
        <h2 className="mt-8 text-xl font-bold">枕診断AIの流れ</h2>
        <ul className="list-decimal space-y-2 pl-5">
          <li>Step 1: 簡単な質問に回答（１分）</li>
          <li>Step 2: あなたの睡眠スタイルを分析</li>
          <li>Step 3: 最適な枕を複数のショップからご提案</li>
        </ul>
      </div>

      <section className="flex justify-between items-center mt-8">
        <a
          href="https://www.marketsupporter-ai.com"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-white/20 px-4 py-2 text-white/80 transition-all hover:bg-white/10"
        >
          ホームへ戻る
        </a>
        <div className="flex gap-3">
          <Link
            href="/pillow/diagnosis"
            className="rounded-xl bg-white/90 px-5 py-3 font-semibold text-black transition-all hover:bg-white/80"
          >
            診断を開始する
          </Link>
          <button
            onClick={reset}
            className="rounded-xl border border-white/20 px-5 py-3 text-white/80 transition-all hover:bg-white/10"
          >
            リセット
          </button>
        </div>
      </section>
    </main>
  );
}
