'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';

// [Stub] という接頭辞を見つけたら外す
const stripStub = (s?: string) => (s ?? '').replace(/^\s*\[Stub\]\s*/i, '');

// 型はざっくりでOK（実データが増えたら都度拡張）
type PrimaryExplainItem = {
  id?: string | number;
  title?: string;
  comment?: string;            // ← API にあれば使用。なければ fallback 生成
  imageUrl?: string;           // ← API にあれば使用
  tags?: string[];
  // 互換用の候補フィールド
  description?: string;
  reason?: string;
  cover?: string;
};
type PrimaryExplain = {
  items?: PrimaryExplainItem[];
};

type Props = { data?: PrimaryExplain | null };

function useFallbackComment(it: PrimaryExplainItem) {
  return useMemo(() => {
    // 既存の description/reason のどちらかを優先
    const raw =
      it.comment?.trim() ||
      it.description?.trim() ||
      it.reason?.trim();

    if (raw) return raw;

    // 最低限の既定文
    return '診断結果に基づく提案。扱いやすい汎用形状です。';
  }, [it.comment, it.description, it.reason]);
}

function useBestImage(it: PrimaryExplainItem) {
  // imageUrl / cover の順で利用、無ければ /placeholder.png
  return it.imageUrl || it.cover || '/placeholder.png';
}

function CardImage({ src, alt }: { src: string; alt: string }) {
  const [fallback, setFallback] = useState(false);
  const show = fallback ? '/placeholder.png' : src;

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
      {/* Next/Image は onError でフェイルオーバ */}
      <Image
        src={show}
        alt={alt || 'item image'}
        fill
        sizes="(max-width: 640px) 100vw, 50vw"
        style={{ objectFit: 'cover' }}
        onError={() => setFallback(true)}
        priority={false}
      />
    </div>
  );
}

export default function PrimaryExplainSection({ data }: Props) {
  const items = data?.items ?? [];

  if (!items.length) return null;

  return (
    <section className="mt-8">
      <h3 className="text-xl font-semibold tracking-wide mb-3">
        第一候補セクション
      </h3>

      <div className="grid gap-6 sm:grid-cols-2">
        {items.map((it, idx) => {
          const rawTitle = it.title ?? `候補 ${idx + 1}`;
          const title = stripStub(rawTitle);
          const comment = useFallbackComment(it);
          const image = useBestImage(it);
          const chips = it.tags ?? [];

          return (
            <article
              key={it.id ?? idx}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm"
            >
              <CardImage src={image} alt={title} />

              <div className="mt-3">
                <h4 className="text-base font-semibold">{title}</h4>
                <p className="mt-2 text-sm opacity-80 leading-relaxed">
                  {comment?.trim() || "あなたの回答（姿勢・悩み）に合わせて、高さを微調整できる高反発系の枕を第一候補に選定しました。"}
                </p>

                {!!chips.length && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {chips.slice(0, 5).map((c, i) => (
                      <span
                        key={`${c}-${i}`}
                        className="px-2 py-1 text-xs rounded-full bg-white/10 border border-white/10"
                      >
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
    </section>
  );
}
