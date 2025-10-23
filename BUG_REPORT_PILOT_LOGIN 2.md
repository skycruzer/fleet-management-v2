# Bug Report: Pilot Portal Login Fails Due to Schema Mismatch

**Date**: October 22, 2025
**Severity**: 🔴 Critical (Login completely broken)
**Affects**: All pilot users attempting to log into the portal
**Status**: ❌ Not Fixed

---

## Summary

Pilot users cannot log into the pilot portal due to a schema mismatch in the authentication service. The login service checks the `an_users` table for pilot authentication, but pilot users are actually stored in the `pilot_users` table.

---

## Root Cause

File: `lib/services/pilot-portal-service.ts` (lines 76-97)

After successful Supabase Auth authentication, the `pilotLogin()` function queries the `an_users` table to verify the user's role:

```typescript
// Step 2: Check if user is a pilot or admin
const { data: userData, error: userError } = await supabase
  .from('an_users')  // ❌ WRONG TABLE FOR PILOTS
  .select('id, role, email')
  .eq('id', data.user.id)
  .single()

if (userError || !userData) {
  await supabase.auth.signOut()
  return {
    success: false,
    error: 'User not found in system.',  // ❌ THIS ERROR ALWAYS OCCURS FOR PILOTS
  }
}
```

**Problem**:
- The `an_users` table only stores **admin** and **manager** users
- It has a check constraint: `role IN ('admin', 'manager')` - pilots are NOT allowed
- Pilot users are stored in the **`pilot_users`** table
- Therefore, `pilotLogin()` will ALWAYS fail for legitimate pilot users

---

## Database Schema

### `an_users` Table
- **Purpose**: System administrators and managers
- **Roles Allowed**: `'admin'`, `'manager'` ONLY
- **Check Constraint**: `role::text = ANY (ARRAY['admin', 'manager'])`

### `pilot_users` Table
- **Purpose**: Pilot portal users
- **Columns**: `id`, `email`, `first_name`, `last_name`, `rank`, `employee_id`, `registration_approved`, etc.
- **No** `role` column - pilots don't use the same role system as admins

---

## Evidence

**Test Account**: mrondeau@airniugini.com.pg

```sql
-- ✅ User EXISTS in auth.users (Supabase Auth)
SELECT id, email FROM auth.users
WHERE email = 'mrondeau@airniugini.com.pg';
-- Result: a1418a40-bde1-4482-ae4b-20905ffba49c

-- ✅ User EXISTS in pilot_users (approved pilot)
SELECT id, email, registration_approved FROM pilot_users
WHERE email = 'mrondeau@airniugini.com.pg';
-- Result: approved = true

-- ❌ User DOES NOT EXIST in an_users (system table for admins/managers)
SELECT id, email, role FROM an_users
WHERE id = 'a1418a40-bde1-4482-ae4b-20905ffba49c';
-- Result: 0 rows (user not found)
```

**Login Test Result**: ❌ 401 Unauthorized - "User not found in system."

---

## The Fix

Update `pilotLogin()` function to check the **`pilot_users`** table instead of `an_users`:

```typescript
export async function pilotLogin(
  credentials: PilotLoginInput
): Promise<ServiceResponse<{ user: any; session: any }>> {
  try {
    const supabase = await createClient()

    // Step 1: Authenticate with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) {
      return {
        success: false,
        error: ERROR_MESSAGES.PORTAL.LOGIN_FAILED.message,
      }
    }

    // Step 2: Check if user is an approved pilot
    const { data: pilotUser, error: pilotError } = await supabase
      .from('pilot_users')  // ✅ CORRECT TABLE
      .select('id, email, registration_approved, first_name, last_name, rank')
      .eq('id', data.user.id)
      .single()

    if (pilotError || !pilotUser) {
      // Check if user is an admin/manager in an_users table
      const { data: adminUser, error: adminError } = await supabase
        .from('an_users')
        .select('id, role, email')
        .eq('id', data.user.id)
        .single()

      if (adminError || !adminUser) {
        await supabase.auth.signOut()
        return {
          success: false,
          error: 'User not found in system.',
        }
      }

      // Allow admins to access pilot portal
      if (adminUser.role !== 'admin') {
        await supabase.auth.signOut()
        return {
          success: false,
          error: ERROR_MESSAGES.AUTH.FORBIDDEN.message,
        }
      }
    } else {
      // Verify pilot registration is approved
      if (!pilotUser.registration_approved) {
        await supabase.auth.signOut()
        return {
          success: false,
          error: 'Your registration is pending admin approval.',
        }
      }
    }

    return {
      success: true,
      data: {
        user: data.user,
        session: data.session,
      },
    }
  } catch (error) {
    console.error('Pilot login error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.PORTAL.LOGIN_FAILED.message,
    }
  }
}
```

---

## Testing After Fix

1. Update `lib/services/pilot-portal-service.ts` with the fixed code above
2. Restart the dev server
3. Test login with: `mrondeau@airniugini.com.pg` / `Lemakot@1972`
4. Expected result: ✅ Successful login → redirect to `/portal/dashboard`

---

## Impact Assessment

**Affected Features**:
- ❌ Pilot portal login (US1) - **completely broken**
- ❌ Pilot dashboard access (US1) - **inaccessible**
- ❌ Leave request submission (US2) - **inaccessible**
- ❌ Flight request submission (US3) - **inaccessible**
- ❌ Pilot notifications (US7) - **inaccessible**

**Workaround**: None - this is a blocking bug that prevents all pilot portal functionality.

---

## Related Files

- `lib/services/pilot-portal-service.ts` - Contains the buggy `pilotLogin()` function
- `app/api/portal/login/route.ts` - API route that calls `pilotLogin()`
- `app/portal/(public)/login/page.tsx` - Login page UI

---

## Priority

**🔴 P0 - Critical**: This bug completely prevents pilot users from accessing any portal functionality. Must be fixed before MVP deployment.

---

**Reported By**: Claude Code (Automated Testing)
**Date**: 2025-10-22
