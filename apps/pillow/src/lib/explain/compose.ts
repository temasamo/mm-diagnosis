import type { MatchDetails, Posture, Concern } from './match';

type ProductLike = { title: string };
type ProfileLike = {
  posture?: Posture | '複合';
  issues?: Concern[];
  preferences?: { material?: string };
};

export type ExplainPayload = {
  summarySentence: string;
  chips: string[]; // 最大3
  table: Array<{ label: string; delta: number; user: string; fact: string }>;
  budgetIn?: boolean;
};

export function composeExplain(p: ProductLike, profile: ProfileLike, md: MatchDetails, diagnosis?: {
  postureText?: string; materialText?: string; // 任意（取れなければ未使用）
}): ExplainPayload {
  // 要約の 1 本目：姿勢優先
  const posturePhrase =
    profile.posture === '横向き' ? '横向き寝に合う高さ' :
    profile.posture === '仰向け' ? '仰向け寝に合う高さ' :
    profile.posture === 'うつ伏せ' ? 'うつ伏せで呼吸を妨げない低め' : 'あなたの寝姿勢に合う高さ';

  // 2 本目は悩み or 素材を採用
  const second =
    (md.concernMatches[0] === '首痛'   && '頚椎サポート') ||
    (md.concernMatches[0] === 'いびき' && '呼吸しやすい形状') ||
    (md.concernMatches.length > 0      && 'お悩みを軽減する構造') ||
    (md.materialMatch                  && `${profile.preferences?.material ?? '素材'}の好みに一致`) ||
    null;

  const summarySentence = second
    ? `あなたの「${posturePhrase}」・「${second}」を重視して選びました。`
    : `あなたの「${posturePhrase}」を重視して選びました。`;

  // チップは 姿勢 / 悩み / 素材 / 予算 内から最大3
  const chips: string[] = [];
  if (profile.posture === '横向き') chips.push('横向き対応');
  if (profile.posture === '仰向け') chips.push('仰向け向き');
  if (profile.posture === 'うつ伏せ') chips.push('低め（うつ伏せ）');

  if (md.concernMatches.includes('首痛')) chips.push('頚椎サポート');
  else if (md.concernMatches.includes('いびき')) chips.push('呼吸しやすい形状');
  else if (md.concernMatches.length) chips.push('悩みに配慮');

  if (md.materialMatch && profile.preferences?.material) chips.push(`${profile.preferences.material}が好みに一致`);
  if (typeof md.budgetIn === 'boolean') chips.push(md.budgetIn ? '予算内' : '予算外');

  // 詳しく（簡易テーブル）
  const table: ExplainPayload['table'] = [];
  table.push({ label: '姿勢に合致', delta: +1, user: `姿勢=${profile.posture ?? '不明'}`, fact: md.postureEvidence.join(' / ') || '記載あり' });
  if (md.concernMatches.length) {
    table.push({ label: 'お悩みに合致', delta: +1, user: `悩み=${(profile.issues ?? []).join('・')}`, fact: md.concernEvidence.join(' / ') });
  }
  if (md.materialMatch && profile.preferences?.material) {
    table.push({ label: '素材の好みに合致', delta: +1, user: `好み=${profile.preferences.material}`, fact: md.materialEvidence ?? '記載あり' });
  }
  if (typeof md.budgetIn === 'boolean') {
    table.push({ label: md.budgetIn ? '予算内' : '予算外', delta: md.budgetIn ? +1 : -1, user: '-', fact: '-' });
  }

  return { summarySentence, chips: chips.slice(0,3), table, budgetIn: md.budgetIn };
}
