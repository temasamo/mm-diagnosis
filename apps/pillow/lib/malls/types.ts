export type Mall = 'rakuten' | 'yahoo';

export type SearchItem = {
  id: string;          // オリジンの一意キー（itemCode 等）
  mall: Mall;
  title: string;
  url: string;
  image: string | null;
  price: number;       // 数値化済み
  shop?: string | null;
}; 