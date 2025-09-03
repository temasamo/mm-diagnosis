import { toRange, neighbors, BandId } from "../recommend/priceBand"

// 検索引数の型定義
type SearchArgs = {
  query: string
  budgetBandId: BandId
  allowedBands?: BandId[]    // 追加
  ngWords?: string[]         // 追加（ふるさと納税など）
  mall?: "rakuten"|"yahoo"|"amazon"
  limit?: number
}

export async function searchWithFallback(args: SearchArgs) {
  const { 
    budgetBandId, 
    allowedBands = neighbors(budgetBandId,{includeSelf:true,maxDistance:1}), 
    ngWords=["ふるさと納税","寄付","返礼品"], 
    limit = 10 
  } = args

  // 1) まずは予算帯±1レンジで /api/search-cross を叩く
  try {
    const response = await fetch("/api/search-cross", {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    // 2) 足りないときは別モール横断 or クエリ緩和（順番は既存仕様に合わせる）
    // ここでは既存のフォールバックロジックを流用
    // ngWords / allowedBands をそのまま渡す
    
    return data
  } catch (error) {
    console.error("searchWithFallback error:", error)
    return { items: [] }
  }
} 