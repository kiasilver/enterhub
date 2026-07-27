# tasks.md — ENTERHUB frontend-only

Track with checkboxes. Follow STYLE_GUIDE + section specs. Reuse [ELEMENT_CATALOG.md](./ELEMENT_CATALOG.md).

## Phase 1: Project setup
- [x] Keep Coreinet frontend as sole app (`frontend/`)
- [x] Remove backend, docker compose, frontend-legacy, old Nexus backend docs
- [x] Create `website-guidelines/` + `website-sections/` (Joanna framework)
- [x] Create STYLE_GUIDE, PROJECT_REQUIREMENTS, ELEMENT_CATALOG
- [x] Create style-guide governance Cursor rule
- [x] Demo-only sign-in (no API)
- [ ] `cd frontend && npm install && npm run dev` smoke check
- [ ] Optional: add screenshots to `website-sections/inspo-images/`

## Phase 2: Marketing sections (iterate one at a time)
- [ ] Refine Navigation — [1.navigation-bar.md](../website-sections/1.navigation-bar.md)
- [ ] Refine Hero — [2.hero-section.md](../website-sections/2.hero-section.md)
- [ ] Refine Trust logos — [3.trust-logos.md](../website-sections/3.trust-logos.md)
- [ ] Refine Features — [4.features.md](../website-sections/4.features.md)
- [ ] Refine FAQ — [5.faq.md](../website-sections/5.faq.md)
- [ ] Refine Footer — [6.footer.md](../website-sections/6.footer.md)
- [ ] Refine Auth pages — [7.auth-pages.md](../website-sections/7.auth-pages.md)
- [ ] After each: update STYLE_GUIDE Changelog if patterns change

## Phase 3: Dashboard shell
- [ ] Audit SafeDashboard navigation labels for ENTERHUB PM product
- [ ] Hide or archive demo modules not needed (NFT/Crypto/Ecommerce) behind nav flags — without deleting design code
- [ ] Wire high-value modules first: Overview, Projects, Tasks, Calendar, Chat, Team, Settings
- [ ] Keep glass + plasma customizer behavior intact

## Phase 4: Polish
- [x] Pass mobile QA (≥360px) — extended to **368px → 4K** (2026-07-27): theme breakpoints `xs`/`3xl`/`4xl`, shell/marketing gutters, dense-app clamps, settings/content measures
- [ ] Replace remaining “Safety / Safe” copy with ENTERHUB PM language where user-facing
- [ ] Commit after each stable section
