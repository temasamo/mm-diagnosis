import CSelectedBridge from "./CSelectedBridge";

// セクション定義
const SECTIONS: { title: string; ids: string[] }[] = [
  {
    title: "A. 体・寝姿勢",
    ids: [
      "posture",            // 主な寝姿勢
      "rollover",           // 寝返り頻度
      "height_band",        // 身長
      "shoulder_width",     // 肩幅（あれば）
    ],
  },
  {
    title: "B. 今使っている枕",
    ids: [
      "cur_years",          // 使用年数
      "cur_height_feel",    // 今の枕の高さはどうですか？
      "cur_firm",           // 今の枕の硬さはどうですか？
      "current_pillow_size",      // 今の枕のサイズは？（わかれば）
      "current_pillow_material",  // 今の枕の素材は？（わかれば）
      "cur_issues",         // 気になる点（複数選択可）
    ],
  },
  {
    title: "C. 今の悩み（複数可）",
    ids: [
      "neck_shoulder_issues", // 首・肩まわりで抱えている問題
      "snore",               // いびき
      "fatigue",             // 起床時の疲れ
      "heat_sweat",          // 暑がり・汗かきですか？
    ],
  },
  {
    title: "D. 好み・希望",
    ids: [
      "mattress_firmness",   // マットレスの硬さ
      "adjustable_pref",     // 枕の高さや硬さを調整できる方が良いですか？
      "material_pref",       // 素材の好み
      "size_pref",           // サイズ希望
      "budget",              // ご予算
    ],
  },
];

export default function Page() {
  // 既存のCブロック UI から「選択されたラベル配列」をここで収集する前提
  // 例: const cValues = collectCValuesFromServerPropsOrFallback(); // ない場合は空配列
  // ↑ 今回はまず暫定で空配列でもOK。その場合遷移はするが悩みは空になる
  const cValues: string[] = []; // ★TODO: 後で実データを渡す

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">質問</h1>
      
      {/* 既存のフォームUI */}
      <div className="space-y-6">
        <p>フォームUIは後で実装...</p>
      </div>
      
      {/* ↓ フォーム末尾の「次へ」ボタンを Bridge に置き換え/併置 */}
      <CSelectedBridge />
    </main>
  );
} 