import type { SearchItem } from '@/lib/malls/types';

// NGワード（タイトル/説明/ショップ名/URL どれかに含んだら除外）
export const NG_PATTERNS = [
  /ふるさと\s*納税/i, /返礼品?/, /寄附?/, /寄付?/, /ふるさと.*返礼/,
  /ふる里/, /自治体/, /ふるなび|さとふる|ふるぽ|楽天ふるさと/,
];

export function excludeNG(items: SearchItem[]) {
  return items.filter(it => {
    const text = `${it.title ?? ''}|${it.shop ?? ''}|${it.url ?? ''}`;
    return !NG_PATTERNS.some(re => re.test(text));
  });
} 