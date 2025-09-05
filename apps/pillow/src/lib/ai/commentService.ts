// apps/pillow/src/lib/ai/commentService.ts
import { createHash } from 'crypto';
import { generateReason, type Answers } from './generateReason';

export type Criteria = Answers;
export type Reasons = string[];

function hashAnswers(input: unknown) {
  return createHash('sha1').update(JSON.stringify(input)).digest('hex');
}

export async function getAiComment(input: { criteria: Criteria; reasons: Reasons }) {
  const key = `pillow:ai_comment:${hashAnswers(input)}`;

  // 1) KV/Supabase キャッシュ試行（存在すれば即返し）
  // const cached = await kv.get<string>(key);
  // if (cached) return cached;

  try {
    // 2) 既存の generateReason を1回だけ使用
    const comment = await generateReason(input.criteria);

    // 3) キャッシュ短期保存（例：30分）
    // await kv.set(key, comment, { ex: 60 * 30 });

    return comment;
  } catch (e) {
    console.warn('[commentService] generateReason failed, using fallback:', e);
    // 4) フォールバック（簡易ロジック）
    return buildFallbackComment(input.criteria, input.reasons);
  }
}

// 簡易フォールバック：医療断定回避・2文程度
function buildFallbackComment(criteria: Criteria, reasons: Reasons): string {
  const head =
    criteria.postures?.includes('prone') ? 'うつ伏せ時は首の反りを抑えやすい低めの高さが目安です。' :
    (criteria.postures?.includes('side') && criteria.postures?.includes('supine')) ? '仰向けと横向きの両立には中〜高めの高さが安定しやすい傾向です。' :
    criteria.postures?.includes('side') ? '横向きには肩幅を埋めやすい中〜高めの高さが合いやすいです。' :
    '体格や寝姿勢に合わせた高さを基準に選ぶと安定しやすくなります。';
  const tail = reasons?.[0] ? `また、${reasons[0]}という観点も重視しています。` : '';
  return [head, tail].filter(Boolean).join(' ');
}
