"use client";

import { StepId, nextStep, Questionnaire, FinalResult, DEFAULT_STEPS } from "@core/mm";

export default function DevImportPage() {
  const step: StepId = "greet";
  const q: Questionnaire = { version: "test", items: [] };
  const fr: FinalResult = { primaryGroup: [], secondaryGroup: [], reasons: [] };

  return (
    <main className="p-6 space-y-3">
      <h1 className="text-xl font-bold">Import OK (mattress)</h1>
      <div>current: <b>{step}</b> → next: <b>{nextStep(step)}</b></div>
      <div>questions.version: <b>{q.version}</b></div>
      <div>final.reasons.length: <b>{fr.reasons.length}</b></div>
      <ul className="text-sm text-gray-600">
        {DEFAULT_STEPS.map(s => <li key={s.id}>{s.id} — {s.title}</li>)}
      </ul>
    </main>
  );
} 