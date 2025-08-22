import type { CategoryId } from "./config";
import { generateSearchQueries } from "./search-queries";

export type ProductRecommendation = {
  category: CategoryId;
  score: number;
  products: Product[];
  searchQueries: string[];
};

export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  url: string;
  rating?: number;
  reviewCount?: number;
  features: string[];
};

// モック商品データ（実際はAPIから取得）
const MOCK_PRODUCTS: Record<CategoryId, Product[]> = {
  "low-loft": [
    {
      id: "low-1",
      name: "低反発 低め枕 やわらか",
      price: 3980,
      image: "/images/low-pillow-1.jpg",
      url: "https://example.com/low-1",
      rating: 4.2,
      reviewCount: 156,
      features: ["低反発", "低め", "やわらか"]
    },
    {
      id: "low-2", 
      name: "高さ調整 低め枕",
      price: 5980,
      image: "/images/low-pillow-2.jpg",
      url: "https://example.com/low-2",
      rating: 4.5,
      reviewCount: 89,
      features: ["高さ調整", "低め", "詰め物"]
    }
  ],
  "mid-loft": [
    {
      id: "mid-1",
      name: "標準高さ 枕 ふつう",
      price: 2980,
      image: "/images/mid-pillow-1.jpg", 
      url: "https://example.com/mid-1",
      rating: 4.1,
      reviewCount: 234,
      features: ["標準高さ", "ふつう", "汎用"]
    }
  ],
  "high-loft": [
    {
      id: "high-1",
      name: "高め枕 高反発",
      price: 4980,
      image: "/images/high-pillow-1.jpg",
      url: "https://example.com/high-1", 
      rating: 4.3,
      reviewCount: 123,
      features: ["高め", "高反発", "しっかり"]
    }
  ],
  "side-contour": [
    {
      id: "side-1",
      name: "波型枕 横向きサポート",
      price: 6980,
      image: "/images/side-pillow-1.jpg",
      url: "https://example.com/side-1",
      rating: 4.6,
      reviewCount: 78,
      features: ["波型", "横向き", "サイドサポート"]
    }
  ],
  "back-contour": [
    {
      id: "back-1", 
      name: "頸椎サポート 仰向け枕",
      price: 7980,
      image: "/images/back-pillow-1.jpg",
      url: "https://example.com/back-1",
      rating: 4.4,
      reviewCount: 92,
      features: ["頸椎サポート", "仰向け", "医療用"]
    }
  ],
  "adjustable": [
    {
      id: "adj-1",
      name: "高さ調整 詰め物枕",
      price: 8980,
      image: "/images/adj-pillow-1.jpg", 
      url: "https://example.com/adj-1",
      rating: 4.7,
      reviewCount: 45,
      features: ["高さ調整", "詰め物", "カスタマイズ"]
    }
  ],
  "cooling": [
    {
      id: "cool-1",
      name: "冷感 通気枕",
      price: 5980,
      image: "/images/cool-pillow-1.jpg",
      url: "https://example.com/cool-1",
      rating: 4.2,
      reviewCount: 67,
      features: ["冷感", "通気", "放熱"]
    }
  ],
  "firm-support": [
    {
      id: "firm-1",
      name: "高反発 硬め枕",
      price: 4980,
      image: "/images/firm-pillow-1.jpg",
      url: "https://example.com/firm-1",
      rating: 4.0,
      reviewCount: 89,
      features: ["高反発", "硬め", "しっかり"]
    }
  ],
  "soft-plush": [
    {
      id: "soft-1",
      name: "低反発 やわらか枕",
      price: 3980,
      image: "/images/soft-pillow-1.jpg",
      url: "https://example.com/soft-1",
      rating: 4.3,
      reviewCount: 134,
      features: ["低反発", "やわらか", "ふわふわ"]
    }
  ],
  "natural-fill": [
    {
      id: "natural-1",
      name: "そば殻枕 自然素材",
      price: 2980,
      image: "/images/natural-pillow-1.jpg",
      url: "https://example.com/natural-1",
      rating: 4.1,
      reviewCount: 56,
      features: ["そば殻", "自然素材", "通気"]
    }
  ]
};

export type RecommendationGroups = {
  primary: ProductRecommendation[];
  secondary: ProductRecommendation[];
  summary: {
    primaryCount: number;
    secondaryCount: number;
    totalProducts: number;
  };
};

export function generateProductRecommendations(
  provisionalResults: Array<{ category: CategoryId; score: number }>,
  maxProductsPerCategory: number = 3
): RecommendationGroups {
  
  // 第一候補（上位3カテゴリ）
  const primary = provisionalResults
    .slice(0, 3)
    .map(result => ({
      category: result.category,
      score: result.score,
      products: MOCK_PRODUCTS[result.category]?.slice(0, maxProductsPerCategory) || [],
      searchQueries: generateSearchQueries(result.category)
    }));

  // 第二候補（4-6位のカテゴリ）
  const secondary = provisionalResults
    .slice(3, 6)
    .map(result => ({
      category: result.category,
      score: result.score,
      products: MOCK_PRODUCTS[result.category]?.slice(0, maxProductsPerCategory) || [],
      searchQueries: generateSearchQueries(result.category)
    }));

  const totalProducts = primary.reduce((sum, p) => sum + p.products.length, 0) +
                       secondary.reduce((sum, p) => sum + p.products.length, 0);

  return {
    primary,
    secondary,
    summary: {
      primaryCount: primary.length,
      secondaryCount: secondary.length,
      totalProducts
    }
  };
}

// 価格帯フィルタリング
export function filterByBudget(
  recommendations: RecommendationGroups,
  budget: string
): RecommendationGroups {
  const budgetRanges = {
    "lt5k": { min: 0, max: 5000 },
    "5k-15k": { min: 5000, max: 15000 },
    "15k-30k": { min: 15000, max: 30000 },
    "30k+": { min: 30000, max: Infinity }
  };

  const range = budgetRanges[budget as keyof typeof budgetRanges];
  if (!range) return recommendations;

  const filterProducts = (products: Product[]) => 
    products.filter(p => p.price >= range.min && p.price <= range.max);

  return {
    primary: recommendations.primary.map(p => ({
      ...p,
      products: filterProducts(p.products)
    })),
    secondary: recommendations.secondary.map(p => ({
      ...p,
      products: filterProducts(p.products)
    })),
    summary: {
      primaryCount: recommendations.primary.length,
      secondaryCount: recommendations.secondary.length,
      totalProducts: recommendations.primary.reduce((sum, p) => sum + filterProducts(p.products).length, 0) +
                     recommendations.secondary.reduce((sum, p) => sum + filterProducts(p.products).length, 0)
    }
  };
}

// 商品の特徴に基づくランキング
export function rankProductsByFeatures(
  products: Product[],
  userPreferences: Record<string, any>
): Product[] {
  return products.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    // 評価でスコア
    scoreA += (a.rating || 0) * 10;
    scoreB += (b.rating || 0) * 10;

    // レビュー数でスコア
    scoreA += Math.min((a.reviewCount || 0) / 10, 10);
    scoreB += Math.min((b.reviewCount || 0) / 10, 10);

    // ユーザー好みとのマッチング
    if (userPreferences.material_pref) {
      const materialMatch = (features: string[]) => 
        features.some(f => f.includes(userPreferences.material_pref));
      
      if (materialMatch(a.features)) scoreA += 20;
      if (materialMatch(b.features)) scoreB += 20;
    }

    return scoreB - scoreA;
  });
} 