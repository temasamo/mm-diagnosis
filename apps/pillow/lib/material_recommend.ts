import { MATERIAL_PROPS, Material, labelMaterial } from "./materials";

type Answers = {
  posture?: "supine"|"side"|"prone";
  height_band?: string;
  mattress_firmness?: "soft"|"mid"|"firm"|"unknown";
  concerns?: string[];
  neck_shoulder_issues?: string[];
  heat_sweat?: "yes"|"no"|"unknown";
  current_pillow_material?: string;
  [key: string]: any;
};

const ORDER: Material[] = ["pipe","latex","high_rebound","low_rebound","sobakawa","beads","poly_cotton","feather","mixed"];

// Array.prototype にワンショット追加
declare global { 
  interface Array<T> { 
    pushOnce?(v:T): void; 
  } 
}

if (!Array.prototype.pushOnce) {
  Array.prototype.pushOnce = function(v:any){ 
    if(!this.includes(v)) this.push(v); 
  };
}

export function recommendMaterial(answers: Answers) {
  const reasonsGlobal: string[] = [];
  const heatSensitive = answers.heat_sweat === "yes" || answers.concerns?.includes("sweat");
  const hasNeckIssue = !!answers.neck_shoulder_issues?.length;
  const current = (answers.current_pillow_material && answers.current_pillow_material !== "other" ? answers.current_pillow_material : undefined) as Material|undefined;

  // 1) "不満→素材置換"のリメディ候補（最優先のAIらしい判断）
  const remedyMap: Partial<Record<Material, Material[]>> = {
    feather:      ["pipe","high_rebound","latex"],       // へたり/高さ不足の改善
    poly_cotton:  ["high_rebound","pipe","latex"],
    low_rebound:  ["high_rebound","latex","pipe"],       // 寝返り/首負担の改善
    beads:        ["pipe","latex","high_rebound"],       // 支え/耐久
    sobakawa:     ["latex","high_rebound","pipe"],       // 硬さ/音の改善
    high_rebound: ["latex","low_rebound"],               // 硬すぎ対策（やや柔らかへ）
    pipe:         ["latex","low_rebound"],               // 硬さが気になる場合に
  };

  function baseScore(m: Material): number {
    let s = 0;

    // (a) 通気ニーズ
    if (heatSensitive) {
      if (MATERIAL_PROPS[m].breath === "high") s += 0.25;
      else if (MATERIAL_PROPS[m].breath === "mid") s += 0.10;
      reasonsGlobal.pushOnce?.("暑がり傾向 → 通気/放熱性を優先");
    }

    // (b) 首肩の悩み → 支え重視
    if (hasNeckIssue) {
      if (["latex","high_rebound","pipe"].includes(m)) s += 0.25;
      else if (MATERIAL_PROPS[m].support === "mid") s += 0.10;
      reasonsGlobal.pushOnce?.("首・肩の負担軽減 → 反発/支え重視");
    }

    // (c) 寝姿勢の傾向（うつ伏せは柔らか/低めが安全、横向きは支え）
    if (answers.posture === "prone") {
      if (["low_rebound","beads","feather","poly_cotton"].includes(m)) s += 0.15;
    } else if (answers.posture === "side") {
      if (["latex","high_rebound","pipe","sobakawa"].includes(m)) s += 0.15;
    } else { // supine
      if (MATERIAL_PROPS[m].support !== "firm") s += 0.05; // 仰向けは中庸寄り
    }

    // (d) 現在素材への"改善方向"
    if (current && remedyMap[current]?.includes(m)) {
      s += 0.20;
      reasonsGlobal.pushOnce?.(`現在の素材(${labelMaterial(current)})の不満を解消する代替を優先`);
    }

    return s;
  }

  // 2) 全素材スコア
  const scored = ORDER.map(m => ({ m, score: baseScore(m) }))
    .sort((a,b)=> b.score - a.score || ORDER.indexOf(a.m) - ORDER.indexOf(b.m));

  const top = scored[0].m;

  // 3) 個別理由（ユーザーに見せる短文）
  const reasonsMat: string[] = [];
  if (current && remedyMap[current]?.includes(top)) {
    reasonsMat.push(`現在の${labelMaterial(current)}で生じやすい不満を改善するため`);
  }
  if (heatSensitive && MATERIAL_PROPS[top].breath !== "low") {
    reasonsMat.push("通気・放熱性に配慮");
  }
  if (hasNeckIssue && ["latex","high_rebound","pipe"].includes(top)) {
    reasonsMat.push("首のカーブを支える反発力");
  }
  // 重複圧縮
  const uniq = Array.from(new Set(reasonsMat));

  return {
    material: top as Material,
    reasons: uniq,
    debug: scored, // デバッグ確認用（必要なければ外す）
  };
} 