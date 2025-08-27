import { DIAG_VERSION } from "../../../../lib/DIAG_VERSION";
import { readAnswersFromSearchParams, readAnswersFromCookie, mergeAnswersAsync } from "@/lib/answers/ssr";
import { buildProblemList } from "../../../../lib/recommend/buildProblemList";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, any>> }) {
  // SSRで回答を決定
  const fromSp = readAnswersFromSearchParams(searchParams);
  const fromCk = readAnswersFromCookie();
  const answers = await mergeAnswersAsync(fromSp, fromCk);
  const problems = buildProblemList(answers);

  return (
    <main className="p-6">
      <div className="text-xs opacity-60 mb-2">DEBUG: {DIAG_VERSION}</div>

      <section className="border rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold mb-2">あなたの診断サマリー</h2>
        <p>あなたにおすすめの枕は「高さは中くらい・柔らかさはやわらかめ」タイプです。</p>
      </section>

      <section aria-labelledby="problems" className="border rounded-xl p-6">
        <h3 id="problems" className="text-xl font-semibold mb-2">あなたのお悩み</h3>
        {problems.bullets.length > 0 ? (
          <ul className="list-disc pl-6 space-y-1">
            {problems.bullets.map((b: string) => <li key={b}>{b}</li>)}
          </ul>
        ) : (
          <p className="text-muted-foreground">{problems.sentence}</p>
        )}
        {/* 一時デバッグ（必要なら表示） */}
        {/* <pre className="mt-2 text-xs opacity-60">debug: {JSON.stringify(problems.debugKeys)}</pre> */}
      </section>

      {/* 既存の「診断結果へ」ボタンなどはそのまま */}
    </main>
  );
}
