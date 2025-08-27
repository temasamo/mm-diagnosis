import Link from "next/link";
import { readAnswersFromSearchParams } from "@/lib/answers/ssr";
import { buildProblemList } from "../../../../../lib/recommend/buildProblemList";

export default async function Page({ searchParams }: { searchParams: Record<string, any> }) {
  const answers = readAnswersFromSearchParams(searchParams);
  const problems = buildProblemList(answers);

  // 現在のクエリを文字列化（c があれば維持）
  const current = new URLSearchParams();
  if (Array.isArray(answers.problems) && answers.problems.length) {
    current.set("c", answers.problems.filter(p => !["snore","tiredMorning","hotSleep"].includes(p)).join(","));
  }
  // s/t/h も既存値があれば維持
  ["s","t","h"].forEach((k) => { if (searchParams[k]) current.set(k, String(searchParams[k])); });

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-6">一次診断</h1>
      
      <section className="rounded-2xl border p-6">
        <h2 className="text-xl md:text-2xl font-semibold">あなたの診断サマリー</h2>
        <p className="leading-relaxed">
          あなたにおすすめの枕は「中くらい・標準」タイプです。
        </p>
      </section>

      {/* 「あなたのお悩み」 */}
      <section>
        <h2 className="text-lg font-semibold">あなたのお悩み</h2>
        {problems.bullets.length ? (
          <ul className="list-disc pl-6 space-y-1">
            {problems.bullets.map((b: string) => <li key={b}>{b}</li>)}
          </ul>
        ) : (
          <p className="text-muted-foreground">特筆すべきお悩みは選択されていません。</p>
        )}
      </section>

      {/* 追加：追質問（GETで自身に送るだけ） */}
      <section className="space-y-4">
        <h3 className="font-medium">追加の確認</h3>
        <form method="GET" action="/pillow/preview" className="space-y-3">
          {/* 既存クエリ（c など）を hidden で維持 */}
          {Array.from(current.entries()).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}

          <div className="grid grid-cols-1 gap-3">
            <label className="flex items-center gap-3">
              <span className="w-40">いびき</span>
              <select name="s" defaultValue={searchParams.s ?? ""} className="border rounded px-2 py-1">
                <option value="">未選択</option>
                <option value="1">あり</option>
                <option value="0">なし</option>
              </select>
            </label>

            <label className="flex items-center gap-3">
              <span className="w-40">起床時の疲れ</span>
              <select name="t" defaultValue={searchParams.t ?? ""} className="border rounded px-2 py-1">
                <option value="">未選択</option>
                <option value="1">あり</option>
                <option value="0">なし</option>
              </select>
            </label>

            <label className="flex items-center gap-3">
              <span className="w-40">暑がり・汗かき</span>
              <select name="h" defaultValue={searchParams.h ?? ""} className="border rounded px-2 py-1">
                <option value="">未選択</option>
                <option value="1">はい</option>
                <option value="0">いいえ</option>
              </select>
            </label>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 rounded border">反映</button>
            {/* /result へ遷移（現在のクエリをすべて持っていく） */}
            <Link href={`/pillow/result?${new URLSearchParams({ ...Object.fromEntries(current), s:String(searchParams.s ?? ""), t:String(searchParams.t ?? ""), h:String(searchParams.h ?? "") }).toString()}`}
                  className="px-5 py-2 rounded bg-black text-white">
              診断結果へ
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
