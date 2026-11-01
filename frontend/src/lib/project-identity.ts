/** Distinct accents that stay readable on both light and dark surfaces. */
export const PROJECT_COLOR_PALETTE = [
  '#2563EB', // blue
  '#0D9488', // teal
  '#7C3AED', // violet
  '#DB2777', // pink
  '#EA580C', // orange
  '#059669', // emerald
  '#CA8A04', // gold
  '#4F46E5', // indigo
  '#0891B2', // cyan
  '#BE123C', // rose
  '#65A30D', // lime
  '#9333EA', // purple
  '#0284C7', // sky
  '#C2410C', // deep orange
  '#0F766E', // deep teal
  '#A21CAF', // fuchsia
  '#B45309', // amber
  '#1D4ED8', // royal blue
] as const;

export const PROJECT_ICON_PRESETS = [
  'folder',
  'view_kanban',
  'assignment',
  'rocket_launch',
  'lightbulb',
  'campaign',
  'construction',
  'inventory_2',
  'dashboard',
  'palette',
  'terminal',
  'public',
] as const;

function isHexColor(value?: string | null): value is string {
  return !!value && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
}

function normHex(value: string): string {
  const v = value.trim().toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(v)) {
    return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  }
  return v;
}

/** Rough perceptual distance — enough to avoid near-duplicate column accents. */
function colorDistance(a: string, b: string): number {
  const parse = (h: string) => {
    const n = normHex(h).slice(1);
    return [
      parseInt(n.slice(0, 2), 16),
      parseInt(n.slice(2, 4), 16),
      parseInt(n.slice(4, 6), 16),
    ] as const;
  };
  try {
    const [r1, g1, b1] = parse(a);
    const [r2, g2, b2] = parse(b);
    return Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
  } catch {
    return 999;
  }
}

export function hashProjectColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return PROJECT_COLOR_PALETTE[Math.abs(hash) % PROJECT_COLOR_PALETTE.length];
}

/**
 * User-set `color` wins. A hex `background` counts only when it is not the
 * department color (legacy create copied dept color onto every board).
 */
export function resolveProjectColor(input: {
  id: string;
  color?: string | null;
  background?: string | null;
  departmentColor?: string | null;
}): string {
  if (isHexColor(input.color)) return input.color.trim();
  const bg = input.background?.trim() || '';
  if (
    isHexColor(bg) &&
    bg.toLowerCase() !== (input.departmentColor || '').trim().toLowerCase()
  ) {
    return bg;
  }
  return hashProjectColor(input.id);
}

/**
 * Ensure projects shown together (e.g. one department kanban) do not share
 * the same — or near-same — accent. Explicit user colors kept when unique;
 * collisions and auto-hashed colors are remapped onto free palette slots.
 */
export function assignDistinctProjectColors<
  T extends {
    id: string;
    color?: string | null;
    background?: string | null;
  },
>(
  items: T[],
  departmentColor?: string | null,
): (T & { coverColor: string })[] {
  const preferred = items.map((item) => ({
    item,
    preferred: resolveProjectColor({
      id: item.id,
      color: item.color,
      background: item.background,
      departmentColor,
    }),
    locked: isHexColor(item.color),
  }));

  const used = new Set<string>();
  const out = new Map<string, string>();
  const MIN_DIST = 90;

  function isFree(candidate: string): boolean {
    const n = normHex(candidate);
    if (used.has(n)) return false;
    for (const u of used) {
      if (colorDistance(n, u) < MIN_DIST) return false;
    }
    return true;
  }

  function take(candidate: string): string {
    const n = normHex(candidate);
    used.add(n);
    return candidate.trim();
  }

  function nextFree(seed: string): string {
    const start = Math.abs(
      [...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0),
    );
    for (let i = 0; i < PROJECT_COLOR_PALETTE.length; i++) {
      const c = PROJECT_COLOR_PALETTE[(start + i) % PROJECT_COLOR_PALETTE.length];
      if (isFree(c)) return take(c);
    }
    // Palette exhausted — allow reuse but still pick farthest from last used
    let best = PROJECT_COLOR_PALETTE[start % PROJECT_COLOR_PALETTE.length];
    let bestScore = -1;
    for (const c of PROJECT_COLOR_PALETTE) {
      let min = 999;
      for (const u of used) min = Math.min(min, colorDistance(c, u));
      if (min > bestScore) {
        bestScore = min;
        best = c;
      }
    }
    return take(best);
  }

  // Pass 1: locked unique user colors
  for (const row of preferred) {
    if (!row.locked) continue;
    if (isFree(row.preferred)) {
      out.set(row.item.id, take(row.preferred));
    }
  }

  // Pass 2: remaining (auto or colliding locked) — prefer preferred if free
  for (const row of preferred) {
    if (out.has(row.item.id)) continue;
    if (isFree(row.preferred)) {
      out.set(row.item.id, take(row.preferred));
    } else {
      out.set(row.item.id, nextFree(row.item.id));
    }
  }

  return items.map((item) => ({
    ...item,
    coverColor: out.get(item.id) || hashProjectColor(item.id),
  }));
}

export function projectInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  }
  return (name.trim().slice(0, 2) || 'P').toUpperCase();
}
