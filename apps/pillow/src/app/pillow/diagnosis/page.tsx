"use client";
import { useState } from "react";
import Link from "next/link";
import { useDiagStore } from "../../../../lib/state/diagStore";

export default function Page() {
  const answers = useDiagStore((s: any) => s.answers);
  const setAnswers = useDiagStore((s: any) => s.setAnswers);

  // チェックボックス用のヘルパー関数
  const handleCheckboxChange = (field: 'concerns' | 'neck_shoulder_issues', value: string, checked: boolean) => {
    const currentValues = Array.isArray(answers?.[field]) ? answers[field] : [];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter(item => item !== value);
    setAnswers({ [field]: newValues });
  };

  const handleNext = () => {
    // 一次診断へ遷移
    const compressed = JSON.stringify(answers);
    window.location.href = `/pillow/preview?c=${encodeURIComponent(compressed)}`;
  };

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">枕診断</h1>
      
      {/* A. 体・寝姿勢 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">A. 体・寝姿勢</h2>
        <div className="space-y-6">
          {/* 主な寝姿勢 */}
          <div>
            <label className="block text-sm font-medium mb-2">主な寝姿勢</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="posture"
                  value="supine"
                  checked={answers?.posture === "supine"}
                  onChange={(e) => setAnswers({ posture: e.target.value })}
                  className="mr-2"
                />
                仰向け
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="posture"
                  value="prone"
                  checked={answers?.posture === "prone"}
                  onChange={(e) => setAnswers({ posture: e.target.value })}
                  className="mr-2"
                />
                うつ伏せ
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="posture"
                  value="side"
                  checked={answers?.posture === "side"}
                  onChange={(e) => setAnswers({ posture: e.target.value })}
                  className="mr-2"
                />
                横向き
              </label>
            </div>
          </div>

          {/* 寝返り頻度 */}
          <div>
            <label className="block text-sm font-medium mb-2">寝返り頻度</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="rollover"
                  value="rare"
                  checked={answers?.rollover === "rare"}
                  onChange={(e) => setAnswers({ rollover: e.target.value })}
                  className="mr-2"
                />
                ほとんどしない
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="rollover"
                  value="mid"
                  checked={answers?.rollover === "mid"}
                  onChange={(e) => setAnswers({ rollover: e.target.value })}
                  className="mr-2"
                />
                普通
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="rollover"
                  value="often"
                  checked={answers?.rollover === "often"}
                  onChange={(e) => setAnswers({ rollover: e.target.value })}
                  className="mr-2"
                />
                よくする
              </label>
            </div>
          </div>

          {/* 身長 */}
          <div>
            <label className="block text-sm font-medium mb-2">身長</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="height_band"
                  value="150-155"
                  checked={answers?.height_band === "150-155"}
                  onChange={(e) => setAnswers({ height_band: e.target.value })}
                  className="mr-2"
                />
                150cm未満
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="height_band"
                  value="155-170"
                  checked={answers?.height_band === "155-170"}
                  onChange={(e) => setAnswers({ height_band: e.target.value })}
                  className="mr-2"
                />
                150-170cm
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="height_band"
                  value="170-180"
                  checked={answers?.height_band === "170-180"}
                  onChange={(e) => setAnswers({ height_band: e.target.value })}
                  className="mr-2"
                />
                170-180cm
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="height_band"
                  value="180+"
                  checked={answers?.height_band === "180+"}
                  onChange={(e) => setAnswers({ height_band: e.target.value })}
                  className="mr-2"
                />
                180cm以上
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* B. 今使っている枕・マットレス/布団 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">B. 今使っている枕・マットレス/布団</h2>
        <div className="space-y-6">
          {/* 使用年数 */}
          <div>
            <label className="block text-sm font-medium mb-2">使用年数</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="cur_years"
                  value="lt1y"
                  checked={answers?.cur_years === "lt1y"}
                  onChange={(e) => setAnswers({ cur_years: e.target.value })}
                  className="mr-2"
                />
                1年未満
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="cur_years"
                  value="1-2y"
                  checked={answers?.cur_years === "1-2y"}
                  onChange={(e) => setAnswers({ cur_years: e.target.value })}
                  className="mr-2"
                />
                1-2年
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="cur_years"
                  value="3-5y"
                  checked={answers?.cur_years === "3-5y"}
                  onChange={(e) => setAnswers({ cur_years: e.target.value })}
                  className="mr-2"
                />
                3-5年
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="cur_years"
                  value="5y+"
                  checked={answers?.cur_years === "5y+"}
                  onChange={(e) => setAnswers({ cur_years: e.target.value })}
                  className="mr-2"
                />
                5年以上
              </label>
            </div>
          </div>

          {/* 気になる点 - チェックボックスに変更 */}
          <div>
            <label className="block text-sm font-medium mb-2">気になる点（複数選択可）</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  value="neck_pain"
                  checked={Array.isArray(answers?.concerns) && answers.concerns.includes("neck_pain")}
                  onChange={(e) => handleCheckboxChange('concerns', e.target.value, e.target.checked)}
                  className="mr-2"
                />
                首が痛い
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  value="height_mismatch"
                  checked={Array.isArray(answers?.concerns) && answers.concerns.includes("height_mismatch")}
                  onChange={(e) => handleCheckboxChange('concerns', e.target.value, e.target.checked)}
                  className="mr-2"
                />
                高さが合わない
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  value="poor_turn"
                  checked={Array.isArray(answers?.concerns) && answers.concerns.includes("poor_turn")}
                  onChange={(e) => handleCheckboxChange('concerns', e.target.value, e.target.checked)}
                  className="mr-2"
                />
                寝返りしづらい
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  value="sweat"
                  checked={Array.isArray(answers?.concerns) && answers.concerns.includes("sweat")}
                  onChange={(e) => handleCheckboxChange('concerns', e.target.value, e.target.checked)}
                  className="mr-2"
                />
                蒸れる
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  value="sagging"
                  checked={Array.isArray(answers?.concerns) && answers.concerns.includes("sagging")}
                  onChange={(e) => handleCheckboxChange('concerns', e.target.value, e.target.checked)}
                  className="mr-2"
                />
                へたる
              </label>
            </div>
          </div>

          {/* マットレス/布団の硬さ */}
          <div>
            <label className="block text-sm font-medium mb-2">マットレス/布団の硬さ</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="mattress_firmness"
                  value="soft"
                  checked={answers?.mattress_firmness === "soft"}
                  onChange={(e) => setAnswers({ mattress_firmness: e.target.value })}
                  className="mr-2"
                />
                柔らかめ
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="mattress_firmness"
                  value="mid"
                  checked={answers?.mattress_firmness === "mid"}
                  onChange={(e) => setAnswers({ mattress_firmness: e.target.value })}
                  className="mr-2"
                />
                普通
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="mattress_firmness"
                  value="firm"
                  checked={answers?.mattress_firmness === "firm"}
                  onChange={(e) => setAnswers({ mattress_firmness: e.target.value })}
                  className="mr-2"
                />
                硬め
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="mattress_firmness"
                  value="unknown"
                  checked={answers?.mattress_firmness === "unknown"}
                  onChange={(e) => setAnswers({ mattress_firmness: e.target.value })}
                  className="mr-2"
                />
                不明 / 指定なし
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* C. 今の悩み */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">C. 今の悩み</h2>
        <div className="space-y-6">
          {/* 首・肩まわりで抱えている問題 - チェックボックスに変更 */}
          <div>
            <label className="block text-sm font-medium mb-2">首・肩まわりで抱えている問題（複数選択可）</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  value="morning_neck_pain"
                  checked={Array.isArray(answers?.neck_shoulder_issues) && answers.neck_shoulder_issues.includes("morning_neck_pain")}
                  onChange={(e) => handleCheckboxChange('neck_shoulder_issues', e.target.value, e.target.checked)}
                  className="mr-2"
                />
                朝起きると首が痛い
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  value="severe_shoulder_stiffness"
                  checked={Array.isArray(answers?.neck_shoulder_issues) && answers.neck_shoulder_issues.includes("severe_shoulder_stiffness")}
                  onChange={(e) => handleCheckboxChange('neck_shoulder_issues', e.target.value, e.target.checked)}
                  className="mr-2"
                />
                肩こりがひどい
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  value="headache"
                  checked={Array.isArray(answers?.neck_shoulder_issues) && answers.neck_shoulder_issues.includes("headache")}
                  onChange={(e) => handleCheckboxChange('neck_shoulder_issues', e.target.value, e.target.checked)}
                  className="mr-2"
                />
                頭痛・偏頭痛持ち
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  value="straight_neck"
                  checked={Array.isArray(answers?.neck_shoulder_issues) && answers.neck_shoulder_issues.includes("straight_neck")}
                  onChange={(e) => handleCheckboxChange('neck_shoulder_issues', e.target.value, e.target.checked)}
                  className="mr-2"
                />
                ストレートネックと診断
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  value="none"
                  checked={Array.isArray(answers?.neck_shoulder_issues) && answers.neck_shoulder_issues.includes("none")}
                  onChange={(e) => handleCheckboxChange('neck_shoulder_issues', e.target.value, e.target.checked)}
                  className="mr-2"
                />
                特に問題なし
              </label>
            </div>
          </div>

          {/* いびき */}
          <div>
            <label className="block text-sm font-medium mb-2">いびき</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="snore"
                  value="rarely"
                  checked={answers?.snore === "rarely"}
                  onChange={(e) => setAnswers({ snore: e.target.value })}
                  className="mr-2"
                />
                ほとんどない
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="snore"
                  value="sometimes"
                  checked={answers?.snore === "sometimes"}
                  onChange={(e) => setAnswers({ snore: e.target.value })}
                  className="mr-2"
                />
                時々ある
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="snore"
                  value="often"
                  checked={answers?.snore === "often"}
                  onChange={(e) => setAnswers({ snore: e.target.value })}
                  className="mr-2"
                />
                よくある
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="snore"
                  value="unknown"
                  checked={answers?.snore === "unknown"}
                  onChange={(e) => setAnswers({ snore: e.target.value })}
                  className="mr-2"
                />
                わからない
              </label>
            </div>
          </div>

          {/* 暑がり・汗かき */}
          <div>
            <label className="block text-sm font-medium mb-2">暑がり・汗かきですか？</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="heat_sweat"
                  value="yes"
                  checked={answers?.heat_sweat === "yes"}
                  onChange={(e) => setAnswers({ heat_sweat: e.target.value })}
                  className="mr-2"
                />
                はい
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="heat_sweat"
                  value="no"
                  checked={answers?.heat_sweat === "no"}
                  onChange={(e) => setAnswers({ heat_sweat: e.target.value })}
                  className="mr-2"
                />
                いいえ
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="heat_sweat"
                  value="unknown"
                  checked={answers?.heat_sweat === "unknown"}
                  onChange={(e) => setAnswers({ heat_sweat: e.target.value })}
                  className="mr-2"
                />
                わからない
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* D. 好み・希望 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">D. 好み・希望</h2>
        <div className="space-y-6">
          {/* 枕の高さや硬さを調整できる方が良いですか？ */}
          <div>
            <label className="block text-sm font-medium mb-2">枕の高さや硬さを調整できる方が良いですか？</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="adjustable_pref"
                  value="yes"
                  checked={answers?.adjustable_pref === "yes"}
                  onChange={(e) => setAnswers({ adjustable_pref: e.target.value })}
                  className="mr-2"
                />
                はい
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="adjustable_pref"
                  value="no"
                  checked={answers?.adjustable_pref === "no"}
                  onChange={(e) => setAnswers({ adjustable_pref: e.target.value })}
                  className="mr-2"
                />
                いいえ
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="adjustable_pref"
                  value="unknown"
                  checked={answers?.adjustable_pref === "unknown"}
                  onChange={(e) => setAnswers({ adjustable_pref: e.target.value })}
                  className="mr-2"
                />
                不明・指定なし
              </label>
            </div>
          </div>

          {/* 素材の好み */}
          <div>
            <label className="block text-sm font-medium mb-2">素材の好み</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="material_pref"
                  value="lp"
                  checked={answers?.material_pref === "lp"}
                  onChange={(e) => setAnswers({ material_pref: e.target.value })}
                  className="mr-2"
                />
                低反発
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="material_pref"
                  value="hp"
                  checked={answers?.material_pref === "hp"}
                  onChange={(e) => setAnswers({ material_pref: e.target.value })}
                  className="mr-2"
                />
                高反発
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="material_pref"
                  value="feather"
                  checked={answers?.material_pref === "feather"}
                  onChange={(e) => setAnswers({ material_pref: e.target.value })}
                  className="mr-2"
                />
                羽毛
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="material_pref"
                  value="buckwheat"
                  checked={answers?.material_pref === "buckwheat"}
                  onChange={(e) => setAnswers({ material_pref: e.target.value })}
                  className="mr-2"
                />
                そば殻
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="material_pref"
                  value="none"
                  checked={answers?.material_pref === "none"}
                  onChange={(e) => setAnswers({ material_pref: e.target.value })}
                  className="mr-2"
                />
                特になし
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="material_pref"
                  value="unknown"
                  checked={answers?.material_pref === "unknown"}
                  onChange={(e) => setAnswers({ material_pref: e.target.value })}
                  className="mr-2"
                />
                不明 / 指定なし
              </label>
            </div>
          </div>

          {/* サイズ希望 */}
          <div>
            <label className="block text-sm font-medium mb-2">サイズ希望</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="size_pref"
                  value="standard"
                  checked={answers?.size_pref === "standard"}
                  onChange={(e) => setAnswers({ size_pref: e.target.value })}
                  className="mr-2"
                />
                標準サイズ
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="size_pref"
                  value="large"
                  checked={answers?.size_pref === "large"}
                  onChange={(e) => setAnswers({ size_pref: e.target.value })}
                  className="mr-2"
                />
                大きめ
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="size_pref"
                  value="small"
                  checked={answers?.size_pref === "small"}
                  onChange={(e) => setAnswers({ size_pref: e.target.value })}
                  className="mr-2"
                />
                小さめ
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="size_pref"
                  value="unknown"
                  checked={answers?.size_pref === "unknown"}
                  onChange={(e) => setAnswers({ size_pref: e.target.value })}
                  className="mr-2"
                />
                不明・指定なし
              </label>
            </div>
          </div>

          {/* ご予算 */}
          <div>
            <label className="block text-sm font-medium mb-2">ご予算</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="budget"
                  value="lt3000"
                  checked={answers?.budget === "lt3000"}
                  onChange={(e) => setAnswers({ budget: e.target.value })}
                  className="mr-2"
                />
                3,000円未満
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="budget"
                  value="3k-6k"
                  checked={answers?.budget === "3k-6k"}
                  onChange={(e) => setAnswers({ budget: e.target.value })}
                  className="mr-2"
                />
                3,000円〜6,000円
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="budget"
                  value="6k-10k"
                  checked={answers?.budget === "6k-10k"}
                  onChange={(e) => setAnswers({ budget: e.target.value })}
                  className="mr-2"
                />
                6,000円〜10,000円
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="budget"
                  value="10k-20k"
                  checked={answers?.budget === "10k-20k"}
                  onChange={(e) => setAnswers({ budget: e.target.value })}
                  className="mr-2"
                />
                10,000円〜20,000円
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="budget"
                  value="20kplus"
                  checked={answers?.budget === "20kplus"}
                  onChange={(e) => setAnswers({ budget: e.target.value })}
                  className="mr-2"
                />
                20,000円以上
              </label>
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-3 pt-4">
        <Link href="/pillow" className="px-4 py-2 rounded-xl border">戻る</Link>
        <button onClick={handleNext} className="px-5 py-2 rounded-xl bg-black text-white">一次診断へ</button>
      </div>
    </main>
  );
} 