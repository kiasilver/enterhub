# ELEMENT_CATALOG.md — Reuse from GitHub (Coreinet)

**Mandatory:** When building or changing UI, pick from this catalog first.  
Paths relative to `frontend/src/components/`.

---

## A. Marketing / chrome

| Element | Path | Use for |
|---------|------|---------|
| Plasma background | `Plasma/PlasmaWrapper.tsx` + `Plasma/Plasma.tsx` | Page backdrops |
| Navbar | `Navbar/Navbar.tsx` | Marketing + auth chrome |
| Footer | `Footer/Footer.tsx` | Marketing footer |
| ThemeProvider | `ThemeProvider/ThemeProvider.tsx` | Dark/light, primary, bgStyle |
| ThemeToggle | `ThemeToggle/` | Theme switch control |
| VariableProximity | `VariableProximity/` | Hero interactive headline |
| BlurText | `BlurText/` | Animated text |
| BorderGlow | `BorderGlow/` | Accent borders |
| AnimatedIcon | `AnimatedIcon/` | Icon motion |
| LanguageProvider | `LanguageProvider/` | i18n shell if needed |

## B. UI primitives (`ui/`)

| Element | Path |
|---------|------|
| Button | `ui/button.tsx` |
| Card | `ui/card.tsx` |
| Dialog | `ui/dialog.tsx` |
| Label / Textarea / Slider | `ui/label.tsx`, `textarea.tsx`, `slider.tsx` |
| Tooltip / Radio / Cloud | `ui/tooltip.tsx`, `radio-group.tsx`, `cloud.tsx` |
| Result states | `ui/success-result.tsx`, `error-result.tsx`, `empty-result.tsx` |

## C. Theme utilities

| Element | Path |
|---------|------|
| glassStyle & text helpers | `SafeDashboard/theme.ts` |

## D. Dashboard shell

| Element | Path |
|---------|------|
| SafeDashboard root | `SafeDashboard/SafeDashboard.tsx` |
| Sidebar / Topbar | `SafeSidebar.tsx`, `SafeTopbar.tsx` |
| Customizer | `SafeCustomizer.tsx` |
| Account shell | `SafeAccountShell.tsx`, `SafeAccountSettings.tsx`, `SafeAccountProfile.tsx`, `SafeAccountBilling.tsx`, `SafeAccountHelp.tsx` |

## E. Dashboard modules (page content)

Reuse these instead of inventing new pages:

| Category | Components (prefix `Safe`) |
|----------|----------------------------|
| Overview / analytics | `SafeStatsRow`, `SafeAnalytics`, `SafeActivityFeed`, `SafeAlertFeed`, `SafeIncidentChart`, `SafeGoals` |
| Charts | `SafeRecharts`, `SafeApexCharts`, `SafeChartjs`, `SafeECharts` |
| Apps | `SafeCalendar`, `SafeEmail`, `SafeChat`, `SafeTasks`, `SafeSupport`, `SafeGallery`, `SafeInvoices` |
| Projects / CRM | `SafeProjects`, `SafeCrm`, `SafeTeam`, `SafeTeamPage` |
| Commerce demos | `SafeEcommerce`, `SafeCrypto`, `SafeNft`, `SafeJob`, `SafeBlog`, `SafeBlogsPage` |
| Forms / inputs | `SafeFormLayouts`, `SafeFormSelect`, `SafeCheckboxesRadios`, `SafeInputMasks`, `SafeFileUploads`, `SafeRangeSlider`, `SafeBasicElements` |
| Base UI demos | `SafeAlerts`, `SafeBadges`, `SafeButtons`, `SafeCards`, `SafeCarousel`, `SafeTables`, `SafeSweetAlerts` |
| Maps | `SafeLeafletMaps`, `SafeGoogleMaps`, `SafeVectorMaps` |
| Auth templates | `SafeAuth`, `SafeAuth_new_sections` |
| Misc | `SafeProfile`, `SafeSettings`, `SafePricing`, `SafeFAQs`, `SafeTimeline`, `SafeWizard`, `SafeTour`, `SafeMaintenance`, `SafeComingSoon`, `SafeNestable`, `SafeSwiper`, `SafeScrollSpy`, `SafeHorizontalNav`, `SafeTwoColumnNav`, `SafeMaterial`, `SafeBoxicons`, `SafeIconAnimation`, `SafeIconFix`, `SafeAdvanced`, `SafeRatings` |

## F. Demo / reference composites

| Element | Path |
|---------|------|
| Pattern comps | `comp-157.tsx`, `comp-171.tsx`, `comp-257.tsx`, `comp-323.tsx` |

## G. How to extend (workflow)

1. Open the matching **section spec** under `website-sections/`.
2. Find a catalog element above that already solves the layout.
3. Copy patterns from that file (glass, spacing, radii) — do not restyle from scratch.
4. If a reusable decision emerges, update `STYLE_GUIDE.md` + Changelog.
5. Prefer editing existing `Safe*` modules over adding new top-level component folders.
