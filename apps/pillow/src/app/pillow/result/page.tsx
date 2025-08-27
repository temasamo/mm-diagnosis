import Link from "next/link";
import { readAnswersFromSearchParams } from "@/lib/answers/ssr";
import { buildProblemList } from "@lib/recommend/buildProblemList";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, any>> }) {
  const answers = await readAnswersFromSearchParams(searchParams);
  const problems = buildProblemList(answers);

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-6">診断結果</h1>
      
      {/* 「診断内容」タブ */}
      <section className="rounded-2xl border p-6">
        <h2 className="text-xl md:text-2xl font-semibold mb-4">診断内容</h2>
        
 {/* あなたのお悩み */}
<div className="mb-6">
  <h3 className="text-lg font-semibold mb-3">あなたのお悩み</h3>
  {problems.bullets.length ? (
    <ul className="list-disc pl-6 space-y-1">
      {problems.bullets.map((b: string) => (
        <li key={b}>{b}</li>
      ))}
    </ul>
  ) : (
    <p className="text-muted-foreground">
      特筆すべきお悩みは選択されていません。
    </p>
  )}
</div>

{/* 商品候補の取得 */}
const budgetBandId = answers?.budget;
const g1 = await buildGroupsFromAPI(rawProv, 12, budgetBandId);
if (!mounted) return;

if (!isEmptyGroups(g1)) {
  setGroups(g1);
  console.log("[recommend] groups.raw", g1);
  console.log("[recommend] primary", g1?.primary?.length, "secondaryA", g1?.secondaryA?.length);
  return;
}

// 0件 → 未試行なら緩和リトライ（1回だけ）
if (!triedFallback) {
  setTriedFallback(true);
  const g2 = await buildGroupsFromAPI(rawProv, 12, undefined, false); // 予算無視・ゆるフィルタ
  if (!isEmptyGroups(g2)) {
    setGroups(g2);
    return;
  }
}

          )}
        </div>

        {/* 商品提案（件数） */}
        <div>
          <h3 className="text-lg font-semibold mb-3">商品提案</h3>
          <p className="text-muted-foreground">候補を取得中…</p>
        </div>
      </section>

      <div className="flex justify-end">
        <Link href="/pillow" className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20">
          トップに戻る
        </Link>
      </div>
    </main>
  );
}
