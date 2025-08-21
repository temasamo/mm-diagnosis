"use client";

import { useState } from "react";
import { StepId, nextStep, prevStep, Questionnaire } from "@core/mm";
import data from "@/data/questions.json";
import { Answers, makeInsights, finalizeResult } from "@/lib/logic/score";

export default function DiagnosisPage() {
  const questionnaire = data as Questionnaire;
  const [step, setStep] = useState<StepId>("greet");
  const [answers, setAnswers] = useState<Answers>({});
  const [followUpQ, setFollowUpQ] = useState(questionnaire.items[0]); // placeholder
  const [insightText, setInsightText] = useState<{summary: string; reasons: string[]}>({ summary: "", reasons: [] });
  const [finalView, setFinalView] = useState<{primary: string[]; secondary: string[]; reasons: string[]}>({ primary: [], secondary: [], reasons: [] });

  const goNext = () => setStep(s => nextStep(s));
  const goPrev = () => setStep(s => prevStep(s));

  // ハンドラ
  const update = (qid: string, choiceId: string, single=true) => {
    setAnswers(prev => {
      const cur = prev[qid] ?? [];
      const next = single ? [choiceId] : Array.from(new Set([...cur, choiceId]));
      return { ...prev, [qid]: next };
    });
  };

  // components
  const Greet = () => (
    <section className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">マットレス診断へようこそ</h1>
      <p>いくつかの質問に答えるだけで、あなたに合う候補を提示します。</p>
      <div className="flex gap-2">
        <button className="px-3 py-2 rounded bg-white/10" onClick={goNext}>はじめる</button>
      </div>
    </section>
  );

  const Questions = () => (
    <section className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">質問に回答</h2>
      {questionnaire.items.map(q => (
        <div key={q.id} className="space-y-2">
          <div className="font-medium">{q.title}{q.required ? " *" : ""}</div>
          <div className="flex flex-wrap gap-2">
            {q.choices.map(c => {
              const active = (answers[q.id] ?? []).includes(c.id);
              return (
                <button
                  key={c.id}
                  className={`px-3 py-1 rounded border ${active ? "bg-white text-black" : "bg-transparent"}`}
                  onClick={() => update(q.id, c.id, q.type === "single")}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <button className="px-3 py-2 rounded border" onClick={goPrev}>戻る</button>
        <button
          className="px-3 py-2 rounded bg-white text-black"
          onClick={() => {
            const res = makeInsights(questionnaire, answers);
            setInsightText(res.insight);
            if (res.followUp) setFollowUpQ(res.followUp);
            setStep("insights");
          }}
        >
          一次診断へ
        </button>
      </div>
    </section>
  );

  const Insights = () => (
    <section className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">一次診断</h2>
      <div className="text-lg">{insightText.summary}</div>
      <ul className="list-disc pl-6 opacity-80">
        {insightText.reasons.map((r, i) => <li key={i}>{r}</li>)}
      </ul>
      <div className="flex gap-2">
        <button className="px-3 py-2 rounded border" onClick={goPrev}>戻る</button>
        <button className="px-3 py-2 rounded bg-white text-black" onClick={() => setStep("lastQuestion")}>
          最後の質問へ
        </button>
      </div>
    </section>
  );

  const LastQuestion = () => (
    <section className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">最後の質問</h2>
      <div className="font-medium">{followUpQ.title}</div>
      <div className="flex flex-wrap gap-2">
        {followUpQ.choices.map(c => {
          const active = (answers[followUpQ.id] ?? []).includes(c.id);
          return (
            <button
              key={c.id}
              className={`px-3 py-1 rounded border ${active ? "bg-white text-black" : "bg-transparent"}`}
              onClick={() => update(followUpQ.id, c.id, true)}
            >
              {c.label}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <button className="px-3 py-2 rounded border" onClick={goPrev}>戻る</button>
        <button
          className="px-3 py-2 rounded bg-white text-black"
          onClick={() => {
            const final = finalizeResult(answers);
            setFinalView({ primary: final.primaryGroup, secondary: final.secondaryGroup, reasons: final.reasons });
            setStep("results");
          }}
        >
          診断結果を見る
        </button>
      </div>
    </section>
  );

  const Results = () => (
    <section className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">最終診断結果</h2>
      <div>
        <div className="text-sm opacity-70">第一候補グループ</div>
        <div className="text-lg">{finalView.primary.join(" / ")}</div>
      </div>
      <div>
        <div className="text-sm opacity-70">第二候補グループ</div>
        <div>{finalView.secondary.join(" / ") || "—"}</div>
      </div>
      <ul className="list-disc pl-6 opacity-80">
        {finalView.reasons.map((r, i) => <li key={i}>{r}</li>)}
      </ul>
      <div className="flex gap-2">
        <button className="px-3 py-2 rounded border" onClick={() => setStep("greet")}>最初から</button>
      </div>
    </section>
  );

  return (
    <main className="max-w-3xl mx-auto">
      {step === "greet" && <Greet/>}
      {step === "questions" && <Questions/>}
      {step === "insights" && <Insights/>}
      {step === "lastQuestion" && <LastQuestion/>}
      {step === "results" && <Results/>}
    </main>
  );
} 