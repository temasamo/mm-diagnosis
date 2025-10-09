'use client';

export default function AffiliateNotice({ className = "" }: { className?: string }) {
  return (
    <div
      role="note"
      aria-label="広告（アフィリエイト）開示"
      className={`rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 ${className}`}
    >
      <span className="font-semibold">【広告 / Ad】</span>{" "}
      当ページにはアフィリエイトリンクが含まれます。<span className="text-amber-700">/ This page contains affiliate links.</span>
    </div>
  );
} 