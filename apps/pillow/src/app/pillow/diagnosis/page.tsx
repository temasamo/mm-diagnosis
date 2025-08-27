// ※ 「use client」を付けない（= Server Component のまま）
import ClientRoot from "./_ClientRoot";

export const metadata = { title: "枕診断 | MMプロジェクト" };

export default async function Page() {
  // ★ ここでは Zustand/ストア/フォーム state を一切参照しないこと！
  // SSR で必要な定数/文言のみ扱い、状態は持たない。
  return (
    <main className="container mx-auto px-4">
      {/* 既存の見出しや導入文など静的なもの */}
      <ClientRoot />
    </main>
  );
} 