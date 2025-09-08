export type Mall = 'rakuten' | 'yahoo' | 'amazon';

export type Item = {
  id?: string;
  title?: string;
  image?: string;
  url: string;
  price: number;

  // 追加: 後方互換のため optional
  mall?: Mall;
  material?: 'lowRebound' | 'highRebound' | 'latex' | 'pipe' | 'feather' | 'polyester' | 'beads' | 'soba' | string;
  structure?: 'flat' | 'wave' | 'contour' | string;
  brand?: string;

  adjustable?: boolean;
  breathable?: boolean;
  snoreSupport?: boolean;
  neckSupport?: boolean;
};

// UIで使う最小プロダクト（mall は必須）
export type MallProduct = {
  id?: string;
  title: string;
  image: string;
  url: string;
  price: number;
  mall: Mall;
};
