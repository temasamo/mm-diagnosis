"use client";
import { useEffect, useRef } from "react";
import { useDiagStore } from "@lib/state/diagStore";

export default function CQueryWriter() {
  const ref = useRef<HTMLInputElement>(null);
  const answers = useDiagStore((s: any) => s.answers);

  useEffect(() => {
    if (!ref.current) return;
    // URLセーフに（既存の readAnswersFromSearchParams が decode 前提なら同じ方式に合わせる）
    ref.current.value = encodeURIComponent(JSON.stringify(answers ?? {}));
  }, [answers]);

  return <input ref={ref} type="hidden" name="c" />;
} 