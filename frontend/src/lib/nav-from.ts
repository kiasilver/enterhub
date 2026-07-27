/** Safe same-origin relative path for back-navigation `from` query. */
export function safeReturnPath(
  from: string | null | undefined,
  fallback: string,
): string {
  if (!from) return fallback;
  const decoded = (() => {
    try {
      return decodeURIComponent(from);
    } catch {
      return from;
    }
  })();
  if (!decoded.startsWith('/') || decoded.startsWith('//')) return fallback;
  if (decoded.includes('://')) return fallback;
  return decoded;
}

/** Append `from` query for return navigation after leaving a page. */
export function hrefWithFrom(href: string, from: string): string {
  const [path, existing = ''] = href.split('?');
  const q = new URLSearchParams(existing);
  q.set('from', from);
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}
