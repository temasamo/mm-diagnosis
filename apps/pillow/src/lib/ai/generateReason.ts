import 'server-only';
import OpenAI from "openai";
import type { Answers } from "../../../lib/recommend/buildProblemList";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// 日本語ラベル
const J = {
  posture: (p?: string) =>
    p === "side" ? "横向き" : p === "supine" ? "仰向け" : p === "prone" ? "うつ伏せ" : "複合",
  mattress: (m?: string) =>
    m === "soft" ? "柔らかめ" : m === "firm" ? "硬め" : "標準",
  material: (m?: string) =>
    ({ HR:"高反発", LR:"低反発", latex:"ラテックス", pipe:"パイプ",
       feather:"羽毛", beads:"ビーズ", poly:"ポリエステル", "gel-grid":"格子/ジェル" } as any)[m ?? ""] ?? "指定なし"
};

// 事実→文字列
function buildFacts(a: Answers) {
  const f: string[] = [];
  if (a.posture)  f.push(`主な寝姿勢: ${J.posture(a.posture)}`);
  if (a.mattress) f.push(`マットレス: ${J.mattress(a.mattress)}`);
  if (a.turnFreq === "high") f.push("寝返り: 多め");
  if (a.sweaty) f.push("暑がり・発汗しやすい");
  if (a.concerns?.includes("stneck")) f.push("ストレートネック傾向");
  if (a.concerns?.includes("headache")) f.push("頭痛が気になる");
  if (a.currentPillowMaterial) f.push(`現在の枕素材: ${J.material(a.currentPillowMaterial)}`);
  if (a.materialPref) f.push(`好みの素材: ${J.material(a.materialPref)}`);
  return f.join(" / ");
}

// ルールで “話題の許可/禁止” を決める（ここが矛盾防止の核）
function policy(a: Answers) {
  const posture = J.posture(a.posture);
  const forbidden: string[] = [];
  // 姿勢は “選ばれたもの以外を言わない”
  (["横向き","仰向け","うつ伏せ"] as const)
    .filter(w => w !== posture)
    .forEach(w => forbidden.push(w));

  // 通気・蒸れの話題は “蒸れやすさのシグナルがある時だけ”
  const heatSignals = Boolean(a.sweaty) ||
    ["feather","poly","LR"].includes(a.currentPillowMaterial || ""); // 例：低反発や羽毛は熱籠りしやすい
  const allowVent = heatSignals;

  return { posture, forbidden, allowVent };
}

// 自然文フォールバック（2〜3文）
function fallback(a: Answers) {
  const { posture, allowVent } = policy(a);
  // 高さの目安
  let height = "中くらい";
  if (a.posture === "side") height = "やや高め";
  if (a.posture === "prone") height = "低め";
  if (a.mattress === "soft" && height !== "低め") height = "低め寄り";
  if (a.mattress === "firm" && height !== "やや高め") height = height === "中くらい" ? "やや高め" : height;

  const parts: string[] = [];
  parts.push(`${posture}で眠る方は、${height}の高さで肩と首の隙間を無理なく埋める枕が楽に感じやすいでしょう。`);
  if (a.concerns?.includes("stneck")) {
    parts.push("首だけが高く盛り上がらない、面で支える形を選ぶと負担をかけにくくなります。");
  }
  if (allowVent) {
    parts.push("暑さが気になる場面では、通気性の高い素材やカバーを組み合わせると蒸れを抑えやすくなります。");
  }
  return parts.join(" ");
}

export async function generateReason(a: Answers): Promise<string> {
  const facts = buildFacts(a);
  const { posture, forbidden, allowVent } = policy(a);

  const mustOpening = `${posture}で眠る方は、`; // 1文目の固定フレーズ（矛盾させない）
  const ventRule = allowVent ? "通気・蒸れ対策に1文だけ触れてよい。" : "通気・蒸れには触れない。";

  const system =
    "あなたは睡眠分野のアドバイザー。日本語で自然な段落を2〜3文で作成する。医療行為の示唆や断定は避け、婉曲な助言にとどめる。";

  const guard =
    `禁止語: ${forbidden.join("、")}。` +
    "禁止語が1つでも含まれる場合は出力をやり直すこと。";

  const user =
    `前提: ${facts || "一般的な成人。"}\n` +
    `必須: 1文目は必ず「${mustOpening}」で始める。${ventRule}\n` +
    "文体: です・ます調。命令形・箇条書き・記号多用はしない。合計120〜180字。\n" +
    guard + "\n" +
    "枕の高さ・形状・素材について、なぜその方向性が良いかを簡潔に述べてください。";

  // 1回目生成
  async function gen(temp = 0.5) {
    const r = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: temp,
      max_tokens: 220,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
    });
    return r.choices?.[0]?.message?.content?.trim() ?? "";
  }

  try {
    let text = await gen(0.4);

    // 出力後チェック：禁止語・通気ルール
    const violatesForbidden = forbidden.some(w => text.includes(w));
    const mentionsVent = /通気|放熱|蒸れ/.test(text);
    const badVent = mentionsVent && !allowVent;

    if (violatesForbidden || badVent || text.length < 40 || !text.includes("。")) {
      // もう一度、より厳しめで
      text = await gen(0.2);
      if (forbidden.some(w => text.includes(w)) || ( /通気|放熱|蒸れ/.test(text) && !allowVent )) {
        // 最後はルールベース
        return fallback(a);
      }
    }
    return text;
  } catch (e) {
    console.error("generateReason error", e);
    return fallback(a);
  }
}
