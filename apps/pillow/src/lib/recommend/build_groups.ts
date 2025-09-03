import { type GroupKey } from '@/lib/ui/labels';

// 返却は必ず安定キー
export type RecGroup = { id: GroupKey; items: any[]; reasonTags: string[] };

export type GroupedRecommendations = {
  primary: any[];
  secondaryBuckets: any[][];
  secondaryA: any[];
  secondaryB: any[];
  secondaryC: any[];
  secondaryLabels?: string[];
};

export async function buildGroupsFromAPI(
  provisional: any,
  limit: number = 12,
  budgetBandId?: string,
  strict: boolean = true,
  answers?: any
): Promise<GroupedRecommendations> {
  // 仮実装：実際のAPI呼び出しロジックは既存のものを流用
  // ここでは安定キーを使用した構造を返す
  
  // 例：A, B, Cグループの安定キーで管理
  const aItems: any[] = [];
  const bItems: any[] = [];
  const cItems: any[] = [];
  
  const reasonsA = ['横向き寝向け', '高反発'];
  const reasonsB = ['低反発', '仰向け'];
  const reasonsC = ['首肩', '調整'];
  
  return {
    primary: [],
    secondaryBuckets: [aItems, bItems, cItems],
    secondaryA: aItems,
    secondaryB: bItems,
    secondaryC: cItems,
    secondaryLabels: [reasonsA.join('・'), reasonsB.join('・'), reasonsC.join('・')]
  };
} 