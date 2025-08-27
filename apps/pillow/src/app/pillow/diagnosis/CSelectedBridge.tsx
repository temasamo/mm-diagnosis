"use client";

import { useMemo } from "react";
import NextStepController from "./NextStepController";
import { toProblemKeys } from "@/i18n/problemValueMap";

// ※ 実プロジェクトのパスに合わせて import してください
import { useDiagStore } from "../../../../lib/state/diagStore";

type DiagState = any;

// 既存ストアのどこにCブロックがあるか不明なため、
// よくある3パターンを順に探索して配列化します。
function pickCValues(s: DiagState): string[] {
  // 例: s.answers?.C?.problems が配列
  const a1 = s?.answers?.C?.problems;
  if (Array.isArray(a1) && a1.length) return a1;

  // 例: s.provisional?.answers?.problems が配列
  const a2 = s?.provisional?.answers?.problems;
  if (Array.isArray(a2) && a2.length) return a2;

  // 例: 個別の真偽値（首痛/肩こり/いびき/疲れ 等）を持っているケース
  const flags = s?.answers?.C ?? s?.provisional?.answers?.C ?? {};
  const out: string[] = [];
  if (flags.neckPain) out.push("朝起きると首が痛い");
  if (flags.shoulderPain) out.push("肩こりがひどい");
  if (flags.snore === "よくかく" || flags.snore === true) out.push("よくかく");
  if (flags.tiredMorning || flags.fatigue === "疲れが残る") out.push("疲れが残る");
  return out;
}

export default function CSelectedBridge() {
  const cValuesRaw = useDiagStore(pickCValues);

  // 空配列対策：開発中のダミーがあれば使う
  const cValues = useMemo<string[]>(
    () =>
      Array.from(
        new Set(
          (cValuesRaw && cValuesRaw.length
            ? cValuesRaw
            : (globalThis as any).__DEBUG_C_VALUES__ || []
          )
            .map(String)
            .map((v: string) => v.trim())
            .filter(Boolean)
        )
      ),
    [cValuesRaw]
  );

  // Bridgeの出口は「ラベル or キーどちらでも可」→ NextStepController 内で toProblemKeys() します
  return <NextStepController cValues={cValues} />;
} 