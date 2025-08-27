"use client";

import { useEffect, useMemo, useRef } from "react";
import { toProblemKeys } from "@/i18n/problemValueMap";

type Props = {
  answers: any; // 診断フォームの answers（Zustandのもの）
};

/**
 * answers から Cセクションの値だけを抽出し、hidden input name="c" を更新する。
 * DOMスキャン不要。診断ページは Client なので安全。
 */
export default function CQueryWriter({ answers }: Props) {
  const hiddenRef = useRef<HTMLInputElement | null>(null);

  // answers から「日本語ラベル配列」を抽出
  const labels = useMemo<string[]>(() => {
    const a = answers ?? {};
    const out: string[] = [];

    // C-1 首・肩まわりで抱えている問題（配列）
    if (Array.isArray(a.neck_shoulder_issues)) {
      for (const v of a.neck_shoulder_issues) if (v) out.push(String(v));
    }

    // C-2 いびき（頻度「よくかく」「時々」は "あり" として1キーへ寄せる）
    if (a.snore && a.snore !== "ほぼない" && a.snore !== "不明 / 指定なし") {
      out.push(String(a.snore));
    }

    // C-3 起床時の疲れ
    if (a.fatigue === "疲れが残る" || a.fatigue === "疲れが残ります") {
      out.push("疲れが残る");
    }

    // C-4 暑がり・汗かき
    if (a.heat_sweat === "はい" || a.heat_sweat === true) {
      out.push("はい");
    }

    // 将来の追加キーにも備えて掃除
    return Array.from(new Set(out.map((s) => String(s).trim()).filter(Boolean)));
  }, [answers]);

  // hidden input を更新
  useEffect(() => {
    const el = hiddenRef.current;
    if (!el) return;
    const keys = toProblemKeys(labels);
    el.value = keys.join(",");
    // デバッグ
    // console.info("[CQueryWriter] labels=", labels, "keys=", keys, "value=", el.value);
  }, [labels]);

  return <input ref={hiddenRef} type="hidden" name="c" defaultValue="" />;
} 