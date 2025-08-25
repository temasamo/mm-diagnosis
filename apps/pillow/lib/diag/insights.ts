import type { DiagSnapshot } from '../../lib/state/diagStore';

const jp = {
  height: (v?: string) =>
    v === '標準' || v === '普通' ? 'ふつう' : v ?? '',
  softness: (v?: string) =>
    v === '標準' || v === '普通' ? 'ふつう' : v ?? '',
  material: (v?: string) => v ?? '',
};
const notSpecified = (v?: string) => !v || v === '指定なし' || v === '未選択';

export function makeComment(d: DiagSnapshot): string {
  const parts: string[] = [];
  if (!notSpecified(d.height))   parts.push(`高さは${jp.height(d.height)}`);
  if (!notSpecified(d.softness)) parts.push(`柔らかさは${jp.softness(d.softness)}`);
  if (!notSpecified(d.material)) parts.push(`素材は${jp.material(d.material)}`);

  return parts.length
    ? `あなたにおすすめの枕は「${parts.join('・')}」タイプです。`
    : '';
}

export function makeProblems(d: DiagSnapshot): string[] {
  if (!d.problems || d.problems.length === 0) return [];
  // 表示用整形（重複/空除去）
  return Array.from(new Set(d.problems.filter(Boolean)));
} 