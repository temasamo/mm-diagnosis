export type Answers = {
  // Cブロックの複数選択。文字列/配列/カンマ区切りに揺れても吸収
  concerns?: string | string[];
  neck_shoulder_issues?: string | string[];
  snore?: string;
  heat_sweat?: string;
  mattress_firmness?: string;
  [key: string]: any;
};

export type ProblemList = {
  bullets: string[];
  summary: string;
};

// 問題点のラベルマッピング
const PROBLEM_LABELS: Record<string, string> = {
  // concerns（気になる点）
  neck_pain: "首が痛い",
  height_mismatch: "高さが合わない",
  poor_turn: "寝返りしづらい",
  sweat: "蒸れる",
  sagging: "へたる",
  
  // neck_shoulder_issues（首・肩の問題）
  morning_neck_pain: "朝起きると首が痛い",
  severe_shoulder_stiffness: "肩こりがひどい",
  headache: "頭痛・偏頭痛持ち",
  straight_neck: "ストレートネック",
  
  // snore（いびき）
  often: "いびきをよくかく",
  sometimes: "いびきを時々かく",
  
  // heat_sweat（暑がり）
  yes: "暑がり・汗かき",
  
  // mattress_firmness（マットレス硬さ）
  soft: "柔らかめマットレス",
  firm: "硬めマットレス",
};

// 配列を正規化（文字列/配列/カンマ区切りに対応）
function normalizeArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    return value.split(",").map(s => s.trim()).filter(Boolean);
  }
  return [];
}

export function buildProblemList(answers: Answers): ProblemList {
  const problems: string[] = [];
  
  // 1. concerns（気になる点）から
  const concerns = normalizeArray(answers.concerns);
  concerns.forEach(concern => {
    const label = PROBLEM_LABELS[concern];
    if (label) problems.push(label);
  });
  
  // 2. neck_shoulder_issues（首・肩の問題）から
  const neckIssues = normalizeArray(answers.neck_shoulder_issues);
  neckIssues.forEach(issue => {
    const label = PROBLEM_LABELS[issue];
    if (label) problems.push(label);
  });
  
  // 3. snore（いびき）から
  if (answers.snore && answers.snore !== "rarely" && answers.snore !== "unknown") {
    const label = PROBLEM_LABELS[answers.snore];
    if (label) problems.push(label);
  }
  
  // 4. heat_sweat（暑がり）から
  if (answers.heat_sweat === "yes") {
    const label = PROBLEM_LABELS[answers.heat_sweat];
    if (label) problems.push(label);
  }
  
  // 5. mattress_firmness（マットレス硬さ）から
  if (answers.mattress_firmness && answers.mattress_firmness !== "mid" && answers.mattress_firmness !== "unknown") {
    const label = PROBLEM_LABELS[answers.mattress_firmness];
    if (label) problems.push(label);
  }
  
  // 重複を除去
  const uniqueProblems = Array.from(new Set(problems));
  
  return {
    bullets: uniqueProblems,
    summary: uniqueProblems.length > 0 
      ? `主な問題点: ${uniqueProblems.slice(0, 3).join("、")}${uniqueProblems.length > 3 ? "など" : ""}`
      : "特に問題なし"
  };
} 