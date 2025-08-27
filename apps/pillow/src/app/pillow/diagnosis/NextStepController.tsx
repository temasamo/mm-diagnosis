"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toProblemKeys } from "@/i18n/problemValueMap";

// TODO: 実装に合わせて props から現在のフォーム state を渡す
type Props = {
  // Cブロックの「選ばれているラベル or キー」の配列を親から受け取る
  cValues: string[];
};

export default function NextStepController({ cValues }: Props) {
  const router = useRouter();

  const handleNext = useCallback(() => {
    const keys = toProblemKeys(cValues || []);
    // searchParams
    const sp = new URLSearchParams();
    if (keys.length) sp.set("c", keys.join(","));
    // Cookie（一時）
    document.cookie = `pillow_answers=${encodeURIComponent(JSON.stringify({ problems: keys }))}; Max-Age=3600; Path=/`;

    // デバッグ表示
    // eslint-disable-next-line no-console
    console.info("[NEXT] cValues=", cValues, "keys=", keys, "sp=", sp.toString());

    router.push(`/pillow/preview?${sp.toString()}`);
  }, [cValues, router]);

  return (
    <button
      type="button"
      onClick={handleNext}
      className="mt-6 rounded-xl px-4 py-2 border"
      data-test="go-preview"
    >
      次へ（プレビューへ）
    </button>
  );
} 