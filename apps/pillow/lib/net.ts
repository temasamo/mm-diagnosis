export async function httpGetJson<T>(
  url: string,
  init: RequestInit = {},
  timeoutMs = 8000
): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const headers = {
    "Accept": "application/json",
    ...(init.headers || {}),
    // UA は API では必須ではないが将来の互換性のため明示
    "User-Agent":
      "mm-diagnosis/1.0 (+https://example.com; support@example.com)",
  };

  try {
    const res = await fetch(url, { ...init, headers, signal: controller.signal, cache: "no-store" });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(id);
  }
} 