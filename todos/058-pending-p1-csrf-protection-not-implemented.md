---
status: pending
priority: p1
issue_id: "058"
tags: [code-review, security, critical, csrf]
dependencies: []
discovered_by: security-sentinel
review_date: 2025-10-26
---

# CSRF Protection Not Implemented

## Problem Statement

CSRF (Cross-Site Request Forgery) utilities exist in `lib/csrf.ts` but are **NOT used in any API routes**. All 60+ API endpoints are vulnerable to cross-site request forgery attacks.

## Findings

**Discovered during**: Comprehensive security audit by Security Sentinel agent
**Location**: `lib/csrf.ts` (utilities exist), `/app/api/**/*.ts` (not used)
**Severity**: 🔴 HIGH

### Evidence

**CSRF utilities exist**:
```typescript
// File: lib/csrf.ts
export function generateCsrfToken(): string { /* ... */ }
export function validateCsrfToken(token: string): boolean { /* ... */ }
```

**But NOT used in API routes**:
```bash
$ grep -r "validateCsrfToken" app/api/
# ❌ NO RESULTS - Not used anywhere!
```

### Attack Scenario

**Without CSRF protection**, an attacker can create a malicious website that submits forms on behalf of logged-in users:

```html
<!-- Malicious website: evil.com -->
<form action="https://yourapp.com/api/leave-requests" method="POST">
  <input type="hidden" name="start_date" value="2025-12-25">
  <input type="hidden" name="end_date" value="2026-01-05">
  <input type="hidden" name="request_type" value="ANNUAL">
</form>
<script>document.forms[0].submit()</script>
```

**What happens**:
1. User visits evil.com while logged into your app
2. Browser automatically includes session cookie
3. Form submits to your API endpoint
4. API approves request (user is authenticated!)
5. ❌ Unwanted leave request created without user consent

### Real-World Impact

Vulnerable endpoints include:
- `/api/leave-requests` - Unwanted leave submissions
- `/api/pilots` - Unauthorized pilot creation/modification
- `/api/certifications` - False certification records
- `/api/user/delete-account` - Account deletion without consent
- `/api/renewal-planning/email` - Spam email sending

## Proposed Solutions

### Option 1: Implement CSRF Token Validation (RECOMMENDED)

**Pros**:
- Industry-standard protection
- Utilities already exist (just need to use them)
- Minimal performance impact
- Works with existing session management

**Cons**:
- Requires frontend changes to include tokens
- Requires middleware wrapper implementation

**Effort**: Medium (6 hours)
**Risk**: Low (well-established pattern)

**Implementation**:

**Step 1: Create CSRF Middleware Wrapper**

```typescript
// File: lib/middleware/csrf-middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { validateCsrfToken } from '@/lib/csrf'
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'

export function withCsrfProtection(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Only check CSRF for state-changing methods
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const csrfToken = req.headers.get('x-csrf-token')

      if (!csrfToken) {
        return NextResponse.json(
          formatApiError(ERROR_MESSAGES.AUTH.CSRF_MISSING, 403),
          { status: 403 }
        )
      }

      const isValid = validateCsrfToken(csrfToken)
      if (!isValid) {
        return NextResponse.json(
          formatApiError(ERROR_MESSAGES.AUTH.CSRF_INVALID, 403),
          { status: 403 }
        )
      }
    }

    // CSRF token valid, proceed to handler
    return handler(req)
  }
}
```

**Step 2: Apply to API Routes**

```typescript
// File: app/api/leave-requests/route.ts
import { withCsrfProtection } from '@/lib/middleware/csrf-middleware'
import { createLeaveRequestServer } from '@/lib/services/leave-service'

async function handlePOST(request: NextRequest) {
  const body = await request.json()
  const result = await createLeaveRequestServer(body)
  return NextResponse.json({ success: true, data: result })
}

export const POST = withCsrfProtection(handlePOST)
```

**Step 3: Generate CSRF Token on Page Load**

```typescript
// File: app/dashboard/leave/new/page.tsx
import { generateCsrfToken } from '@/lib/csrf'
import { cookies } from 'next/headers'

export default async function NewLeaveRequestPage() {
  const csrfToken = generateCsrfToken()

  // Store token in HTTP-only cookie
  const cookieStore = await cookies()
  cookieStore.set('csrf-token', csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600, // 1 hour
  })

  return <LeaveRequestForm csrfToken={csrfToken} />
}
```

**Step 4: Include Token in API Requests**

```typescript
// File: components/forms/leave-request-form.tsx
'use client'

interface LeaveRequestFormProps {
  csrfToken: string
}

export function LeaveRequestForm({ csrfToken }: LeaveRequestFormProps) {
  const onSubmit = async (data: LeaveRequestFormData) => {
    const response = await fetch('/api/leave-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken, // ✅ Include token
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) throw new Error('Failed to submit')
  }

  return <form onSubmit={handleSubmit(onSubmit)}>...</form>
}
```

### Option 2: Use SameSite Cookie Attribute Only (NOT RECOMMENDED)

**Pros**:
- No code changes needed (cookies already set with `SameSite=Strict`)
- Modern browser protection

**Cons**:
- Not supported by all browsers (especially older ones)
- Not defense-in-depth
- Doesn't protect against subdomain attacks

**Effort**: Zero (already implemented)
**Risk**: Medium (incomplete protection)

## Recommended Action

**IMPLEMENT OPTION 1** - Proper CSRF token validation.

While SameSite cookies provide some protection, **defense-in-depth requires CSRF tokens**. This is especially critical for aviation safety systems where unauthorized actions could have serious consequences.

## Technical Details

**Affected Files**:
- `lib/middleware/csrf-middleware.ts` (new wrapper)
- `app/api/**/route.ts` (60+ API routes need wrapper)
- Server components that render forms (pass CSRF token)
- Form components (include token in requests)

**Related Components**:
- All state-changing API endpoints (POST/PUT/DELETE/PATCH)
- All form submission workflows
- Session management

**Database Changes**: No

**Breaking Changes**: Yes - Requires frontend changes to include CSRF tokens

## Migration Strategy

**Phase 1**: Implement CSRF middleware (non-breaking)
**Phase 2**: Add CSRF tokens to high-risk endpoints first:
- Leave request submissions
- Pilot management
- Account deletion
- Certification management

**Phase 3**: Expand to all endpoints
**Phase 4**: Make CSRF enforcement mandatory (remove fallback)

## Testing Strategy

### 1. CSRF Attack Simulation

```typescript
// File: e2e/csrf-protection.spec.ts
test('should block CSRF attack without token', async ({ page }) => {
  // Login as legitimate user
  await page.goto('/login')
  await page.fill('[name="email"]', 'admin@test.com')
  await page.fill('[name="password"]', 'password')
  await page.click('[type="submit"]')

  // Attempt API request WITHOUT CSRF token (simulates CSRF attack)
  const response = await page.evaluate(async () => {
    return fetch('/api/leave-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start_date: '2025-11-01',
        end_date: '2025-11-05',
      }),
      // ❌ NO CSRF TOKEN
    })
  })

  expect(response.status).toBe(403)
  expect(await response.json()).toMatchObject({
    success: false,
    error: expect.stringContaining('CSRF')
  })
})

test('should allow request with valid CSRF token', async ({ page }) => {
  await page.goto('/dashboard/leave/new')

  // Extract CSRF token from page
  const csrfToken = await page.getAttribute('[name="csrf-token"]', 'value')

  // Submit form with token
  const response = await page.evaluate(async (token) => {
    return fetch('/api/leave-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': token, // ✅ Valid token
      },
      body: JSON.stringify({
        start_date: '2025-11-01',
        end_date: '2025-11-05',
      }),
    })
  }, csrfToken)

  expect(response.status).toBe(200)
})
```

### 2. Token Expiration Test

```typescript
test('should reject expired CSRF token', async ({ page }) => {
  // Get token
  await page.goto('/dashboard/leave/new')
  const csrfToken = await page.getAttribute('[name="csrf-token"]', 'value')

  // Wait for token to expire (mock time or wait)
  await page.waitForTimeout(3600 * 1000 + 1000) // 1 hour + 1 second

  // Attempt request with expired token
  const response = await page.evaluate(async (token) => {
    return fetch('/api/leave-requests', {
      method: 'POST',
      headers: { 'X-CSRF-Token': token },
      body: JSON.stringify({ /* data */ }),
    })
  }, csrfToken)

  expect(response.status).toBe(403)
})
```

## Acceptance Criteria

- [ ] CSRF middleware wrapper implemented
- [ ] All POST/PUT/DELETE/PATCH endpoints protected
- [ ] CSRF tokens generated on page load for forms
- [ ] Form components include CSRF token in requests
- [ ] E2E test confirms CSRF attack blocked without token
- [ ] E2E test confirms legitimate request succeeds with token
- [ ] Token expiration handled gracefully
- [ ] Error messages clear for users ("Session expired, please refresh")
- [ ] Documentation updated with CSRF implementation details
- [ ] Security audit confirms CSRF protection effective

## Work Log

### 2025-10-26 - Code Review Discovery
**By**: Security Sentinel (Claude)
**Actions**:
- Discovered CSRF utilities exist but are unused
- Verified 0 API routes implement CSRF validation
- Analyzed attack surface (60+ vulnerable endpoints)
- Designed CSRF middleware wrapper solution

**Learnings**:
- Having utilities != implementing protection
- CSRF is critical for state-changing operations
- Defense-in-depth requires multiple layers (SameSite + CSRF tokens)

## Related Issues

- Finding #4: Incomplete rate limiting (todos/059-pending-p1-incomplete-rate-limiting.md)
- Finding #6: SQL injection risk in search queries (todos/061-pending-p1-sql-injection-search.md)

## Notes

**Priority Justification**: This is P1 HIGH because:
1. All state-changing endpoints are vulnerable
2. Aviation safety systems require strong security
3. Utilities already exist (just need to use them)
4. Industry-standard protection missing

**OWASP Top 10**: This addresses **A01:2021 - Broken Access Control** and **A05:2021 - Security Misconfiguration**.

**Deployment Strategy**:
1. Deploy CSRF middleware (non-enforcing mode first)
2. Add logging to track requests without tokens
3. Update frontend to include tokens
4. Enable enforcement once adoption is >95%
5. Monitor error rates
