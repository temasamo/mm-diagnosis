// apps/pillow/src/app/api/search-cross/filters.ts
import type { SearchItem } from '../../../../lib/malls/types';

export function isCover(item: SearchItem): boolean {
  const t = (item.title ?? '').toLowerCase();
  const u = (item.url ?? '').toLowerCase();
  const s = (item.shop ?? '').toLowerCase();

  // 「枕カバー/ピローケース」等の明確なキーワード
  if (/(枕カバー|ピローケース|pillow case|pillowcover)/i.test(item.title)) return true;

  // 画像やURLに cover 系のパスが入る場合に備えた緩いチェック
  if (/cover|pillowcase/.test(u)) return true;

  return false;
}

export function isFurusato(item: SearchItem): boolean {
  const t = item.title ?? '';
  const u = (item.url ?? '').toLowerCase();
  const s = item.shop ?? '';

  // タイトルの明確シグナル
  if (/ふるさと納税|返礼品|寄付|寄附/.test(t)) return true;

  // URL ドメイン／パスに典型的な文字列
  if (/(furusato|furanavi|satofull)/.test(u)) return true;

  // 店舗名に「楽天ふるさと納税」等が含まれる
  if (/ふるさと納税/.test(s)) return true;

  return false;
}
