# STYLE_GUIDE.md — ENTERHUB (Coreinet)

**Authoritative global design system.** Living document.  
Implementation source: `frontend/src/`. Moodboard: `website-sections/0.design-moodboard.md`.

---

## 1. Color palette (CSS variables)

Defined in `frontend/src/app/globals.css` and overridden live by `ThemeProvider`.

### Light (`:root` / `html.light`)
```css
--background: #f0eded;
--foreground: #0a0a0a;
--primary: #4f46e5;
--primary-hover: #4338ca;
--card-bg: rgba(255, 255, 255, 0.6);
--card-border: rgba(255, 255, 255, 0.4);
```

### Dark (`html.dark`)
```css
--background: #000000;
--foreground: #ffffff;
--primary: #6366f1; /* default; user-customizable */
--card-bg: rgba(20, 20, 20, 0.4);
--card-border: rgba(255, 255, 255, 0.05);
```

### Helpers (`SafeDashboard/theme.ts`) — **prefer these in dashboard UI**
| Helper | Purpose |
|--------|---------|
| `glassStyle(isDark)` | Standard panel |
| `glassTopbar` / `glassSidebar` | Shell chrome |
| `textPrimary` / `textSecondary` / `textMuted` | Type colors |
| `surfaceHover` / `surfaceItem` / `borderSubtle` | Interactive surfaces |
| `hexToRgba` / `lighten` / `darken` | Accent math |

### Utility class
- `.glass-card` — blur 12px, `border-radius: 1rem`, uses `--card-bg` / `--card-border`

---

## 2. Typography

| Level | Classes / size | Weight |
|-------|----------------|--------|
| Hero H1 | `text-3xl sm:text-4xl md:text-6xl` | bold + variable wght via proximity |
| Section H2 | `text-2xl sm:text-3xl md:text-5xl` | bold |
| Card H3 | `text-xl` | bold |
| Body | `text-base sm:text-lg` | normal |
| Caption / badge | `text-xs` uppercase tracking | bold / medium |

Font stack: `var(--font-sans)` → Geist. Hero may use Roboto Flex axes.

---

## 3. Component patterns (MUST reuse)

### Marketing primitives
| Pattern | Where | Rules |
|---------|--------|-------|
| Plasma backdrop | `Plasma/PlasmaWrapper` | Fixed `inset-0 z-0` on marketing/auth |
| Navbar | `Navbar/Navbar` | Fixed, `backdrop-blur-md`, glass fill |
| Theme toggle | `ThemeToggle` | In navbar |
| Pill CTA primary | inverted fill | `rounded-full px-7 py-3` |
| Pill CTA secondary | translucent + border | same radius |
| Feature card | home `page.tsx` | `rounded-[24px] backdrop-blur-xl` + glass fill |
| Auth card | `signin` / `signup` | `rounded-[32px] backdrop-blur-2xl` |
| Footer | `Footer/Footer` | Brand + links + copyright |

### shadcn-style UI (`components/ui/`)
`button`, `card`, `dialog`, `label`, `textarea`, `slider`, `tooltip`, `radio-group`, `cloud`, result states (`success-result`, `error-result`, `empty-result`).

### Dashboard shell
| Piece | File |
|-------|------|
| Root shell | `SafeDashboard/SafeDashboard.tsx` |
| Sidebar | `SafeSidebar.tsx` |
| Topbar | `SafeTopbar.tsx` |
| Theme customizer | `SafeCustomizer.tsx` |
| Page modules | `Safe*.tsx` (analytics, tasks, chat, calendar, …) |

**Rule:** New product screens = compose existing `Safe*` modules or extend them. Do not create a parallel layout kit.

### Motion / visual toys (already in tree)
`BlurText`, `BorderGlow`, `VariableProximity`, `AnimatedIcon`, `comp-157/171/257/323`

---

## 4. Visual effects

| Effect | Spec |
|--------|------|
| Plasma | OGL; dark color `#9d9696`; light `#6b6060`; opacity 1 / 0.7 |
| Glass blur | 12px (`.glass-card`) or 18px (`glassStyle`) |
| Transitions | `transition-colors duration-300` (theme); `duration-200` (hover) |
| Auth shadow | dark `0 30px 60px rgba(0,0,0,0.6)` |
| Active scale | CTAs `active:scale-95` / `active:scale-[0.98]` |

---

## 5. Spacing & layout

| Context | Guidance |
|---------|----------|
| Section vertical | `pt-16 sm:pt-24` between marketing blocks |
| Page horizontal | `page-gutter` or `px-4 sm:px-6 xl:px-8 3xl:px-12 4xl:px-16`; navbar `px-4 sm:px-8 3xl:px-12` |
| Content max | Marketing inner `max-w-5xl` / `.page-measure`; hero text `max-w-4xl` / `max-w-2xl` |
| Card padding | Feature `p-6 sm:p-8`; FAQ `p-5 sm:p-6`; auth `p-6 sm:p-8 md:p-10` |
| Gaps | `gap-3 sm:gap-4` CTAs; `gap-6` feature grid |
| Grid | Features `md:grid-cols-2 lg:grid-cols-3` |
| Tables | Wrap in `.table-scroll` / `overflow-x-auto`; flex children need `min-w-0` |

---

## 6. Responsive

**Supported range:** comfortable from **368px** (QA floor) through **4K (3840px)**.

| Token | Min width | Role |
|-------|-----------|------|
| *(base)* | 0–367 | Tiny phones — stack, full-width CTAs, drawer nav |
| `xs` | 368px | QA floor / small phones |
| `sm` | 640px | Large phones / small tablets |
| `md` | 768px | Tablet; marketing hamburger closes; dashboard sidebar docked |
| `lg` | 1024px | Multi-pane Chat / Calendar / Email desktop layouts |
| `xl` | 1280px | Wider marketing gutters |
| `2xl` | 1536px | Large desktop |
| `3xl` | 1920px | Full HD+ / 2K — extra page gutters |
| `4xl` | 2560px | Ultra-wide / 4K — max gutters on marketing; dashboard shell stays full-bleed |

**Rules**
- Mobile-first; hamburger nav below `md`
- Touch targets ≥ `min-h-[44px]` where practical; CTAs `w-full sm:w-auto`
- Dashboard modules: use `*Mobile.tsx` below `lg` (1024) for multi-pane apps; shell drawer below `md` (768)
- **Dashboard shell is full-bleed at every width** (including 4K). Do **not** put `max-w-* mx-auto` on `SafeAppShell` / main chrome — only on reading surfaces (settings, legal, marketing sections)
- Multi-pane product UIs (Chat / Email / Calendar) use `dir="ltr"` on their root so RTL document direction does not reverse pane order
- On ≥`3xl` / `4xl` marketing: increase gutters; keep copy in `max-w-*` / `.page-measure`
- Prevent horizontal overflow: `min-w-0` on flex/grid children; wide tables in `.table-scroll`
- Utility classes in `globals.css`: `.page-gutter`, `.page-measure`, `.page-measure-narrow`, `.table-scroll`

---

## 7. Icon policy (this codebase)

Coreinet ships **multiple** icon sets. When editing a file, **match that file’s existing icon import**. Do not globally force Material-only if Lucide is already used in that module.

---

## 8. Frontend-only constraints

- No `/api` proxy required
- Sign-in may use **local demo session** (`localStorage`) only
- Do not reintroduce FastAPI, Docker DB, or Redis into this repo unless explicitly requested

---

## Changelog

| Date | Change |
|------|--------|
| 2026-07-27 | Responsive range documented 368px→4K; added `xs`/`3xl`/`4xl` theme breakpoints + `.page-gutter` / `.page-measure` / `.table-scroll` utilities. Shell and marketing gutters hardened for ultra-narrow and 4K. |
| 2026-07-27 | **4K fix:** removed `4xl:max-w` cap on dashboard shell (full-bleed). Chat/Email roots use `dir="ltr"` so RTL locale does not reverse multi-pane order into a huge empty column. |
| 2026-07-21 | Initial STYLE_GUIDE extracted from Coreinet clone + ENTERHUB rebrand. Backend removed; frontend-only. |
