"use client";

import { useMemo } from "react";
import NextStepController from "./NextStepController";
import { toProblemKeys } from "@/i18n/problemValueMap";

// ※ 実プロジェクトのパスに合わせて import してください
import { useDiagStore, selectCValues } from "../../../../lib/state/diagStore";

export default function CSelectedBridge() {
  const cValuesRaw = useDiagStore(selectCValues);

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