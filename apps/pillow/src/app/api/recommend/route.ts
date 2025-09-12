export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { ENABLED_MALLS, type MallProduct } from "../../../../lib/types";
import { rankCandidates } from "../../../lib/recommend";
import { applyBanFilter, toMallProducts } from "../../../lib/recommend/filter";
import { mallSearchAll } from "../../../server/mall/service";
import type { Item } from "../../../types/product";
import { buildMatchDetails } from '@/lib/explain/match';
import { composeExplain } from '@/lib/explain/compose';

// このAPI専用の受け取り型（影響範囲を局所化）
type RecommendBody = {
  postures?: string[];
  concerns?: string[];
  pillowMaterial?: string[];
  avoid?: {
    materials?: string[];
    structures?: string[];
    brands?: string[];
  };
};

type Profile = {
  postures?: string[];         // ['supine','side','prone']
  roll?: 'low'|'normal'|'high' | string; // 寝返り頻度(内部で正規化)
  snore?: 'none'|'sometimes'|'often' | string;
  concerns?: string[];         // ['neck','shoulder','migraine','straight-neck', ...]
  mattressFirmness?: 'soft'|'medium'|'firm'|string;
  budget?: { max?: number };
  prefers?: {
    adjustable?: boolean;
    material?: string[];       // ['latex','high-rebound','low-rebound', ...]
    size?: 'std'|'large'|'small'|string;
  };
};

type ItemMeta = {
  id?: string;
  title?: string;
  imageUrl?: string|null;
  heightCm?: number | { head?: number; neck?: number };
  firmness?: 'soft'|'medium'|'firm'|string;
  material?: string;           // 'latex'|'high-rebound'|'low-rebound'|'pipe'|'feather'...
  shape?: 'center-dent'|'wave'|'flat'|string;
  breathable?: boolean;
  washable?: boolean;
  tags?: string[];
  comment?: string;
};

function normalize(v?: string) {
  return (v || '').toLowerCase();
}

function has<T>(arr: T[]|undefined, v: T) {
  return Array.isArray(arr) && arr.includes(v);
}

function isSupine(profile: Profile) {
  return has(profile.postures, 'supine') || has(profile.postures, '仰向け');
}
function isSide(profile: Profile) {
  return has(profile.postures, 'side') || has(profile.postures, '横向き');
}
function lowRoll(profile: Profile) {
  const r = normalize(profile.roll || '');
  return r.includes('low') || r.includes('ほとんどしない');
}
function snoresSometimes(profile: Profile) {
  const s = normalize(profile.snore || '');
  return s.includes('sometimes') || s.includes('時々');
}
function prefersHighRebound(profile: Profile) {
  const m = profile.prefers?.material?.map(normalize) || [];
  return m.includes('high-rebound') || m.includes('高反発') || m.includes('latex') || m.includes('ラテックス');
}

function yen(n?: number) {
  if (!n) return '';
  return `ご予算は上限${n.toLocaleString()}円`;
}

/** 1〜3文で返す。商品メタが薄くても成立するように設計 */
export function generatePrimaryComment(profile: Profile, p: ItemMeta): string {
  // 収集したヒント
  const supine = isSupine(profile);
  const side = isSide(profile);
  const lowroll = lowRoll(profile);
  const snoreSome = snoresSometimes(profile);
  const highReb = prefersHighRebound(profile);
  const conc = (profile.concerns || []).map(normalize);

  const mat = normalize(p.material || '');
  const firm = normalize(p.firmness || '');
  const shape = normalize(p.shape || '');
  const heightHead = typeof p.heightCm === 'number' ? p.heightCm : (p.heightCm as any)?.head;
  const heightNeck = typeof p.heightCm === 'number' ? undefined : (p.heightCm as any)?.neck;

  // 文1: 体勢 × 形状 × 反発 （核心）
  const s1Parts: string[] = [];
  if (supine && shape.includes('center')) {
    s1Parts.push('仰向け中心でも後頭部が安定しやすい「中央くぼみ」構造');
  } else if (side && shape.includes('wave')) {
    s1Parts.push('横向き時に肩幅の隙間を埋めるサイド高めの波型');
  } else if (shape) {
    s1Parts.push(`体勢に馴染みやすい${shape}形状`);
  }

  if (highReb || mat.includes('latex') || mat.includes('高反発')) {
    s1Parts.push('高反発コアで沈み込み過ぎを抑え、頸椎のラインをキープ');
  } else if (mat.includes('低反発')) {
    s1Parts.push('低反発フォームで頭部を包み込み、圧を分散');
  }

  if (s1Parts.length === 0) {
    s1Parts.push('反発と形状のバランスで首をまっすぐ保ちやすい設計');
  }
  const s1 = ' ' + s1Parts.join('・') + '。';

  // 文2: 高さ/硬さ × 悩み × いびき/寝返り
  const s2Parts: string[] = [];
  if (heightHead) {
    s2Parts.push(`後頭部の目安高さは約${Math.round(heightHead)}cm`);
  }
  if (heightNeck) {
    s2Parts.push(`首元は＋${Math.round(heightNeck)}cmで頸椎カーブをサポート`);
  }
  if (firm) {
    const jp = firm.includes('firm') ? 'やや硬め' : firm.includes('soft') ? 'やわらかめ' : '標準の硬さ';
    s2Parts.push(jp);
  }
  if (lowroll) s2Parts.push('寝返りが少なくても頭が落ちにくい復元性');
  if (snoreSome) s2Parts.push('横向き移行時にも気道を確保しやすい厚み');

  if (conc.includes('neck') || conc.includes('首')) {
    s2Parts.push('起床時の首の張りを軽減する支え方');
  }
  const s2 = s2Parts.length ? ' ' + s2Parts.join('・') + '。' : '';

  // 文3: 使い勝手（調整/通気/洗える/予算）
  const s3Parts: string[] = [];
  if (p.breathable) s3Parts.push('通気孔でムレを抑制');
  if (p.washable) s3Parts.push('カバーは洗えて清潔を保ちやすい');
  if (profile.prefers?.adjustable) s3Parts.push('付属のシートで高さ微調整が可能');
  if (profile.budget?.max) s3Parts.push(yen(profile.budget.max));
  const s3 = s3Parts.length ? ' ' + s3Parts.filter(Boolean).join('。') + '。' : '';

  // 仕上げ（1〜3文に収める）
  const out = (s1 + s2 + s3).trim();
  // 最低限のフォールバック
  return out || '仰向け中心のプロファイルに合わせて首の自然なカーブを支え、高反発の復元性で沈み込みを抑える設計です。高さは付属シートで微調整できます。';
}

export function buildDiagnosisComment(profile: Profile): string {
  const base: string[] = [];
  if (isSupine(profile) && lowRoll(profile)) {
    base.push('仰向け中心で寝返りが少ないため、中央くぼみ＋首元やや高めの設計が安心です');
  }
  if (snoresSometimes(profile)) {
    base.push('横向きに移っても呼吸が楽な厚みを確保できる形状が向きます');
  }
  if (prefersHighRebound(profile)) {
    base.push('高反発の復元性は沈み込み過ぎを抑え、頸椎のラインを保持しやすくします');
  }
  base.push('高さ調整シートで微調整できるモデルを選ぶと適合度が上がります');
  return base.join('。') + '。';
}


// キーワード構築関数（例）
function buildKeyword(signals: any): string {
  return "枕"; // 簡易実装
}

export async function POST(req: Request) {
  // 追加フィールド（postures/concerns/pillowMaterial/avoid）を許容（非破壊のため any 受け）
  const body: any = await req.json();

  // stubデータに仮想フィールドを追加（テスト用）
  const stubItems: Item[] = [
    {
      id: "stub-1",
      title: `[Stub] スタンダード / 高反発系`,
      image: "/placeholder.png",
      url: "#",
      price: 32980,
      mall: "rakuten" as const,
      material: "highRebound",
      structure: "flat",
      brand: "StandardBrand"
    },
    {
      id: "stub-2",
      title: "[Stub] 通気重視モデル",
      image: "/placeholder.png",
      url: "#",
      price: 29800,
      mall: "yahoo" as const,
      material: "latex",
      structure: "contour",
      brand: "ComfortBrand"
    }
  ];

  // モール検索を実行
  const signals = { postures: body?.postures, concerns: body?.concerns };
  const q = { 
    q: buildKeyword(signals), 
    budgetMin: 3000, 
    budgetMax: 10000, 
    limit: 30 
  };
  const { items: mallItems, offline } = await mallSearchAll(q);

  // モール検索結果をItem型に変換
  const mallItemsAsItems: Item[] = mallItems.map(item => ({
    id: item.id,
    title: item.title,
    url: item.url,
    price: item.price,
    image: item.image,
    mall: item.mall
  }));

  // stubデータとモール検索結果をマージ
  const allItems = [...stubItems, ...mallItemsAsItems];

  // banフィルタを適用
  const filteredItems = applyBanFilter(allItems, body?.avoid);

  // MallProduct型に変換（既存互換性のため）
  const picks = toMallProducts(filteredItems);

  // ---- RECO_WIRING=1 の時のみ、meta.final を付与（既存 items は変更しない） ----
  if (process.env.RECO_WIRING === "1") {
    try {
      const final = rankCandidates({
        postures: Array.isArray(body?.postures) ? body.postures : [],
        concerns: Array.isArray(body?.concerns) ? body.concerns : [],
        pillowMaterial: Array.isArray(body?.pillowMaterial) ? body.pillowMaterial : [],
        avoid: body?.avoid,
      });
      
      const responseBody = { 
        items: picks, 
        meta: { 
          final,
          flags: { offline }
        } 
      };

      // メトリクス送信（非同期 fire-and-forget）
      try { 
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/track`, {
          method:'POST', 
          headers:{'content-type':'application/json'},
          body: JSON.stringify({
            event:'search_latency', 
            mall:'all', 
            offline, 
            ts:Date.now()
          })
        }).catch(()=>{});
      } catch {}

      // 新機能：primaryExplain を追加
      const FEATURE = process.env.NEXT_PUBLIC_FEATURE_PRIMARY_EXPLAIN === '1';
      let primaryExplain: null | {
        layout: 'primary-explain-v1';
        items: Array<any>;
      } = null;

      try {
        if (FEATURE) {
          // 既存の第一候補集合から、上位3件を採用（picks 先頭から）
          const primaryList = picks.slice(0, 3);

          // プロフィール情報を新しいProfile型に合わせて構築
          const profile: Profile = {
            postures: body?.postures || [],
            roll: body?.roll || 'normal',
            snore: body?.snore || 'none',
            concerns: body?.concerns || [],
            mattressFirmness: body?.mattressFirmness || 'medium',
            budget: { max: body?.budget?.max || 10000 },
            prefers: {
              adjustable: body?.prefers?.adjustable || false,
              material: body?.prefers?.material || body?.pillowMaterial || [],
              size: body?.prefers?.size || 'std'
            }
          };

          const items: ItemMeta[] = primaryList.map((p: any, i: number) => {
            const item: ItemMeta = {
              id: p.id ?? p.sku ?? `item-${i}`,
              title: p.title ?? p.name ?? p.label ?? `候補 ${i + 1}`,
              imageUrl: p.imageUrl ?? p.image?.url ?? p.cover ?? p.thumbnail ?? null,
              heightCm: p.heightCm ?? p.height ?? undefined,
              firmness: p.firmness ?? p.hardness ?? undefined,
              material: p.material ?? p.core ?? undefined,
              shape: p.shape ?? p.form ?? undefined,
              breathable: Boolean(p.breathable ?? p.vent ?? p.airHole),
              washable: Boolean(p.washable ?? p.wash ?? p.coverWashable),
              tags: p.tags ?? [],
              comment: p.comment, // いったん入れてから…
            };
            if (!item.comment) {
              item.comment = generatePrimaryComment(profile, item);
            }
            return item;
          });

          primaryExplain = items.length ? { layout: 'primary-explain-v1', items } : null;
        }
      } catch (e) {
        console.error('[primaryExplain] compose failed', e);
        primaryExplain = null;
      }

      // 確実にprimaryExplainを返す
      return NextResponse.json({
        primaryExplain: primaryExplain || { layout: 'primary-explain-v1', items: [] },
        groups: responseBody?.groups ?? {},   // 既存
        ...responseBody
      }, { 
        headers: { 'Cache-Control': 'no-store' }
      });
    } catch (e) {
      console.warn("[recommend] meta.final wiring skipped:", e);
      return NextResponse.json({ items: picks });
    }
  }
  
  // 既存どおり
  return NextResponse.json({ items: picks });
}
