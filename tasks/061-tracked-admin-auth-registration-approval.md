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

- [ ] API route `/api/portal/registration-approval` properly authenticates admin users
- [ ] Page fetches from API instead of calling service directly
- [ ] `approved_by` field properly populated with admin ID
- [ ] Audit trail captures admin who approved/denied registration
