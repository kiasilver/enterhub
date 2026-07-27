# Enterhub

Premium project-management **UI** based on [Coreinet/dashboard](https://github.com/Coreinet/dashboard).  
**Frontend only** — no backend in this repository.

## Quick start (app)

```bash
cd frontend
cp .env.example .env   # set DATABASE_URL to postgresql://...
npm install
npx prisma migrate dev
npm run dev            # or: npm run dev:socket  for Socket.io
```

Open http://localhost:3000

> If your shell already exports `DATABASE_URL` (e.g. `postgresql+psycopg2://...`), override it — Prisma requires `postgresql://` or `postgres://`.

## Backend artifacts (this pass — no Kanban UI yet)

| Layer | Path |
|-------|------|
| Schema | `frontend/prisma/schema.prisma` |
| Auth.js | `frontend/src/lib/auth.ts` |
| Middleware | `frontend/src/middleware.ts` |
| RBAC | `frontend/src/lib/rbac.ts` → `hasPermission` |
| Create board API | `POST /api/workspaces/[id]/boards` |
| Reorder cards | `PATCH /api/cards/reorder` |
| Superadmin metrics | `GET /api/superadmin/metrics` |
| Suspend tenant | `POST /api/superadmin/workspaces/[id]/suspend` |
| Audit | `frontend/src/lib/audit-logger.ts` |
| Zustand DnD store | `frontend/src/stores/useBoardStore.ts` |
| Socket hook | `frontend/src/hooks/useSocket.ts` |
| Socket server | `frontend/server.js` |
| Deploy | `docker-compose.yml` + `nginx.conf` + `frontend/Dockerfile` |

## Design framework (for AI + humans)

Follow the Joanna / AI Builder Space specs-driven flow:

| Folder | Purpose |
|--------|---------|
| `website-guidelines/product-brief.md` | What / who / goal |
| `website-guidelines/STYLE_GUIDE.md` | Living design system |
| `website-guidelines/PROJECT_REQUIREMENTS.md` | Stack + section index |
| `website-guidelines/ELEMENT_CATALOG.md` | **Reuse these GitHub components** |
| `website-guidelines/tasks.md` | Checklist |
| `website-sections/*.md` | Per-section content + design specs |

## Source of UI elements

All visual building blocks are already in `frontend/src/components/` (Plasma, Navbar, SafeDashboard modules, ui primitives). New work should compose those — see ELEMENT_CATALOG.
