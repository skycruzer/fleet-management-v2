# API Route CSRF Protection Implementation Guide

**Developer**: Maurice Rondeau
**Date**: October 27, 2025
**Sprint**: Sprint 1 Days 3-4 (Security Hardening)

---

## Overview

This guide provides the standard pattern for adding CSRF protection to all API routes that handle state-changing operations (POST, PUT, PATCH, DELETE).

## Implementation Pattern

### 1. Import CSRF Middleware

Add the import at the top of your route file:

```typescript
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
```

### 2. Add CSRF Validation

Add CSRF validation as the FIRST step in your handler (before authentication):

```typescript
export async function POST(request: NextRequest) {
  try {
    // CSRF Protection - MUST BE FIRST
    const csrfError = await validateCsrf(request)
    if (csrfError) {
      console.error('❌ [API] CSRF validation failed')
      return csrfError
    }

    // Continue with authentication and business logic
    const supabase = await createClient()
    // ... rest of handler
  } catch (error) {
    // error handling
  }
}
```

### 3. Update Function Signature

Change the request parameter from `_request` to `request` if it was unused:

```typescript
// Before
export async function POST(_request: NextRequest) {

// After
export async function POST(request: NextRequest) {
```

### 4. Add Developer Attribution

Update the file header comment:

```typescript
/**
 * [Route Name] API Route
 * [Description]
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: [Methods] require CSRF token validation
 *
 * @version X.X.X
 * @updated 2025-10-27 - Added CSRF protection
 */
```

---

## Complete Example

See `/app/api/pilots/[id]/route.ts` for a complete reference implementation showing:
- ✅ CSRF validation on PUT method
- ✅ CSRF validation on DELETE method
- ✅ Proper error handling
- ✅ GET method (no CSRF needed)

**Before**:
```typescript
export async function PUT(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify authentication
    const supabase = await createClient()
    // ...
  }
}
```

**After**:
```typescript
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // CSRF Protection
    const csrfError = await validateCsrf(request)
    if (csrfError) {
      return csrfError
    }

    // Verify authentication
    const supabase = await createClient()
    // ...
  }
}
```

---

## Methods Requiring CSRF Protection

✅ **Protect These**:
- POST - Creating resources
- PUT - Updating resources
- PATCH - Partial updates
- DELETE - Deleting resources

❌ **Do NOT Protect These**:
- GET - Reading data (read-only, no state change)
- HEAD - Metadata only
- OPTIONS - CORS preflight

---

## API Routes Status

### Total Routes: 68 files

### ✅ Protected (21/68 - 31% Complete):

#### Pilots API Routes (2 files) ✅
1. `/app/api/pilots/route.ts` - POST
2. `/app/api/pilots/[id]/route.ts` - PUT, DELETE

#### Certifications API Routes (2 files) ✅
3. `/app/api/certifications/route.ts` - POST
4. `/app/api/certifications/[id]/route.ts` - PUT, DELETE

#### Leave Requests API Routes (2 files) ✅
5. `/app/api/leave-requests/route.ts` - POST
6. `/app/api/leave-requests/[id]/review/route.ts` - PUT

#### Flight Requests API Routes (2 files) ✅
7. `/app/api/dashboard/flight-requests/[id]/route.ts` - PATCH
8. `/app/api/portal/flight-requests/route.ts` - POST, DELETE

#### Portal API Routes (9 files) ✅
9. `/app/api/portal/leave-bids/route.ts` - POST
10. `/app/api/portal/leave-requests/route.ts` - POST, DELETE
11. `/app/api/portal/feedback/route.ts` - POST
12. `/app/api/portal/register/route.ts` - POST
13. `/app/api/portal/logout/route.ts` - POST
14. `/app/api/portal/forgot-password/route.ts` - POST
15. `/app/api/portal/reset-password/route.ts` - POST
16. `/app/api/portal/registration-approval/route.ts` - POST

#### Admin/Tasks API Routes (2 files) ✅
17. `/app/api/tasks/route.ts` - POST
18. `/app/api/admin/leave-bids/review/route.ts` - POST

### ⏳ Remaining Routes (47/68):

#### Settings Routes
- [ ] `/app/api/settings/route.ts` - May have mutations
- [ ] `/app/api/settings/[id]/route.ts` - May have mutations

#### Auth Routes
- [ ] `/app/api/auth/logout/route.ts`
- [ ] `/app/api/auth/signout/route.ts`

...and ~45 more routes (many are GET-only and don't require CSRF protection)

---

## Testing CSRF Protection

### 1. Valid Request (Should Succeed)
```typescript
import { fetchWithCsrf } from '@/lib/providers/csrf-provider'

const response = await fetchWithCsrf('/api/pilots/123', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(pilotData)
})
```

### 2. Missing CSRF Token (Should Fail with 403)
```typescript
// This should be blocked
const response = await fetch('/api/pilots/123', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(pilotData)
  // Missing X-CSRF-Token header
})
// Expected: 403 Forbidden with error message
```

### 3. Invalid CSRF Token (Should Fail with 403)
```typescript
const response = await fetch('/api/pilots/123', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': 'invalid-token-12345'
  },
  body: JSON.stringify(pilotData)
})
// Expected: 403 Forbidden with error message
```

---

## Next Steps

1. **Phase 1 (Immediate)**: Protect high-traffic mutation endpoints
   - Pilots CRUD
   - Certifications CRUD
   - Leave requests CRUD
   - Flight requests CRUD

2. **Phase 2 (Short-term)**: Protect portal endpoints
   - All `/app/api/portal/*` routes

3. **Phase 3 (Comprehensive)**: Protect all remaining endpoints
   - Settings, tasks, analytics, etc.

4. **Phase 4 (Validation)**: Test all protected endpoints
   - Write E2E tests for CSRF validation
   - Verify error responses
   - Test with valid/invalid tokens

---

## Common Issues & Solutions

### Issue: "CSRF token not found" in forms
**Solution**: Ensure form components use `useCsrfToken()` hook and pass token in `X-CSRF-Token` header

### Issue: Request body consumed twice
**Solution**: Use header-based CSRF validation (current implementation) instead of body-based

### Issue: GET requests failing
**Solution**: CSRF validation only runs on POST/PUT/PATCH/DELETE - verify handler method

### Issue: Token expired during session
**Solution**: CSRF provider auto-refreshes every 20 minutes (already implemented)

---

## Security Notes

1. **CSRF tokens are NOT a replacement for authentication** - always verify user auth first
2. **CSRF tokens protect against cross-site attacks** - they don't protect against XSS
3. **Tokens are stored in cookies** - ensure SameSite=lax is set (already configured)
4. **Token rotation** - happens automatically every 20 minutes
5. **Production requirement** - HTTPS is required for secure cookies

---

**Implementation Status**: 1.5% complete (1/68 routes)
**Estimated Time Remaining**: ~4-5 hours for all routes
**Priority**: High - Critical security vulnerability until complete
