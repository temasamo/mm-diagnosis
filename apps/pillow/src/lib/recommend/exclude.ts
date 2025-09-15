// apps/pillow/src/lib/recommend/exclude.ts
export const EXCLUDE_PATTERNS: RegExp[] = [
  /足枕|フットピロー|レッグピロー/i,                  // 足枕系
  /抱き枕|ボディピロー/i,                              // 抱き枕系
  /(小学生|ジュニア|キッズ|子供|こども).*(枕|まくら)/i, // 子供用
  /(ベビー|赤ちゃん|新生児|乳児).*(枕|まくら)/i,       // 乳幼児
];

export const shouldExclude = (title?: string) => {
  if (!title) return false;
  const t = title.toLowerCase();
  return EXCLUDE_PATTERNS.some(re => re.test(t));
};
