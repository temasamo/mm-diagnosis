'use client';

export default function AffiliateNotice({ className = "" }: { className?: string }) {
  return (
    <div
      role="note"
      aria-label="広告（アフィリエイト）開示"
      className={`rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200 ${className}`}
    >
      <span className="font-semibold">【広告 / Ad】</span>{" "}
      当ページにはアフィリエイトリンクが含まれます。<span className="text-amber-300/70">/ This page contains affiliate links.</span>
    </div>
  );
} 