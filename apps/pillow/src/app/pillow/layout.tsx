import "@/app/globals.css"; // 相対パスは環境に合わせて。apps配下なら "../../globals.css" など。

export default function PillowLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="dark">
      <body className="min-h-screen bg-black text-neutral-100">{children}</body>
    </html>
  );
} 