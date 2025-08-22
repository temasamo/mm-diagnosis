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