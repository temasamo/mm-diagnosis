'use client';

import { useState } from 'react';
import type { QuestionSpec } from '@/lib/lastQuestion';

export function LastQuestionCard({
  question,
  onAnswer,
}: {
  question: QuestionSpec | null;
  onAnswer: (value: string | null, bestNote?: string) => Promise<void> | void;
}) {
  const [value, setValue] = useState<string | null>(null);
  const [note, setNote] = useState<string>('');

  const hasQuestion = !!question;

  return (
    <div className="rounded-2xl border border-zinc-800 p-4 md:p-6 space-y-4">
      {hasQuestion && (
        <>
          <div className="text-lg font-semibold">最後の質問</div>
          <div className="text-zinc-300">{question!.label}</div>
          <div className="flex flex-wrap gap-2">
            {question!.options.map(opt => (
              <button
                key={opt.value}
                onClick={() => setValue(opt.value)}
                className={`px-3 py-2 rounded-xl border ${value === opt.value ? 'border-white' : 'border-zinc-700'} hover:border-white/70`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="space-y-2">
        <div className="text-lg font-semibold">自由記述（任意）</div>
        <div className="text-zinc-300 text-sm">
          今までで一番最高の枕があれば教えてください（メーカー名・商品名・ホテル名など）
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="例）◯◯ホテルの枕が最高でした / △△社 ××ピロー"
          className="w-full rounded-xl border border-zinc-700 bg-black/30 p-3 outline-none focus:border-white/70"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => onAnswer(value, note.trim() || undefined)}
          className="px-4 py-2 rounded-xl bg-white text-black font-medium hover:opacity-90"
        >
          続ける
        </button>
      </div>
    </div>
  );
} 