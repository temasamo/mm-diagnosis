"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDiagStore } from "../../../../lib/state/diagStore";
import { derivePosture } from "../../../lib/utils/posture";
import { AGE_BAND_LABELS, GENDER_LABELS, type AgeBand, type Gender } from "../../../types/answers";
import { APP_NAME } from "@/lib/constants";

export default function Page() {
  const router = useRouter();
  const answers = useDiagStore((s: any) => s.answers);
  const setAnswers = useDiagStore((s: any) => s.setAnswers);

  // URLから初期データを読み込み
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const cParam = searchParams.get('c');
      if (cParam) {
        try {
          const jsonData = JSON.parse(decodeURIComponent(cParam));
          setAnswers(jsonData);
        } catch (e) {
          console.warn('Failed to parse legacy JSON format:', e);
        }
      }
    }
  }, [setAnswers]);

  // チェックボックス用のヘルパー関数
  const handleCheckboxChange = (field: 'concerns' | 'neck_shoulder_issues', value: string, checked: boolean) => {
    const currentValues = Array.isArray(answers?.[field]) ? answers[field] : [];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter(item => item !== value);
    setAnswers({ [field]: newValues });
  };

  const handleNext = () => {
    // 古いJSON圧縮方式で一次診断へ遷移
    const compressed = JSON.stringify(answers);
    router.push(`/pillow/preview?c=${encodeURIComponent(compressed)}`);
  };

  return (
    <main className="max-w-4xl mx-auto p-4 md:p-6">
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-6">{APP_NAME}</h1>
      
      {/* A. 体・寝姿勢 */}
      <section className="rounded-xl border border-zinc-700/60 bg-zinc-900/40 p-5 md:p-6 mb-8">
        <h2 className="text-xl md:text-2xl font-bold mb-4">A. 体・寝姿勢</h2>
        <div className="space-y-6">
          {/* 主な寝姿勢 */}
          <div>
            <label className="text-sm md:text-base font-semibold text-zinc-200 mb-3 block">主な寝姿勢</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  checked={answers?.postures?.includes("supine") || false}
                  onChange={(e) => {
                    const currentPostures = answers?.postures || [];
                    const newPostures = e.target.checked
                      ? [...currentPostures, "supine"]
                      : currentPostures.filter((p: string) => p !== "supine");
                    const derived = derivePosture(newPostures);
                    setAnswers({ 
                      postures: newPostures,
                      posture: derived
                    });
                  }}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">仰向け</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  checked={answers?.postures?.includes("prone") || false}
                  onChange={(e) => {
                    const currentPostures = answers?.postures || [];
                    const newPostures = e.target.checked
                      ? [...currentPostures, "prone"]
                      : currentPostures.filter((p: string) => p !== "prone");
                    const derived = derivePosture(newPostures);
                    setAnswers({ 
                      postures: newPostures,
                      posture: derived
                    });
                  }}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">うつ伏せ</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  checked={answers?.postures?.includes("side") || false}
                  onChange={(e) => {
                    const currentPostures = answers?.postures || [];
                    const newPostures = e.target.checked
                      ? [...currentPostures, "side"]
                      : currentPostures.filter((p: string) => p !== "side");
                    const derived = derivePosture(newPostures);
                    setAnswers({ 
                      postures: newPostures,
                      posture: derived
                    });
                  }}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">横向き</span>
              </label>
            </div>
          </div>

          {/* 寝返り頻度 */}
          <div>
            <label className="text-sm md:text-base font-semibold text-zinc-200 mb-3 block">寝返り頻度</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="rollover"
                  value="rare"
                  checked={answers?.rollover === "rare"}
                  onChange={(e) => setAnswers({ rollover: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">ほとんどしない</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="rollover"
                  value="mid"
                  checked={answers?.rollover === "mid"}
                  onChange={(e) => setAnswers({ rollover: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">普通</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="rollover"
                  value="often"
                  checked={answers?.rollover === "often"}
                  onChange={(e) => setAnswers({ rollover: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">よくする</span>
              </label>
            </div>
          </div>

          {/* 身長 */}
          <div>
            <label className="text-sm md:text-base font-semibold text-zinc-200 mb-3 block">身長</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="height_band"
                  value="lt155"
                  checked={answers?.height_band === "lt155"}
                  onChange={(e) => setAnswers({ height_band: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">155cm未満</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="height_band"
                  value="155-170"
                  checked={answers?.height_band === "155-170"}
                  onChange={(e) => setAnswers({ height_band: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">155cm〜170cm</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="height_band"
                  value="170-180"
                  checked={answers?.height_band === "170-180"}
                  onChange={(e) => setAnswers({ height_band: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">170cm〜180cm</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="height_band"
                  value="180p"
                  checked={answers?.height_band === "180p"}
                  onChange={(e) => setAnswers({ height_band: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">180cm以上</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* B. 今使っている枕・マットレス/布団 */}
      <section className="rounded-xl border border-zinc-700/60 bg-zinc-900/40 p-5 md:p-6 mb-8">
        <h2 className="text-xl md:text-2xl font-bold mb-4">B. 今使っている枕・マットレス/布団</h2>
        <div className="space-y-6">
          {/* 使用年数 */}
          <div>
            <label className="text-sm md:text-base font-semibold text-zinc-200 mb-3 block">現在の枕の使用年数</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="cur_years"
                  value="lt1y"
                  checked={answers?.cur_years === "lt1y"}
                  onChange={(e) => setAnswers({ cur_years: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">1年未満</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="cur_years"
                  value="1-3y"
                  checked={answers?.cur_years === "1-3y"}
                  onChange={(e) => setAnswers({ cur_years: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">1〜3年</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="cur_years"
                  value="3-5y"
                  checked={answers?.cur_years === "3-5y"}
                  onChange={(e) => setAnswers({ cur_years: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">3〜5年</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="cur_years"
                  value="5y+"
                  checked={answers?.cur_years === "5y+"}
                  onChange={(e) => setAnswers({ cur_years: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">5年以上</span>
              </label>
            </div>
          </div>

          {/* 気になる点 */}
          <div>
            <label className="text-sm md:text-base font-semibold text-zinc-200 mb-3 block">気になる点（複数選択可）</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  value="neck_pain"
                  checked={Array.isArray(answers?.concerns) && answers.concerns.includes("neck_pain")}
                  onChange={(e) => handleCheckboxChange('concerns', e.target.value, e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">首が痛い</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  value="height_mismatch"
                  checked={Array.isArray(answers?.concerns) && answers.concerns.includes("height_mismatch")}
                  onChange={(e) => handleCheckboxChange('concerns', e.target.value, e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">高さが合わない</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  value="poor_turn"
                  checked={Array.isArray(answers?.concerns) && answers.concerns.includes("poor_turn")}
                  onChange={(e) => handleCheckboxChange('concerns', e.target.value, e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">寝返りしづらい</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  value="sweat"
                  checked={Array.isArray(answers?.concerns) && answers.concerns.includes("sweat")}
                  onChange={(e) => handleCheckboxChange('concerns', e.target.value, e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">蒸れる</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  value="sagging"
                  checked={Array.isArray(answers?.concerns) && answers.concerns.includes("sagging")}
                  onChange={(e) => handleCheckboxChange('concerns', e.target.value, e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">へたる</span>
              </label>
            </div>
          </div>

          {/* マットレス/布団の硬さ */}
          <div>
            <label className="text-sm md:text-base font-semibold text-zinc-200 mb-3 block">マットレス/布団の硬さ</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="mattress_firmness"
                  value="soft"
                  checked={answers?.mattress_firmness === "soft"}
                  onChange={(e) => setAnswers({ mattress_firmness: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">柔らかめ</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="mattress_firmness"
                  value="mid"
                  checked={answers?.mattress_firmness === "mid"}
                  onChange={(e) => setAnswers({ mattress_firmness: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">普通</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="mattress_firmness"
                  value="firm"
                  checked={answers?.mattress_firmness === "firm"}
                  onChange={(e) => setAnswers({ mattress_firmness: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">硬め</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="mattress_firmness"
                  value="unknown"
                  checked={answers?.mattress_firmness === "unknown"}
                  onChange={(e) => setAnswers({ mattress_firmness: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">不明 / 指定なし</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* C. 今の悩み */}
      <section className="rounded-xl border border-zinc-700/60 bg-zinc-900/40 p-5 md:p-6 mb-8">
        <h2 className="text-xl md:text-2xl font-bold mb-4">C. 今の悩み</h2>
        <div className="space-y-6">
          {/* 肩まわりで抱えている問題 */}
          <div>
            <label className="text-sm md:text-base font-semibold text-zinc-200 mb-3 block">・肩まわりで抱えている問題（複数選択可）</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  value="morning_neck_pain"
                  checked={Array.isArray(answers?.neck_shoulder_issues) && answers.neck_shoulder_issues.includes("morning_neck_pain")}
                  onChange={(e) => handleCheckboxChange('neck_shoulder_issues', e.target.value, e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">朝起きると首が痛い</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  value="severe_shoulder_stiffness"
                  checked={Array.isArray(answers?.neck_shoulder_issues) && answers.neck_shoulder_issues.includes("severe_shoulder_stiffness")}
                  onChange={(e) => handleCheckboxChange('neck_shoulder_issues', e.target.value, e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">肩こりがひどい</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  value="headache"
                  checked={Array.isArray(answers?.neck_shoulder_issues) && answers.neck_shoulder_issues.includes("headache")}
                  onChange={(e) => handleCheckboxChange('neck_shoulder_issues', e.target.value, e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">頭痛・偏頭痛持ち</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  value="straight_neck"
                  checked={Array.isArray(answers?.neck_shoulder_issues) && answers.neck_shoulder_issues.includes("straight_neck")}
                  onChange={(e) => handleCheckboxChange('neck_shoulder_issues', e.target.value, e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">ストレートネックと診断</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  value="no_problem"
                  checked={Array.isArray(answers?.neck_shoulder_issues) && answers.neck_shoulder_issues.includes("no_problem")}
                  onChange={(e) => handleCheckboxChange('neck_shoulder_issues', e.target.value, e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">特に問題なし</span>
              </label>
            </div>
          </div>

          {/* いびき */}
          <div>
            <label className="text-sm md:text-base font-semibold text-zinc-200 mb-3 block">いびき</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="snore"
                  value="rarely"
                  checked={answers?.snore === "rarely"}
                  onChange={(e) => setAnswers({ snore: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">ほとんどない</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="snore"
                  value="sometimes"
                  checked={answers?.snore === "sometimes"}
                  onChange={(e) => setAnswers({ snore: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">時々ある</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="snore"
                  value="often"
                  checked={answers?.snore === "often"}
                  onChange={(e) => setAnswers({ snore: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">よくある</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="snore"
                  value="unknown"
                  checked={answers?.snore === "unknown"}
                  onChange={(e) => setAnswers({ snore: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">わからない</span>
              </label>
            </div>
          </div>

          {/* 暑がり・汗かき */}
          <div>
            <label className="text-sm md:text-base font-semibold text-zinc-200 mb-3 block">暑がり・汗かきですか？</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="heat_sweat"
                  value="yes"
                  checked={answers?.heat_sweat === "yes"}
                  onChange={(e) => setAnswers({ heat_sweat: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">はい</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="heat_sweat"
                  value="no"
                  checked={answers?.heat_sweat === "no"}
                  onChange={(e) => setAnswers({ heat_sweat: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">いいえ</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="heat_sweat"
                  value="unknown"
                  checked={answers?.heat_sweat === "unknown"}
                  onChange={(e) => setAnswers({ heat_sweat: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">わからない</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* D. 好み・希望 */}
      <section className="rounded-xl border border-zinc-700/60 bg-zinc-900/40 p-5 md:p-6 mb-8">
        <h2 className="text-xl md:text-2xl font-bold mb-4">D. 好み・希望</h2>
        <div className="space-y-6">
          {/* 調整可能な枕 */}
          <div>
            <label className="text-sm md:text-base font-semibold text-zinc-200 mb-3 block">枕の高さや硬さを調整できる方が良いですか？</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="adjustable_pref"
                  value="yes"
                  checked={answers?.adjustable_pref === "yes"}
                  onChange={(e) => setAnswers({ adjustable_pref: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">はい</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="adjustable_pref"
                  value="no"
                  checked={answers?.adjustable_pref === "no"}
                  onChange={(e) => setAnswers({ adjustable_pref: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">いいえ</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="adjustable_pref"
                  value="unknown"
                  checked={answers?.adjustable_pref === "unknown"}
                  onChange={(e) => setAnswers({ adjustable_pref: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">不明・指定なし</span>
              </label>
            </div>
          </div>

          {/* 好きな枕の素材 */}
          <div>
            <label className="text-sm md:text-base font-semibold text-zinc-200 mb-3 block">好きな枕の素材</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="material_pref"
                  value="LR"
                  checked={answers?.material_pref === "LR"}
                  onChange={(e) => setAnswers({ material_pref: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">低反発</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="material_pref"
                  value="HR"
                  checked={answers?.material_pref === "HR"}
                  onChange={(e) => setAnswers({ material_pref: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">高反発</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="material_pref"
                  value="feather"
                  checked={answers?.material_pref === "feather"}
                  onChange={(e) => setAnswers({ material_pref: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">羽毛</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="material_pref"
                  value="sobakawa"
                  checked={answers?.material_pref === "sobakawa"}
                  onChange={(e) => setAnswers({ material_pref: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">そば殻</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="material_pref"
                  value="unknown"
                  checked={answers?.material_pref === "unknown"}
                  onChange={(e) => setAnswers({ material_pref: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">不明/指定なし</span>
              </label>
            </div>
          </div>

          {/* サイズ希望 */}
          <div>
            <label className="text-sm md:text-base font-semibold text-zinc-200 mb-3 block">サイズ希望</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="size_pref"
                  value="standard"
                  checked={answers?.size_pref === "standard"}
                  onChange={(e) => setAnswers({ size_pref: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">標準サイズ</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="size_pref"
                  value="large"
                  checked={answers?.size_pref === "large"}
                  onChange={(e) => setAnswers({ size_pref: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">大きめ</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="size_pref"
                  value="small"
                  checked={answers?.size_pref === "small"}
                  onChange={(e) => setAnswers({ size_pref: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">小さめ</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="size_pref"
                  value="unknown"
                  checked={answers?.size_pref === "unknown"}
                  onChange={(e) => setAnswers({ size_pref: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">不明・指定なし</span>
              </label>
            </div>
          </div>

          {/* E. 基本情報（任意） */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">E. 基本情報（任意）</h2>

            <div>
              <p className="mb-2">年代</p>
              {Object.entries(AGE_BAND_LABELS).map(([value, label]) => (
                <label key={value} className="flex items-center space-x-2 mb-1">
                  <input
                    type="radio"
                    name="age_band"
                    value={value}
                    checked={answers.age_band === value}
                    onChange={(e) => setAnswers({ ...answers, age_band: e.target.value as AgeBand })}
                    className="h-4 w-4"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            <div>
              <p className="mb-2">性別</p>
              {Object.entries(GENDER_LABELS).map(([value, label]) => (
                <label key={value} className="flex items-center space-x-2 mb-1">
                  <input
                    type="radio"
                    name="gender"
                    value={value}
                    checked={answers.gender === value}
                    onChange={(e) => setAnswers({ ...answers, gender: e.target.value as Gender })}
                    className="h-4 w-4"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </section>

          {/* ご予算 */}
          <div>
            <label className="text-sm md:text-base font-semibold text-zinc-200 mb-3 block">ご予算</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="budget"
                  value="lt3000"
                  checked={answers?.budget === "lt3000"}
                  onChange={(e) => setAnswers({ budget: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">3,000円未満</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="budget"
                  value="3k-6k"
                  checked={answers?.budget === "3k-6k"}
                  onChange={(e) => setAnswers({ budget: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">3,000円〜6,000円</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="budget"
                  value="6k-10k"
                  checked={answers?.budget === "6k-10k"}
                  onChange={(e) => setAnswers({ budget: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">6,000円〜10,000円</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="budget"
                  value="10k-20k"
                  checked={answers?.budget === "10k-20k"}
                  onChange={(e) => setAnswers({ budget: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">10,000円〜20,000円</span>
              </label>
              <label className="flex items-center gap-3 py-2">
                <input
                  type="radio"
                  name="budget"
                  value="20kplus"
                  checked={answers?.budget === "20kplus"}
                  onChange={(e) => setAnswers({ budget: e.target.value })}
                  className="h-4 w-4"
                />
                <span className="text-sm md:text-base">20,000円以上</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-3 pt-4">
        <Link href="/pillow" className="px-5 py-2.5 rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-200 font-semibold hover:bg-zinc-700 transition-colors">戻る</Link>
        <button onClick={handleNext} className="px-5 py-2.5 rounded-lg bg-zinc-100 text-zinc-900 font-semibold hover:bg-zinc-200 transition-colors">一次診断へ</button>
      </div>
    </main>
  );
} 