// Business rules for item filtering (枕カバー/ふるさと納税) - 2025-09 policy
import type { SearchItem } from '../../../../lib/malls/types';

export type WithFlags<T> = T & {
  flags?: {
    isCover?: boolean;
    isFurusato?: boolean;
  };
};

// 正規表現
const RE_COVER_TITLE = /(枕カバー|まくらカバー|ピローケース|pillow\s*case)/i;
// URLは誤爆防止のため "pillow-?case|pillow-?cover" 周辺に限定
const RE_COVER_URL = /(pillow-?case|pillow-?cover|\/pillowcase|\/pillow-cover)/i;

const RE_FURUSATO_TITLE = /(ふるさと納税|返礼品|寄付|寄附)/i;
// NOTE: furunavi が正。furanavi は誤り
const RE_FURUSATO_URL = /(furusato|furunavi|satofull|\/furusato)/i;
const RE_FURUSATO_SHOP = /(楽天ふるさと納税|ふるさと納税)/i;

export function isCover(item: SearchItem): boolean {
  const t = item.title ?? '';
  const u = (item.url ?? '').toLowerCase();
  return RE_COVER_TITLE.test(t) || RE_COVER_URL.test(u);
}

export function isFurusato(item: SearchItem): boolean {
  const t = item.title ?? '';
  const u = (item.url ?? '').toLowerCase();
  const s = item.shop ?? '';
  return RE_FURUSATO_TITLE.test(t) || RE_FURUSATO_URL.test(u) || RE_FURUSATO_SHOP.test(s);
}

export function annotateFlags<T extends SearchItem>(item: T): WithFlags<T> {
  return {
    ...item,
    flags: {
      ...(item as any).flags,
      isCover: isCover(item),
      isFurusato: isFurusato(item),
    },
  };
}

// 仕様：枕カバー=常時除外、ふるさと納税=常時除外（SSOT）
export function applyFilters<T extends SearchItem>(items: T[]): WithFlags<T>[] {
  const out: WithFlags<T>[] = [];
  for (const raw of items) {
    const item = annotateFlags(raw);
    if (item.flags?.isCover) continue;
    if (item.flags?.isFurusato) continue;
    out.push(item);
  }
  return out;
}
