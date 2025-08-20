import Link from "next/link";
import type { StepId } from "@core/mm"; // ワークスペース解決の確認用

export default function Page() {
  const firstStep: StepId = "greet";
  return (
    <main className="max-w-[720px] mx-auto my-10 leading-7">
      <h1 className="text-2xl font-bold">こんにちは！あなたに合う「枕」を一緒に見つけましょう。</h1>
      <p className="mt-2">いくつか質問します。気軽に選んでくださいね。（step: {firstStep}）</p>
      <Link href="/questions" className="inline-block mt-4 underline">はじめる →</Link>
    </main>
  );
}

