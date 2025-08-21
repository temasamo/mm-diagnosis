"use client";
import Link from "next/link";
import { loadAnswers } from "../lib/answers";

export default function Page(){
  const a = loadAnswers();
  const weight = a["body_weight"]?.[0];
  const firm = a["firmness"]?.[0];

  const summary = (() => {
    const s: string[] = [];
    if (weight === "heavy") s.push("体格がしっかりめ → 体圧分散と沈み込みすぎない支持性が重要。");
    if (firm === "hard") s.push("硬めが好み → 高反発〜しっかりめフォームが候補。");
    return s.join(" ") || "回答をもとに条件を整理しました。";
  })();

  return (
    <main className="max-w-[720px] mx-auto my-10">
      <h2 className="text-xl font-semibold">一次診断（マットレス）</h2>
      <p className="mt-2">{summary}</p>
      <p className="mt-2">仕上げに最後の1問だけ。</p>
      <Link href="/last" className="inline-block mt-4 underline">最後の質問へ →</Link>
    </main>
  );
}
