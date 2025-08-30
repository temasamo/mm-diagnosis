import type { Answers } from "../../../lib/recommend/buildProblemList";
import type { Product } from "./normalize";
import { scoreProduct, inBudget } from "./score";

export function selectPrimary(products:Product[], a:Answers){
  const scored = products.map(p=>({p, ...scoreProduct(p,a)})).sort((x,y)=>y.score-x.score);
  // 多様化（素材×形状の被りを避ける）
  const seen = new Set<string>(), out:any[]=[];
  for (const it of scored){
    const key = `${it.p.materialClass}-${it.p.shape[0]||"none"}`;
    if (seen.has(key)) continue;
    out.push({...it.p, why: it.why, recType:"primary"});
    seen.add(key);
    if (out.length>=3) break;
  }
  while (out.length<3 && scored[out.length]) out.push({...scored[out.length].p, why:scored[out.length].why, recType:"primary"});
  return out;
}

export function selectAlternatives(products:Product[], a:Answers){
  const out:any[] = [];

  // A) 素材改善
  const improve = products
    .filter(p=>["HR","latex","gel-grid"].includes(p.materialClass))
    .map(p=>({p,...scoreProduct(p,a)})).sort((a,b)=>b.score-a.score)[0];
  if (improve) out.push({...improve.p, why:["素材改善（面支持/放熱）"], recType:"alt_material"});

  // B) 悩み特化
  const concern = products
    .map(p=>{
      let c=0, w:string[]=[];
      if (a.heat_sweat==="yes" && (p.tags.includes("vent")||p.materialClass==="gel-grid")){c+=3; w.push("通気特化");}
      if (a.neck_shoulder_issues?.includes("straight_neck") && (p.shape.includes("grid")||p.tags.includes("neck-plain"))){c+=3; w.push("面支持特化");}
      if (a.snore && p.tags.includes("anti-snore")){c+=3; w.push("いびき特化");}
      return {p,c,w};
    }).filter(x=>x.c>0).sort((a,b)=>b.c-a.c)[0];
  if (concern) out.push({...concern.p, why:concern.w, recType:"alt_concern"});

  // C) 予算上下
  const bands:Answers["budget"][] = ["lt3k","3to6k","6to10k","10to20k","gt20k"];
  const i = bands.indexOf(a.budget);
  for (const b of [bands[i+1], bands[i-1]].filter(Boolean) as Answers["budget"][]){
    const a2 = {...a, budget:b};
    const best = products.filter(p=>inBudget(a2,p)).map(p=>({p,...scoreProduct(p,a2)})).sort((x,y)=>y.score-x.score)[0];
    if (best){ out.push({...best.p, why:[b===bands[i+1]?"予算↑で品質UP":"予算↓でコスパ"], recType:"alt_budget"}); break; }
  }

  return out.slice(0,3);
} 