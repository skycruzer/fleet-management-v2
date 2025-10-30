# Admin Dashboard - Pending Registrations Issue

**Date**: October 26, 2025
**Status**: ⚠️ **ISSUE IDENTIFIED**
**Severity**: **BLOCKING** - Cannot view pending registrations

---

## 🔍 Issue Summary

The admin dashboard at `/dashboard/admin/pilot-registrations` shows **0 pending registrations** even though a valid pending registration exists in the database.

**Error**: `403 Forbidden - Failed to fetch pending registrations`

---

## 📋 What We Found

### 1. **Registration Successfully Created** ✅
The pilot registration test was successful:
- **User**: Daniel Wanma (daniel.wanma@test.com)
- **Employee ID**: 1042
- **UUID**: `942a3cc9-743d-43aa-9d00-0c2f53775fb6`
- **Status**: `registration_approved: null` (PENDING)
- **Created**: 2025-10-26 09:20:38 UTC

**Database Verification**:
```sql
SELECT id, email, first_name, last_name, registration_approved
FROM pilot_users
WHERE registration_approved IS NULL;

Result: 1 record found ✅
```

### 2. **Admin Dashboard Shows 0 Pending** ❌
- Browser shows: "0 Awaiting approval"
- Empty state message: "No pending pilot registrations at this time"
- Console error: **"Failed to fetch pending registrations: Server Forbidden"**

### 3. **Root Cause Identified** 🎯

**The admin authentication check is failing.**

**File**: `/app/api/portal/registration-approval/route.ts:22-45`

```typescript
async function verifyAdmin() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { authorized: false, user: null }  // ❌ FAILING HERE
  }

  const { data: userData, error: userError } = await supabase
    .from('an_users')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (userError || !userData || userData.role !== 'admin') {
    return { authorized: false, user: null }
  }

  return { authorized: true, user: userData }
}
```

**Problem**: The `verifyAdmin()` function is checking for a logged-in Supabase Auth user with admin role, but **no admin user is currently authenticated** in the browser session.

---

## 🔧 Technical Details

### API Endpoint Analysis

**Endpoint**: `GET /api/portal/registration-approval`

**Expected Flow**:
1. Admin navigates to `/dashboard/admin/pilot-registrations`
2. Server component calls `getPendingRegistrations()` function
3. Fetches from API: `http://localhost:3000/api/portal/registration-approval`
4. API checks admin authentication via `verifyAdmin()`
5. **FAILS** at step 4 → Returns 403 Forbidden
6. Page receives empty array → Shows "0 pending registrations"

**Actual Error**:
```
[ERROR] Failed to fetch pending registrations: Server Forbidden
```

### Service Function (Working Correctly) ✅

**File**: `/lib/services/pilot-portal-service.ts:303-331`

```typescript
export async function getPendingRegistrations(): Promise<ServiceResponse<PilotRegistration[]>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('pilot_users')
      .select('*')
      .is('registration_approved', null) // NULL means pending
      .order('created_at', { ascending: true })

    if (error) {
      return { success: false, error: 'Failed to fetch pending registrations' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Get pending registrations error:', error)
    return { success: false, error: 'Failed to fetch pending registrations' }
  }
}
```

This function works correctly when called with proper authentication. The issue is **authentication is missing**.

### Database Status

**RLS Disabled** (from previous testing):
```sql
-- Current state
ALTER TABLE pilot_users DISABLE ROW LEVEL SECURITY;
```

**Status**: `rls_enabled: false`

This means the query should work without authentication IF called server-side with service role. However, the API endpoint is using the user's Supabase client, which requires authentication.

---

## 🚨 Why This Is Happening

### Dual Authentication Architecture

The application has **two separate authentication systems**:

1. **Admin Portal Authentication** (Supabase Auth)
   - Routes: `/dashboard/*`
   - Users: Admin staff, managers
   - Auth check: `supabase.auth.getUser()`

2. **Pilot Portal Authentication** (Custom `an_users` table)
   - Routes: `/portal/*`
   - Users: Pilots
   - Auth check: Custom credential validation

**The Problem**: The admin registration approval page is at `/dashboard/admin/pilot-registrations` (admin route), but the API endpoint `/api/portal/registration-approval` expects a Supabase Auth session.

**Current State**: No admin user is logged in to Supabase Auth in the current browser session.

---

## 🛠️ Solutions

### Option 1: Log In as Admin (Immediate)

**Quick Fix**: Log in to the admin portal with a valid Supabase Auth account.

**Steps**:
1. Navigate to `/auth/login`
2. Log in with admin credentials
3. Navigate to `/dashboard/admin/pilot-registrations`
4. Pending registrations should now appear

**Limitation**: Requires an existing admin user in Supabase Auth + `an_users` table with `role = 'admin'`

---

### Option 2: Create Admin User (Required for Production)

**File to Check**: `/lib/services/user-service.ts` (if exists)

**Required Data**:
```sql
-- Check if admin users exist
SELECT id, email, role FROM an_users WHERE role = 'admin';

-- If none exist, we need to create one
```

**Process**:
1. Create Supabase Auth user
2. Insert corresponding record in `an_users` table with `role = 'admin'`
3. Log in with those credentials

---

### Option 3: Bypass Auth for Server-Side Fetch (Development Only)

**Modify**: `/app/dashboard/admin/pilot-registrations/page.tsx:17-38`

**Change**:
```typescript
async function getPendingRegistrations() {
  try {
    // OPTION 1: Fetch via API (requires auth) ❌
    const response = await fetch(`${baseUrl}/api/portal/registration-approval`, {
      cache: 'no-store'
    })

    // OPTION 2: Direct service call (bypasses API auth) ✅
    import { getPendingRegistrations } from '@/lib/services/pilot-portal-service'
    const result = await getPendingRegistrations()
    return result.success ? result.data || [] : []
  } catch (error) {
    console.error('Error fetching pending registrations:', error)
    return []
  }
}
```

**Pros**: Works immediately without authentication
**Cons**: Bypasses security - only use for development/testing

---

### Option 4: Use Service Role Key (Production-Safe)

**Add to API endpoint**: Use Supabase service role for admin operations

**File**: `/app/api/portal/registration-approval/route.ts`

**Change**:
```typescript
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function GET(_request: NextRequest) {
  try {
    // Use service role for server-side admin operations
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabaseAdmin
      .from('pilot_users')
      .select('*')
      .is('registration_approved', null)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Get pending registrations API error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch' }, { status: 500 })
  }
}
```

**Pros**: Production-safe, no user auth needed for server operations
**Cons**: Requires `SUPABASE_SERVICE_ROLE_KEY` environment variable

---

## ✅ Recommended Solution

**For Testing (Now)**: Option 3 - Direct service call
**For Production**: Option 4 - Service role key + proper admin auth

### Implementation Steps

1. **Immediate (Testing)**:
   ```typescript
   // app/dashboard/admin/pilot-registrations/page.tsx
   import { getPendingRegistrations } from '@/lib/services/pilot-portal-service'

   async function getPendingRegistrationsData() {
     const result = await getPendingRegistrations()
     return result.success ? result.data || [] : []
   }
   ```

2. **Production**:
   - Add `SUPABASE_SERVICE_ROLE_KEY` to environment variables
   - Update API endpoint to use service role for admin operations
   - Re-enable RLS on `pilot_users` table
   - Create proper admin user accounts

---

## 📊 Test Evidence

### Browser Console
```
[ERROR] Failed to fetch pending registrations: Server Forbidden
```

### Database Query (Direct)
```sql
SELECT COUNT(*) FROM pilot_users WHERE registration_approved IS NULL;
-- Result: 1 ✅
```

### API Response
```json
{
  "success": false,
  "error": "Forbidden"
}
```

**Status Code**: 403

---

## 🎯 Next Steps

### Immediate Action Required
1. ✅ Document issue (this file)
2. ⚠️ Choose solution approach
3. ⚠️ Implement fix
4. ⚠️ Test with pending registration
5. ⚠️ Verify approval workflow

### Production Checklist
- [ ] Create admin user in Supabase Auth
- [ ] Add admin record to `an_users` table
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` to environment
- [ ] Update API to use service role for admin operations
- [ ] Re-enable RLS on `pilot_users`
- [ ] Test complete approval workflow
- [ ] Add email notifications for approved/denied registrations

---

## 📝 Files Involved

### Pages
- `app/dashboard/admin/pilot-registrations/page.tsx` - Admin dashboard page
- `app/dashboard/admin/pilot-registrations/registration-approval-client.tsx` - Client component

### API Routes
- `app/api/portal/registration-approval/route.ts` - Registration approval API

### Services
- `lib/services/pilot-portal-service.ts` - Portal service functions

### Database
- `pilot_users` table - Registration records

---

## 🔗 Related Documentation

- **Registration Testing**: `PILOT-REGISTRATION-TESTING-COMPLETE.md`
- **Fix Summary**: `REGISTRATION-FIX-SUMMARY.md`
- **Project Documentation**: `CLAUDE.md`

---

**Last Updated**: 2025-10-26 09:30 UTC
**Status**: Issue identified, awaiting fix implementation
**Blocking**: Admin approval workflow testing

---

## 💡 Key Takeaway

The pilot registration form is **working perfectly**. The registration was successfully created in the database with PENDING status.

The **only issue** is that the admin dashboard cannot display pending registrations because there is no authenticated admin user in the current browser session.

**Solution**: Either log in as admin, or modify the code to use direct service calls or service role authentication for server-side operations.
