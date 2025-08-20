"use client";

import { StepId, nextStep, Questionnaire, FinalResult, DEFAULT_STEPS } from "@core/mm";

export default function DevImportPage() {
  const step: StepId = "greet";
  return (
    <main className="p-6 space-y-3">
      <h1 className="text-xl font-bold">Import OK (pillow)</h1>
      <div>next: <b>{nextStep(step)}</b></div>
      <ul className="text-sm text-gray-600">
        {DEFAULT_STEPS.map(s => <li key={s.id}>{s.id} — {s.title}</li>)}
      </ul>
    </main>
  );
} 