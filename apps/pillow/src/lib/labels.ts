export function budgetBandLabel(id?: 'lt3000'|'3k-6k'|'6k-10k'|'10k-20k'|'20k+'): string {
  switch (id) {
    case 'lt3000': return '3,000円未満'
    case '3k-6k': return '3,000円〜6,000円'
    case '6k-10k': return '6,000円〜10,000円'
    case '10k-20k': return '10,000円〜20,000円'
    case '20k+': return '20,000円以上'
    default: return '—'
  }
}

export function postureLabel(postures?: ('back'|'side'|'prone')[] | 'mixed'): string {
  if (!postures) return '不明'
  const arr = Array.isArray(postures) ? postures : (postures === 'mixed' ? [] : [postures as any])
  if (arr.length === 0) return 'いろいろ'
  const map: Record<string,string> = { back: '仰向け', side: '横向き', prone: 'うつ伏せ' }
  return arr.map(p => map[p] ?? p).join('・')
}

export function ageGroupLabel(v?: 'teen'|'20s'|'30s'|'40s'|'50s'|'60s'|'70+'|'unknown'): string {
  switch (v) {
    case 'teen': return '10代'
    case '20s': return '20代'
    case '30s': return '30代'
    case '40s': return '40代'
    case '50s': return '50代'
    case '60s': return '60代'
    case '70+': return '70代以上'
    default: return '—'
  }
}

export function sexLabel(v?: 'male'|'female'|'other'|'unknown'): string {
  switch (v) {
    case 'male': return '男性'
    case 'female': return '女性'
    case 'other': return 'その他'
    default: return '—'
  }
} 