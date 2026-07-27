# task.md — User Management & Access Control (RBAC)

> مرجع نقش‌ها: [website-guidelines/ROLE_ACCESS_MAP.md](website-guidelines/ROLE_ACCESS_MAP.md)

**یادداشت‌ها:**
- \* Guest عمدتاً در سطح **Board** است نه Role سراسری.
- † Member: `board:create` برای MVP روشن است.

---

## وضعیت کلی

| فاز | وضعیت |
|-----|--------|
| 0–4 | ✅ |
| 5 Guest | ✅ |
| 6 Security policies | ✅ |
| 7 Session / Force logout | ✅ |
| 8 Audit + Impersonation | ✅ |
| 9–10 UI | ✅ |
| 11 E2E scenarios | ✅ |

---

## فاز 2 — Auth ✅
- [x] 2.1–2.5 register / Auth.js / me / signup-signin

## فاز 3 — Members ✅
- [x] 3.1–3.7 (invite via `POST .../members`, bulk, transfer)

## فاز 4 — Roles ✅
- [x] 4.1–4.5

## فاز 5 — Guest / Observer ✅
- [x] **5.1** `GET/POST /api/boards/[id]/guests`
- [x] **5.2** `canAccessBoard` → [frontend/src/lib/board-access.ts](frontend/src/lib/board-access.ts)
- [x] **5.3** `redactCardForGuest` + `GET /api/boards/[id]/cards`

## فاز 6 — امنیت سازمان ✅
- [x] **6.1** `enforce2FA`, `sessionTimeoutHours`, `ipAllowlist` روی Workspace
- [x] **6.2** Enforce در `authorize` (2FA + IP) + session TTL
- [x] **6.3** `GET/PATCH /api/workspaces/[id]/security`

## فاز 7 — Session / Force Logout ✅
- [x] **7.1** `Session.jti` هنگام login
- [x] **7.2** `POST .../members/[memberId]/force-logout`
- [x] **7.3** revoke/expiry در JWT callback

## فاز 8 — Audit ✅
- [x] **8.1** AuditLogger روی invite/role/remove/force-logout/security/impersonate
- [x] **8.2** `GET /api/workspaces/[id]/audit`
- [x] **8.3** `POST/DELETE /api/superadmin/impersonate` (read-only؛ mutations → 403)

## فاز 9–10 UI ✅
- [x] Members / Roles pages

## فاز 11 — E2E ✅
- [x] **11.1–11.4** اسکریپت: `npx tsx scripts/e2e-access-scenarios.ts`

---

## تست سریع

```bash
cd frontend
npx tsx scripts/e2e-access-scenarios.ts
npm run dev
```

1. Signup → Members / Roles  
2. Owner: `PATCH /api/workspaces/{id}/security` با `{ "enforce2FA": true }`  
3. Board Admin: `POST /api/boards/{boardId}/guests`  
4. Guest: `GET /api/boards/{boardId}/cards` → بدون timeLogs  
5. Force logout: `POST .../members/{memberId}/force-logout`

## لاگ
| تاریخ | نتیجه |
|-------|--------|
| 2026-07-21 | فاز ۵–۸ و ۱۱ کامل شد؛ E2E سبز |
