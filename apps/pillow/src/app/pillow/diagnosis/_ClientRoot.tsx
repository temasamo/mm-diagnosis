"use client";

/**
 * 診断フォーム全体のクライアント・エントリ。
 * ここから下でのみ Zustand/useSyncExternalStore を使う。
 */
import React from "react";

// 既存のフォームツリー（チップ群や各セクション）をここで読み込む
// 例: import DiagnosisForm from "./components/DiagnosisForm";
import CSelectedBridge from "./CSelectedBridge";     // 先ほど作成
import NextStepController from "./NextStepController"; // 先ほど作成

export default function ClientRoot() {
  return (
    <div>
      {/* 既存の診断フォームのメインUIをここで描画 */}
      {/* <DiagnosisForm /> */}
      {/* cValues の配線 → Nextへ */}
      <CSelectedBridge />
      {/* もしフォーム内部に「次へ」ボタンがある場合は NextStepController をそちらに組み込んでOK */}
      {/* <NextStepController cValues={...} /> */}
    </div>
  );
} 