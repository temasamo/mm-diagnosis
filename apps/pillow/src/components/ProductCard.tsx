'use client';

import * as React from 'react';

type Mall = 'rakuten' | 'yahoo' | 'amazon' | string;

export type ProductItem = {
  id: string;
  mall: Mall;
  title: string;
  url: string;           // 生URL（/api/out でラップして遷移）
  image?: string | null; // 画像URL（無ければプレースホルダー表示）
  price?: number | null;
  shop?: string | null;
  outOfBudget?: boolean; // 予算外フラグ（あればバッジ表示）
};

type ProductCardProps = {
  item: ProductItem;
  explain?: {
    summarySentence?: string;
    chips?: string[];
    table?: { label: string; badge: '◎'|'▲'; userAnswer: string; productFact: string }[];
    budgetIn?: boolean;
    budget?: { price?: number | null; max?: number | undefined };
  };
};

const mallLabel: Record<string, string> = {
  rakuten: 'RAKUTEN',
  yahoo: 'YAHOO',
  amazon: 'AMAZON',
};

function formatJPY(v?: number | null) {
  if (v == null) return '';
  return `¥${v.toLocaleString('ja-JP')}`;
}

export default function ProductCard({ item, explain }: ProductCardProps) {
  const href = `/api/out?mall=${encodeURIComponent(item.mall)}&url=${encodeURIComponent(
    item.url
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="block rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors overflow-hidden"
      onClick={() =>
        navigator.sendBeacon?.(
          '/api/track',
          new Blob(
            [
              JSON.stringify({
                mall: item.mall,
                id: item.id,
                price: item.price ?? null,
              }),
            ],
            { type: 'application/json' }
          )
        )
      }
    >
      {/* 画像領域（高さ固定＋object-coverで統一） */}
      <div className="relative h-48 w-full bg-black/20">
        {/* モールバッジ */}
        <div className="absolute left-2 top-2 z-10">
          <span className="rounded-full bg-black/70 text-white text-xs tracking-widest px-2 py-1">
            {mallLabel[item.mall] ?? item.mall?.toUpperCase()}
          </span>
        </div>

        {/* 予算外バッジ（任意） */}
        {(item.outOfBudget || explain?.budgetIn === false) && (
          <div className="absolute right-2 top-2 z-10">
            <span className="rounded-full bg-rose-700/80 text-white text-xs px-2 py-1">
              予算外
            </span>
          </div>
        )}

        {/* 画像 or プレースホルダー */}
        {item.image ? (
          // 画像URLがある場合のみ <img> を描画（空文字で描画しない）
          <img
            src={item.image}
            alt={item.title}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-400">
            <span className="text-sm">No image</span>
          </div>
        )}
      </div>

      {/* テキスト領域 */}
      <div className="p-3 flex flex-col gap-2">
        <div className="line-clamp-2 text-white/90 text-sm leading-tight">
          {item.title}
        </div>

        {/* 理由つき表示の追加部分 */}
        {explain?.summarySentence && (
          <p className="mt-2 text-sm text-gray-300">{explain.summarySentence}</p>
        )}

        {!!explain?.chips?.length && (
          <div className="mt-2 flex flex-wrap gap-1">
            {explain.chips.slice(0,3).map((c, i) => (
              <span key={i} className="px-2 py-0.5 text-xs rounded-full border border-white/20">
                {c}
              </span>
            ))}
          </div>
        )}

        {!!explain?.table?.length && (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm underline">詳しく</summary>
            <div className="mt-2 text-xs divide-y divide-white/10">
              {explain.table.map((r, i) => (
                <div key={i} className="py-2 grid grid-cols-[8rem,2rem,1fr] gap-2">
                  <div className="opacity-80">{r.label}</div>
                  <div className={r.badge === '◎' ? 'text-green-400' : 'text-amber-300'}>{r.badge}</div>
                  <div className="space-y-0.5">
                    <div className="opacity-80">{r.userAnswer}</div>
                    <div className="opacity-60">{r.productFact}</div>
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}

        <div className="flex items-center justify-between">
          <div className="text-white text-lg font-semibold">
            {formatJPY(item.price)}
          </div>
          {item.shop && (
            <div className="text-xs text-white/50 uppercase tracking-wider">
              {item.shop}
            </div>
          )}
        </div>
      </div>
    </a>
  );
}
