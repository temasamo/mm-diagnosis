import { z } from "zod";

export const POSTURE_KEYS = ['supine', 'prone', 'side'] as const;
const PostureEnum = z.enum(POSTURE_KEYS);

// 以前の「単一選択（文字列）」にも互換で対応
export const diagnosisSchema = z.object({
  // 例: 既存フィールド名が `posture` だった場合
  postures: z.preprocess((v: unknown) => {
    if (Array.isArray(v)) return v;          // ["side","supine"]
    if (typeof v === 'string' && v) return [v]; // "side" → ["side"]
    return []; // 未選択は空配列
  }, z.array(PostureEnum).min(1, '少なくとも1つ選んでください')),
  // ...他の項目
});

export type Diagnosis = z.infer<typeof diagnosisSchema>; 