// フェーズ3: 件数上限と総量セーフガード

// 帯ごとの取得上限（マジックナンバー化を避ける）
export const PER_BAND_LIMIT = 30;

// 総量セーフガード（予算未指定時の最終安全弁）
export const TOTAL_CAP = 60;
