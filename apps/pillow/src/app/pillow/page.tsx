"use client";
import Link from "next/link";
import { useDiagStore } from "../../../lib/state/diagStore";
import { getGreetingJST } from "@/lib/ui/greeting";

export default function Page() {
  const reset = useDiagStore(s => s.reset);
  const greet = getGreetingJST();
  
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="mb-6">
        <p className="text-neutral-300 mb-2">{greet}</p>
        <h1 className="text-3xl font-bold">枕診断へようこそ</h1>
      </div>
      <p className="text-lg text-white leading-relaxed font-medium bg-black p-4 rounded-lg border border-white/10">
        悩みの可視化 → 解決アプローチ提示 → モール横断の購入候補まで、数分でご案内します。
      </p>
      <div className="flex gap-3">
        <Link href="/pillow/diagnosis" className="px-5 py-2 rounded-xl bg-black text-white">診断を始める</Link>
        <button className="px-4 py-2 rounded-xl border" onClick={reset}>リセット</button>
      </div>
    </main>
  );
} 