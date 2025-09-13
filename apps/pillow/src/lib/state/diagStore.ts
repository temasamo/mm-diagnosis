import { create } from 'zustand';

export type PrimaryExplainItem = {
  id: string; title: string; imageUrl?: string|null;
  comment?: string; priceYen?: number;
  material?: string; firmness?: string;
  heightCm?: number | { head?: number; neck?: number };
  shape?: string; breathable?: boolean; washable?: boolean;
  tags?: string[];
};
export type PrimaryExplain = { layout: string; items: PrimaryExplainItem[] };

type DiagState = {
  primaryExplain?: PrimaryExplain;
  setPrimaryExplain: (pe?: PrimaryExplain) => void;

  // 回答（必要なら使う）— 使わないなら放置でOK
  answers?: any;
  setAnswers: (a: any) => void;
};

export const useDiagStore = create<DiagState>((set) => ({
  primaryExplain: undefined,
  setPrimaryExplain: (pe) => set({ primaryExplain: pe }),

  answers: undefined,
  setAnswers: (a) => set({ answers: a }),
}));
