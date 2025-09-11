'use client';

import Image from 'next/image';
import Link from 'next/link';

// --- chips order: 姿勢 → 悩み → 調整 → 素材 → サイズ → 予算 ---
const CHIP_ORDER: Array<{ key: string; test: (s: string) => boolean }> = [
  { key: '姿勢',  test: s => /仰向け|横向き|うつ伏せ|寝返り/.test(s) },
  { key: '悩み',  test: s => /首|肩|いびき|頭痛|ストレートネック|高さが合わない|へたる/.test(s) },
  { key: '調整',  test: s => /調整/.test(s) },
  { key: '素材',  test: s => /低反発|高反発|ラテックス|羽毛|パイプ|ビーズ|ポリエステル|そば殻/.test(s) },
  { key: 'サイズ', test: s => /大きめ|標準|小さめ/.test(s) },
  { key: '予算',  test: s => /予算/.test(s) },
];

function chipScore(s: string): number {
  const i = CHIP_ORDER.findIndex(o => o.test(s));
  return i === -1 ? 999 : i;
}
function sortChips(chips: string[] = []): string[] {
  return [...chips]
    .map((c, i) => ({ c, i }))
    .sort((a, b) => {
      const sa = chipScore(a.c), sb = chipScore(b.c);
      return sa === sb ? a.i - b.i : sa - sb;
    })
    .map(x => x.c);
}

type ExplainItem = {
  id?: string;
  title?: string;
  image?: string;
  url?: string;
  explain?: { summarySentence?: string; chips?: string[]; table?: any };
  chips?: string[]; // fallback
};

export default function PrimaryExplainSection({ data }: { data: { items?: ExplainItem[] } }) {
  const items = data?.items ?? [];
  if (!items.length) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {items.map((p: ExplainItem, idx: number) => {
        const chips = sortChips(p?.explain?.chips ?? p?.chips ?? []);
        const key = p?.id ?? `${idx}`;

        return (
          <article key={key} className="rounded-2xl overflow-hidden bg-white/5 border border-white/10">
            <div className="relative aspect-[4/3] bg-black/20">
              {p?.image ? (
                <Image src={p.image} alt={p?.title ?? 'pillow'} fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 grid place-content-center text-xs text-white/40">No image</div>
              )}
            </div>

            <div className="p-3 space-y-2">
              {p?.title ? (
                p?.url ? (
                  <h3 className="text-sm font-semibold line-clamp-2">
                    <Link href={p.url} target="_blank" className="hover:underline">{p.title}</Link>
                  </h3>
                ) : (
                  <h3 className="text-sm font-semibold line-clamp-2">{p.title}</h3>
                )
              ) : null}

              {/* コメント（診断に基づく理由） */}
              <p className="text-sm text-white/80 leading-relaxed line-clamp-3">
                {p?.explain?.summarySentence ?? '診断結果に基づき総合的に適合する候補です。'}
              </p>

              {/* チップ（最大3つ） */}
              {!!chips.length && (
                <div className="flex flex-wrap gap-1">
                  {chips.slice(0, 3).map((c) => (
                    <span key={c} className="px-2 py-0.5 text-xs rounded-full bg-white/10 border border-white/10">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
