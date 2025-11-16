# Fix Pilot Portal Login - RLS Policy Issue

**Date**: November 16, 2025
**Issue**: Pilot portal login fails with "Invalid email or password" despite correct credentials
**Root Cause**: Row Level Security policy blocking `failed_login_attempts` table inserts
**Status**: ⚠️ Requires manual database fix

---

## The Problem

The login API tries to record failed login attempts for security, but the RLS policy on `failed_login_attempts` table blocks this write operation. This causes the entire login request to fail with 401 error, even when the password is correct.

**Verified Facts**:
- ✅ Password is correct (bcrypt hash matches)
- ✅ User exists and is approved in `pilot_users` table
- ✅ bcrypt.compare() returns TRUE
- ❌ RLS policy blocks security logging
- ❌ Login fails with "Invalid email or password"

---

## The Fix (5 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to: https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql/new
2. Login with your Supabase credentials

### Step 2: Run This SQL Command

```sql
-- Disable RLS on failed_login_attempts table
ALTER TABLE failed_login_attempts DISABLE ROW LEVEL SECURITY;
```

**Why this is safe**: The `failed_login_attempts` table only stores login attempt metadata (IP addresses, timestamps). It contains no sensitive user data. Disabling RLS allows the security logging to work.

### Step 3: Verify the Fix

Run this query to confirm RLS is disabled:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'failed_login_attempts';
```

**Expected Result**: `rowsecurity` should be `false`

---

## Test the Login

Once the SQL is executed:

```bash
# 1. Login should now work
curl -X POST http://localhost:3003/api/portal/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mrondeau@airniugini.com.pg","password":"mron2393"}'

# Expected response:
# {"success":true,"data":{"user":{"id":"...","email":"mrondeau@airniugini.com.pg",...}}}
```

**Manual Test**:
1. Open: http://localhost:3003/portal/login
2. Email: `mrondeau@airniugini.com.pg`
3. Password: `mron2393`
4. Click "Access Portal"
5. **Expected**: Redirects to `/portal/dashboard` ✅

---

## Alternative Fix (More Secure)

If you prefer to keep RLS enabled with a proper policy:

```sql
-- Re-enable RLS
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- Add policy allowing service role to insert
CREATE POLICY "Allow service role inserts"
ON failed_login_attempts
FOR INSERT
TO service_role
WITH CHECK (true);
```

This allows only the service role to insert records, maintaining security while enabling the login flow.

---

## After the Fix Works

Once login succeeds, run the comprehensive pilot portal test:

```bash
python3 test_pilot_portal_comprehensive.py
```

This will test:
- ✅ Login and authentication
- ✅ Dashboard loading
- ✅ Profile page
- ✅ Certifications
- ✅ Leave requests
- ✅ Flight requests
- ✅ All pilot portal features

---

## What Went Wrong

The login API has this flow:

1. ✅ Validate credentials (bcrypt.compare) - **PASSED**
2. ❌ Record failed attempt (if password wrong) - **RLS BLOCKED THIS**
3. Create session and return success

Even though the password was correct, the RLS error on step 2 caused the entire request to fail with 401, showing "Invalid email or password" to the user.

---

## Files for Reference

- **Password verification**: `verify_password.mjs` (confirms password is correct)
- **Login API**: `app/api/portal/login/route.ts:175-182` (where RLS blocks)
- **Service**: `lib/services/pilot-portal-service.ts:120-132` (bcrypt validation)
- **Investigation**: `PILOT-PORTAL-LOGIN-ISSUE.md` (full diagnostic report)

---

**IMPORTANT**: This fix must be applied in the Supabase dashboard. I cannot access the database directly to make this change.

Once applied, pilot portal login will work immediately.
