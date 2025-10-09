'use client';

import * as React from 'react';
import { buildAffUrl, toSearchQuery } from '@/lib/affOut';

type Mall = "rakuten" | "yahoo" | "amazon" | string;

export type ProductItem = {
  id: string;
  mall: Mall;
  title: string;
  url?: string;           // 個別商品の生URL（あれば最優先）
  image?: string | null; // 画像URL（無ければプレースホルダー表示）
  price?: number | null;
  shop?: string | null;
  brand?: string;         // ブランド/シリーズ名（あれば精度UP）
  outOfBudget?: boolean; // 予算外フラグ（あればバッジ表示）
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

export default function ProductCard({ item }: { item: ProductItem }) {
  // 個別URLがあれば最優先、なければ検索クエリでフォールバック
  const href =
    item.url
      ? buildAffUrl(item.mall as "rakuten" | "yahoo", { url: item.url }) // ①個別URLをもしも/VCで包む
      : buildAffUrl(item.mall as "rakuten" | "yahoo", { brand: toSearchQuery(item.title, item.brand) }); // ②検索で包む

  return (
    <a 
      href={href} 
      target="_blank" 
      rel="nofollow sponsored noopener" 
      className="block rounded-xl overflow-hidden hover:shadow-lg transition-shadow bg-white border border-gray-200 shadow-sm"
    >
      <div className="aspect-[4/3] bg-gray-50">
        {item.image ? (
          <img 
            src={item.image} 
            alt={item.title} 
            className="h-full w-full object-cover" 
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-400">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="text-sm line-clamp-2 mb-1 text-gray-900">{item.title}</div>
        <div className="flex items-center justify-between">
          <div className="font-semibold text-lg text-gray-900">{formatJPY(item.price)}</div>
          {item.shop && (
            <div className="text-xs text-gray-600">{item.shop}</div>
          )}
        </div>
        {item.outOfBudget && (
          <div className="mt-2">
            <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
              予算外
            </span>
          </div>
        )}
      </div>
    </a>
  );
}
