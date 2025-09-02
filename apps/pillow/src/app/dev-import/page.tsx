"use client";

import { StepId, nextStep, Questionnaire, FinalResult, STEP_ORDER } from "../../../lib/types";

export default function DevImportPage() {
  const step: StepId = "greet";
  const q: Questionnaire = { version: "test", locale: "ja", title: "Test", items: [] };
  const fr: FinalResult = { primaryGroup: [], secondaryGroup: [], reasons: [] };

  return (
    <main className="p-6 space-y-3">
      <h1 className="text-xl font-bold">Import OK (mattress)</h1>
      <div>current: <b>{step}</b> → next: <b>{nextStep(step)}</b></div>
      <div>questions.version: <b>{q.version}</b></div>
      <div>final.reasons.length: <b>{fr.reasons.length}</b></div>
      <ul className="text-sm text-gray-600">
        {STEP_ORDER.map(s => <li key={s}>{s}</li>)}
      </ul>
    </main>
  );
} 