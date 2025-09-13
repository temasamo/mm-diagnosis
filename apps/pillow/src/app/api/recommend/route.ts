import { NextResponse } from 'next/server';
import type { ItemMeta } from '@/lib/recommend/normalize';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Budget = { min?: number; max?: number };
type Profile = {
  postures?: string[]; roll?: string; snore?: string;
  concerns?: string[]; mattressFirmness?: string;
  budget?: Budget; prefers?: { adjustable?: boolean; material?: string[]; size?: string };
};

function budgetText(b?: Budget){
  if(!b) return ''; if(b.min&&b.max) return `ご予算は${b.min.toLocaleString()}〜${b.max.toLocaleString()}円帯`;
  if(b.max) return `ご予算は上限${b.max.toLocaleString()}円`;
  if(b.min) return `ご予算は${b.min.toLocaleString()}円以上`; return '';
}
function inBudget(item: ItemMeta, b?: Budget){
  const p = item.priceYen; if(!p||!b) return true;
  if(b.min && p < b.min) return false; if(b.max && p > b.max) return false; return true;
}

function generatePrimaryComment(profile: Profile, p: ItemMeta){
  const s1:string[]=[]; const s2:string[]=[]; const s3:string[]=[];
  const shape = p.shape || '';
  if ((profile.postures||[]).includes('supine') && /center/.test(shape)) s1.push('仰向け中心でも後頭部が安定しやすい「中央くぼみ」構造');
  else if ((profile.postures||[]).includes('side') && /wave/.test(shape)) s1.push('横向きでも肩の隙間を埋める波型サイド高め設計');
  else s1.push('反発と形状のバランスで首をまっすぐ保ちやすい設計');

  if (typeof p.heightCm==='number') s2.push(`目安高さは約${Math.round(p.heightCm)}cm`);
  if (profile.roll?.match(/low|ほとんどしない/)) s2.push('寝返りが少なくても頭が落ちにくい復元性');
  if (p.breathable) s3.push('通気孔でムレを抑制');
  if (p.washable) s3.push('カバーは洗えて清潔を保ちやすい');
  const btxt = budgetText(profile.budget); if (btxt) s3.push(btxt);

  return [s1.join('・'), s2.join('・'), s3.join('。')].filter(Boolean).map(s=>s+'。').join(' ');
}

export async function POST(req: Request){
  try{
    const profile = (await req.json().catch(()=>({}))) as Profile;

    // ★ 現状: Mall接続の picks をここに集約（仮ダミーでもOK）
    const picks: ItemMeta[] = [
      { id:'stub-1', title:'スタンダード / 高反発系', priceYen: 4980, shape:'center-dent', breathable:true },
      { id:'stub-2', title:'通気重視モデル',         priceYen: 5580, shape:'wave',        breathable:true, washable:true },
      { id:'stub-3', title:'調整シート付',           priceYen: 3280, shape:'flat',        washable:true },
    ];

    const poolA = picks.filter(i => inBudget(i, profile.budget));
    const pool  = poolA.length >= 2 ? poolA : picks;

    const items = pool.slice(0,6).map((p, i) => {
      const item: ItemMeta = { ...p };
      item.comment = p.comment ?? generatePrimaryComment(profile, item);
      return item;
    });

    return NextResponse.json({ primaryExplain: { layout:'primary-explain-v1', items: items.slice(0,2) }, groups: {} });
  }catch(e){
    return NextResponse.json({ error:'internal_error', primaryExplain:{ layout:'primary-explain-v1', items:[] } }, { status:500 });
  }
}
