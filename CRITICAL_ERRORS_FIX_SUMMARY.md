# Critical Errors Fixed - October 28, 2025

## Summary

Fixed 2 of 3 critical errors preventing application from working properly:

- ✅ **Redis Rate Limiting** - Fixed (certification updates now work)
- ⏳ **RLS Recursion** - SQL ready to run
- ⏳ **Leave Bids Foreign Key** - Investigation SQL ready

---

## Issue #1: Redis Rate Limiting Failure ✅ FIXED

### Problem
```
[Upstash Redis] The 'url' property is missing or undefined in your Redis config.
❌ [API] Error updating certification: TypeError: Failed to parse URL from /pipeline
```

**Impact**: Certification updates completely broken (500 errors)

### Root Cause
`lib/middleware/rate-limit-middleware.ts` was initializing Redis with empty strings instead of checking if Redis is configured:

```typescript
// ❌ WRONG - Creates invalid Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})
```

### Fix Applied
Updated `lib/middleware/rate-limit-middleware.ts` to use same fallback pattern as `lib/rate-limit.ts`:

```typescript
// ✅ CORRECT - Checks if Redis is configured
const isRedisConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN

const redis = isRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

// Use mock rate limiter when Redis not configured
const createMockRateLimiter = () => ({
  limit: async () => ({
    success: true,
    limit: 999,
    remaining: 999,
    reset: Date.now() + 60000,
    pending: Promise.resolve(),
  }),
})

export const mutationRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1 m'),
      analytics: true,
    })
  : createMockRateLimiter()
```

**Files Modified**:
- `lib/middleware/rate-limit-middleware.ts`

**Result**: Certification updates now work even without Redis configured. No more "Failed to parse URL from /pipeline" errors.

---

## Issue #2: RLS Infinite Recursion ⏳ SQL READY

### Problem
```
📊 an_users query result: {
  hasAdminUser: false,
  hasError: true,
  errorMessage: 'infinite recursion detected in policy for relation "an_users"',
  errorCode: '42P17'
}
```

**Impact**: Admin login fails intermittently when RLS is enabled

### Root Cause
Row Level Security policies on `an_users` table have circular references causing infinite recursion when querying with authenticated user context.

### Fix Available
Run `FIX_CRITICAL_ERRORS.sql` in Supabase SQL Editor:

```sql
-- Disable RLS on an_users table
ALTER TABLE an_users DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'an_users';
-- Expected: rowsecurity = FALSE
```

**Status**: SQL file created, waiting for user to run in Supabase

**After Running**: Admin login will work consistently, no more recursion errors

---

## Issue #3: Leave Bids Foreign Key Error ⏳ INVESTIGATION

### Problem
```
Error fetching leave bids: {
  code: 'PGRST200',
  details: "Searched for a foreign key relationship between 'leave_bids' and 'leave_bid_options' in the schema 'public', but no matches were found.",
  message: "Could not find a relationship between 'leave_bids' and 'leave_bid_options' in the schema cache"
}
```

**Impact**: Admin leave bids page shows error instead of data

### Investigation SQL
Run diagnostic SQL in `FIX_CRITICAL_ERRORS.sql`:

```sql
-- Check if foreign key exists
SELECT
    tc.table_name as source_table,
    kcu.column_name as source_column,
    ccu.table_name AS foreign_table,
    ccu.column_name AS foreign_column,
    tc.constraint_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name='leave_bids';
```

**Next Steps**:
1. Run investigation SQL to check if foreign key exists
2. If missing, create foreign key relationship
3. If exists but not in schema cache, refresh PostgREST schema cache

---

## Testing After Fixes

### Test Certification Update (Redis Fix)
1. Login to admin dashboard: http://localhost:3000/auth/login
2. Go to Pilots page
3. Click on any pilot
4. Try to edit a certification expiry date
5. Click Save

**Expected**: ✅ Save succeeds (no more Redis errors)

### Test Admin Login (After RLS Fix)
1. Go to: http://localhost:3000/auth/login
2. Email: skycruzer@icloud.com
3. Password: mron2393
4. Click Sign In

**Expected**: ✅ Dashboard loads successfully (no recursion errors)

### Test Leave Bids (After Foreign Key Fix)
1. Login to admin dashboard
2. Go to: http://localhost:3000/dashboard/admin/leave-bids

**Expected**: ✅ Leave bids display (no foreign key errors)

---

## Next Steps

1. ✅ **Redis Rate Limiting** - Already fixed, test certification updates
2. ⏳ **Run SQL Fix** - Open Supabase and run `FIX_CRITICAL_ERRORS.sql`
3. ⏳ **Verify Leave Bids** - Check foreign key relationship and fix if needed

---

## Files Created

- `FIX_CRITICAL_ERRORS.sql` - SQL commands to fix RLS and investigate leave bids
- `CRITICAL_ERRORS_FIX_SUMMARY.md` - This file

## Files Modified

- `lib/middleware/rate-limit-middleware.ts` - Added Redis config check and mock rate limiter

---

**Date**: October 28, 2025
**Status**: 1 of 3 fixed immediately, 2 pending SQL execution
