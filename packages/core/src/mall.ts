export type Mall = "rakuten" | "yahoo" | "amazon"; // Amazonは型としては残す
export const ENABLED_MALLS: Mall[] = ["rakuten", "yahoo"]; // ← 現時点で有効なのは2社

export type MallProduct = {
  id: string;
  title: string;
  image: string;
  url: string;
  price?: number;
  mall: Mall;
};

export type RecommendRequest = {
  primaryGroup: string[];
  secondaryGroup: string[];
}; 