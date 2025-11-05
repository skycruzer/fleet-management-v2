# Manual Fix for RLS Infinite Recursion

## CRITICAL: Apply This Fix IMMEDIATELY

The `an_users` table has RLS policies causing infinite recursion. This breaks the entire dashboard.

---

## How to Fix (5 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to: https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql
2. Click "New query"

### Step 2: Copy and Paste This SQL

```sql
-- Fix RLS Infinite Recursion on an_users Table
-- This removes policies that query an_users FROM within an_users policies

-- Drop problematic policies
DROP POLICY IF EXISTS "an_users_delete_policy" ON "public"."an_users";
DROP POLICY IF EXISTS "an_users_insert_policy" ON "public"."an_users";
DROP POLICY IF EXISTS "an_users_update_policy" ON "public"."an_users";
DROP POLICY IF EXISTS "Users can view own profile" ON "public"."an_users";
DROP POLICY IF EXISTS "Authenticated users can view all an_users" ON "public"."an_users";

-- Create new, safe policies that DON'T cause recursion

-- Allow users to view their own profile
CREATE POLICY "an_users_select_own"
ON "public"."an_users"
FOR SELECT
TO authenticated
USING ("id" = auth.uid());

-- Allow authenticated users to view all user records
CREATE POLICY "an_users_select_all"
ON "public"."an_users"
FOR SELECT
TO authenticated
USING (true);

-- Only service role can insert/update/delete
CREATE POLICY "an_users_insert_service_role_only"
ON "public"."an_users"
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "an_users_update_service_role_only"
ON "public"."an_users"
FOR UPDATE
TO service_role
USING (true);

CREATE POLICY "an_users_delete_service_role_only"
ON "public"."an_users"
FOR DELETE
TO service_role
USING (true);

-- Create helper function to check if user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM an_users
  WHERE id = auth.uid()
  LIMIT 1;

  RETURN user_role = 'admin';
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Verify RLS is still enabled
ALTER TABLE "public"."an_users" ENABLE ROW LEVEL SECURITY;
```

### Step 3: Click "Run" Button

The query should execute successfully.

### Step 4: Verify Fix Worked

Run this query to confirm policies were created:

```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'an_users'
ORDER BY policyname;
```

You should see:
- `an_users_delete_service_role_only`
- `an_users_insert_service_role_only`
- `an_users_select_all`
- `an_users_select_own`
- `an_users_update_service_role_only`

---

## What This Fixes

**Before (BROKEN)**:
```sql
-- Policy queries an_users FROM an_users = infinite recursion! ❌
CREATE POLICY "an_users_delete_policy" ON "an_users"
USING ((auth.uid()) IN (
  SELECT id FROM an_users WHERE role = 'admin'  -- 🔴 RECURSION!
));
```

**After (FIXED)**:
```sql
-- Service role only, no recursion ✅
CREATE POLICY "an_users_delete_service_role_only" ON "an_users"
TO service_role
USING (true);

-- Helper function uses SECURITY DEFINER to bypass RLS ✅
CREATE FUNCTION is_admin() ... SECURITY DEFINER ...
```

---

## After Applying the Fix

1. Refresh your local dev server (it should automatically pick up the changes)
2. Dashboard errors should disappear
3. All widgets should load correctly

---

## Need Help?

If the SQL fails, check:
1. You're connected to the correct database (wgdmgvonqysflwdiiols)
2. You're logged in as database owner/admin
3. Copy the FULL error message and send it to me

