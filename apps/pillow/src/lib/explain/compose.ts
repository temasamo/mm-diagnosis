// apps/pillow/src/lib/explain/compose.ts
export function composeExplain(input: {
  title: string; price: number|null;
  profile: any; md: any; prod: any;
}) {
  const { profile, prod } = input;

  const postureLine = (() => {
    if (profile?.posture === '横向き') return '横向き推奨の診断。';
    if (profile?.posture === '仰向け') return '仰向け中心の診断。';
    if (profile?.posture === 'うつ伏せ') return 'うつ伏せは低め推奨の診断。';
    return '診断結果に基づく提案。';
  })();

  const structurePhrase = (() => {
    const s = prod?.structure;
    if (s === 'contour') return '波型で首のカーブを支えます。';
    if (s === 'center_dip') return '中央くぼみで頭が安定し、横向き移行もしやすい形状です。';
    if (s === 'flat') return 'フラット形状で寝返りがしやすい設計です。';
    return '扱いやすい汎用形状です。';
  })();

  const issuePhrase = (() => {
    const issues: string[] = profile?.issues ?? [];
    if (issues.includes('首痛')) return '頸椎サポートに配慮した作りです。';
    if (issues.includes('肩こり')) return '肩幅を支えやすい高さ設計です。';
    if (issues.includes('いびき')) return '横向き移行がしやすく気道確保に配慮。';
    if (issues.includes('蒸れ')) return '通気性素材で熱こもりを抑えます。';
    return '';
  })();

  const materialPhrase = (() => {
    const m = prod?.material;
    if (m === 'highRebound') return '高反発で支えがしっかり。';
    if (m === 'lowRebound') return '低反発で包み込む寝心地。';
    if (m === 'latex') return 'ラテックスで反発が早く通気性も良好。';
    return '';
  })();

  const adjustPhrase = prod?.adjustable ? '高さ調整つきで体格差にも対応。' : '';

  const price = typeof prod?.price === 'number' ? prod.price : null;
  const max = profile?.budget?.max;
  const budgetIn = (price != null && typeof max === 'number') ? price <= max : false;
  const budgetPhrase = (max ? (budgetIn ? '価格は上限内。' : '上限を少し超えます。') : '');

  const sentence = [
    postureLine,
    [structurePhrase, issuePhrase || materialPhrase, adjustPhrase].filter(Boolean).join(' '),
    budgetPhrase
  ].filter(Boolean).join(' ');

  const chips: string[] = [];
  chips.push('姿勢◎');
  const issues: string[] = profile?.issues ?? [];
  if (issues.includes('首痛')) chips.push('首痛対策');
  else if (issues.includes('肩こり')) chips.push('肩こり対策');
  else if (issues.includes('いびき')) chips.push('いびき配慮');
  else if (issues.includes('蒸れ')) chips.push('通気性');
  if (max) chips.push(budgetIn ? '予算内' : '予算外');

  return {
    summarySentence: sentence, // ← ここをUIに表示
    chips: chips.slice(0, 3),
    table: input.md?.rows ?? [],
    budgetIn,
    budget: { max, price }
  };
}
