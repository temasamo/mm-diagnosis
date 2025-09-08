export type Mall = 'rakuten' | 'yahoo';
export type MallQuery = { q: string; budgetMin?: number; budgetMax?: number; limit?: number };
export type RawMallItem = { id?: string; title: string; url: string; price: number; image?: string; mall: Mall };

export interface MallAdapter {
  name: Mall;
  isConfigured(): boolean;
  search(q: MallQuery, signal?: AbortSignal): Promise<RawMallItem[]>;
}
