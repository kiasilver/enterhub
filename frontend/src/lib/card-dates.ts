/** Parse YYYY-MM-DD or ISO into a Date (noon UTC for date-only). */
export function parseCardDateInput(
  raw: string | null | undefined,
): Date | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null || raw === '') return null;
  const d = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T12:00:00.000Z`)
    : new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}
