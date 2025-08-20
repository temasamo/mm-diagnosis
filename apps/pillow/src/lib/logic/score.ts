import { Questionnaire, Insight, ProvisionalResult, FinalResult, Question } from "@core/mm";

// 回答の型：{ 質問ID: 選択肢ID配列 }（singleでも配列で統一）
export type Answers = Record<string, string[]>;

export function makeInsights(qn: Questionnaire, ans: Answers): {
  insight: Insight;
  missing: Question[];               // 不足質問
  followUp?: Question;               // 最後の質問に出す動的1問（任意）
  provisional: ProvisionalResult;    // 一次診断
} {
  const reasons: string[] = [];
  const missing: Question[] = qn.items.filter(it => it.required && !ans[it.id]?.length);

  // ざっくりカテゴリ推定（ダミー）
  let category = "スタンダード";
  if (ans["sleep_pos"]?.includes("side")) category = "横向き特化";
  if (ans["firm_pref"]?.includes("firm")) category = "高反発";

  if (ans["sleep_pos"]) reasons.push(`寝姿勢: ${ans["sleep_pos"][0]}`);
  if (ans["firm_pref"]) reasons.push(`硬さの好み: ${ans["firm_pref"][0]}`);

  // 不足が多い場合は follow-up を1問生成
  let followUp: Question | undefined = undefined;
  if (missing.length === 0 && !ans["heat"]) {
    followUp = {
      id: "heat",
      title: "寝ている時の蒸れは気になりますか？",
      type: "single",
      required: false,
      choices: [
        { id: "cool", label: "通気重視", weight: 1 },
        { id: "ok", label: "特に気にしない", weight: 1 }
      ]
    };
  }

  const insight: Insight = {
    summary: `一次診断：${category}が合いそうです。`,
    reasons
  };

  const provisional: ProvisionalResult = {
    category,
    confidence: 0.7,
    insight
  };

  return { insight, missing, followUp, provisional };
}

export function finalizeResult(ans: Answers): FinalResult {
  // フィニッシュ用の簡易ロジック（後で置換）
  const reasons: string[] = [];
  const primary: string[] = [];
  const secondary: string[] = [];

  if (ans["firm_pref"]?.includes("firm")) primary.push("高反発系");
  if (ans["sleep_pos"]?.includes("side")) primary.push("横向きサポート");
  if (ans["heat"]?.includes("cool")) secondary.push("通気/放熱重視");

  if (primary.length === 0) primary.push("スタンダード");

  reasons.push("回答に基づく簡易スコアリング（暫定）");

  return {
    primaryGroup: Array.from(new Set(primary)),
    secondaryGroup: Array.from(new Set(secondary)),
    reasons
  };
} 