"use client";
import { useState } from "react";
import Link from "next/link";
import { useDiagStore } from "../../../../lib/state/diagStore";

export default function Page() {
  const answers = useDiagStore((s: any) => s.answers);
  const setAnswers = useDiagStore((s: any) => s.setAnswers);

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
              value={answers?.posture || ""} 
              onChange={(e) => setAnswers({ posture: e.target.value })}
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
              value={answers?.rollover || ""} 
              onChange={(e) => setAnswers({ rollover: e.target.value })}
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
              value={answers?.height_band || ""} 
              onChange={(e) => setAnswers({ height_band: e.target.value })}
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
              value={answers?.cur_years || ""} 
              onChange={(e) => setAnswers({ cur_years: e.target.value })}
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
            <label className="block text-sm font-medium mb-2">気になる点（複数選択可）</label>
            <div className="space-y-2">
              {[
                { id: "neck_pain", label: "首が痛い" },
                { id: "height_mismatch", label: "高さが合わない" },
                { id: "poor_turn", label: "寝返りしづらい" },
                { id: "sweat", label: "蒸れる" },
                { id: "sagging", label: "へたる" }
              ].map((item) => (
                <label key={item.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={answers?.concerns?.includes(item.id) || false}
                    onChange={(e) => {
                      const current = answers?.concerns || [];
                      const newValue = e.target.checked
                        ? [...current, item.id]
                        : current.filter((x: string) => x !== item.id);
                      setAnswers({ concerns: newValue });
                    }}
                    className="mr-2"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* C. 今の悩み */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">C. 今の悩み（複数可）</h2>
        <div className="space-y-6">
          {/* 首・肩まわりで抱えている問題 */}
          <div>
            <label className="block text-sm font-medium mb-2">首・肩まわりで抱えている問題（複数選択可）</label>
            <div className="space-y-2">
              {[
                { id: "morning_neck_pain", label: "朝起きると首が痛い" },
                { id: "severe_shoulder_stiffness", label: "肩こりがひどい" },
                { id: "headache", label: "頭痛・偏頭痛持ち" },
                { id: "straight_neck", label: "ストレートネックと診断" },
                { id: "none", label: "特に問題なし" }
              ].map((item) => (
                <label key={item.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={answers?.neck_shoulder_issues?.includes(item.id) || false}
                    onChange={(e) => {
                      const current = answers?.neck_shoulder_issues || [];
                      const newValue = e.target.checked
                        ? [...current, item.id]
                        : current.filter((x: string) => x !== item.id);
                      setAnswers({ neck_shoulder_issues: newValue });
                    }}
                    className="mr-2"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          {/* いびき */}
          <div>
            <label className="block text-sm font-medium mb-2">いびき</label>
            <select 
              value={answers?.snore || ""} 
              onChange={(e) => setAnswers({ snore: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">選択してください</option>
              <option value="often">よくかく</option>
              <option value="sometimes">時々</option>
              <option value="rarely">ほぼない</option>
              <option value="unknown">不明 / 指定なし</option>
            </select>
          </div>

          {/* 暑がり・汗かき */}
          <div>
            <label className="block text-sm font-medium mb-2">暑がり・汗かきですか？</label>
            <select 
              value={answers?.heat_sweat || ""} 
              onChange={(e) => setAnswers({ heat_sweat: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">選択してください</option>
              <option value="yes">はい</option>
              <option value="no">いいえ</option>
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
              value={answers?.mattress_firmness || ""} 
              onChange={(e) => setAnswers({ mattress_firmness: e.target.value })}
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
              value={answers?.adjustable_pref || ""} 
              onChange={(e) => setAnswers({ adjustable_pref: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">選択してください</option>
              <option value="yes">はい</option>
              <option value="no">いいえ</option>
              <option value="unknown">不明 / 指定なし</option>
            </select>
          </div>

          {/* 素材の好み */}
          <div>
            <label className="block text-sm font-medium mb-2">素材の好み</label>
            <select 
              value={answers?.material_pref || ""} 
              onChange={(e) => setAnswers({ material_pref: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">選択してください</option>
              <option value="memory_foam">メモリーフォーム</option>
              <option value="latex">ラテックス</option>
              <option value="down">羽毛</option>
              <option value="cotton">綿</option>
              <option value="unknown">不明 / 指定なし</option>
            </select>
          </div>

          {/* サイズ希望 */}
          <div>
            <label className="block text-sm font-medium mb-2">サイズ希望</label>
            <select 
              value={answers?.size_pref || ""} 
              onChange={(e) => setAnswers({ size_pref: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">選択してください</option>
              <option value="standard">標準サイズ</option>
              <option value="large">大きめ</option>
              <option value="small">小さめ</option>
              <option value="unknown">不明 / 指定なし</option>
            </select>
          </div>

          {/* ご予算 */}
          <div>
            <label className="block text-sm font-medium mb-2">ご予算 *</label>
            <select 
              value={answers?.budget || ""} 
              onChange={(e) => setAnswers({ budget: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              required
            >
              <option value="">選択してください</option>
              <option value="lt3000">〜3,000円未満</option>
              <option value="3k-6k">3,000円〜6,000円</option>
              <option value="6k-10k">6,000円〜10,000円未満</option>
              <option value="10k-20k">10,000円〜20,000円未満</option>
              <option value="20kplus">20,000円以上</option>
            </select>
          </div>
        </div>
      </section>
      
      <div className="flex justify-end gap-3 pt-4">
        <Link href="/pillow" className="px-4 py-2 rounded-xl border">戻る</Link>
        <Link href="/pillow/preview" className="px-5 py-2 rounded-xl bg-black text-white">一次診断へ</Link>
      </div>
    </main>
  );
} 