"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// 購入理由を2択に変更
export type PurchaseReason = "not-fit" | "better";

type Answers = Record<string, any>;
type Provisional = any;
type Groups = any;

type DiagState = {
  // 購入理由
  purchaseReason: PurchaseReason | null;
  setPurchaseReason: (reason: PurchaseReason) => void;
  
  // 既存の状態
  answers: Answers;
  provisional: Provisional | null;
  groups: Groups | null;
  setAnswers: (patch: Partial<Answers>) => void;
  setProvisional: (p: Provisional | null) => void;
  setGroups: (g: Groups | null) => void;
  reset: () => void;
};

// giftを除去する正規化関数
const normalizeReason = (v: any): PurchaseReason | null => {
  return v === "not-fit" || v === "better" ? v : null;
};

export const useDiagStore = create<DiagState>()(
  persist(
    (set, get) => ({
      // 購入理由
      purchaseReason: null,
      setPurchaseReason: (reason) => set({ purchaseReason: reason }),
      
      // 既存の状態
      answers: {},
      provisional: null,
      groups: null,
      setAnswers: (patch) => set({ answers: { ...get().answers, ...patch } }),
      setProvisional: (p) => set({ provisional: p }),
      setGroups: (g) => set({ groups: g }),
      reset: () => set({ 
        purchaseReason: null,
        answers: {}, 
        provisional: null, 
        groups: null 
      }),
    }),
    { 
      name: "pillow-diag", 
      storage: createJSONStorage(() => sessionStorage),
      version: 2, // バージョンを上げてマイグレーション
      migrate: (state: any, version) => {
        if (version === 1) {
          // バージョン1から2へのマイグレーション
          return {
            ...state,
            purchaseReason: normalizeReason(state?.purchaseReason),
          };
        }
        return state;
      },
    }
  )
); 