import Link from "next/link";
import { readAnswersFromSearchParams } from "@/lib/answers/ssr";
import { buildProblemList } from "@lib/recommend/buildProblemList";

// 先頭付近に util を1つ追加（関数でもOK）
const qp = (v: unknown): string => (Array.isArray(v) ? (v[0] ?? "") : (v as string ?? ""));

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, any>> }) {
  const params = await searchParams;
  const answers = await readAnswersFromSearchParams(searchParams);
  const problems = buildProblemList(answers);

  // 既存クエリ維持用
  const current = new URLSearchParams();
  if (Array.isArray(answers.problems) && answers.problems.length) {
    current.set("c", answers.problems
      .filter(p => !["snore","tiredMorning","hotSleep"].includes(p))
      .join(","));
  }

  // ← ここを追加：常にスカラに正規化
  const s = qp(params.s);
  const h = qp(params.h);

  // 既存値があれば current にも反映
  if (s) current.set("s", s);
  if (h) current.set("h", h);

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
            {problems.bullets.map((b: string, i: number) => (
              <li key={`${b}-${i}`}>{b}</li>
            ))}
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
              <select name="s" defaultValue={s} className="border rounded px-2 py-1 bg-white text-black">
                <option value="" className="text-black">未選択</option>
                <option value="1" className="text-black">あり</option>
                <option value="0" className="text-black">なし</option>
              </select>
            </label>

            <label className="flex items-center gap-3">
              <span className="w-40">暑がり・汗かき</span>
              <select name="h" defaultValue={h} className="border rounded px-2 py-1 bg-white text-black">
                <option value="" className="text-black">未選択</option>
                <option value="1" className="text-black">はい</option>
                <option value="0" className="text-black">いいえ</option>
              </select>
            </label>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 rounded border">反映</button>
            {/* /result へ遷移（現在のクエリをすべて持っていく） */}
            <Link
              href={`/pillow/result?${new URLSearchParams({
                ...(Object.fromEntries(current) as Record<string,string>),
                s, h,
              }).toString()}`}
              className="px-5 py-2 rounded bg-black text-white"
            >
              診断結果へ
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
