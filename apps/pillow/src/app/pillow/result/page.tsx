import { DIAG_VERSION } from "../../../../lib/DIAG_VERSION";
import { readAnswersFromSearchParams, readAnswersFromCookie, mergeAnswersAsync } from "@/lib/answers/ssr";
import { buildProblemList } from "../../../../lib/recommend/buildProblemList";

export default async function Page({ searchParams }: { searchParams: Record<string, any> }) {
  const answers = await mergeAnswersAsync(
    readAnswersFromSearchParams(searchParams),
    readAnswersFromCookie()
  );
  const problems = buildProblemList(answers);

  return (
    <div className="p-6">
      <div className="text-xs opacity-60 mb-3">
        DEBUG: {DIAG_VERSION}
      </div>

      <div className="tabs mb-4">
        <button className="btn">診断内容</button>
        <button className="btn">商品提案</button>
      </div>

      {/* 診断内容 */}
      <section className="border rounded-xl p-6 mb-8">
        <h3 className="text-xl font-semibold mb-2">あなたの診断サマリー</h3>
        <p>あなたにおすすめの枕は「高さは中程度・柔らかさは標準」タイプです。</p>
      </section>

      <section aria-labelledby="problems" className="border rounded-xl p-6 mb-8">
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

      {/* 商品提案（簡易 / まずは件数が出ることを確認） */}
      <section className="border rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-2">商品提案（件数）</h3>
        <div>候補を取得中…</div>
      </section>
    </div>
  );
}
