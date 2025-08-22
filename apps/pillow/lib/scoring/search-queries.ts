import type { CategoryId } from "./config";

export type SearchQuery = {
  rakuten: string[];
  yahoo: string[];
  amazon: string[];
  generic: string[]; // 汎用検索用
};

export const CATEGORY_SEARCH_QUERIES: Record<CategoryId, SearchQuery> = {
  "low-loft": {
    rakuten: ["枕 低め", "枕 低反発 低め", "枕 高さ調整 低め"],
    yahoo: ["枕 低め", "低反発枕", "枕 高さ調整"],
    amazon: ["pillow low loft", "低め枕", "枕 低反発"],
    generic: ["低め枕", "低反発枕", "枕 高さ調整"]
  },
  "mid-loft": {
    rakuten: ["枕 標準", "枕 ふつう", "枕 中くらい"],
    yahoo: ["枕 標準", "枕 ふつう", "枕 中くらい"],
    amazon: ["pillow medium loft", "標準枕", "枕 ふつう"],
    generic: ["標準枕", "枕 ふつう", "枕 中くらい"]
  },
  "high-loft": {
    rakuten: ["枕 高め", "枕 高さ", "枕 高反発 高め"],
    yahoo: ["枕 高め", "高反発枕", "枕 高さ"],
    amazon: ["pillow high loft", "高め枕", "枕 高反発"],
    generic: ["高め枕", "高反発枕", "枕 高さ"]
  },
  "side-contour": {
    rakuten: ["枕 波型", "枕 横向き", "枕 サイドサポート", "枕 波型 横向き"],
    yahoo: ["枕 波型", "横向き枕", "枕 サイドサポート"],
    amazon: ["pillow side contour", "波型枕", "横向き枕"],
    generic: ["波型枕", "横向き枕", "枕 サイドサポート"]
  },
  "back-contour": {
    rakuten: ["枕 頸椎", "枕 仰向け", "枕 頸椎サポート", "枕 仰向け 頸椎"],
    yahoo: ["枕 頸椎", "仰向け枕", "枕 頸椎サポート"],
    amazon: ["pillow back contour", "頸椎枕", "仰向け枕"],
    generic: ["頸椎枕", "仰向け枕", "枕 頸椎サポート"]
  },
  "adjustable": {
    rakuten: ["枕 高さ調整", "枕 調整", "枕 詰め物", "枕 高さ調整 詰め物"],
    yahoo: ["枕 高さ調整", "調整枕", "枕 詰め物"],
    amazon: ["adjustable pillow", "高さ調整枕", "枕 詰め物"],
    generic: ["高さ調整枕", "調整枕", "枕 詰め物"]
  },
  "cooling": {
    rakuten: ["枕 冷感", "枕 通気", "枕 放熱", "枕 冷感 通気"],
    yahoo: ["枕 冷感", "冷感枕", "枕 通気"],
    amazon: ["cooling pillow", "冷感枕", "枕 通気"],
    generic: ["冷感枕", "通気枕", "枕 放熱"]
  },
  "firm-support": {
    rakuten: ["枕 高反発", "枕 硬め", "枕 しっかり", "枕 高反発 硬め"],
    yahoo: ["枕 高反発", "硬め枕", "枕 しっかり"],
    amazon: ["firm pillow", "高反発枕", "硬め枕"],
    generic: ["高反発枕", "硬め枕", "枕 しっかり"]
  },
  "soft-plush": {
    rakuten: ["枕 低反発", "枕 やわらか", "枕 ふわふわ", "枕 低反発 やわらか"],
    yahoo: ["枕 低反発", "やわらか枕", "枕 ふわふわ"],
    amazon: ["soft pillow", "低反発枕", "やわらか枕"],
    generic: ["低反発枕", "やわらか枕", "枕 ふわふわ"]
  },
  "natural-fill": {
    rakuten: ["枕 そば殻", "枕 羽毛", "枕 自然素材", "枕 そば殻 羽毛"],
    yahoo: ["枕 そば殻", "羽毛枕", "枕 自然素材"],
    amazon: ["natural pillow", "そば殻枕", "羽毛枕"],
    generic: ["そば殻枕", "羽毛枕", "枕 自然素材"]
  }
};

// 検索クエリ生成関数
export function generateSearchQueries(category: CategoryId, site: keyof SearchQuery = 'generic'): string[] {
  const queries = CATEGORY_SEARCH_QUERIES[category];
  return queries ? queries[site] : [];
}

// 複数カテゴリの検索クエリを結合
export function generateCombinedQueries(categories: CategoryId[], site: keyof SearchQuery = 'generic'): string[] {
  const allQueries = categories.flatMap(cat => generateSearchQueries(cat, site));
  return [...new Set(allQueries)]; // 重複除去
}

// カテゴリの説明から検索クエリを生成
export function generateQueriesFromDescription(description: string, site: keyof SearchQuery = 'generic'): string[] {
  const keywords = description.toLowerCase().split(/[、\s]+/);
  const matchingCategories = Object.entries(CATEGORY_SEARCH_QUERIES)
    .filter(([_, queries]) => 
      keywords.some(keyword => 
        queries[site].some(query => query.includes(keyword))
      )
    )
    .map(([category, _]) => category as CategoryId);
  
  return generateCombinedQueries(matchingCategories, site);
} 