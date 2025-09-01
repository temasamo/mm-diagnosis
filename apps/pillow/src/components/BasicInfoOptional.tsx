"use client";
import React from "react";
import type { AgeBand, Gender } from "@/lib/ai/generateReason";

const AGE_LABEL: Record<AgeBand, string> = {
  na:"回答しない", "10s":"10代", "20s":"20代", "30s":"30代",
  "40s":"40代", "50s":"50代", "60plus":"60歳以上"
};

type Props = {
  age_band?: AgeBand;
  gender?: Gender;
  onChange:(v:{age_band?:AgeBand; gender?:Gender})=>void;
  compact?: boolean;
};

export default function BasicInfoOptional({age_band="na", gender="na", onChange, compact}:Props){
  return (
    <div className={`rounded-2xl border border-neutral-800/60 ${compact?"p-4 mt-4":"p-4 mt-8"}`}>
      <div className="flex items-baseline gap-2">
        <h3 className="text-lg font-semibold">基本情報（任意）</h3>
        <span className="text-xs text-neutral-500">スキップ可・個人特定不可の範囲で集計</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-neutral-400">年代</span>
          <select
            value={age_band}
            onChange={(e)=>onChange({age_band: e.target.value as AgeBand})}
            className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2"
          >
            {Object.entries(AGE_LABEL).map(([v,l])=>(<option key={v} value={v}>{l}</option>))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-neutral-400">性別</span>
          <select
            value={gender}
            onChange={(e)=>onChange({gender: e.target.value as Gender})}
            className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2"
          >
            <option value="na">回答しない</option>
            <option value="male">男性</option>
            <option value="female">女性</option>
            <option value="other">その他</option>
          </select>
        </label>
      </div>

      <p className="text-xs text-neutral-500 mt-2">
        ※ 任意の項目です。品質改善のために集計します（個人を特定できる形では保存しません）。
      </p>
    </div>
  );
} 