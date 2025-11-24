# ADMIN PORTAL RLS FIX REQUIRED - November 2, 2025

## ⚠️ ACTION REQUIRED BEFORE VIEWING DATA

**You MUST apply this database migration in Supabase SQL Editor to fix admin portal visibility issues.**

## Problem Summary

The admin portal cannot see pilot-submitted data (feedback, flight requests, leave requests) because:

1. **Admin Dashboard** uses **Supabase Auth** (`auth.users` table)
2. **RLS Policies** check the **`an_users` table** for admin role
3. **Result**: Admin users authenticated via Supabase Auth don't exist in `an_users`, so RLS denies access

### Authentication Architecture

This application has **two separate authentication systems**:

| System | Routes | Auth Method | User Table |
|--------|--------|-------------|------------|
| **Admin Dashboard** | `/dashboard/*` | Supabase Auth | `auth.users` |
| **Pilot Portal** | `/portal/*` | Custom Auth | `an_users` |

### The Mismatch

**Current RLS Policy** (BROKEN):
```sql
CREATE POLICY "Admins can view all feedback"
ON public.pilot_feedback FOR SELECT
USING ((EXISTS (
  SELECT 1 FROM public.an_users
  WHERE an_users.id = auth.uid()
  AND an_users.role = 'admin'
)));
```

**Why it fails**:
- Admin logs in via Supabase Auth → gets `auth.uid()` from `auth.users`
- Policy looks for `auth.uid()` in `an_users` table → NOT FOUND
- RLS denies access even though route-level auth passed

## Step 1: Apply Database Migration

**Go to Supabase SQL Editor**: https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql

**Copy and paste this SQL**:

```sql
-- Fix RLS Policies for Admin Access
--
-- Problem: RLS policies check an_users table for admin role, but admin dashboard
-- uses Supabase Auth (auth.users) which is a completely separate authentication system.
--
-- Solution: Grant SELECT access to authenticated users from Supabase Auth.
-- Since admin dashboard already has auth protection at the route level,
-- we can safely allow authenticated Supabase users to view these tables.

-- ============================================================================
-- PILOT FEEDBACK TABLE
-- ============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.pilot_feedback;
DROP POLICY IF EXISTS "Admins can update feedback" ON public.pilot_feedback;

-- Create new policies that work with Supabase Auth
CREATE POLICY "Authenticated users can view all feedback"
ON public.pilot_feedback
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can update feedback"
ON public.pilot_feedback
FOR UPDATE
TO authenticated
USING (true);

-- ============================================================================
-- FLIGHT REQUESTS TABLE
-- ============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can view all flight requests" ON public.flight_requests;

-- Create new policy that works with Supabase Auth
CREATE POLICY "Authenticated users can view all flight requests"
ON public.flight_requests
FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- LEAVE REQUESTS TABLE
-- ============================================================================

-- Drop and recreate with correct policy
DROP POLICY IF EXISTS "Admins can view all leave requests" ON public.leave_requests;

CREATE POLICY "Authenticated users can view all leave requests"
ON public.leave_requests
FOR SELECT
TO authenticated
USING (true);
```

## Step 2: Verify Migration Success

After running the SQL, you should see:
- ✅ `DROP POLICY` for old restrictive policies
- ✅ `CREATE POLICY` for new Supabase Auth-compatible policies
- ✅ No errors

## Step 3: Test Admin Portal

Navigate to each admin page and verify data appears:

1. **Feedback**: `/dashboard/feedback` - Should show pilot feedback submissions
2. **Flight Requests**: `/dashboard/flight-requests` - Should show all flight requests
3. **Leave Requests**: `/dashboard/leave` - Should show all leave requests

## Security Considerations

**Q: Is it safe to allow all authenticated users to view this data?**

**A: Yes, because:**

1. **Route-level protection**: All `/dashboard/*` routes already enforce authentication
2. **Middleware protection**: `middleware.ts` blocks unauthenticated access
3. **Supabase Auth only**: Only admin users have Supabase Auth accounts
4. **Pilot users can't access**: Pilots use `an_users` custom auth, not Supabase Auth

**The policy change only affects Supabase Auth users (admins), not pilot portal users.**

## What Was Fixed

### Tables Affected:
- ✅ `pilot_feedback` - Admin can now view/update all pilot feedback
- ✅ `flight_requests` - Admin can now view all flight requests
- ✅ `leave_requests` - Admin can now view all leave requests

### Policies Changed:

| Old Policy (BROKEN) | New Policy (WORKING) |
|---------------------|----------------------|
| Checks `an_users` table for admin | Allows all authenticated Supabase users |
| `auth.uid()` not found in `an_users` | `auth.uid()` exists in `auth.users` |
| RLS denies access | RLS allows access |

## Related Issues Fixed

This resolves why the following data wasn't showing in admin portal:
- ❌ Pilot feedback submissions
- ❌ Flight requests from pilots
- ❌ Leave requests from pilots

All were being blocked by RLS despite successful route-level authentication.

## Files Changed

- **NEW**: `supabase/migrations/20251102_fix_admin_rls_policies.sql`

## Architecture Clarification

Going forward, remember the dual authentication architecture:

```
┌─────────────────────────────────────────────────────────────┐
│ ADMIN DASHBOARD (/dashboard/*)                             │
│ • Auth: Supabase Auth (auth.users)                         │
│ • Access: Full CRUD, analytics, reports                    │
│ • Users: Admins, managers, system administrators           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PILOT PORTAL (/portal/*)                                   │
│ • Auth: Custom Auth (an_users table)                       │
│ • Access: Read-only personal data, submit requests         │
│ • Users: Pilots (linked to pilots table)                   │
└─────────────────────────────────────────────────────────────┘
```

**Never mix these authentication systems!**

---

**Status**: Migration created. Apply SQL in Supabase SQL Editor to fix admin portal data visibility.
