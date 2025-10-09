'use client';

export default function AffiliateDisclaimer({ className = "" }: { className?: string }) {
  return (
    <section
      aria-labelledby="affiliate-disclaimer"
      className={`rounded-2xl border border-amber-300 bg-amber-50 p-5 ${className}`}
    >
      <h2 id="affiliate-disclaimer" className="mb-3 text-lg font-semibold text-amber-800">
        ⚠️ 免責事項
      </h2>
      <ul className="list-disc space-y-1 pl-5 text-sm text-amber-800">
        <li>本ページの商品情報は掲載時点のものです。</li>
        <li>価格や在庫状況は変動する可能性があります。購入前に各販売店で最新情報をご確認ください。</li>
        <li>本ページはアフィリエイトプログラムを通じて収益を得ています。</li>
      </ul>
    </section>
  );
} 