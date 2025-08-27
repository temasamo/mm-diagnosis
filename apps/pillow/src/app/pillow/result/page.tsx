import { readAnswersFromSearchParams } from '@/lib/answers/ssr';
import { buildProblemList } from '@lib/recommend/buildProblemList';
import { buildGroupsFromAPIv2 } from '@lib/recommend/build_groups';

export const dynamic = 'force-dynamic'; // SSR

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, any>> }) {
  const params = await searchParams;
  const c = params.c ?? '';
  const snore = Number(params.s ?? 0);
  const heat  = Number(params.h ?? 0);

  const answers = await readAnswersFromSearchParams(searchParams);
  const problems = buildProblemList(answers); // Setでユニーク

  const groups = await buildGroupsFromAPIv2({ c, snore, heat }); // ← ここを既存実装に合わせて
  const { primary = [], secondaryA = [], secondaryB = [], secondaryC = [] } = groups ?? {};

  const isEmpty = (primary.length + secondaryA.length + secondaryB.length + secondaryC.length) === 0;

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <section>
        <h1 className="text-2xl font-bold">診断結果</h1>
        <ul className="mt-3 list-disc pl-5">
          {[...new Set(problems.bullets)].map((p, i) => <li key={`p-${i}`}>{p}</li>)}
        </ul>
      </section>

      {isEmpty ? (
        <div className="rounded-lg border p-6">
          候補が見つかりませんでした。条件を変更してお試しください。
        </div>
      ) : (
        <>
          <section aria-labelledby="primary">
            <h2 id="primary" className="text-lg font-semibold flex items-center gap-2">
              第一候補 <span className="text-sm font-normal text-muted-foreground">(あなたに最も合いそう)</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {primary.slice(0, 3).map((item: any, i: number) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="text-sm text-blue-600 mb-2">第一候補</div>
                  <h3 className="font-medium mb-2">{item.title}</h3>
                  {item.price && <div className="text-lg font-bold">¥{item.price.toLocaleString()}</div>}
                  {item.mall && <div className="text-sm text-gray-600">{item.mall}</div>}
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="secondary" className="mt-8">
            <h2 id="secondary" className="text-lg font-semibold">第二候補</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {[...secondaryA, ...secondaryB, ...secondaryC].slice(0, 3).map((item: any, i: number) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="text-sm text-green-600 mb-2">第二候補</div>
                  <h3 className="font-medium mb-2">{item.title}</h3>
                  {item.price && <div className="text-lg font-bold">¥{item.price.toLocaleString()}</div>}
                  {item.mall && <div className="text-sm text-gray-600">{item.mall}</div>}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
