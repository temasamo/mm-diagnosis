"use client";
import { useMemo } from "react";
import type { Question } from "../lib/types";
import { isVisible } from "../lib/visibleIf";

type Props = {
  questions: Question[];
  answers: Record<string, string | string[]>;
  onChange: (id: string, value: any) => void;
};

export default function QuestionRenderer({ questions, answers, onChange }: Props) {
  const visibleQs = useMemo(
    () => questions.filter(q => isVisible(q.visibleIf, answers)),
    [questions, answers]
  );

  return (
    <div className="space-y-6">
      {visibleQs
        .sort((a,b) => (a.meta?.order ?? 999) - (b.meta?.order ?? 999))
        .map(q => (
        <div key={q.id} className="rounded-2xl p-4 shadow-sm border">
          <div className="font-medium mb-3">{q.title}{q.required ? <span className="text-red-500"> *</span> : null}</div>
          {q.type === "single" && (
            <div className="flex flex-wrap gap-2">
              {q.choices?.map(c => (
                <button
                  key={c.id}
                  className={`px-3 py-2 rounded-full border transition
                    ${answers[q.id] === c.id
                      ? "bg-white text-black border-white shadow-sm"
                      : "border-gray-500 hover:border-gray-300 text-white/90"}
                  `}
                  aria-pressed={answers[q.id] === c.id}
                  onClick={() => onChange(q.id, c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
          {q.type === "multi" && (
            <div className="flex flex-wrap gap-2">
              {q.choices?.map(c => {
                const arr = Array.isArray(answers[q.id]) ? (answers[q.id] as string[]) : [];
                const active = arr.includes(c.id);
                return (
                  <button
                    key={c.id}
                    className={`px-3 py-2 rounded-full border transition
                      ${active
                        ? "bg-white text-black border-white shadow-sm"
                        : "border-gray-500 hover:border-gray-300 text-white/90"}
                    `}
                    aria-pressed={active}
                    onClick={() => {
                      const next = active ? arr.filter(x => x !== c.id) : [...arr, c.id];
                      onChange(q.id, next);
                    }}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          )}
          {q.type === "text" && (
            <textarea
              className="w-full rounded-xl border p-3 bg-black border-gray-600 focus:outline-none focus:ring-2 focus:ring-white/40"
              rows={3}
              placeholder="自由記述（任意）"
              value={(answers[q.id] as string) ?? ""}
              onChange={(e) => onChange(q.id, e.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  );
} 