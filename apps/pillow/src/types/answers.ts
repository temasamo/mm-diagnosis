export type AgeBand =
  | "10s"
  | "20s"
  | "30s"
  | "40s"
  | "50s"
  | "60s"
  | "70s"
  | "80p"
  | "na";

export type Gender = "male" | "female" | "other" | "na";

export const AGE_BAND_LABELS: Record<AgeBand, string> = {
  "10s": "10代",
  "20s": "20代",
  "30s": "30代",
  "40s": "40代",
  "50s": "50代",
  "60s": "60代",
  "70s": "70代",
  "80p": "80代以上",
  "na": "回答しない"
};

export const GENDER_LABELS: Record<Gender, string> = {
  male: "男性",
  female: "女性",
  other: "その他",
  na: "回答しない"
};

export interface Answers {
  [key: string]: any;
  age_band?: AgeBand;
  gender?: Gender;
} 