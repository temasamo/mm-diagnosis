"use client";

import React from "react";
import type { TargetHeight } from "@/lib/recommend/height";

type BudgetBandKey = "lt3k" | "3k-6k" | "6k-10k" | "10k-20k" | "20k+";

const BUDGET_LABEL: Record<BudgetBandKey, string> = {
  lt3k: "3,000円未満",
  "3k-6k": "3,000〜6,000円",
  "6k-10k": "6,000〜10,000円",
  "10k-20k": "10,000〜20,000円",
  "20k+": "20,000円以上",
};

type Props = {
  payload: any;
  targetHeight?: TargetHeight | null;
  className?: string;
};

export default function BasicInfoSection({ payload, targetHeight, className }: Props) {
  const postureLabel =
    payload?.posture === "back" ? "仰向け" :
    payload?.posture === "stomach" ? "うつ伏せ" :
    payload?.posture === "side" ? "横向き" : "不明";

  const firmLabel =
    payload?.mattressFirmness === "soft" ? "柔らかめ" :
    payload?.mattressFirmness === "hard" ? "硬め" :
    payload?.mattressFirmness === "medium" ? "普通" : "不明/指定なし";

  const sweatyLabel =
    payload?.sweaty_yes === true ? "暑がり・汗かき" :
    payload?.sweaty_yes === false ? "特になし" : "不明";

  const adjustableLabel =
    payload?.adjustable === true ? "高さ調整できる方が良い" :
    payload?.adjustable === false ? "調整不要" : "不明/指定なし";

  const materialLabel =
    payload?.material === "feather" ? "羽毛" :
    payload?.material === "memory" ? "低反発ウレタン" :
    payload?.material === "latex" ? "ラテックス" :
    payload?.material === "pipe" ? "パイプ" :
    payload?.material === "buckwheat" ? "そば殻" :
    payload?.material === "none" ? "特になし" : "不明/指定なし";

  const sizeLabel =
    payload?.size === "standard" ? "標準サイズ" :
    payload?.size === "large" ? "大きめ" :
    payload?.size === "small" ? "小さめ" :
    "不明/指定なし";

  const budgetLabel = BUDGET_LABEL[(payload?.budgetBandId as BudgetBandKey) ?? "3k-6k"] ?? "—";

  return (
    <section className={["rounded-2xl border border-neutral-800/50 bg-neutral-900/40 p-5 md:p-6", className].join(" ")}>
      <h2 className="text-xl md:text-2xl font-semibold mb-3">基本情報</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoRow label="寝姿勢" value={postureLabel} />
        <InfoRow label="マットレスの硬さ" value={firmLabel} />
        <InfoRow label="暑がり・汗かき" value={sweatyLabel} />
        <InfoRow label="高さ調整の希望" value={adjustableLabel} />
        <InfoRow label="好みの素材" value={materialLabel} />
        <InfoRow label="サイズ希望" value={sizeLabel} />
        <InfoRow label="ご予算" value={budgetLabel} />
        <InfoRow
          label="目標の高さ"
          value={
            targetHeight
              ? `${targetHeight.min}〜${targetHeight.max} cm（目安：${targetHeight.base}cm）`
              : "—"
          }
          highlight
        />
      </div>

      <p className="text-xs text-neutral-400 mt-3">
        ※ 目標の高さは寝姿勢・マットレスの硬さ・肩の厚み等から簡易算出した目安です（使いながら±5mm程度の微調整を推奨）。
      </p>
    </section>
  );
}

function InfoRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-neutral-800/60 pb-2">
      <div className="text-neutral-400 text-sm">{label}</div>
      <div className={highlight ? "text-base font-semibold" : "text-base"}>{value}</div>
    </div>
  );
} 