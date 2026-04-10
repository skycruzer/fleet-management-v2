# Pilot Portal Login 429 Fix — Options 1+2

## Root cause (confirmed)

`lib/middleware/rate-limit-middleware.ts` creates four `Ratelimit` instances with **no `prefix`**. Upstash's default prefix is `"@upstash/ratelimit"`, so **every API route using `withRateLimit`, `withMutationRateLimit`, or `withAuthRateLimit` shares the same Redis key** `@upstash/ratelimit:<ip>`. The strictest limit (auth: 5/min) effectively caps every mutation from an IP. Pilots on a shared office IP hit 429 as soon as ~5 normal portal requests fire in a minute.

Symptom matches exactly: pilots see "Too many login attempts" (429) in production, affecting all pilots and specific ones (whichever happens to try login after the bucket fills).

Admin login (`/api/auth/login`) uses a separately-prefixed limiter from `lib/rate-limit.ts` and is unaffected.

## Plan

- [ ] Add unique `prefix` to all four `Ratelimit` instances in `lib/middleware/rate-limit-middleware.ts`:
  - `readRateLimit` → `ratelimit:read`
  - `mutationRateLimit` → `ratelimit:mutation`
  - `authRateLimit` → `ratelimit:auth-middleware`
  - strict limiter inside `withStrictRateLimit` → `ratelimit:strict`
- [ ] Change pilot login rate-limit keying from IP to `staffId` to eliminate shared-office-IP collateral damage. Account lockout already provides per-user brute-force defense (5 failed attempts → 30 min lockout).
- [ ] Remove the `withAuthRateLimit` wrapper from `app/api/portal/login/route.ts` and inline the rate check against `authRateLimit.limit(staffId.toLowerCase())` after body parsing.
- [ ] Preserve the existing 429 response shape so the login page's existing error handling keeps working.
- [ ] Run `npm run validate` (type-check + lint + format:check).
- [ ] Run `npm run build` to catch SSR / import errors.
- [ ] Report changes and manual verification steps.

## Out of scope (separate conversations)

- Dual-middleware structural issue (`middleware.ts` vs `lib/supabase/middleware.ts` both handling `/portal/*`).
- Account lockout tables verification (archived migration).
- RLS policy audit from the Mar 13 security hardening migration.

## Simplicity guardrails

- No new files beyond this plan.
- No refactoring beyond what the fix requires.
- Edits limited to `lib/middleware/rate-limit-middleware.ts` and `app/api/portal/login/route.ts`.
