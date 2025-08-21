
import Link from "next/link";
export default function Page() {
  return (
    <main className="max-w-[720px] mx-auto my-10 leading-7">
      <div className="h-10 w-full bg-red-500/60 p-2 rounded-xl text-white">Tailwind OK</div>
      <h1 className="text-2xl font-bold">こんにちは！あなたに合う「枕」を一緒に見つけましょう。</h1>
      <p className="mt-2">いくつか質問します。気軽に選んでくださいね。</p>
      <Link href="/questions" className="inline-block mt-4 underline">はじめる →</Link>
    </main>
  );
}

