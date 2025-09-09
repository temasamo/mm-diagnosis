// 既存の rank.ts を触らず、製品テキストから「合致の内訳」を抽出する軽量版
export type Posture = '横向き'|'仰向け'|'うつ伏せ';
export type Concern = '首痛'|'肩こり'|'頭痛'|'いびき'|'蒸れ'|'寝汗';

export type MatchDetails = {
  postureMatches: Posture[];
  postureEvidence: string[];   // 見つかったキーワード
  concernMatches: Concern[];
  concernEvidence: string[];
  materialMatch: boolean;
  materialEvidence?: string;
  budgetIn?: boolean;
};

type ProductLike = {
  title: string;
  description?: string | null;
  price?: number | null;
  attributes?: Partial<{ material?: string }>;
};

type ProfileLike = {
  posture?: Posture | '複合';
  issues?: Concern[];
  preferences?: { material?: string };
  budget?: { max?: number };
};

const KW = {
  side: ['横向き','サイド','サイドスリーパー','高め','ワイド','肩幅'],
  supine: ['仰向け','中央くぼみ','スタンダード','ウェーブ','波型','頸椎','ネック'],
  prone: ['うつ伏せ','低め','ロー','薄型','フラット','ソフト'],
  adjust: ['高さ調整','多層','分割','パーツ','シート'],

  neck: ['頸椎','ネック','ウェーブ','波型','高さ調整','ラテックス','高反発'],
  snore: ['横向き','サイド','中央くぼみ','呼吸','気道'],
  hot:   ['通気','メッシュ','エア','パイプ','丸洗い','ウォッシャブル'],
  shoulder: ['ワイド','大判','ゾーン','肩'],
};

const MAT_ALIASES: Record<string,string[]> = {
  '低反発': ['低反発','メモリーフォーム','ウレタン'],
  '高反発': ['高反発','ラテックス','反発'],
  '羽毛':   ['羽毛','ダウン','フェザー'],
  'そば殻': ['そば','蕎麦殻','そば殻'],
  'パイプ': ['パイプ','ビーズ'],
  'ラテックス': ['ラテックス'],
};

const norm = (s?: string | null) => (s ?? '').toLowerCase().replace(/\s+/g,'');

const containsAny = (hay: string, kws: string[]) =>
  kws.some(k => hay.includes(k.toLowerCase()));

export function buildMatchDetails(p: ProductLike, profile: ProfileLike): MatchDetails {
  const t = norm(`${p.title} ${p.description ?? ''}`);
  const postureMatches: Posture[] = [];
  const postureEvidence: string[] = [];

  // 姿勢ヒットを慎重に抽出（adjust は補助扱い）
  if (containsAny(t, KW.side))   { postureMatches.push('横向き'); postureEvidence.push('横向き/高め/ワイド'); }
  if (containsAny(t, KW.supine)) { postureMatches.push('仰向け'); postureEvidence.push('中央くぼみ/ウェーブ/頸椎'); }
  if (containsAny(t, KW.prone))  { postureMatches.push('うつ伏せ'); postureEvidence.push('低め/薄型/フラット'); }
  if (containsAny(t, KW.adjust)) { postureEvidence.push('高さ調整'); }

  const concernMatches: Concern[] = [];
  const concernEvidence: string[] = [];
  const issues = profile.issues ?? [];

  if (issues.includes('首痛') && containsAny(t, KW.neck)) {
    concernMatches.push('首痛'); concernEvidence.push('頚椎/波型/高さ調整/高反発');
  }
  if (issues.includes('いびき') && containsAny(t, KW.snore)) {
    concernMatches.push('いびき'); concernEvidence.push('横向き/中央くぼみ/呼吸');
  }
  if ((issues.includes('蒸れ') || issues.includes('寝汗')) && containsAny(t, KW.hot)) {
    concernMatches.push('蒸れ'); concernEvidence.push('通気/メッシュ/丸洗い/パイプ');
  }
  if (issues.includes('肩こり') && containsAny(t, KW.shoulder)) {
    concernMatches.push('肩こり'); concernEvidence.push('ワイド/ゾーン/肩');
  }

  // 素材：プロフィールの好みと一致すれば true
  const prefMat = profile.preferences?.material;
  let materialMatch = false;
  let materialEvidence: string | undefined;
  if (prefMat) {
    const aliases = MAT_ALIASES[prefMat] ?? [prefMat];
    if (containsAny(t, aliases) || norm(p.attributes?.material).includes(norm(prefMat))) {
      materialMatch = true; materialEvidence = prefMat;
    }
  }

  // 予算（UIバッジ用に流すだけ）
  let budgetIn: boolean | undefined = undefined;
  if (typeof p.price === 'number' && typeof profile.budget?.max === 'number') {
    budgetIn = p.price <= profile.budget.max!;
  }

  return { postureMatches, postureEvidence, concernMatches, concernEvidence, materialMatch, materialEvidence, budgetIn };
}
