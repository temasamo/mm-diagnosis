// apps/pillow/src/lib/malls/types.ts

export type Mall = 'rakuten' | 'yahoo' | 'amazon';

export type SearchItem = {
  id?: string;

  // 判定で使うフィールド（NGワード判定コメントに合わせて）
  title: string;
  description?: string;
  shopName?: string;
  url: string;

  // 表示やフィルタで使うかもしれない項目（任意）
  price?: number;
  currency?: 'JPY';
  imageUrl?: string;

  mall: Mall;
};
