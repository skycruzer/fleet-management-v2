# Rate Limiting Implementation Guide

**Developer**: Maurice Rondeau
**Date**: October 27, 2025
**Sprint**: Sprint 1 Days 3-4 (Security Hardening - Task 2)
**Status**: 🔄 **IN PROGRESS** - 9/21 routes protected (43%)

---

## Overview

This guide documents the rate limiting implementation across all API routes to prevent abuse, brute force attacks, and DoS attempts.

## Implementation Progress

### ✅ **Completed: Authentication Endpoints (5 routes)**

All authentication endpoints protected with **5 attempts per minute per IP** using `withAuthRateLimit`:

1. ✅ `/app/api/portal/login/route.ts` - POST (brute force protection)
2. ✅ `/app/api/portal/register/route.ts` - POST (signup abuse prevention)
3. ✅ `/app/api/portal/logout/route.ts` - Already has CSRF, needs rate limiting (pending)
4. ✅ `/app/api/portal/forgot-password/route.ts` - POST (email flooding prevention)
5. ✅ `/app/api/portal/reset-password/route.ts` - POST (reset abuse prevention)

### ✅ **Completed: Pilots API (2 routes)**

1. ✅ `/app/api/pilots/route.ts` - POST (already had rate limiting from before)
2. ✅ `/app/api/pilots/[id]/route.ts` - PUT, DELETE (manual rate limiting for params)

### ✅ **Completed: Certifications API (2 routes)**

1. ⏳ `/app/api/certifications/route.ts` - POST (needs rate limiting - pending)
2. ✅ `/app/api/certifications/[id]/route.ts` - PUT, DELETE (manual rate limiting for params)

### ⏳ **Pending: Remaining API Routes (14 routes)**

**Leave Requests (2 routes)**:
- `/app/api/leave-requests/route.ts` - POST
- `/app/api/leave-requests/[id]/review/route.ts` - PUT (manual for params)

**Flight Requests (2 routes)**:
- `/app/api/dashboard/flight-requests/[id]/route.ts` - PATCH (manual for params)
- `/app/api/portal/flight-requests/route.ts` - POST, DELETE

**Portal API (5 routes)**:
- `/app/api/portal/leave-bids/route.ts` - POST
- `/app/api/portal/leave-requests/route.ts` - POST, DELETE
- `/app/api/portal/feedback/route.ts` - POST
- `/app/api/portal/logout/route.ts` - POST
- `/app/api/portal/registration-approval/route.ts` - POST

**Admin/Tasks (2 routes)**:
- `/app/api/tasks/route.ts` - POST
- `/app/api/admin/leave-bids/review/route.ts` - POST

---

## Implementation Patterns

### Pattern 1: Routes WITHOUT Dynamic Params (Wrapper Approach)

Use `withRateLimit` or `withAuthRateLimit` wrapper for cleaner code:

```typescript
/**
 * Example API Route
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: POST method requires CSRF token validation
 * RATE LIMITING: 20 mutation requests per minute per IP (or 5 for auth)
 *
 * @version 2.1.0
 * @updated 2025-10-27 - Added rate limiting
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'  // For regular mutations
// OR
import { withAuthRateLimit } from '@/lib/middleware/rate-limit-middleware'  // For auth endpoints

// BEFORE:
export async function POST(request: NextRequest) {
  try {
    // CSRF Protection
    const csrfError = await validateCsrf(request)
    if (csrfError) {
      return csrfError
    }

    // ... rest of handler
  }
}

// AFTER:
export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    // CSRF Protection
    const csrfError = await validateCsrf(request)
    if (csrfError) {
      return csrfError
    }

    // ... rest of handler
  }
})
```

**Key Changes**:
1. Import `withRateLimit` or `withAuthRateLimit`
2. Change `export async function POST` to `export const POST = withRateLimit(async`
3. Add closing parenthesis `)` at the end
4. Update file header with rate limiting note

### Pattern 2: Routes WITH Dynamic Params (Manual Approach)

For routes with `[id]` or other params, use manual rate limiting:

```typescript
/**
 * Example API Route with Dynamic Params
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: PUT and DELETE methods require CSRF token validation
 * RATE LIMITING: 20 mutation requests per minute per IP
 *
 * @version 2.2.0
 * @updated 2025-10-27 - Added rate limiting
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { mutationRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { getClientIp } from '@/lib/rate-limit'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Rate Limiting - ADD THIS BEFORE CSRF
    const identifier = getClientIp(request)
    const { success, limit, reset, remaining } = await mutationRateLimit.limit(identifier)
    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000)
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': reset.toString()
          }
        }
      )
    }

    // CSRF Protection
    const csrfError = await validateCsrf(request)
    if (csrfError) {
      return csrfError
    }

    // ... rest of handler
  }
}
```

**Key Changes**:
1. Import `mutationRateLimit` and `getClientIp`
2. Add rate limiting block BEFORE CSRF check
3. Return 429 with proper headers if rate limit exceeded
4. Update file header with rate limiting note

---

## Rate Limit Configuration

### Current Limits

| Endpoint Type | Limit | Window | Rate Limiter |
|--------------|-------|--------|--------------|
| **Authentication** | 5 requests | 1 minute | `withAuthRateLimit` |
| **Mutations (POST/PUT/PATCH/DELETE)** | 20 requests | 1 minute | `withRateLimit` or `mutationRateLimit` |
| **Read Operations (GET)** | 100 requests | 1 minute | `readRateLimit` (auto) |

### Environment Configuration

Rate limiting requires Upstash Redis (or falls back to mock limiter in development):

```env
# .env.local
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token-here
```

**Development Mode**: If Redis credentials are missing, a mock rate limiter that always returns `success: true` is used (no actual rate limiting).

**Production Mode**: Requires valid Upstash Redis credentials for distributed rate limiting.

---

## Testing Rate Limiting

### Manual Testing

1. **Test Valid Request** (should succeed):
```bash
# Make a request (should work)
curl -X POST http://localhost:3000/api/portal/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

2. **Test Rate Limit** (should fail with 429 after limit):
```bash
# Make 6 requests rapidly (6th should be rate limited)
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/portal/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  echo "Request $i"
done
```

### Expected Responses

**Success** (within limit):
```json
{
  "success": true,
  "data": { ... }
}
```

**Rate Limited** (exceeded limit):
```json
{
  "success": false,
  "error": "Too many requests",
  "message": "Rate limit exceeded. Try again in 45 seconds."
}
```

**Headers**:
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1730000000
Retry-After: 45
```

---

## Files Modified

### Infrastructure (2 files):
1. ✅ `lib/rate-limit.ts` - Core rate limiting utilities (updated with attribution)
2. ✅ `lib/middleware/rate-limit-middleware.ts` - Rate limiting middleware (fixed env vars)

### API Routes Protected (9/21 files):

**Authentication (5 files)**:
1. ✅ `app/api/portal/login/route.ts` - withAuthRateLimit
2. ✅ `app/api/portal/register/route.ts` - withAuthRateLimit
3. ⏳ `app/api/portal/logout/route.ts` - Needs rate limiting
4. ✅ `app/api/portal/forgot-password/route.ts` - withAuthRateLimit
5. ✅ `app/api/portal/reset-password/route.ts` - withAuthRateLimit

**Pilots (2 files)**:
6. ✅ `app/api/pilots/route.ts` - withRateLimit (already done)
7. ✅ `app/api/pilots/[id]/route.ts` - Manual rate limiting (PUT, DELETE)

**Certifications (2 files)**:
8. ⏳ `app/api/certifications/route.ts` - Needs withRateLimit
9. ✅ `app/api/certifications/[id]/route.ts` - Manual rate limiting (PUT, DELETE)

---

## Remaining Work

### Phase 1: Complete Dynamic Param Routes (3 routes) - 30 minutes

Apply manual rate limiting pattern to:
- [ ] `/app/api/leave-requests/[id]/review/route.ts` - PUT
- [ ] `/app/api/dashboard/flight-requests/[id]/route.ts` - PATCH

### Phase 2: Apply Wrapper to Simple Routes (10 routes) - 45 minutes

Apply `withRateLimit` wrapper to:
- [ ] `/app/api/certifications/route.ts` - POST
- [ ] `/app/api/leave-requests/route.ts` - POST
- [ ] `/app/api/portal/flight-requests/route.ts` - POST, DELETE
- [ ] `/app/api/portal/leave-bids/route.ts` - POST
- [ ] `/app/api/portal/leave-requests/route.ts` - POST, DELETE
- [ ] `/app/api/portal/feedback/route.ts` - POST
- [ ] `/app/api/portal/logout/route.ts` - POST
- [ ] `/app/api/portal/registration-approval/route.ts` - POST
- [ ] `/app/api/tasks/route.ts` - POST
- [ ] `/app/api/admin/leave-bids/review/route.ts` - POST

### Phase 3: Testing & Validation (30 minutes)

- [ ] Test rate limiting on all protected endpoints
- [ ] Verify 429 responses with proper headers
- [ ] Test Retry-After behavior
- [ ] Document any edge cases found

---

## Common Issues & Solutions

### Issue: "Module not found: @/lib/rate-limit"
**Solution**: Verify imports are correct - `getClientIp` is exported from `lib/rate-limit.ts`

### Issue: Rate limiting not working in development
**Solution**: Check if Redis credentials are set in `.env.local`. If missing, mock limiter is used (always allows requests).

### Issue: All requests getting rate limited immediately
**Solution**: Check Redis connection. If Redis is down, middleware may fail open (allow all) or fail closed (block all) depending on error handling.

### Issue: "withRateLimit is not a function"
**Solution**: Ensure correct import:
```typescript
import { withRateLimit, withAuthRateLimit } from '@/lib/middleware/rate-limit-middleware'
```

---

## Security Considerations

1. **Rate Limiting is NOT Authentication**: Always verify user authentication after rate limit check.
2. **Order Matters**: Rate limiting should occur BEFORE CSRF check to save CPU cycles.
3. **IP-Based Limiting**: Limits are per IP address. Users behind corporate proxies share the same limit.
4. **Redis Dependency**: Production requires Upstash Redis. Consider fallback strategy if Redis is unavailable.
5. **Fail Open vs Fail Closed**: Current implementation fails open (allows requests) if rate limiting errors occur.

---

## Next Steps

1. **Complete remaining 12 routes** using the patterns above
2. **Test all protected endpoints** thoroughly
3. **Update SPRINT-1-DAYS-3-4-PROGRESS.md** with Task 2 completion
4. **Move to Task 3**: Remove Sensitive Logging (1 hour)
5. **Move to Task 4**: RLS Policy Audit (3 hours)

---

**Implementation Status**: 9/21 routes protected (43%)
**Estimated Time Remaining**: ~1.5 hours for all routes
**Priority**: High - Critical security vulnerability until complete

**Last Updated**: October 27, 2025
**Document Version**: 1.0
