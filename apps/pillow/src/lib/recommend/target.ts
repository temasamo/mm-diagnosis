import type { Answers } from "../../../lib/recommend/buildProblemList";

export function targetSpec(a: Answers){
  let height:"low"|"mid"|"high" = a.posture==="side" ? "high" : a.posture==="prone" ? "low" : "mid";
  if (a.mattress_firmness==="soft" && height!=="low") height = height==="high"?"mid":"low";
  if (a.mattress_firmness==="firm" && height!=="high") height = height==="low"?"mid":"high";

  let firm:"soft"|"medium"|"firm" = "medium";
  if (a.rollover==="often") firm="firm";
  if (a.posture==="prone") firm="medium";
  if (a.neck_shoulder_issues?.includes("straight_neck")) firm="firm";

  const nice:string[] = [];
  if (a.heat_sweat==="yes") nice.push("vent","cooling");
  if (a.neck_shoulder_issues?.includes("straight_neck")) nice.push("neck-plain");
  if (a.adjustable_pref==="yes") nice.push("adjustable");

  return { height, firm, nice };
} 