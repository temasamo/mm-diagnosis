export type BandTag = "primary" | "adjacent";
export type SourceTag = "rakuten" | "yahoo";

export type ProductMeta = {
  source?: SourceTag;
  bandTag?: BandTag;
  bandId?: string | null;
};

// 既存の SearchItem を拡張（SearchItem の import 先は現状に合わせて）
import type { SearchItem } from "../../../lib/malls/types"; // ←実際のパスに合わせて

export type Product = SearchItem & {
  meta?: ProductMeta;
};
