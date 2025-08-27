// 既存 readAnswersFromSearchParams を差し替え/拡張
export type SsrAnswers = { 
  problems?: string[];
  snore?: string;
  hot?: string;
};

// 例: /pillow/preview?c=neckPain,shoulderPain&s=1&t=1&h=1
export async function readAnswersFromSearchParams(sp: Promise<Record<string, any>>): Promise<SsrAnswers> {
  const params = await sp;
  
  const arrFromC = (() => {
    const raw = typeof params?.c === "string" ? params.c : Array.isArray(params?.c) ? params.c[0] : "";
    return raw ? String(raw).split(",").map((s) => s.trim()).filter(Boolean) : [];
  })();

  const extra: string[] = [];
  // いびき: s=1(あり)/0(なし)
  if (params?.s === "1" || params?.snore === "1") extra.push("snore");
  // 暑がり: h=1(はい)
  if (params?.h === "1" || params?.hot === "1") extra.push("hotSleep");

  const problems = Array.from(new Set([...arrFromC, ...extra]));
  
  return { 
    problems,
    snore: params?.s,
    hot: params?.h
  };
} 