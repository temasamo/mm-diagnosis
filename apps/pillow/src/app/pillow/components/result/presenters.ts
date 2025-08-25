'use client';

export type Rank = 'excellent' | 'good' | 'ok';

export function toRank(score: number | undefined): Rank {
  const s = typeof score === 'number' ? score : 0;
  if (s >= 0.75) return 'excellent'; // ◎
  if (s >= 0.55) return 'good';      // ○
  return 'ok';                       // △
}

// カテゴリのやさしいラベル
export const labelMap: Record<string, string> = {
  middle_height: '高さ：中くらい',
  high_height: '高さ：高め',
  low_height: '高さ：低め',
  adjustable_height: '高さ調整：できる',
  cooling_breathable: '蒸れにくい',
  firm_support: '硬めでしっかり支持',
  soft_feel: 'やわらかめ',
  cervical_support_supine: '仰向け 首サポート',
  // 足りなければ随時追加
};

// 補足の短文
export const helpTextMap: Record<string, string> = {
  middle_height: '首のカーブを支えやすい標準的な高さ',
  high_height: '首肩がしっかりしていて高めが合いやすい方向け',
  low_height: '低めが楽な方向け',
  adjustable_height: '試しながら微調整できて失敗しにくい',
  cooling_breathable: '通気性がよく夏も快適',
  firm_support: '沈み込みを抑えて負担を分散',
  soft_feel: '包まれる感触でリラックス',
  cervical_support_supine: '仰向け時の頸椎をやさしく支持',
};

export function rankSymbol(rank: Rank): '◎' | '○' | '△' {
  return rank === 'excellent' ? '◎' : rank === 'good' ? '○' : '△';
}

// 診断サマリー用のチップを抽出（上位3件）
export function pickTopChips(scores: Record<string, number> = {}): Array<{key:string; label:string}> {
  return Object.entries(scores)
    .sort((a,b) => (b[1]??0) - (a[1]??0))
    .slice(0,3)
    .map(([k]) => ({ key: k, label: labelMap[k] ?? k }));
}

// 「高さは高め・柔らかさは硬め」形式の自然文を生成
export function buildComment(opts: {
  heightKey?: 'low_height'|'middle_height'|'high_height';
  firmnessKey?: 'soft_feel'|'firm_support';
}) {
  const heightPart =
    opts.heightKey === 'low_height' ? '低め' :
    opts.heightKey === 'high_height' ? '高め' :
    '中くらい';
  const firmnessPart =
    opts.firmnessKey === 'soft_feel' ? 'やわらかめ' :
    opts.firmnessKey === 'firm_support' ? '硬め' :
    '標準';

  return `あなたにおすすめの枕は「高さは${heightPart}・柔らかさは${firmnessPart}」タイプです。`;
}

// formatSummary関数（height/softness のラベルを渡す）
export function formatSummary(height: string, softness: string) {
  return `高さは${height}・柔らかさは${softness}`;
}

// お悩みの文面化（箇条書き用）
export function problemsToBullets(problems?: string[]|null): string[] {
  if (!problems?.length) return [];
  return problems.map(p => `・${p}`);
}

// TOPカード用データ（◎/○/△ 付き）
export function topTypeCards(scores: Record<string, number> = {}) {
  return Object.entries(scores)
    .sort((a,b) => (b[1]??0) - (a[1]??0))
    .slice(0,3)
    .map(([key, val]) => {
      const rank = toRank(val);
      return {
        key,
        label: labelMap[key] ?? key,
        sub:  helpTextMap[key] ?? '',
        rank,
        symbol: rankSymbol(rank),
      };
    });
} 