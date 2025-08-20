export type Choice = { id: string; label: string; weight?: number };

export type Question = {
  id: string;
  title: string;
  type: "single" | "multi";
  choices: Choice[];
  required?: boolean;
};

export type Questionnaire = {
  version: string;
  items: Question[];
}; 