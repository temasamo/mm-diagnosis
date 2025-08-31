import type { Answers } from "../../../lib/recommend/buildProblemList";
import type { Product } from "./normalize";
import { targetSpec } from "./target";

export function inBudget(a:Answers, p:Product){
  const band = a.budget;
  const map:any = { 
    "lt3k":[0,3000], 
    "3to6k":[3000,6000], 
    "6to10k":[6000,10000], 
    "10to20k":[10000,20000], 
    "gt20k":[20000,999999] 
  };
  const [min,max] = map[band] || [0,999999];
  return p.price>=min && p.price<=max;
}

export function scoreProduct(p:Product, a:Answers){
  const tgt = targetSpec(a); let s=0; const why:string[]=[];

  if (!inBudget(a,p)) { s-=5; why.push("予算外"); } else { s+=2; why.push("予算内"); }

  if (p.heightClass===tgt.height){ s+=4; why.push(`高さ一致:${tgt.height}`); }
  else if (tgt.height==="mid" || p.heightClass==="mid"){ s+=2; why.push("高さ近似"); }

  const fm:any={"soft":0,"medium":1,"firm":2};
  const diff = Math.abs(fm[p.firmness]-fm[tgt.firm]);
  if (diff===0){ s+=2; why.push(`硬さ一致:${tgt.firm}`); } else if (diff===1){ s+=1; }

  if (a.neck_shoulder_issues?.includes("straight_neck") && (p.shape.includes("grid")||p.tags.includes("neck-plain"))){ s+=3; why.push("面支持"); }
  if (a.snore && p.tags.includes("anti-snore")){ s+=2; why.push("いびき対策"); }
  if (a.heat_sweat==="yes" && (p.tags.includes("vent")||p.materialClass==="gel-grid")){ s+=3; why.push("通気/放熱"); }
  if (a.material_pref && p.materialClass===a.material_pref){ s+=2; why.push(`素材好み:${a.material_pref}`); }
  if (a.adjustable_pref==="yes" && p.shape.includes("adjustable")){ s+=2; why.push("高さ調整可"); }

  const rv = Math.min(2, (p.review.stars-3)*0.5 + Math.log10(Math.max(1,p.review.count))/3);
  s += rv;

  return { score: Math.round(s*10)/10, why };
} 