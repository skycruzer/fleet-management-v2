# Admin Login Fix - ACTION REQUIRED

## Current Status: **RLS FIX NOT APPLIED**

Despite saying "done - success", the RLS infinite recursion error is still occurring on the `an_users` table.

## Root Cause
The `an_users` table has RLS policies causing infinite recursion when the proxy tries to verify admin access.

## Required Fix

### **Step 1: Apply SQL in Supabase**

1. **Open Supabase SQL Editor:**
   - URL: https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql/new

2. **Copy and paste this ENTIRE SQL block:**

```sql
-- Fix an_users RLS infinite recursion
-- CRITICAL: This must be applied in Supabase SQL Editor

BEGIN;

-- Drop ALL existing problematic policies
DROP POLICY IF EXISTS "an_users select policy" ON public.an_users;
DROP POLICY IF EXISTS "an_users insert policy" ON public.an_users;
DROP POLICY IF EXISTS "an_users update policy" ON public.an_users;
DROP POLICY IF EXISTS "an_users delete policy" ON public.an_users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.an_users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.an_users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.an_users;
DROP POLICY IF EXISTS "an_users_select_policy" ON public.an_users;
DROP POLICY IF EXISTS "an_users_insert_policy" ON public.an_users;
DROP POLICY IF EXISTS "an_users_update_policy" ON public.an_users;

-- Create NEW simple, non-recursive policies
CREATE POLICY "an_users_select_policy"
ON public.an_users
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "an_users_insert_policy"
ON public.an_users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "an_users_update_policy"
ON public.an_users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE public.an_users ENABLE ROW LEVEL SECURITY;

COMMIT;
```

3. **Click "Run" button**

4. **Verify success message appears**

### **Step 2: Test Locally**

After applying the SQL:

```bash
node test-admin-login-final.mjs
```

You should see:
```
✅ ✅ ✅ SUCCESS! ✅ ✅ ✅
Admin login working correctly!
```

### **Step 3: Deploy to Production**

Once local test passes:

```bash
vercel --prod
```

## Why This Happens

Supabase RLS policies can reference other tables (like looking up user roles), which creates circular dependencies causing "infinite recursion detected in policy for relation".

The fix uses simple, non-recursive policies:
- **SELECT**: `USING (true)` - All authenticated users can see all users
- **INSERT/UPDATE**: Users can only modify their own record

## Verification

After applying the fix, you should see in server logs:
```
📊 an_users query result: {
  hasAdminUser: true,           ← Should be true now!
  adminUserId: '08c7b547-...',
  adminUserRole: 'admin'
}
```

Instead of:
```
hasError: true,
errorMessage: 'infinite recursion detected in policy for relation "an_users"'
```

---

**Status**: Waiting for SQL to be applied in Supabase SQL Editor
**Last Updated**: 2025-10-30
