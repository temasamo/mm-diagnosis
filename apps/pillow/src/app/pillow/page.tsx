"use client";
import Link from "next/link";
import { useDiagStore } from "../../../lib/state/diagStore";

export default function Page() {
  const reset = useDiagStore(s => s.reset);
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">枕診断へようこそ</h1>
      <div className="mt-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 md:px-6 md:py-4">
        <p className="text-base md:text-lg leading-relaxed">
          <span className="font-semibold">悩みの可視化</span>
          <span className="mx-2">→</span>
          <span className="font-semibold">解決アプローチ提示</span>
          <span className="mx-2">→</span>
          <span className="font-semibold">モール横断の購入候補</span>
          まで、数分でご案内します。
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/pillow/diagnosis" className="px-5 py-2 rounded-xl bg-black text-white">診断を始める</Link>
        <button className="px-4 py-2 rounded-xl border" onClick={reset}>リセット</button>
      </div>
    </main>
  );
} 