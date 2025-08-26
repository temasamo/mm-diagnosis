// === 追加/更新: コード→日本語 辞書 ==========================
const TOKEN_JA: Record<string, string> = {
  // 症状コード系
  straight_neck: "ストレートネック",
  am_neck_pain: "朝起きると首が痛い",
  morning_neck_pain: "朝起きると首が痛い",
  shoulder_stiff: "肩こりがひどい",
  shoulder_stiffness: "肩こりがひどい",
  neck_shoulder_pain: "首・肩の痛み",
  headache: "頭痛・偏頭痛",
  migraine: "頭痛・偏頭痛",

  // 汎用・無回答系（表示しない）
  none: "",
  no_problem: "",
  unknown: "",
  unspecified: "",
  na: "",
};

// いびき/疲れなどのコード→日本語
const SLEEP_DICTIONARY = {
  snoring: {
    often: "いびきがよくあります",
    sometimes: "いびきは時々あります",
    rarely: "いびきはほとんどありません",
    none: "いびきはほとんどありません",
    unknown: "いびき：不明／指定なし",
  },
  morning_fatigue: {
    remain: "朝起きたときに疲れが残りやすい",
    normal: "起床時の疲れは普通です",
    refresh: "起床時はスッキリしています",
    unknown: "起床時の疲れ：不明／指定なし",
  },
};

function normKey(s?: string) {
  return (s ?? "").toString().trim().toLowerCase().replace(/\s+/g, "_");
}

function codeToJa(token?: string) {
  const k = normKey(token);
  return TOKEN_JA[k] ?? token ?? "";
}

function yesNoJa(v: any) {
  const s = typeof v === "string" ? v : (v ? "はい" : "いいえ");
  if (/^(true|はい|yes|y|1)$/i.test(s)) return "はい";
  if (/^(false|いいえ|no|n|0)$/i.test(s)) return "いいえ";
  return s;
}

function unique<T>(arr: T[]) {
  return Array.from(new Set(arr.filter((x) => x !== "" && x != null)));
}

// === ここから既存の toLabel / toLabels を日本語優先に上書き =========
function toLabel(v: any): string {
  if (!v) return "";
  if (typeof v === "string") {
    const ja = codeToJa(v);
    return ja || v;
  }
  if (typeof v === "object") {
    const cand = v.label ?? v.text ?? v.value ?? "";
    const ja = codeToJa(cand);
    return ja || String(cand);
  }
  return String(v);
}

function toLabels(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(toLabel).filter(Boolean) as string[];
  return [toLabel(v)].filter(Boolean) as string[];
}

// === 表記のゆらぎを1つに寄せ、none等を除外 ===========================
function canonicalizeProblem(s: string): string | null {
  let t = (s || "").trim();
  if (!t) return null;

  // none / 無回答は捨てる
  if (/^(none|no[_\s-]?problem|不明|指定なし)$/i.test(normKey(t))) return null;

  // 同義語を統一
  t = t
    .replace(/頭痛・?偏頭痛持ち/g, "頭痛・偏頭痛")
    .replace(/肩こり$/g, "肩こりがひどい");

  return t || null;
}

function canonicalizeList(items: string[]): string[] {
  const canon = items
    .map((s) => canonicalizeProblem(s))
    .filter((x): x is string => !!x);
  return unique(canon);
}

// 追加: ネガティブ判定
const NEG_SNORING = new Set(["often", "sometimes"]); // よくかく/時々 → 表示
const NEG_FATIGUE = new Set(["remain"]);             // 残りがち → 表示（normal/refresh は非表示）

// === Cセクションからの集約（日本語化済みで返す） =====================
export function collectConcernsFromAnswers(ans: Record<string, any>): string[] {
  if (!ans) return [];

  const out: string[] = [];

  // C-1) 首・肩まわり（複数選択）
  if (ans.neck_shoulder_issues) {
    out.push(...toLabels(ans.neck_shoulder_issues));
  }

  // C-2) いびき（ネガティブのみ）
  if (ans.snoring) {
    const key = normKey(ans.snoring);
    if (NEG_SNORING.has(key)) {
      out.push(
        key === "often"
          ? "いびきがよくあります"
          : "いびきは時々あります"
      );
    }
  }

  // C-3) 起床時の疲れ（ネガティブのみ）
  if (ans.morning_fatigue) {
    const key = normKey(ans.morning_fatigue);
    if (NEG_FATIGUE.has(key)) {
      out.push("朝起きたときに疲れが残りやすい");
    }
  }

  // C-4) 暑がり（従来通り。外したい場合はここをコメントアウト）
  if (ans.heat_sweat !== undefined) {
    const yn = yesNoJa(ans.heat_sweat);
    out.push(yn === "はい" ? "暑がり・汗をかきやすい" : "暑がり・汗かきではない");
  }

  // 追加で boolean/コード系が来ても日本語化して吸収
  const extraKeys = ["am_neck_pain", "shoulder_stiff", "shoulder_stiffness", "headache", "migraine"];
  for (const k of extraKeys) {
    if (ans[k] !== undefined && ans[k] !== false) {
      const label = toLabel(typeof ans[k] === "boolean" ? (ans[k] ? k : "") : ans[k]);
      if (label) out.push(label);
    }
  }

  return humanizeProblemsList(out); // ← 重複除去＋自然文化
}

// === 人の言葉に寄せた最終整形（短文化） ================================
export function humanizeProblemsList(items: string[]): string[] {
  const z = (items ?? []).map((s) =>
    s
      .replace(/^いびき：よくかく$/, "いびきがよくあります")
      .replace(/^いびき：時々$/, "いびきは時々あります")
      .replace(/^いびき：ほとんどない$/, "いびきはほとんどありません")
      .replace(/^起床時の疲れ：残りがち$/, "朝起きたときに疲れが残りやすい")
      .replace(/^起床時の疲れ：普通$/, "起床時の疲れは普通です")
      .replace(/^起床時の疲れ：スッキリ$/, "起床時はスッキリしています")
  );
  return canonicalizeList(z);
} 