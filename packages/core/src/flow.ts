export type StepId =
  | "greet"
  | "questions"
  | "insights"
  | "lastQuestion"
  | "results";

export const STEP_ORDER: StepId[] = [
  "greet",
  "questions",
  "insights",
  "lastQuestion",
  "results",
];

export function nextStep(current: StepId): StepId {
  const idx = STEP_ORDER.indexOf(current);
  return idx >= 0 && idx < STEP_ORDER.length - 1
    ? STEP_ORDER[idx + 1]
    : "results";
}

export function prevStep(current: StepId): StepId {
  const idx = STEP_ORDER.indexOf(current);
  return idx > 0 ? STEP_ORDER[idx - 1] : "greet";
}

export type StepConfig = {
  id: StepId;
  title: string;
  required?: boolean;
  skippable?: boolean;
};

export const DEFAULT_STEPS: StepConfig[] = [
  { id: "greet",        title: "ようこそ" },
  { id: "questions",    title: "質問に回答", required: true },
  { id: "insights",     title: "一次診断（要約/洞察）" },
  { id: "lastQuestion", title: "最後の質問", skippable: true },
  { id: "results",      title: "最終診断結果" },
];
