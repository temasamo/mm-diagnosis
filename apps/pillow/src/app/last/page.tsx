import Link from "next/link";
export default function Page(){
  return (
    <main className="max-w-[720px] mx-auto my-10">
      <h2 className="text-xl font-semibold">最後の質問</h2>
      <p className="mt-2">低反発と高反発、どちらの感触が好みですか？（ダミー）</p>
      <Link href="/results" className="inline-block mt-4 underline">最終結果を見る →</Link>
    </main>
  );
}
