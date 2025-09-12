'use client';

import Image from 'next/image';
import Link from 'next/link';

// --- chip order utils: 姿勢 → 悩み → 調整 → 素材 → サイズ → 予算 ---
const CHIP_ORDER: Array<{ key: string; test: (s: string) => boolean }> = [
  { key: '姿勢',  test: s => /仰向け|横向き|うつ伏せ|寝返り/.test(s) },
  { key: '悩み',  test: s => /首|肩|いびき|頭痛|ストレートネック|高さが合わない|へたり/.test(s) },
  { key: '調整',  test: s => /調整/.test(s) },
  { key: '素材',  test: s => /低反発|高反発|ラテックス|羽毛|パイプ|ビーズ|ポリエステル/.test(s) },
  { key: 'サイズ', test: s => /大きめ|標準|小さめ/.test(s) },
  { key: '予算',  test: s => /予算/.test(s) },
];
const chipScore = (s: string) => {
  const i = CHIP_ORDER.findIndex(x => x.test(s));
  return i === -1 ? 999 : i;
};
// 安全な安定ソート（同カテゴリ内は元の順番を維持）
function sortChips(chips: string[] = []): string[] {
  return [...chips]
    .map((c, i) => ({ c, i }))
    .sort((a, b) => {
      const sa = chipScore(a.c), sb = chipScore(b.c);
      if (sa !== sb) return sa - sb;
      return a.i - b.i;
    })
    .map(x => x.c);
}

type Item = any;

export default function PrimaryExplainSection({ data }: { data: any }) {
  const debug = process.env.NEXT_PUBLIC_DEBUG_PRIMARY_EXPLAIN === '1';
  const items: Item[] = data?.items ?? [];

  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {items.map((p: Item) => {
        const chips = sortChips(p.explain?.chips ?? []);
        return (
          <article key={p.id} className="rounded-2xl overflow-hidden bg-white/5 border border-white/10">
            <div className="relative aspect-[4/3] bg-black/20">
              {p.image ? (
                <Image src={p.image} alt={p.title} fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 grid place-content-center text-xs text-white/40">No image</div>
              )}
            </div>

            <div className="p-4 space-y-2">
              <h3 className="text-base font-semibold line-clamp-2">{p.title}</h3>

              <p className="text-sm text-white/80 leading-relaxed line-clamp-3">
                {p.explain?.summarySentence ?? '診断結果に基づき総合的に適合する候補です。'}
              </p>

              {!!chips.length && (
                <div className="flex flex-wrap gap-1">
                  {chips.slice(0, 3).map((c) => (
                    <span key={c} className="px-2 py-0.5 text-xs rounded-full bg-white/10 border border-white/10">
                      {c}
                    </span>
                  ))}
                </div>
              )}

              {debug && (
                <details className="mt-2 text-xs opacity-70">
                  <summary className="cursor-pointer">詳しく（DEBUG）</summary>
                  <pre className="mt-1 max-h-40 overflow-auto text-[11px] opacity-70">
                    {JSON.stringify(p.explain?.table, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

