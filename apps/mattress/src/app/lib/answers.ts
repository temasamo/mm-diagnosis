"use client";

type Answers = Record<string, string[]>;
const KEY = "mm.answers.mattress";

export function saveAnswers(a: Answers) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(a));
}
export function loadAnswers(): Answers {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
} 