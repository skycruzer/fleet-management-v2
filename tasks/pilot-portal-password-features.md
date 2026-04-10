# Pilot Portal Password Features — Implementation Plan

**Created**: February 15, 2026
**Developer**: Maurice Rondeau

---

## Investigation Summary

Three agents investigated the codebase in parallel. Key finding: **most of the requested features already exist** but are either not wired up in the UI or missing integration links.

### What Already Exists (No Changes Needed)

| Feature                                            | Status  | Key Files                                  |
| -------------------------------------------------- | ------- | ------------------------------------------ |
| `must_change_password` DB column                   | Working | `pilot_users` table                        |
| Login returns `mustChangePassword` flag            | Working | `pilot-portal-service.ts:186`              |
| Login API redirects to `/portal/change-password`   | Working | `api/portal/login/route.ts:211`            |
| Protected layout enforces password change redirect | Working | `portal/(protected)/layout.tsx:48`         |
| Forced change-password page                        | Working | `portal/change-password/page.tsx`          |
| Change-password API endpoint                       | Working | `api/portal/change-password/route.ts`      |
| Forgot-password page                               | Working | `portal/(public)/forgot-password/page.tsx` |
| Reset-password page (token-based)                  | Working | `portal/(public)/reset-password/page.tsx`  |
| Forgot-password API                                | Working | `api/portal/forgot-password/route.ts`      |
| Reset-password API                                 | Working | `api/portal/reset-password/route.ts`       |
| Password reset email via Resend                    | Working | `pilot-email-service.ts:1067`              |
| `password_reset_tokens` table                      | Working | DB table with token, expiry, used_at       |
| `password-validation-service.ts`                   | Working | 12-char min, strength scoring, history     |
| Rate limiting on auth endpoints                    | Working | `lib/rate-limit.ts`                        |
| Account lockout (5 attempts)                       | Working | `account-lockout-service.ts`               |

### What's Missing (To Be Implemented)

- [ ] **1. "Forgot Password?" link on login page** — The page exists but there's no link to it from login
- [ ] **2. Portal Settings page** — New route with password change form accessible from sidebar
- [ ] **3. Settings sidebar navigation item** — Add to `pilot-portal-sidebar.tsx`
- [ ] **4. Middleware fix** — Exclude `/portal/change-password`, `/portal/forgot-password`, `/portal/reset-password` from session cookie check

---

## Implementation Tasks

### Task 1: Add "Forgot Password?" link to login page

**File**: `app/portal/(public)/login/page.tsx`

**Changes**:

- Add `Link` import from `next/link`
- Add "Forgot your password?" link between the Remember Me checkbox and Submit button
- Update file header comment (remove "No registration or forgot-password" note)

**Lines of code**: ~5

---

### Task 2: Add "Settings" to portal sidebar navigation

**File**: `components/layout/pilot-portal-sidebar.tsx`

**Changes**:

- Import `Settings` icon from `lucide-react`
- Add Settings nav item to `navigationItems` array (after Feedback)

**Lines of code**: ~6

---

### Task 3: Create Settings page with password change

**File**: `app/portal/(protected)/settings/page.tsx` (NEW)

**Changes**:

- Create settings page with password change form
- Reuse existing `/api/portal/change-password` API endpoint
- Follow existing portal UI patterns (card layout, form style)
- Include password strength indicator (reuse from `password-validation-service.ts`)
- CSRF protection via `useCsrfToken()`
- Show/hide password toggles (consistent with existing pages)
- Success toast notification after password change

**Template**: Use `portal/change-password/page.tsx` as the base, adapt for voluntary (not forced) context

---

### Task 4: Fix middleware session exclusions

**File**: `lib/supabase/middleware.ts`

**Changes**:

- Add `/portal/change-password`, `/portal/forgot-password`, `/portal/reset-password` to the exclusion list alongside `/portal/login` and `/portal/register`

**Lines of code**: ~3

---

## Security Checklist

- [x] Rate limiting already in place for change-password and forgot-password endpoints
- [x] CSRF tokens required on POST endpoints
- [x] Account lockout after 5 failed attempts
- [x] Password reset tokens expire after 1 hour, single-use
- [x] Generic response on forgot-password (prevents email enumeration)
- [x] bcryptjs with 10 salt rounds for password hashing
- [ ] Settings page will use existing authenticated change-password API (requires current password)

---

## Files to Modify

1. `app/portal/(public)/login/page.tsx` — Add forgot password link
2. `components/layout/pilot-portal-sidebar.tsx` — Add Settings nav item
3. `lib/supabase/middleware.ts` — Fix session exclusions

## Files to Create

4. `app/portal/(protected)/settings/page.tsx` — Settings page with password change
