type Dict = Record<string, unknown>;

/** Resolve nested key like `nav.features` from a dictionary object. */
export function getMessage(dict: Dict, key: string, params?: Record<string, string | number>): string {
  const parts = key.split('.');
  let cur: unknown = dict;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return key;
    cur = (cur as Dict)[p];
  }
  if (typeof cur !== 'string') return key;
  if (!params) return cur;
  return cur.replace(/\{(\w+)\}/g, (_, name: string) =>
    params[name] != null ? String(params[name]) : `{${name}}`,
  );
}
