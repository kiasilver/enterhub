const KNOWN_DEPT_KEYS = new Set([
  'finance',
  'it',
  'hr',
  'marketing',
  'operations',
  'general',
]);

/** Localize a department label from its stable key; falls back to API label. */
export function localizedDepartmentLabel(
  t: (key: string) => string,
  key?: string | null,
  apiLabel?: string | null,
): string {
  const k = key || 'general';
  if (KNOWN_DEPT_KEYS.has(k)) {
    return t(`departments.${k}`);
  }
  return apiLabel || k;
}
