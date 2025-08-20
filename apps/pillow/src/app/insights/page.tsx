import Link from "next/link";
export default function Page(){
  return (
    <main className="max-w-[720px] mx-auto my-10">
      <h2 className="text-xl font-semibold">一次診断</h2>
      <p className="mt-2">あなたの回答から、首のサポート性と高さ調整が特に重要だと分かりました。</p>
      <p className="mt-2">より最適にするため、最後に1点だけ確認させてください。</p>
      <Link href="/last" className="inline-block mt-4 underline">最後の質問へ →</Link>
    </main>
  );
}
