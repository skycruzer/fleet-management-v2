# Security Hardening - Quick Start Continuation Guide

**Date**: November 4, 2025
**Session**: Security Phase 2 Implementation
**Current Status**: Phase 2A ✅ COMPLETE | Phase 2B ✅ COMPLETE

---

## What's Been Completed ✅

### Phase 2A: Critical Security Fixes (100% COMPLETE)
1. ✅ Hardcoded credentials removed
2. ✅ CSRF protection framework implemented
3. ✅ Password hash logging removed
4. ✅ Session fixation vulnerability fixed
5. ✅ PII logging removed

### Phase 2B: CSRF Protection Rollout (100% COMPLETE) ✅
- ✅ `/api/user/delete-account` - SECURED (DELETE)
- ✅ `/api/admin/leave-bids/[id]` - SECURED (PATCH)
- ✅ `/api/disciplinary/[id]` - SECURED (PATCH + DELETE)
- ✅ `/api/renewal-planning/[planId]/confirm` - SECURED (PUT)
- ✅ `/api/renewal-planning/[planId]/reschedule` - SECURED (PUT)
- ✅ `/api/tasks/[id]` - SECURED (PATCH + DELETE)
- ✅ `/api/feedback/[id]` - SECURED (PUT)
- ✅ `/api/pilot/flight-requests/[id]` - SECURED (DELETE)
- ✅ `/api/pilot/leave/[id]` - SECURED (DELETE)
- ✅ `/api/notifications` - SECURED (PATCH)
- ✅ `/api/settings/[id]` - SECURED (PUT)
- ✅ `/api/cache/invalidate` - SECURED (POST + DELETE)

---

## Phase 2B: COMPLETE ✅

All mutation endpoints have been secured with CSRF protection and rate limiting!

**Total Secured**: 12 endpoints (14 methods total)

**Completion**: 100%

---

## Next Phase: Phase 2C (Authorization & Security Hardening)

With CSRF protection complete, continue with Phase 2C:

### Phase 2C Tasks

1. **Authorization Middleware**
   - Implement resource ownership verification
   - Add role-based access control (RBAC)
   - Ensure users can only modify their own resources

2. **Account Lockout Protection**
   - Track failed login attempts
   - Lock accounts after 5 failed attempts
   - Email notifications for lockouts
   - Admin unlock capability

3. **Password Complexity Requirements**
   - Enforce minimum 12 characters
   - Require mixed case + numbers + symbols
   - Prevent common/leaked passwords
   - Password strength meter

4. **Error Message Sanitization**
   - Remove stack traces from production errors
   - Sanitize database error messages
   - Generic error responses for security-sensitive operations

---

## CSRF Protection Template

Use this template for all remaining endpoints:

```typescript
/**
 * [Endpoint Description]
 *
 * @version 2.0.0 - SECURITY: Added CSRF protection and rate limiting
 * @updated 2025-11-04 - Critical security hardening
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { authRateLimit } from '@/lib/rate-limit'

export async function POST/PUT/PATCH/DELETE(request: NextRequest) {
  try {
    // SECURITY: Validate CSRF token
    const csrfError = await validateCsrf(request)
    if (csrfError) return csrfError

    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // SECURITY: Rate limiting
    const { success: rateLimitSuccess } = await authRateLimit.limit(user.id)
    if (!rateLimitSuccess) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // ... rest of endpoint logic
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## Step-by-Step Process

### For Each Endpoint:

1. **Open the route file**:
   ```bash
   code app/api/[path]/route.ts
   ```

2. **Add imports** (at top of file):
   ```typescript
   import { NextRequest, NextResponse } from 'next/server'
   import { validateCsrf } from '@/lib/middleware/csrf-middleware'
   import { authRateLimit } from '@/lib/rate-limit'
   ```

3. **Update function signature** (if needed):
   ```typescript
   // Before
   export async function POST(request: Request) {

   // After
   export async function POST(request: NextRequest) {
   ```

4. **Add CSRF validation** (first thing in try block):
   ```typescript
   // SECURITY: Validate CSRF token
   const csrfError = await validateCsrf(request)
   if (csrfError) return csrfError
   ```

5. **Add rate limiting** (after authentication check):
   ```typescript
   // SECURITY: Rate limiting
   const { success: rateLimitSuccess } = await authRateLimit.limit(user.id)
   if (!rateLimitSuccess) {
     return NextResponse.json(
       { success: false, error: 'Too many requests. Please try again later.' },
       { status: 429 }
     )
   }
   ```

6. **Update version comment**:
   ```typescript
   /**
    * @version 2.0.0 - SECURITY: Added CSRF protection and rate limiting
    * @updated 2025-11-04 - Critical security hardening
    */
   ```

7. **Test the endpoint**:
   - Get CSRF token: `curl http://localhost:3000/api/csrf`
   - Test without token (should fail)
   - Test with token (should succeed)

---

## Quick Commands

### Find Unprotected Endpoints
```bash
cd /Users/skycruzer/Desktop/fleet-management-v2/app/api
find . -name "route.ts" -type f -exec grep -l "DELETE\|PUT\|PATCH" {} \; | xargs grep -L "validateCsrf"
```

### Test CSRF Protection
```bash
# Get CSRF token
curl http://localhost:3000/api/csrf -c cookies.txt

# Extract token from response
TOKEN=$(curl -s http://localhost:3000/api/csrf | jq -r '.csrfToken')

# Test endpoint WITH token (should succeed)
curl -X DELETE http://localhost:3000/api/endpoint \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $TOKEN" \
  -b cookies.txt

# Test endpoint WITHOUT token (should fail with 403)
curl -X DELETE http://localhost:3000/api/endpoint \
  -H "Content-Type: application/json"
```

### Verify No PII in Logs
```bash
# Should return zero
grep -r "console.log.*email" lib/services/
grep -r "console.log.*@" lib/services/
grep -r "console.log.*password" lib/services/
```

---

## Files to Reference

### Security Implementation Examples
- ✅ `app/api/user/delete-account/route.ts` - Perfect example
- ✅ `app/api/admin/leave-bids/[id]/route.ts` - PATCH example
- ✅ `app/api/disciplinary/[id]/route.ts` - Multiple methods (PATCH + DELETE)
- ✅ `app/api/renewal-planning/clear/route.ts` - Original CSRF implementation

### Documentation
- `SECURITY-PHASE-2-PROGRESS-REPORT.md` - Complete progress report
- `SECURITY-FIX-SESSION-FIXATION-COMPLETE.md` - Session management details
- `SECURITY-FIX-PII-LOGGING-COMPLETE.md` - PII logging fixes
- `SECURITY-INCIDENT-CREDENTIALS-EXPOSURE.md` - Credential leak incident

### Core Security Files
- `lib/middleware/csrf-middleware.ts` - CSRF validation logic
- `lib/services/session-service.ts` - Session management
- `lib/hooks/use-csrf-token.ts` - Client-side CSRF hook

---

## Testing Checklist (Before Continuing)

Verify all Phase 2A fixes are working:

```bash
# 1. Session Management
npm test -- auth.spec.ts

# 2. CSRF Protection
curl http://localhost:3000/api/csrf
# Should return: { success: true, csrfToken: "..." }

# 3. No Hardcoded Credentials
grep -r "mron2393" .
# Should return: zero results

# 4. No Password Hashes in Logs
grep -r "Password hash" lib/services/
# Should return: zero results (only comments)

# 5. No PII in Logs
grep -r "console.log.*email" lib/services/pilot-portal-service.ts
# Should return: zero results
```

---

## Common Issues & Solutions

### Issue: `validateCsrf is not a function`
**Solution**: Check import statement
```typescript
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
```

### Issue: `authRateLimit is not defined`
**Solution**: Check import statement
```typescript
import { authRateLimit } from '@/lib/rate-limit'
```

### Issue: TypeScript error on NextRequest
**Solution**: Update import
```typescript
import { NextRequest, NextResponse } from 'next/server'
```

### Issue: CSRF validation failing in tests
**Solution**: Use the CSRF hook in client code
```typescript
import { useCsrfToken } from '@/lib/hooks/use-csrf-token'

const { csrfToken, getCsrfHeaders } = useCsrfToken()

fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...getCsrfHeaders(),
  },
  body: JSON.stringify(data),
})
```

---

## Progress Tracking ✅ COMPLETE

### Priority 1 (Most Dangerous) - 100% COMPLETE ✅
- [x] `/api/user/delete-account` (DELETE) ✅
- [x] `/api/admin/leave-bids/[id]` (PATCH) ✅
- [x] `/api/disciplinary/[id]` (PATCH, DELETE) ✅
- [x] `/api/renewal-planning/[planId]/confirm` (PUT) ✅
- [x] `/api/renewal-planning/[planId]/reschedule` (PUT) ✅

### Priority 2 (High Risk) - 100% COMPLETE ✅
- [x] `/api/tasks/[id]` (PATCH, DELETE) ✅
- [x] `/api/feedback/[id]` (PUT) ✅
- [x] `/api/pilot/flight-requests/[id]` (DELETE) ✅
- [x] `/api/pilot/leave/[id]` (DELETE) ✅
- [x] `/api/notifications` (PATCH) ✅

### Priority 3 (Medium Risk) - 100% COMPLETE ✅
- [x] `/api/settings/[id]` (PUT) ✅
- [x] `/api/cache/invalidate` (POST, DELETE) ✅
- [x] `/api/audit` (GET only - no CSRF needed) ✅
- [x] `/api/audit/export` (GET only - no CSRF needed) ✅

**Progress**: 14/14 (100%) ✅ | **Status**: COMPLETE | **Time Spent**: ~2 hours

---

## Deployment Checklist

Before deploying these changes:

- [ ] All TypeScript errors resolved
- [ ] Build succeeds: `npm run build`
- [ ] Tests pass: `npm test`
- [ ] No console.log with PII: `grep -r "console.log.*email" lib/`
- [ ] Database migration deployed (session table)
- [ ] CSRF endpoints tested manually
- [ ] Session management tested
- [ ] Production credentials rotated
- [ ] Documentation updated

---

## User Actions Required

⚠️ **CRITICAL - Before Going Live**:

1. **Reset Exposed Passwords**:
   - Admin: `skycruzer@icloud.com` (password was `mron2393`)
   - Pilot: `mrondeau@airniugini.com.pg` (password was `Lemakot@1972`)

2. **Rotate API Key**:
   - Resend API: `re_9MGCNg2C_Fn3MHmNE6sGosnxKdoGRQ37f`

3. **Audit Access Logs**:
   - Check Supabase Auth logs for unauthorized access
   - Review Better Stack logs for suspicious activity

4. **Create Test Accounts**:
   - Create `test-admin@example.com` for E2E tests
   - Create `test-pilot@example.com` for E2E tests
   - Add credentials to `.env.test.local`

---

## Contact & Support

**Developer**: Maurice Rondeau
**Email**: skycruzer@icloud.com
**Session Start**: November 4, 2025, 10:00 AM
**Last Updated**: November 4, 2025, 2:00 PM

**Key Documents**:
- Full Progress Report: `SECURITY-PHASE-2-PROGRESS-REPORT.md`
- Session Fixation Fix: `SECURITY-FIX-SESSION-FIXATION-COMPLETE.md`
- PII Logging Fix: `SECURITY-FIX-PII-LOGGING-COMPLETE.md`
- Credential Incident: `SECURITY-INCIDENT-CREDENTIALS-EXPOSURE.md`

---

**Ready to continue!** Pick up from Priority 1, endpoint #4:
`/api/renewal-planning/[planId]/confirm`
