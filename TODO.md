# SortOut Jobs — TODO

Done = ✓ | Not done = leave blank

---

## Module 0 — Project Init

| Done | Task |
|:---:|------|
| ✓ | M0-1 — docker-compose.yml (PostgreSQL 16) |
| ✓ | M0-2 — npm init + install all dependencies |
| ✓ | M0-3 — tsconfig.json |
| ✓ | M0-4 — .env + src/config/env.ts |
| ✓ | M0-5 — src/db/index.ts (Drizzle client + testConnection) |
| ✓ | M0-6 — Utils (apiError, apiResponse, asyncHandler) |
| ✓ | M0-7 — src/middlewares/error.middleware.ts |
| ✓ | M0-8 — src/app.ts + src/index.ts (server running) |

---

## Module 1 — User Management (Phase 1: Core)

| Done | Task |
|:---:|------|
| ✓ | M1-1 — Drizzle schema (users, refresh_tokens, auth_tokens) |
| ✓ | M1-2 — drizzle.config.ts + generate & run migration |
| ✓ | M1-3 — Zod schemas (user.types.ts) |
| ✓ | M1-4 — Token service (JWT + refresh) |
| ✓ | M1-5 — User service (register, login, getById) |
| ✓ | M1-6 — Auth controller (register, login, logout, refresh, me) |
| ✓ | M1-7 — Auth router + mount at /api/auth |
| ✓ | M1-8 — Auth middleware (requireAuth on /me) |
| ✓ | M1-9 — Test all 5 Phase 1 routes |

---

## Module 1 — User Management (Phase 1 hardening + Phases 2–5)

| Done | Task |
|:---:|------|
| ✓ | M1-10 — Phase 1 hardening (cookie path/secure, JWT type) + rate limiting |
| ✓ | M1-11 — Phase 2: Email verification (verify-email, resend) |
| ✓ | M1-12 — Phase 3: Forgot / reset password |
| ✓ | M1-13 — Phase 4: OTP login (request + verify) |
| ✓ | M1-14 — Phase 5: Google OAuth |
| ✓ | M1-15 — Unified Identity Linking (email nullable, phone/email linking endpoints) |

---

## Module 2 — Onboarding (Future)

| Done | Task |
|:---:|------|
| | M2-0 — Planning |
| | M2-x — TBD |

---

## Module 3 — Profile (Future)

| Done | Task |
|:---:|------|
| | M3-0 — Planning |
| | M3-x — TBD |

---

## Module 4 — Job Listings (Future)

| Done | Task |
|:---:|------|
| | M4-0 — Planning |
| | M4-x — TBD |
