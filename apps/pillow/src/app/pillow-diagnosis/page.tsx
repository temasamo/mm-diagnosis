"use client";
import { useEffect, useState } from "react";
import QuestionRenderer from "../../../components/QuestionRenderer";
import type { Questionnaire } from "../../../lib/types";
import { computeProvisional } from "../../../lib/scoring/engine";
import { CATEGORY_LABEL } from "../../../lib/scoring/config";
import { generateProductRecommendations, filterByBudget } from "../../../lib/scoring/product-recommendations";
import { generatePersonalizedExplanation } from "../../../lib/scoring/explanations";
import { generateSearchQueries } from "../../../lib/scoring/search-queries";
import { buildGroupsFromAPI, type GroupedRecommendations } from "../../../lib/recommend/build_groups";
import { buildAffUrl } from "../../../lib/affOut";

export default function Page() {
  const [q, setQ] = useState<Questionnaire | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetch("/questions.pillow.v2.json").then(r => r.json()).then(setQ).catch(console.error);
  }, []);

  const onPrimary = async () => {
    const r = computeProvisional(answers);
    
    // 商品推薦を生成（既存）
    const recommendations = generateProductRecommendations(r.provisional);
    
    // 予算でフィルタリング（既存）
    const filteredRecommendations = answers.budget ? 
      filterByBudget(recommendations, answers.budget) : recommendations;
    
    // 新しいグループ化機能を追加
    const groupedRecommendations = await buildGroupsFromAPI(r.provisional);
    
    // 拡張結果を設定
    const extendedResult = {
      ...r,
      recommendations: filteredRecommendations,
      groupedRecommendations,
      searchQueries: generateSearchQueries(r.provisional[0]?.category || "mid-loft")
    };
    
    setResult(extendedResult);
    console.log("拡張診断結果", extendedResult);
  };

  if (!q) return <div className="p-6">読み込み中...</div>;

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">{q.title}</h1>

      <QuestionRenderer
        questions={q.items}
        answers={answers}
        onChange={(id, v) => setAnswers(prev => ({ ...prev, [id]: v }))}
      />

      <div className="flex justify-end gap-3 pt-4">
        <button className="px-4 py-2 rounded-xl border" onClick={() => { setAnswers({}); setResult(null); }}>
          クリア
        </button>
        <button className="px-5 py-2 rounded-xl bg-black text-white" onClick={onPrimary}>
          一次診断へ
        </button>
      </div>

      {result && (
        <section className="rounded-2xl border p-4 space-y-6">
          <div className="text-lg font-semibold">拡張診断結果</div>
          
          {/* 一次診断サマリー */}
          <div className="space-y-2">
            <div className="text-sm text-gray-600">{result.insight.summary}</div>
            <ul className="list-disc pl-5 text-sm">
              {result.insight.reasons.map((r: string, i: number) => <li key={i}>{r}</li>)}
            </ul>
          </div>

          {/* 第一候補グループ */}
          {result.recommendations?.primary && result.recommendations.primary.length > 0 && (
            <div className="space-y-3">
              <div className="font-medium text-blue-600">第一候補グループ</div>
              {result.recommendations.primary.map((rec: any) => (
                <div key={rec.category} className="rounded-xl border p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">{CATEGORY_LABEL[rec.category as keyof typeof CATEGORY_LABEL] ?? rec.category}</div>
                    <div className="text-sm text-gray-500">スコア: {(rec.score*100).toFixed(0)}%</div>
                  </div>
                  
                  {/* パーソナライズ説明 */}
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {generatePersonalizedExplanation(rec.category, answers)}
                  </div>
                  
                  {/* 商品リスト */}
                  {rec.products && rec.products.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">おすすめ商品:</div>
                      {rec.products.map((product: any) => (
                        <div key={product.id} className="flex justify-between items-center text-sm">
                          <span>{product.name}</span>
                          <span className="text-gray-500">¥{product.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* 検索クエリ */}
                  <div className="text-xs text-gray-500">
                    検索キーワード: {rec.searchQueries?.slice(0, 2).join(", ")}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 第二候補グループ */}
          {result.recommendations?.secondary && result.recommendations.secondary.length > 0 && (
            <div className="space-y-3">
              <div className="font-medium text-green-600">第二候補グループ</div>
              {result.recommendations.secondary.map((rec: any) => (
                <div key={rec.category} className="rounded-xl border p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">{CATEGORY_LABEL[rec.category as keyof typeof CATEGORY_LABEL] ?? rec.category}</div>
                    <div className="text-sm text-gray-500">スコア: {(rec.score*100).toFixed(0)}%</div>
                  </div>
                  
                  {/* 商品リスト */}
                  {rec.products && rec.products.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">おすすめ商品:</div>
                      {rec.products.map((product: any) => (
                        <div key={product.id} className="flex justify-between items-center text-sm">
                          <span>{product.name}</span>
                          <span className="text-gray-500">¥{product.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 新しいグループ化結果 */}
          {result.groupedRecommendations && (
            <div className="space-y-4">
              <div className="font-medium text-purple-600">モール検索結果</div>
              
              {/* 第一候補グループ */}
              {result.groupedRecommendations.primaryGroup && result.groupedRecommendations.primaryGroup.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-blue-600">第一候補商品</div>
                  {result.groupedRecommendations.primaryGroup.map((product: any, i: number) => (
                    <div key={`primary-${product.url}-${i}`} className="flex justify-between items-center text-sm border rounded p-2">
                      <div>
                        <div className="font-medium">{product.title}</div>
                        <div className="text-xs text-gray-500">[{product.mall}]</div>
                      </div>
                      <a href={product.mall === "rakuten" ? buildAffUrl("rakuten", { url: product.url }) : product.mall === "yahoo" ? buildAffUrl("yahoo", { url: product.url }) : product.url} target="_blank" rel="nofollow sponsored noopener" 
                         className="text-blue-500 text-xs underline">
                        詳細
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* 第二候補グループ */}
              {result.groupedRecommendations.secondaryGroup && result.groupedRecommendations.secondaryGroup.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-green-600">第二候補商品</div>
                  {result.groupedRecommendations.secondaryGroup.map((product: any, i: number) => (
                    <div key={`secondary-${product.url}-${i}`} className="flex justify-between items-center text-sm border rounded p-2">
                      <div>
                        <div className="font-medium">{product.title}</div>
                        <div className="text-xs text-gray-500">[{product.mall}]</div>
                      </div>
                      <a href={product.mall === "rakuten" ? buildAffUrl("rakuten", { url: product.url }) : product.mall === "yahoo" ? buildAffUrl("yahoo", { url: product.url }) : product.url} target="_blank" rel="nofollow sponsored noopener" 
                         className="text-blue-500 text-xs underline">
                        詳細
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* 診断根拠 */}
              {result.groupedRecommendations.rationale && (
                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  <div className="font-medium mb-1">診断根拠:</div>
                  {result.groupedRecommendations.rationale.notes.map((note: string, i: number) => (
                    <div key={i}>• {note}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* フィードバックボタン */}
          <div className="flex gap-2 pt-4">
            <button 
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded"
              onClick={() => {
                // フィードバックAPIを呼び出し
                fetch('/api/feedback', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    session_id: Date.now().toString(),
                    category_id: result.provisional[0]?.category,
                    action: 'click',
                    answers: answers
                  })
                });
              }}
            >
              この結果をクリック
            </button>
            <button 
              className="px-3 py-1 text-sm bg-green-500 text-white rounded"
              onClick={() => {
                fetch('/api/feedback', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    session_id: Date.now().toString(),
                    category_id: result.provisional[0]?.category,
                    action: 'purchase',
                    answers: answers
                  })
                });
              }}
            >
              購入した
            </button>
          </div>
        </section>
      )}
    </main>
  );
} 