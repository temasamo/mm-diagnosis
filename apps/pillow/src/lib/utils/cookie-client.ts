export type CookieOptions = { path?: string; maxAge?: number };

export function setCookie(name: string, value: string, opts: CookieOptions = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (opts.maxAge) parts.push(`Max-Age=${opts.maxAge}`);
  parts.push(`Path=${opts.path ?? "/"}`);
  document.cookie = parts.join("; ");
} 