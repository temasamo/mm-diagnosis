import { searchCross } from "./search";

export const PROBE_BANDS = [
  { label: "〜¥3,000", min: 0, max: 3000 },
  { label: "¥3,000〜¥6,000", min: 3000, max: 6000 },
  { label: "¥6,000〜¥10,000", min: 6000, max: 10000 },
  { label: "¥10,000〜¥20,000", min: 10000, max: 20000 },
  { label: "¥20,000〜", min: 20000, max: 999999 },
];

export const CURRENT_4 = [
  { label: "〜¥5,000", min: 0, max: 5000 },
  { label: "¥5,000〜¥15,000", min: 5000, max: 15000 },
  { label: "¥15,000〜¥30,000", min: 15000, max: 30000 },
  { label: "¥30,000〜", min: 30000, max: 999999 },
];

export async function probeCounts(queries: string[], bands: {label:string;min:number;max:number}[]) {
  const rows: { label: string; count: number }[] = [];
  console.groupCollapsed("[budget][probe] start", { queries });

  for (const b of bands) {
    const res = await searchCross({
      queries,
      minPrice: b.min,
      maxPrice: b.max,
      excludeFurusato: true,
      // countOnly: true, // ← 使ってもOK。どちらでも rows に入るようにします
    });
    const count = (res as any)?.total ?? ((res as any)?.items?.length ?? 0);
    rows.push({ label: b.label, count });
    console.log(`[budget][probe] ${b.label} -> ${count}`);
  }

  console.table(rows);
  console.groupEnd();
  return rows;
} 