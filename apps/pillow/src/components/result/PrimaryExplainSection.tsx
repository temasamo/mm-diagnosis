'use client';

import ProductCard from '@/components/ProductCard';

export default function PrimaryExplainSection({ items }: { items: any[] }) {
  if (!items?.length) return null;
  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold">第一候補（理由つき）</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        {items.map((it: any) => (
          <ProductCard
            key={`${it.mall}:${it.id}`}
            item={{
              id: it.id,
              title: it.title,
              imageUrl: it.image,
              price: it.price,
              mall: it.mall,
              url: it.url,
            }}
            explain={{
              summarySentence: it.explain?.summarySentence,
              chips: it.explain?.chips,
              allReasons: it.explain?.allReasons,
              budgetIn: it.explain?.budgetIn,
            }}
          />
        ))}
      </div>
    </section>
  );
}
