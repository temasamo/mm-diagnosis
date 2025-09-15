import { NextResponse } from 'next/server';
import { searchRakuten } from '../../../../lib/malls/rakuten';
import { searchYahoo } from '../../../../lib/malls/yahoo';
import { dedupeAndPickCheapest } from '../../../../lib/dedupe';
import type { SearchItem } from '../../../../lib/malls/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Budget = { min?: number; max?: number };
type Profile = {
  postures?: string[]; roll?: string; snore?: string;
  concerns?: string[]; mattressFirmness?: string;
  budget?: Budget; prefers?: { adjustable?: boolean; material?: string[]; size?: string };
};

type ItemMeta = {
  id: string;
  title: string;
  priceYen?: number;
  imageUrl?: string;
  url?: string;
  mall?: string;
  shop?: string;
  shape?: string;
  breathable?: boolean;
  washable?: boolean;
  comment?: string;
};

// 予算帯IDを取得
function getBudgetBandId(budget?: Budget): string | null {
  if (!budget) return null;
  
  if (budget.min && budget.max) {
    if (budget.min >= 3000 && budget.max <= 6000) return '3k-6k';
    if (budget.min >= 6000 && budget.max <= 10000) return '6k-10k';
    if (budget.min >= 10000 && budget.max <= 20000) return '10k-20k';
  }
  
  if (budget.max && budget.max <= 3000) return 'lt3k';
  if (budget.min && budget.min >= 20000) return '20k+';
  
  return null;
}

function budgetText(b?: Budget){
  if(!b) return ''; 
  if(b.min&&b.max) return `ご予算は${b.min.toLocaleString()}〜${b.max.toLocaleString()}円帯`;
  if(b.max) return `ご予算は上限${b.max.toLocaleString()}円`;
  if(b.min) return `ご予算は${b.min.toLocaleString()}円以上`; 
  return '';
}

function inBudget(item: ItemMeta, b?: Budget){
  const p = item.priceYen; 
  if(!p||!b) return true;
  if(b.min && p < b.min) return false; 
  if(b.max && p > b.max) return false; 
  return true;
}

function generatePrimaryComment(profile: Profile, p: ItemMeta){
  const s1:string[]=[]; const s2:string[]=[]; const s3:string[]=[];
  const shape = p.shape || '';
  
  if ((profile.postures||[]).includes('supine') && /center/.test(shape)) {
    s1.push('仰向け中心でも後頭部が安定しやすい「中央くぼみ」構造');
  } else if ((profile.postures||[]).includes('side') && /wave/.test(shape)) {
    s1.push('横向きでも肩の隙間を埋める波型サイド高め設計');
  } else {
    s1.push('反発と形状のバランスで首をまっすぐ保ちやすい設計');
  }

  if (typeof p.priceYen === 'number') {
    s2.push(`価格${p.priceYen.toLocaleString()}円`);
  }
  if (profile.roll?.match(/low|ほとんどしない/)) {
    s2.push('寝返りが少なくても頭が落ちにくい復元性');
  }
  if (p.breathable) s3.push('通気孔でムレを抑制');
  if (p.washable) s3.push('カバーは洗えて清潔を保ちやすい');
  
  const btxt = budgetText(profile.budget); 
  if (btxt) s3.push(btxt);

  return [s1.join('・'), s2.join('・'), s3.join('。')].filter(Boolean).map(s=>s+'。').join(' ');
}

// SearchItemをItemMetaに変換
function convertToItemMeta(searchItem: SearchItem): ItemMeta {
  return {
    id: searchItem.id,
    title: searchItem.title,
    priceYen: searchItem.price,
    imageUrl: searchItem.image || undefined,
    url: searchItem.url,
    mall: searchItem.mall,
    shop: searchItem.shop || undefined,
    // 実際の商品なので形状は推測
    shape: searchItem.title.includes('波') ? 'wave' 
         : searchItem.title.includes('くぼみ') ? 'center' 
         : 'flat',
    breathable: searchItem.title.includes('通気') || searchItem.title.includes('メッシュ'),
    washable: searchItem.title.includes('洗える') || searchItem.title.includes('カバー'),
  };
}

export async function POST(req: Request){
  try {
    const profile = (await req.json().catch(()=>({}))) as Profile;
    
    // 実際のAPI検索を実行
    const query = '枕';
    const limit = 10; // 多めに取得して後でフィルタリング
    
    console.log('[recommend] Searching for real products with profile:', profile);
    
    // 楽天・Yahoo検索を並行実行
    const [rakutenResults, yahooResults] = await Promise.allSettled([
      searchRakuten(query, limit),
      searchYahoo(query, limit)
    ]);
    
    // 検索結果をマージ
    const allResults: SearchItem[] = [
      ...(rakutenResults.status === 'fulfilled' ? rakutenResults.value : []),
      ...(yahooResults.status === 'fulfilled' ? yahooResults.value : [])
    ];
    
    console.log('[recommend] Found products:', allResults.length);
    
    // 重複除去
    const deduped = dedupeAndPickCheapest(allResults);
    
    // ItemMetaに変換
    const picks: ItemMeta[] = deduped.map(convertToItemMeta);
    
    // 予算フィルタリング
    const poolA = picks.filter(i => inBudget(i, profile.budget));
    const pool = poolA.length >= 3 ? poolA : picks; // 予算内が3つ以上あれば予算内のみ、なければ全体から
    
    console.log('[recommend] After budget filtering:', pool.length);
    
    // 上位3つを選択（価格順でソート）
    const sortedPool = pool.sort((a, b) => (a.priceYen || 0) - (b.priceYen || 0));
    const selectedItems = sortedPool.slice(0, 3);
    
    // コメント生成
    const items = selectedItems.map((p) => {
      const item: ItemMeta = { ...p };
      item.comment = generatePrimaryComment(profile, item);
      return item;
    });

    console.log('[recommend] Final items:', items.length);

    return NextResponse.json({ 
      primaryExplain: { 
        layout: 'primary-explain-v1', 
        items: items 
      }, 
      groups: {} 
    });
    
  } catch(e) {
    console.error('[recommend] Error:', e);
    return NextResponse.json({ 
      error: 'internal_error', 
      primaryExplain: { 
        layout: 'primary-explain-v1', 
        items: [] 
      } 
    }, { status: 500 });
  }
}
