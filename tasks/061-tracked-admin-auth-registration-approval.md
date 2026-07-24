# TRACKED: Admin Authentication for Registration Approval

**Status**: Pending
**Priority**: P1
**Created**: 2026-01-04

## Description

Fix admin authentication in the registration approval workflow. Currently using a temporary workaround that bypasses the API in favor of direct service calls.

## Affected Files

1. `app/dashboard/admin/pilot-registrations/page.tsx:32`
   - Currently calls service directly instead of API

2. `app/dashboard/admin/pilot-registrations/actions.ts:20`
   - Handle NULL `approved_by` in reviewPilotRegistration service

## Current Workaround

The page calls `getPendingRegistrationsService()` directly instead of fetching from `/api/portal/registration-approval` due to admin auth issues.

## Root Cause

The API endpoint expects admin authentication that isn't properly passed through in the current request context.

## Acceptance Criteria

- [x] API route properly authenticates admin users — **root cause found and fixed 2026-07-25**
- [ ] Page fetches from API instead of calling service directly
- [ ] `approved_by` field properly populated with admin ID
- [ ] Audit trail captures admin who approved/denied registration

## Root Cause (identified 2026-07-25 deep review)

The "admin auth isn't passed through" symptom was not an auth-context problem. The route
lived at `/api/portal/registration-approval`, and `proxy.ts` gates **every** `/api/portal/*`
path on the caller existing in `pilot_users` — returning 403 before the handler runs. The
route used `createAdminRoute`, so a pure admin could never satisfy both checks: the proxy
demanded a pilot, the factory demanded an admin. It was unreachable by design, which is why
the workaround (calling the service directly) was the only thing that worked.

**Fix**: moved to `app/api/admin/registration-approval/route.ts`, where the proxy's admin
branch applies and the factory's auth is authoritative. Endpoint strings updated to match.

Remaining items are unchanged in scope: rewiring the page to fetch from the API (it
currently works via server actions) and the `approved_by` / audit-trail work.
