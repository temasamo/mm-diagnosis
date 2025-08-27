import { cookies } from "next/headers";

export type SsrAnswers = { problems?: string[] };

export async function readAnswersFromSearchParams(sp: Promise<Record<string, any>>): Promise<SsrAnswers> {
  const resolved = await sp;
  const raw = typeof resolved?.c === "string" ? resolved.c : Array.isArray(resolved?.c) ? resolved.c[0] : "";
  const arr = raw ? String(raw).split(",").map(s => s.trim()).filter(Boolean) : [];
  return { problems: Array.from(new Set(arr)) };
}

export async function readAnswersFromCookie(): Promise<SsrAnswers> {
  try {
    const jar = await cookies();
    const v = jar.get("pillow_answers")?.value;
    if (!v) return {};
    const obj = JSON.parse(v);
    if (Array.isArray(obj?.problems)) return { problems: obj.problems.filter(Boolean) };
  } catch {}
  return {};
}

export function mergeAnswers(a: SsrAnswers, b: SsrAnswers): SsrAnswers {
  const p = new Set([...(a.problems ?? []), ...(b.problems ?? [])]);
  return { problems: Array.from(p) };
}

export async function mergeAnswersAsync(a: Promise<SsrAnswers>, b: Promise<SsrAnswers>): Promise<SsrAnswers> {
  const [aResolved, bResolved] = await Promise.all([a, b]);
  return mergeAnswers(aResolved, bResolved);
} 