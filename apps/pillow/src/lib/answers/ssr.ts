// 既存 readAnswersFromSearchParams を差し替え/拡張
export type SsrAnswers = { problems?: string[] };

// 例: /pillow/preview?c=neckPain,shoulderPain&s=1&t=1&h=1
export function readAnswersFromSearchParams(sp: Record<string, any>): SsrAnswers {
  const arrFromC = (() => {
    const raw = typeof sp?.c === "string" ? sp.c : Array.isArray(sp?.c) ? sp.c[0] : "";
    return raw ? String(raw).split(",").map((s) => s.trim()).filter(Boolean) : [];
  })();

  const extra: string[] = [];
  // いびき: s=1(あり)/0(なし)
  if (sp?.s === "1" || sp?.snore === "1") extra.push("snore");
  // 起床時の疲れ: t=1(あり)
  if (sp?.t === "1" || sp?.tired === "1") extra.push("tiredMorning");
  // 暑がり: h=1(はい)
  if (sp?.h === "1" || sp?.hot === "1") extra.push("hotSleep");

  const problems = Array.from(new Set([...arrFromC, ...extra]));
  return { problems };
} 