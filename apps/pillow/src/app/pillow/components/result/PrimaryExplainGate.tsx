// 開発中は常に表示（あとで元に戻す）
export default function PrimaryExplainGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;  // ← 一時バイパス
}

// ※ フラグ運用を続ける場合は下記のように：
// const on = process.env.NEXT_PUBLIC_FEATURE_PRIMARY_EXPLAIN === '1';
// return on ? <>{children}</> : null;
