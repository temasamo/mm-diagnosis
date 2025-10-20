// Business rules for item filtering (枕カバー/ふるさと納税/ベビー用/布団セット/抱き枕) - 2025-09 policy
import type { SearchItem } from '../../../../lib/malls/types';

export type WithFlags<T> = T & {
  flags?: {
    isCover?: boolean;
    isFurusato?: boolean;
    isBabyPillow?: boolean;
    isFutonSet?: boolean;
    isHugPillow?: boolean;
    isLumbarPillow?: boolean;
    isSpecialUse?: boolean;
  };
};

// 既存の正規表現
const RE_COVER_TITLE = /(枕カバー|まくらカバー|ピローケース|pillow\s*case)/i;
// URLは誤爆防止のため "pillow-?case|pillow-?cover" 周辺に限定
const RE_COVER_URL = /(pillow-?case|pillow-?cover|\/pillowcase|\/pillow-cover)/i;

const RE_FURUSATO_TITLE = /(ふるさと納税|返礼品|寄付|寄附)/i;
// NOTE: furunavi が正。furanavi は誤り
const RE_FURUSATO_URL = /(furusato|furunavi|satofull|\/furusato)/i;
const RE_FURUSATO_SHOP = /(楽天ふるさと納税|ふるさと納税)/i;

// 新しい除外条件の正規表現
const RE_BABY_PILLOW = /(ベビー|赤ちゃん|新生児|乳児|子供|キッズ|ジュニア|幼児|ドーナツ枕|ベビー枕|赤ちゃん枕)/i;
const RE_FUTON_SET = /(布団セット|寝具セット|枕付き|枕込み|セット)/i;
const RE_HUG_PILLOW = /(抱き枕|抱きまくら|ボディピロー|ボディ枕|抱き|ボディ)/i;
const RE_LUMBAR_PILLOW = /(腰枕|腰まくら|腰痛クッション|腰マクラ|腰クッション|腰椎|腰サポート|腰用|腰の)/i;
const RE_SPECIAL_USE = /(医療用|介護用|リハビリ|治療用|車用|旅行用|キャンプ用|アウトドア用)/i;

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

export function isBabyPillow(item: SearchItem): boolean {
  const t = item.title ?? '';
  return RE_BABY_PILLOW.test(t);
}

export function isFutonSet(item: SearchItem): boolean {
  const t = item.title ?? '';
  return RE_FUTON_SET.test(t);
}

export function isHugPillow(item: SearchItem): boolean {
  const t = item.title ?? '';
  return RE_HUG_PILLOW.test(t);
}

export function isLumbarPillow(item: SearchItem): boolean {
  const t = item.title ?? '';
  return RE_LUMBAR_PILLOW.test(t);
}

export function isSpecialUse(item: SearchItem): boolean {
  const t = item.title ?? '';
  return RE_SPECIAL_USE.test(t);
}

export function annotateFlags<T extends SearchItem>(item: T): WithFlags<T> {
  return {
    ...item,
    flags: {
      ...(item as any).flags,
      isCover: isCover(item),
      isFurusato: isFurusato(item),
      isBabyPillow: isBabyPillow(item),
      isFutonSet: isFutonSet(item),
      isHugPillow: isHugPillow(item),
      isLumbarPillow: isLumbarPillow(item),
      isSpecialUse: isSpecialUse(item),
    },
  };
}

// 仕様：枕カバー/ふるさと納税/ベビー用/布団セット/抱き枕/腰枕/特殊用途=常時除外（SSOT）
export function applyFilters<T extends SearchItem>(items: T[]): WithFlags<T>[] {
  const out: WithFlags<T>[] = [];
  for (const raw of items) {
    const item = annotateFlags(raw);
    if (item.flags?.isCover) continue;
    if (item.flags?.isFurusato) continue;
    if (item.flags?.isBabyPillow) continue;
    if (item.flags?.isFutonSet) continue;
    if (item.flags?.isHugPillow) continue;
    if (item.flags?.isLumbarPillow) continue;
    if (item.flags?.isSpecialUse) continue;
    out.push(item);
  }
  return out;
}
