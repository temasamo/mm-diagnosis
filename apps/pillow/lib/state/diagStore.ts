"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { migrateBudget } from '../budget';
import type { AgeBand, Gender } from '../../src/types/answers';

// 購入理由を2択に変更
export type PurchaseReason = "not-fit" | "better";

// 診断結果用の最小スナップショット
export type DiagSnapshot = {
  height?: '低め'|'標準'|'高め'|'指定なし';
  softness?: '柔らかめ'|'普通'|'硬め'|'指定なし';
  material?: '低反発'|'高反発'|'羽毛'|'そば殻'|'指定なし';
  posture?: '仰向け'|'横向き'|'うつ伏せ'|'指定なし';
  problems?: string[]; // 例: ['首が痛い','蒸れる','寝返りしづらい']
};

type Answers = Record<string, any> & {
  age_band?: AgeBand;
  gender?: Gender;
};
type Provisional = any;
type Groups = any;

export type DiagState = {
  // 購入理由
  purchaseReason: PurchaseReason | null;
  setPurchaseReason: (reason: PurchaseReason) => void;
  
  // 既存の状態
  answers: Answers;
  provisional: Provisional | null;
  groups: Groups | null;
  hasHydrated: boolean;
  setAnswers: (patch: Partial<Answers>) => void;
  setProvisional: (p: Provisional | null) => void;
  setGroups: (g: Groups | null) => void;
  reset: () => void;
  
  // 診断結果用スナップショット取得
  getSnapshot: () => DiagSnapshot;
};

// giftを除去する正規化関数
const normalizeReason = (v: any): PurchaseReason | null => {
  return v === "not-fit" || v === "better" ? v : null;
};

// 回答から表示用ラベルに変換する関数
const mapHeight = (v?: string): DiagSnapshot['height'] => {
  if (!v) return '指定なし';
  switch (v) {
    case 'low': return '低め';
    case 'just': return '標準';
    case 'high': return '高め';
    default: return '指定なし';
  }
};

const mapSoftness = (v?: string): DiagSnapshot['softness'] => {
  if (!v) return '指定なし';
  switch (v) {
    case 'soft': return '柔らかめ';
    case 'mid': return '普通';
    case 'hard': return '硬め';
    default: return '指定なし';
  }
};

const mapMaterial = (v?: string): DiagSnapshot['material'] => {
  if (!v) return '指定なし';
  switch (v) {
    case 'lp': return '低反発';
    case 'hp': return '高反発';
    case 'feather': return '羽毛';
    case 'buckwheat': return 'そば殻';
    default: return '指定なし';
  }
};

const mapPosture = (v?: string): DiagSnapshot['posture'] => {
  if (!v) return '指定なし';
  switch (v) {
    case 'supine': return '仰向け';
    case 'side': return '横向き';
    case 'prone': return 'うつ伏せ';
    default: return '指定なし';
  }
};

export const useDiagStore = create<DiagState>()(
  persist(
    (set, get) => ({
      // 購入理由
      purchaseReason: null,
      setPurchaseReason: (reason) => set({ purchaseReason: reason }),
      
      // 既存の状態
      answers: {
        age_band: "na",
        gender: "na"
      },
      provisional: null,
      groups: null,
      hasHydrated: false,
      setAnswers: (patch) => set({ answers: { ...get().answers, ...patch } }),
      setProvisional: (p) => set({ provisional: p }),
      setGroups: (g) => set({ groups: g }),
      reset: () => set({ 
        purchaseReason: null,
        answers: {
          age_band: "na",
          gender: "na"
        }, 
        provisional: null, 
        groups: null,
        hasHydrated: false
      }),
      
      // 診断結果用スナップショット取得
      getSnapshot: () => {
        const s = get();
        const answers = s.answers;
        
        // 問題点の抽出
        const problems: string[] = [];
        if (answers.neck_shoulder_issues) {
          const issues = Array.isArray(answers.neck_shoulder_issues) 
            ? answers.neck_shoulder_issues 
            : [answers.neck_shoulder_issues];
          
          issues.forEach(issue => {
            switch (issue) {
              case 'am_neck_pain': problems.push('朝起きると首が痛い'); break;
              case 'shoulder_stiff': problems.push('肩こりがひどい'); break;
              case 'headache': problems.push('頭痛・偏頭痛持ち'); break;
              case 'straight_neck': problems.push('ストレートネック'); break;
            }
          });
        }
        
        return {
          height: mapHeight(answers.cur_height_feel),
          softness: mapSoftness(answers.cur_firm),
          material: mapMaterial(answers.material_pref),
          posture: mapPosture(answers.posture),
          problems: problems.length > 0 ? problems : undefined,
        };
      },
    }),
    { 
      name: "pillow-diag", 
      storage: createJSONStorage(() => sessionStorage),
      version: 2,
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hasHydrated = true;
          console.debug("[diag] store hydrated");
        }
      },
      migrate: (state: any, version) => {
        if (version === 1) {
          return {
            ...state,
            purchaseReason: normalizeReason(state?.purchaseReason),
          };
        }
        
        // バージョン2以降のマイグレーション
        if (state?.answers) {
          const answers = { ...state.answers };
          
          // 予算のマイグレーション
          if (answers.budget) {
            answers.budget = migrateBudget(answers.budget);
          }
          
          // fatigueキーを削除
          if (answers.fatigue) {
            delete answers.fatigue;
          }
          
          // cur_issuesをconcernsに変換
          if (answers.cur_issues) {
            answers.concerns = answers.cur_issues;
            delete answers.cur_issues;
          }
          
          return {
            ...state,
            answers,
          };
        }
        
        return state;
      },
    }
  )
); 