// apps/pillow/src/lib/malls/types.ts

export type Mall = 'rakuten' | 'yahoo' | 'amazon';

export type SearchItem = {
  id?: string;
  title?: string | null;
  description?: string | null;
  // どちらでも入って来る可能性があるため両方許可
  shop?: string | null;        // 新
  shopName?: string | null;    // 既存
  url: string;
  price?: number | null;
  currency?: 'JPY';
  imageUrl?: string | null;
  mall: Mall;
};
