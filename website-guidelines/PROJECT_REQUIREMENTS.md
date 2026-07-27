# PROJECT_REQUIREMENTS.md — ENTERHUB

Concise overview. Details live in linked files — **do not duplicate**.

## 1. Project Overview
See [product-brief.md](./product-brief.md).  
UI from [Coreinet/dashboard](https://github.com/Coreinet/dashboard), branded **ENTERHUB**, plus multi-tenant SaaS backend logic in the same Next.js app (Prisma / Auth.js / Socket.io).

**Roles:** Super Admin · Org Admin · Board Admin · Member · Guest — see product brief & `frontend/prisma/schema.prisma`.

## 2. Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js 16 (App Router) | UI + API routes |
| Prisma + PostgreSQL | Multi-tenant data model |
| Auth.js (next-auth v5) | Credentials JWT auth |
| Zustand + @hello-pangea/dnd | Kanban optimistic DnD |
| Socket.io | Real-time board rooms |
| Redis | Sessions / pub-sub (infra) |
| Tailwind CSS v4 + Coreinet UI | Design system |
| Docker + Nginx | Production deploy |

## 3. Dependencies
Canonical list: `frontend/package.json`. Install with `cd frontend && npm install`.

Key packages already present: `next`, `react`, `tailwindcss@4`, `@tailwindcss/postcss`, `motion`, `ogl`, `recharts`, `lucide-react`, `remixicon`, `@heroicons/react`, `boxicons`, `material-icons`, `gsap`, `lottie-react`, `radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`.

## 4. Design System
**Single source of truth:** [STYLE_GUIDE.md](./STYLE_GUIDE.md)  
Moodboard: [../website-sections/0.design-moodboard.md](../website-sections/0.design-moodboard.md)  
Element catalog: [ELEMENT_CATALOG.md](./ELEMENT_CATALOG.md)

## 5. Page Sections (index)

| # | Section | Spec | Route / entry |
|---|---------|------|----------------|
| 0 | Moodboard | [0.design-moodboard.md](../website-sections/0.design-moodboard.md) | — |
| 1 | Navigation | [1.navigation-bar.md](../website-sections/1.navigation-bar.md) | all marketing |
| 2 | Hero | [2.hero-section.md](../website-sections/2.hero-section.md) | `/` |
| 3 | Trust logos | [3.trust-logos.md](../website-sections/3.trust-logos.md) | `/` |
| 4 | Features | [4.features.md](../website-sections/4.features.md) | `/` |
| 5 | FAQ | [5.faq.md](../website-sections/5.faq.md) | `/` |
| 6 | Footer | [6.footer.md](../website-sections/6.footer.md) | marketing |
| 7 | Auth | [7.auth-pages.md](../website-sections/7.auth-pages.md) | `/signin`, `/signup` |
| 8 | Dashboard | [8.dashboard-shell.md](../website-sections/8.dashboard-shell.md) | `/dashboard` |

## 6. File Structure

```
enterhub/
├── .cursor/rules/
│   ├── general.mdc
│   └── style-guide-governance.mdc
├── website-guidelines/
│   ├── product-brief.md
│   ├── STYLE_GUIDE.md
│   ├── PROJECT_REQUIREMENTS.md
│   ├── ELEMENT_CATALOG.md
│   └── tasks.md
├── website-sections/
│   ├── inspo-images/
│   ├── 0.design-moodboard.md
│   └── 1…8.*.md
└── frontend/                 # Coreinet app (only runtime code)
    ├── src/app/
    ├── src/components/
    │   ├── Plasma/
    │   ├── Navbar/
    │   ├── Footer/
    │   ├── ThemeProvider/
    │   ├── SafeDashboard/    # product UI modules
    │   └── ui/
    └── package.json
```

## 7. Responsive Requirements
- Breakpoints: Tailwind defaults (`sm` 640, `md` 768, `lg` 1024, …)
- Navbar collapses below `md`
- Prefer existing `*Mobile.tsx` SafeDashboard variants

## 8. Backend / data entry points
| Artifact | Path |
|----------|------|
| Prisma schema | `frontend/prisma/schema.prisma` |
| Auth | `frontend/src/lib/auth.ts` |
| RBAC | `frontend/src/lib/rbac.ts` |
| Audit | `frontend/src/lib/audit-logger.ts` |
| Board store | `frontend/src/stores/useBoardStore.ts` |
| Socket hook | `frontend/src/hooks/useSocket.ts` |
| Custom server | `frontend/server.js` |
| Compose / Nginx | `docker-compose.yml`, `nginx.conf` |

## 9. Out of scope (this pass)
Kanban/Super Admin **UI screens** (logic + APIs only).
