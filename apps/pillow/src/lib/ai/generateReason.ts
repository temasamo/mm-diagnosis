// apps/pillow/src/lib/ai/generateReason.ts
import "server-only";
import OpenAI from "openai";

// ★ import はプロジェクトに合わせて調整してOK
// 既存の Answers 定義が取りにくい場合に備えて、最低限の型をローカルで用意
export type Answers = {
  posture?: "side" | "supine" | "prone" | "mixed";
  postures?: ("side" | "supine" | "prone")[];
  turnFreq?: "low" | "mid" | "high";
  mattress?: "soft" | "normal" | "firm";
  sweaty?: boolean;                      // 暑がり・汗かき
  concerns?: string[];                   // 例: ["stneck","headache","snore","heat","flatten"]
  currentPillowMaterial?: string;        // 例: "pipe"|"LR"|"HR"|"latex"|...
  materialPref?: string | null;          // 好み（任意）
};

// normalizeSweaty をこうしておく
function normalizeSweaty(v:any): boolean {
  if (typeof v === "boolean") return v;
  const s = String(v ?? "").trim();
  if (s === "はい" || /^(true|1|yes)$/i.test(s)) return true;
  if (s === "いいえ" || /^(false|0|no)$/i.test(s)) return false;
  return false;
}

const jpPosture = (p: "side" | "supine" | "prone") =>
  p === "side" ? "横向き" : p === "supine" ? "仰向け" : "うつ伏せ";

// -------- ルール: 事実→助言ポイントを抽出（ここが可変性の源） --------
function buildPoints(a: Answers) {
  const pts: string[] = [];
  const avoid: string[] = [];
  const facts: string[] = [];

  // 姿勢（opening は後で決定）
  if (a.posture === "side") {
    pts.push("肩の厚みを埋めるため、やや高めの枕が楽になりやすい");
    if (a.turnFreq !== "low") pts.push("寝返りのしやすさを保てる少ししっかりめが扱いやすい");
  } else if (a.posture === "supine") {
    pts.push("首の自然なカーブを保ちやすい中くらいの高さが目安");
  } else if (a.posture === "prone") {
    pts.push("呼吸を妨げないよう低めの高さが無難");
    avoid.push("高すぎる・硬すぎる枕は首へ負担");
  } else {
    // mixed / 不明
    pts.push("日によって楽な姿勢が変わるため、中くらいを基準に微調整できるタイプが安心");
  }

  // マットレスの硬さ補正
  if (a.mattress === "soft") pts.push("沈み込みが大きい寝面では、目安より少し低めの『枕』から試すとバランスを取りやすい");
  if (a.mattress === "firm") pts.push("硬めの寝面では、目安より少し高めの『枕』が首肩の隙間を埋めやすい");

  // 寝返り頻度
  if (a.turnFreq === "high") pts.push("形状が保たれやすい少ししっかりめの『枕』だと体勢の移行がスムーズ");

  // 暑がり
  if (a.sweaty) {
    pts.push("蒸れを抑えられる通気・放熱性の高い構造やカバーの『枕』が相性◯");
  } else {
    avoid.push("※通気/蒸れの話題は出さない");
  }

  // 悩み（首肩/ストレートネック/頭痛/いびき等）
  if (a.concerns?.includes("stneck")) {
    pts.push("面で支えて頸椎のカーブを保ちやすい形状の『枕』だと負担を分散しやすい");
  }
  if (a.concerns?.includes("headache")) {
    pts.push("朝の張りや頭痛がある時は「高すぎ/低すぎ」を避け、少しずつ高さを合わせる『枕』を選ぶ");
  }
  if (a.concerns?.includes("snore")) {
    pts.push("気道が確保されやすい高さ調整や横向き対応の形状の『枕』が役立つことがある");
  }
  if (a.concerns?.includes("flatten")) {
    pts.push("へたりが気になるなら復元性の高い素材・調整式の『枕』を検討");
  }

  // 現在素材からの改善ヒント（軽めに）
  if (a.currentPillowMaterial === "LR") {
    pts.push("沈み込みが大きい低反発で合わない場合は、復元性の高いタイプの『枕』へ切り替えると姿勢が安定しやすい");
  }
  if (a.currentPillowMaterial === "pipe") {
    pts.push("音や当たりが気になるパイプ使用時は、粒の細かさやカバーで当たりを和らげる/別素材の『枕』を試すのも有効");
  }

  // 事実（opening 決定に使用）
  if (a.posture === "side" || a.posture === "supine" || a.posture === "prone") {
    facts.push(`主姿勢=${jpPosture(a.posture)}`);
  } else if (a.posture === "mixed") {
    facts.push("主姿勢=混在");
  }

  return { pts, avoid, facts };
}

// -------- 1文目と禁止語を決定 --------
function resolveOpening(a: Answers) {
  if (a.posture === "side" || a.posture === "supine" || a.posture === "prone") {
    const label = jpPosture(a.posture);
    return {
      opening: `${label}で眠る方は、`,
      forbidden: ["横向き", "仰向け", "うつ伏せ"].filter((w) => w !== label),
    };
  }
  // mixed / 未定義 は統一
  return { opening: "寝姿勢が変わる方は、", forbidden: [] as string[] };
}

// -------- OpenAI 呼び出し本文 --------
export async function generateReason(a: Answers): Promise<string> {
  // Step 1-2: 生成入口でのログ（正規化後の値も確認）
  console.log("[gen] input(raw)", a);
  
  // 暑がり・汗かきの値を正規化
  const normalizedSweaty = normalizeSweaty(a.sweaty);
  const normalizedAnswers = { ...a, sweaty: normalizedSweaty };
  
  const { pts, avoid, facts } = buildPoints(normalizedAnswers);
  const { opening, forbidden } = resolveOpening(normalizedAnswers);

  // 「暑がりでない時は"通気/蒸れ"ワード禁止」を明示
  const forbidExtra = new Set(forbidden);
  if (!normalizedSweaty) ["通気", "蒸れ", "放熱", "冷感"].forEach((w) => forbidExtra.add(w));
  forbidExtra.add("マットレス"); // 枕以外の提案に逸れないように

  // Must 観点の組み立て（既存の must に追加）
  const must: string[] = [];
  if (normalizedSweaty) must.push("暑さ対策（通気・放熱・冷感のいずれかの語を含める）");
  if (a.concerns?.includes("stneck")) must.push("首肩の負担軽減（面で支える/頸椎/形状保持/しっかりめ のいずれかの語を含める）");

  const system = [
    "あなたは寝具（枕）の専門アドバイザーです。対象は枕。マットレスの推奨はしない。",
    "日本語・丁寧体・2〜3文。箇条書き/記号列挙/商品名は禁止。素材名は特性で述べる。",
    `次の語を含めない: ${Array.from(forbidExtra).join("、") || "（なし）"}`,
    `必ず触れる観点: ${must.join("、")}`,
    "文章の先頭は必ず指定の書き出しで開始する。",
  ].join("\n");

  const user = [
    `【書き出し】${opening}`,
    `【利用者の状況】${facts.join(" / ") || "情報少"} / 寝返り=${a.turnFreq || "不明"} / マットレス=${a.mattress || "不明"} / 暑がり=${normalizedSweaty ? "はい" : "いいえ"}`,
    "【助言ポイント】",
    ...pts.map((p, i) => `${i + 1}. ${p}`),
    "上のポイントを元に、自然な2〜3文でまとめてください。",
  ].join("\n");

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",     // 既存の小型でOK。プロジェクトの標準に合わせて可
      temperature: 0.2,         // 低めで安定
      max_tokens: 220,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const out = resp.choices[0]?.message?.content?.trim();
    if (out) {
      // --- LLM 出力後のセーフティ: 必須語がなければ1文追記 ---
      const COOL = ["通気","放熱","冷感","メッシュ","蒸れにく"];
      const NECK = ["面で支える","頸椎","首のカーブ","形状保持","しっかりめ"];
      const hasAny = (t:string, words:string[]) => words.some(w => t.includes(w));

      let result = sanitize(out, forbidExtra);
      for (const w of forbidExtra) result = result.replaceAll(w, ""); // 最終禁止語クリーニング

      // ★ ここから強制追記
      if (normalizedSweaty && !hasAny(result, COOL)) {
        result = result.replace(/。?$/, "。") +
          " 蒸れを抑えられる通気・放熱性の高い『枕』や、冷感素材のカバーを組み合わせると暑い季節も快適です。";
      }
      if (a.concerns?.includes("stneck") && !hasAny(result, NECK)) {
        result = result.replace(/。?$/, "。") + " 首のカーブを面で支えやすい、少ししっかりめの『枕』だと負担を分散しやすくなります。";
      }
      return result;
    }
  } catch (e) {
    console.error("generateReason OpenAI error:", e);
  }

  // フォールバック（API失敗時でも必ず返す）
  return fallbackText(normalizedAnswers, opening, pts, forbidExtra);
}

// -------- 後処理（禁止語が紛れたら除去・微整形） --------
function sanitize(text: string, forbidden: Set<string>) {
  let t = text.replace(/\s+/g, " ").trim();
  for (const w of forbidden) t = t.replaceAll(w, "");
  // 先頭が開き記号等になったら軽く整形
  t = t.replace(/^[-・、。]/, "");
  return t;
}

// -------- フォールバック生成 --------
function fallbackText(a: Answers, opening: string, pts: string[], forbidden: Set<string>) {
  const pick = (arr: string[], n: number) => arr.slice(0, n);
  const core = pick(pts, 3).join("。");
  let text = `${opening}${core || "無理のない高さを基準に、少しずつ調整して楽さを確かめましょう" }。`;
  for (const w of forbidden) text = text.replaceAll(w, "");
  return text;
}
