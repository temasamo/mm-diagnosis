"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type Answers = Record<string, any>;
type Provisional = any;
type Groups = any;

type DiagState = {
  answers: Answers;
  provisional: Provisional | null;
  groups: Groups | null;
  setAnswers: (patch: Partial<Answers>) => void;
  setProvisional: (p: Provisional | null) => void;
  setGroups: (g: Groups | null) => void;
  reset: () => void;
};

export const useDiagStore = create<DiagState>()(
  persist(
    (set, get) => ({
      answers: {},
      provisional: null,
      groups: null,
      setAnswers: (patch) => set({ answers: { ...get().answers, ...patch } }),
      setProvisional: (p) => set({ provisional: p }),
      setGroups: (g) => set({ groups: g }),
      reset: () => set({ answers: {}, provisional: null, groups: null }),
    }),
    { name: "pillow-diag", storage: createJSONStorage(() => sessionStorage) }
  )
); 