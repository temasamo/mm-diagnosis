"use client";
import { useEffect, useState } from "react";
import type { Questionnaire, Question } from "@core/mm";
import { loadAnswers, saveAnswers } from "../lib/answers";
import Link from "next/link";

export default function QuestionRenderer({ data }: { data: Questionnaire }) {
  const [answers, setAnswers] = useState<Record<string, string[]>>(loadAnswers());
  useEffect(() => saveAnswers(answers), [answers]);

  const set = (q: Question, choiceId: string, checked: boolean) => {
    setAnswers(prev => {
      const cur = new Set(prev[q.id] || []);
      if (q.type === "single") return { ...prev, [q.id]: [choiceId] };
      if (checked) cur.add(choiceId); else cur.delete(choiceId);
      return { ...prev, [q.id]: Array.from(cur) };
    });
  };

  const allRequiredOk = data.items
    .filter(q => q.required)
    .every(q => (answers[q.id] || []).length > 0);

  return (
    <div className="space-y-6">
      {data.items.map(q => (
        <section key={q.id} className="border rounded-xl p-4">
          <h3 className="font-semibold">{q.title}</h3>
          <div className="mt-2 space-y-1">
            {q.choices?.map(c => {
              const checked = (answers[q.id] || []).includes(c.id);
              return (
                <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type={q.type === "single" ? "radio" : "checkbox"}
                    name={q.id}
                    value={c.id}
                    checked={checked}
                    onChange={e => set(q, c.id, e.currentTarget.checked)}
                  />
                  <span>{c.label}</span>
                </label>
              );
            })}
          </div>
        </section>
      ))}
      <div className="pt-2">
        <Link
          href="/insights"
          className={`inline-block underline ${!allRequiredOk ? "pointer-events-none" : ""}`}
        >
          回答を送信 →
        </Link>
      </div>
    </div>
  );
} 