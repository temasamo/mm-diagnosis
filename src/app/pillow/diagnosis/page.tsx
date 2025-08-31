"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function Page() {
  const [answers, setAnswers] = useState({
    posture: "",
    rollover: "",
    height_band: "",
    cur_years: "",
    concerns: "",
    neck_shoulder_issues: "",
    snore: "",
    heat_sweat: "",
    mattress_firmness: "",
    adjustable_pref: "",
    material_pref: "",
    size_pref: "",
    budget: ""
  });

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
            <select 
              value={answers.posture} 
              onChange={(e) => setAnswers({...answers, posture: e.target.value})}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">選択してください</option>
              <option value="supine">仰向け</option>
              <option value="prone">うつ伏せ</option>
              <option value="side">横向き</option>
            </select>
          </div>

          {/* 寝返り頻度 */}
          <div>
            <label className="block text-sm font-medium mb-2">寝返り頻度</label>
            <select 
              value={answers.rollover} 
              onChange={(e) => setAnswers({...answers, rollover: e.target.value})}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">選択してください</option>
              <option value="rare">ほとんどしない</option>
              <option value="mid">普通</option>
              <option value="often">よくする</option>
            </select>
          </div>

          {/* 身長 */}
          <div>
            <label className="block text-sm font-medium mb-2">身長</label>
            <select 
              value={answers.height_band} 
              onChange={(e) => setAnswers({...answers, height_band: e.target.value})}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">選択してください</option>
              <option value="150-155">150cm未満</option>
              <option value="155-170">150-170cm</option>
              <option value="170-180">170-180cm</option>
              <option value="180+">180cm以上</option>
            </select>
          </div>
        </div>
      </section>

      {/* B. 今使っている枕 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">B. 今使っている枕</h2>
        <div className="space-y-6">
          {/* 使用年数 */}
          <div>
            <label className="block text-sm font-medium mb-2">使用年数</label>
            <select 
              value={answers.cur_years} 
              onChange={(e) => setAnswers({...answers, cur_years: e.target.value})}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">選択してください</option>
              <option value="lt1y">1年未満</option>
              <option value="1-2y">1-2年</option>
              <option value="3-5y">3-5年</option>
              <option value="5y+">5年以上</option>
            </select>
          </div>

          {/* 気になる点 */}
          <div>
            <label className="block text-sm font-medium mb-2">気になる点</label>
            <select 
              value={answers.concerns} 
              onChange={(e) => setAnswers({...answers, concerns: e.target.value})}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">選択してください</option>
              <option value="neck_pain">首が痛い</option>
              <option value="height_mismatch">高さが合わない</option>
              <option value="poor_turn">寝返りしづらい</option>
              <option value="sweat">蒸れる</option>
              <option value="sagging">へたる</option>
            </select>
          </div>
        </div>
      </section>

      {/* C. 今の悩み */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">C. 今の悩み</h2>
        <div className="space-y-6">
          {/* 首・肩まわりで抱えている問題 */}
          <div>
            <label className="block text-sm font-medium mb-2">首・肩まわりで抱えている問題</label>
            <select 
              value={answers.neck_shoulder_issues} 
              onChange={(e) => setAnswers({...answers, neck_shoulder_issues: e.target.value})}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">選択してください</option>
              <option value="morning_neck_pain">朝起きると首が痛い</option>
              <option value="severe_shoulder_stiffness">肩こりがひどい</option>
              <option value="headache">頭痛・偏頭痛持ち</option>
              <option value="straight_neck">ストレートネックと診断</option>
              <option value="none">特に問題なし</option>
            </select>
          </div>

          {/* いびき */}
          <div>
            <label className="block text-sm font-medium mb-2">いびき</label>
            <select 
              value={answers.snore} 
              onChange={(e) => setAnswers({...answers, snore: e.target.value})}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">選択してください</option>
              <option value="rarely">ほとんどない</option>
              <option value="sometimes">時々ある</option>
              <option value="often">よくある</option>
              <option value="unknown">わからない</option>
            </select>
          </div>

          {/* 暑がり・汗かき */}
          <div>
            <label className="block text-sm font-medium mb-2">暑がり・汗かきですか？</label>
            <select 
              value={answers.heat_sweat} 
              onChange={(e) => setAnswers({...answers, heat_sweat: e.target.value})}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">選択してください</option>
              <option value="yes">はい</option>
              <option value="no">いいえ</option>
              <option value="unknown">わからない</option>
            </select>
          </div>
        </div>
      </section>

      {/* D. 好み・希望 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">D. 好み・希望</h2>
        <div className="space-y-6">
          {/* マットレスの硬さ */}
          <div>
            <label className="block text-sm font-medium mb-2">マットレスの硬さ</label>
            <select 
              value={answers.mattress_firmness} 
              onChange={(e) => setAnswers({...answers, mattress_firmness: e.target.value})}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">選択してください</option>
              <option value="soft">柔らかめ</option>
              <option value="mid">普通</option>
              <option value="firm">硬め</option>
              <option value="unknown">不明 / 指定なし</option>
            </select>
          </div>

          {/* 枕の高さや硬さを調整できる方が良いですか？ */}
          <div>
            <label className="block text-sm font-medium mb-2">枕の高さや硬さを調整できる方が良いですか？</label>
            <select 
              value={answers.adjustable_pref} 
              onChange={(e) => setAnswers({...answers, adjustable_pref: e.target.value})}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">選択してください</option>
              <option value="yes">はい</option>
              <option value="no">いいえ</option>
              <option value="unknown">不明・指定なし</option>
            </select>
          </div>

          {/* 素材の好み */}
          <div>
            <label className="block text-sm font-medium mb-2">素材の好み</label>
            <select 
              value={answers.material_pref} 
              onChange={(e) => setAnswers({...answers, material_pref: e.target.value})}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">選択してください</option>
              <option value="lp">低反発</option>
              <option value="hp">高反発</option>
              <option value="feather">羽毛</option>
              <option value="buckwheat">そば殻</option>
              <option value="none">特になし</option>
              <option value="unknown">不明 / 指定なし</option>
            </select>
          </div>

          {/* サイズ希望 */}
          <div>
            <label className="block text-sm font-medium mb-2">サイズ希望</label>
            <select 
              value={answers.size_pref} 
              onChange={(e) => setAnswers({...answers, size_pref: e.target.value})}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">選択してください</option>
              <option value="standard">標準サイズ</option>
              <option value="large">大きめ</option>
              <option value="small">小さめ</option>
              <option value="unknown">不明・指定なし</option>
            </select>
          </div>

          {/* ご予算 */}
          <div>
            <label className="block text-sm font-medium mb-2">ご予算</label>
            <select 
              value={answers.budget} 
              onChange={(e) => setAnswers({...answers, budget: e.target.value})}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">選択してください</option>
              <option value="lt3000">3,000円未満</option>
              <option value="3k-6k">3,000円〜6,000円</option>
              <option value="6k-10k">6,000円〜10,000円</option>
              <option value="10k-20k">10,000円〜20,000円</option>
              <option value="20kplus">20,000円以上</option>
            </select>
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