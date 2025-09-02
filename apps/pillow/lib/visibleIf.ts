import type { VisibleIf, VisiblePredicate } from "./types";

type Answers = Record<string, string | string[] | undefined>;

function evalPred(ans: Answers, [qid, op, val]: VisiblePredicate) {
  const a = ans[qid];
  if (op === "=") return a === val;
  if (op === "!=") return a !== val;
  if (op === "in")  return Array.isArray(val) && val.includes(a as string);
  if (op === "not-in") return Array.isArray(val) && !val.includes(a as string);
  return true;
}

export function isVisible(v: VisibleIf | undefined, ans: Answers): boolean {
  if (!v) return true;
  if ("allOf" in v) return v.allOf.every(p => evalPred(ans, p));
  if ("anyOf" in v) return v.anyOf.some(p => evalPred(ans, p));
  return true;
} 