export type Choice = { id: string; label: string; weight?: number };

export type VisiblePredicate =
  | [questionId: string, op: "=" | "!=" | "in" | "not-in", value: string | string[]];

export type VisibleIf =
  | { allOf: VisiblePredicate[] }
  | { anyOf: VisiblePredicate[] };

export type Question = {
  id: string;
  title: string;
  type: "single" | "multi" | "text";
  choices?: Choice[];
  required?: boolean;
  visibleIf?: VisibleIf;
  meta?: { group?: string; order?: number; notes?: string };
};

export type Questionnaire = {
  version: string;
  locale: string;
  title: string;
  items: Question[];
  logic?: unknown;
};

export type Insight = {
  summary: string;
  concerns: string[];
  recommendations: string[];
  reasons?: string[];
};

export type ProvisionalResult = {
  score: number;
  insight: Insight;
  category?: string;
  confidence?: number;
};

export type FinalResult = {
  primaryGroup: string[];
  secondaryGroup: string[];
  reasons: string[];
  insight?: { summary: string; reasons: string[] };
};

export type MallProduct = {
  id: string;
  title: string;
  url: string;
  image?: string;
  price?: string | number;
  mall: "rakuten" | "yahoo" | "amazon";
  match?: number;
};

export type RecommendRequest = {
  answers: Record<string, any>;
  budget?: string;
  preferences?: string[];
  primaryGroup?: string;
};

export const ENABLED_MALLS = ["rakuten", "yahoo", "amazon"] as const;

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