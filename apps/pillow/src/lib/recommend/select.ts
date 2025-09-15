import type { Answers } from "../../../lib/recommend/buildProblemList";
import type { Product, ItemMeta } from "./normalize";
import { scoreProduct, inBudget } from "./score";

// 安全アクセサ（共通化）
const mc = (p: ItemMeta) => p.materialClass ?? "unknown";
const firstShape = (p: ItemMeta) => p.shape?.[0] ?? "none";
const hasTag = (p: ItemMeta, t: string) => !!p.tags?.includes(t);

export function selectPrimary(products:Product[], a:Answers){
  const scored = products.map(p=>({p, ...scoreProduct(p,a)})).sort((x,y)=>y.score-x.score);
  // 多様化（素材×形状の被りを避ける）
  const seen = new Set<string>(), out:any[]=[];
  for (const it of scored){
    const key = `${mc(it.p)}-${firstShape(it.p)}`;
    if (seen.has(key)) continue;
    out.push({...it.p, why: it.why, recType:"primary"});
    seen.add(key);
    if (out.length>=3) break;
  }
  return out;
}

export function selectAlternatives(products:Product[], a:Answers){
  const out:any[] = [];

  // A) 素材改善
  const improve = products
    .filter(p=>["HR","latex","gel-grid"].includes(mc(p)))
    .map(p=>({p,...scoreProduct(p,a)})).sort((a,b)=>b.score-a.score)[0];
  if (improve) out.push({...improve.p, why:["素材改善（面支持/放熱）"], recType:"alt_material"});

  // B) 悩み特化
  const concern = products
    .map(p=>{
      let c=0, w:string[]=[];
      if (a.heat_sweat === "yes" && (hasTag(p, "vent") || mc(p) === "gel-grid")){c+=3; w.push("通気特化");}
      if (a.neck_shoulder_issues?.includes("straight_neck") && (p.shape?.includes("grid")||hasTag(p, "neck-plain"))){c+=3; w.push("面支持特化");}
      if (a.snore && hasTag(p, "anti-snore")){c+=3; w.push("いびき特化");}
      return {p,c,w};
    }).filter(x=>x.c>0).sort((a,b)=>b.c-a.c)[0];
  if (concern) out.push({...concern.p, why:concern.w, recType:"alt_concern"});

  // C) 予算上下
  const budget = products
    .filter(p=>!inBudget(a,p))
    .map(p=>({p,...scoreProduct(p,a)})).sort((a,b)=>b.score-a.score)[0];
  if (budget) out.push({...budget.p, why:["予算外だが高評価"], recType:"alt_budget"});

  return out;
}
