# Project Brief — ENTERHUB

## What is it?
**ENTERHUB** is a premium project-management product UI built from the [Coreinet/dashboard](https://github.com/Coreinet/dashboard) design system. This repo is **frontend-only**: marketing pages + an in-app dashboard shell (SafeDashboard) with glassmorphism, plasma backgrounds, and dark/light themes. There is **no backend** in this project.

## Who is it for?
Teams and founders who want a polished SaaS-style workspace UI (landing + dashboard) and will continue iterating section-by-section with AI using specs-driven design.

## What's the goal?
1. Keep the **exact Coreinet visual language** (Plasma, glass cards, rounded CTAs, SafeDashboard).
2. Rebrand surface copy to **ENTERHUB**.
3. Extend features **only** by reusing existing components from this GitHub tree — do not invent a parallel design system.

## Sections needed
### Marketing (`src/app`)
1. Navigation Bar
2. Hero Section
3. Trust Logos
4. Features
5. FAQ
6. Footer
7. Auth (Sign In / Sign Up) — demo / local session only
8. Marketing pages: About, Contact, Privacy, Team, Features, Terms, FAQ

### Product shell (`/dashboard` → `SafeDashboard`)
9. Dashboard shell (Sidebar + Topbar + Customizer + page modules)

## Additional Requirements
- Fully responsive (mobile-first; comfortable from ~360px up)
- Fast loading (Plasma via dynamic import / WebGL optimized)
- Dark mode default; light mode supported via `ThemeProvider`
- **Source of truth for UI elements**: `frontend/src/components/**` (especially `SafeDashboard`, `Plasma`, `Navbar`, `ui/`)
- Specs-driven workflow: see `website-guidelines/` + `website-sections/`

## Design source
| Item | Value |
|------|--------|
| Upstream | https://github.com/Coreinet/dashboard |
| Brand | ENTERHUB |
| Stack | Next.js 16 App Router, React 19, Tailwind CSS v4, Motion, OGL (Plasma) |
