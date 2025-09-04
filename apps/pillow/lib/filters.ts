// 判定ユーティリティ（軽量ヒューリスティック）
export function isPillowCoverTitle(title?: string): boolean {
  if (!title) return false;
  const s = title.toLowerCase();
  const z = s.replace(/\s+/g, "");
  // 明確に「枕カバー／ピローケース」
  const coverHit =
    /(枕|まくら|ﾏｸﾗ|ピロー|ﾋﾟﾛｰ)(用)?(カバー|ｶﾊﾞｰ)/.test(z) ||
    /(ピローケース|ﾋﾟﾛｰｹｰｽ|ピロケース)/.test(z) ||
    /pillow\s?case/.test(s);
  // 「カバー付き／一体型」等は枕本体の特徴なので除外
  const notJustCover =
    /(カバー付|カバー付き|ｶﾊﾞｰ付|ｶﾊﾞｰ付き|一体|取り外し|洗える)/.test(s);
  return coverHit && !notJustCover;
}

export function isFurusato(
  title?: string,
  shop?: string | null,
  url?: string
): boolean {
  const t = title ?? "";
  const u = (url ?? "").toLowerCase();
  const sh = shop ?? "";
  // タイトルでの明確なシグナル
  if (/ふるさと納税|返礼品|寄附|寄付/.test(t)) return true;
  // URL 系（楽天ふるさと・外部モールの返礼品）
  if (/furusato|furunavi|satofull/.test(u)) return true;
  // 店舗名に「楽天ふるさと納税」等が含まれる
  if (/ふるさと納税/.test(sh)) return true;
  return false;
}
