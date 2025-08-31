export function getGreetingJST(date = new Date()) {
  // JSTに変換
  const jst = new Date(date.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }));
  const h = jst.getHours();
  if (h < 5)   return "夜更かしさん、ようこそ";
  if (h < 11)  return "おはようございます";
  if (h < 18)  return "こんにちは";
  return "こんばんは";
} 