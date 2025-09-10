import type { MatchDetails, Posture, Concern } from './match';

type ProductLike = { title: string; price?: number | null };
type ProfileLike = {
  posture?: Posture | '複合';
  issues?: Concern[];
  preferences?: { material?: string };
  budget?: { max?: number };
};

export type ExplainPayload = {
  summarySentence: string;
  chips: string[];
  table: Array<{
    label: string;
    badge: '◎' | '▲';
    userAnswer: string;
    productFact: string;
  }>;
  budgetIn?: boolean;
  budget?: { price?: number | null; max?: number | undefined };
};

const posturePhrase = (p?: ProfileLike['posture']) =>
  p === '横向き' ? '横向きで肩幅を支える高さ'
: p === '仰向け' ? '仰向けで頚椎カーブを保つ高さ'
: p === 'うつ伏せ' ? 'うつ伏せでも呼吸を妨げない低め'
: 'あなたの寝姿勢に合う高さ';

const topConcernPhrase = (c?: Concern) =>
  c === '首痛'   ? '頚椎サポート'
: c === 'いびき' ? '呼吸しやすい形状'
: c === '肩こり' ? '肩圧分散'
: c === '蒸れ'   ? '通気性'
: undefined;

export function composeExplain(
  p: ProductLike,
  profile: ProfileLike,
  md: MatchDetails
): ExplainPayload {

  const topConcern = md.concernMatches[0];
  const second = topConcernPhrase(topConcern)
              || (md.materialMatch && profile.preferences?.material
                  ? `${profile.preferences.material}の好み`
                  : undefined);

  const summarySentence = second
    ? `「${posturePhrase(profile.posture)}」と「${second}」を重視して選定しました。`
    : `「${posturePhrase(profile.posture)}」を重視して選定しました。`;

  // ---- chips（最大3）----
  const chips: string[] = [];
  if (profile.posture === '横向き') chips.push('横向き対応');
  if (profile.posture === '仰向け') chips.push('仰向け向き');
  if (profile.posture === 'うつ伏せ') chips.push('低め（うつ伏せ）');

  if (topConcern === '首痛') chips.push('頚椎サポート');
  else if (topConcern === 'いびき') chips.push('呼吸しやすい形状');
  else if (topConcern === '蒸れ') chips.push('通気性');
  else if (topConcern === '肩こり') chips.push('肩圧分散');

  if (md.materialMatch && profile.preferences?.material)
    chips.push(`${profile.preferences.material}が好みに一致`);

  const budgetIn = typeof md.budgetIn === 'boolean' ? md.budgetIn : undefined;
  if (typeof budgetIn === 'boolean') chips.push(budgetIn ? '予算内' : '予算外');

  // ---- table（あなたの回答 / 商品の根拠）----
  const table: ExplainPayload['table'] = [];

  table.push({
    label: '姿勢に合致',
    badge: '◎',
    userAnswer: `あなたの回答：${profile.posture ?? '未回答'}`,
    productFact: `商品の根拠：${md.postureEvidence.join('・') || '記載あり'}`
  });

  if (md.concernMatches.length) {
    table.push({
      label: 'お悩みに合致',
      badge: '◎',
      userAnswer: `あなたの回答：${(profile.issues ?? []).join('・')}`,
      productFact: `商品の根拠：${md.concernEvidence.join('・')}`
    });
  }

  if (md.materialMatch && profile.preferences?.material) {
    table.push({
      label: '素材の好みに合致',
      badge: '◎',
      userAnswer: `あなたの回答：${profile.preferences.material}`,
      productFact: `商品の根拠：${md.materialEvidence ?? '記載あり'}`
    });
  }

  if (typeof budgetIn === 'boolean') {
    table.push({
      label: budgetIn ? '予算内' : '予算外',
      badge: budgetIn ? '◎' : '▲',
      userAnswer: `上限：${formatJPY(profile.budget?.max)}`,
      productFact: `価格：${formatJPY(p.price)}`
    });
  }

  return {
    summarySentence,
    chips: chips.slice(0, 3),
    table,
    budgetIn,
    budget: { price: p.price, max: profile.budget?.max }
  };
}

// シンプルな円表記
function formatJPY(n?: number | null) {
  if (typeof n !== 'number') return '-';
  return `¥${n.toLocaleString('ja-JP')}`;
}
