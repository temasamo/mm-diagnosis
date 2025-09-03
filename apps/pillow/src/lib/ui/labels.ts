// 表示ラベルはここでだけ管理。内部処理は「安定キー」を使う
export type GroupKey = 'A' | 'B' | 'C';

export const GROUP_LABEL: Record<GroupKey, string> = {
  A: 'Aタイプ',
  B: 'Bタイプ',
  C: 'Cタイプ',
}; 