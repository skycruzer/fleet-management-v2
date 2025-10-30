# Sprint 1 Days 3-4: Security Hardening - Implementation Plan

**Date**: October 27, 2025
**Duration**: 12 hours estimated
**Status**: 🔄 **READY TO BEGIN**
**Prerequisites**: Days 1-2 (Database Integrity) ✅ Complete

---

## 🎯 Objectives

Enhance application security to production-grade standards by implementing:
1. **CSRF Protection** - Prevent cross-site request forgery attacks
2. **Rate Limiting** - Prevent abuse and DoS attacks
3. **Sensitive Data Logging** - Remove PII and secrets from logs
4. **RLS Policy Audit** - Ensure proper data access controls

**Target Health Score**: 75/100 → 82/100 (+4 points from Days 1-2)

---

## 📊 Current Security Status

### Existing Security Measures ✅
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Supabase Auth for admin authentication
- ✅ Custom authentication for pilot portal
- ✅ Protected routes via middleware
- ✅ Environment variable protection
- ✅ Next.js security headers configured

### Security Gaps Identified ⚠️
- ❌ **CSRF tokens not implemented** - Forms vulnerable to CSRF attacks
- ❌ **No rate limiting** - API endpoints open to abuse
- ⚠️ **Sensitive data in logs** - Passwords, tokens may be logged
- ⚠️ **RLS policies untested** - 137 policies need audit

---

## 🔒 Task 1: CSRF Protection (6 hours)

### Overview
Implement CSRF tokens on all mutation endpoints to prevent cross-site request forgery attacks.

### Scope
- **60+ mutation endpoints** requiring protection
- **All forms** need CSRF token fields
- **Middleware** for token validation
- **Token generation** and verification logic

### Implementation Steps

#### Step 1: Install CSRF Library (15 minutes)
```bash
npm install csrf
npm install --save-dev @types/csrf
```

#### Step 2: Create CSRF Utility (30 minutes)
**File**: `lib/security/csrf.ts`

Key functions:
- `generateCsrfToken()` - Generate new token
- `verifyCsrfToken(token, secret)` - Verify token
- `getCsrfSecret()` - Get secret from session/cookies
- `setCsrfSecret(secret)` - Store secret in session

#### Step 3: Create CSRF Middleware (1 hour)
**File**: `lib/middleware/csrf-middleware.ts`

Features:
- Automatic token validation on POST/PUT/DELETE/PATCH
- Skip validation for GET/HEAD/OPTIONS
- Return 403 for invalid tokens
- Support for API routes and Server Actions

#### Step 4: Add CSRF Token Provider (1 hour)
**File**: `lib/providers/csrf-provider.tsx`

Features:
- Generate token on mount
- Store in React Context
- Provide `useCsrfToken()` hook
- Auto-refresh tokens

#### Step 5: Update All Forms (2 hours)
Forms requiring CSRF protection:
- Pilot CRUD forms (create, edit, delete)
- Certification forms
- Leave request forms
- Flight request forms
- Disciplinary action forms
- Admin settings forms
- User management forms
- Pilot portal forms (login, registration, leave, flights)

**Pattern**:
```tsx
const { csrfToken } = useCsrfToken()

<form onSubmit={handleSubmit}>
  <input type="hidden" name="csrf_token" value={csrfToken} />
  {/* other fields */}
</form>
```

#### Step 6: Update All API Routes (1.5 hours)
**Pattern**:
```typescript
import { verifyCsrfToken } from '@/lib/security/csrf'

export async function POST(request: Request) {
  const body = await request.json()

  // Verify CSRF token
  const isValid = await verifyCsrfToken(body.csrf_token)
  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    )
  }

  // Process request
}
```

### Testing Plan
- [ ] Test form submission with valid token → Success
- [ ] Test form submission without token → 403 Forbidden
- [ ] Test form submission with expired token → 403 Forbidden
- [ ] Test form submission with invalid token → 403 Forbidden
- [ ] Test GET requests still work (no CSRF check)

### Success Criteria
- [x] All POST/PUT/DELETE/PATCH endpoints validate CSRF
- [x] All forms include CSRF token field
- [x] Token validation middleware active
- [x] Zero false positives in testing

---

## ⏱️ Task 2: Rate Limiting (2 hours)

### Overview
Implement rate limiting on all public API endpoints and Server Actions to prevent abuse.

### Scope
- **Public API endpoints** (authentication, portal)
- **Server Actions** (data mutations)
- **Form submissions** (prevent spam)

### Implementation Steps

#### Step 1: Set Up Upstash Redis (30 minutes)

**Option A: Use Existing Upstash**
```env
UPSTASH_REDIS_REST_URL=your-url
UPSTASH_REDIS_REST_TOKEN=your-token
```

**Option B: Use In-Memory Rate Limiter** (No Redis required)
- Use `@upstash/ratelimit` with in-memory adapter
- Suitable for development and single-server deployments

#### Step 2: Create Rate Limit Utility (30 minutes)
**File**: `lib/security/rate-limit.ts`

Features:
- Configurable limits per endpoint
- Different limits for authenticated vs anonymous users
- IP-based limiting
- User-based limiting (for authenticated requests)

**Example Configuration**:
```typescript
const rateLimits = {
  'api/auth/login': { requests: 5, window: '1m' },
  'api/portal/login': { requests: 5, window: '1m' },
  'api/portal/register': { requests: 3, window: '1h' },
  'api/pilots': { requests: 100, window: '1m' },
  'api/leave-requests': { requests: 50, window: '1m' },
}
```

#### Step 3: Create Rate Limit Middleware (30 minutes)
**File**: `lib/middleware/rate-limit-middleware.ts`

Features:
- Apply to specific routes
- Return 429 Too Many Requests
- Include Retry-After header
- Log rate limit violations

#### Step 4: Apply to Critical Endpoints (30 minutes)

**High-Priority Endpoints**:
- `/api/auth/login` - 5 requests per minute
- `/api/portal/login` - 5 requests per minute
- `/api/portal/register` - 3 requests per hour
- `/api/pilots` - 100 requests per minute
- `/api/leave-requests` - 50 requests per minute

**Pattern**:
```typescript
import { rateLimit } from '@/lib/security/rate-limit'

export async function POST(request: Request) {
  // Get identifier (IP or user ID)
  const identifier = request.headers.get('x-forwarded-for') || 'anonymous'

  // Check rate limit
  const { success, remaining } = await rateLimit(identifier, 'api/auth/login')

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': '60' }
      }
    )
  }

  // Process request
}
```

### Testing Plan
- [ ] Test endpoint within limit → Success
- [ ] Test endpoint exceeding limit → 429 Too Many Requests
- [ ] Test different endpoints have separate limits
- [ ] Test authenticated vs anonymous limits differ
- [ ] Test rate limit resets after window

### Success Criteria
- [x] All public endpoints have rate limiting
- [x] Authentication endpoints have strict limits (5/min)
- [x] Form submission endpoints protected
- [x] Proper 429 responses with Retry-After

---

## 🔇 Task 3: Remove Sensitive Data from Logging (1 hour)

### Overview
Audit all logging statements and remove sensitive data (passwords, tokens, PII).

### Scope
- **Server-side logging** (Better Stack/Logtail)
- **Client-side logging** (console.log, console.error)
- **Error tracking** (error boundaries)
- **Audit logs** (database logging)

### Implementation Steps

#### Step 1: Audit Current Logging (15 minutes)
Search for logging of sensitive data:
```bash
# Search for potential sensitive logging
grep -r "password" lib/ app/ components/ | grep -i "log\|console"
grep -r "token" lib/ app/ components/ | grep -i "log\|console"
grep -r "email" lib/ app/ components/ | grep -i "log\|console"
grep -r "api_key" lib/ app/ components/ | grep -i "log\|console"
```

#### Step 2: Create Sanitization Utility (15 minutes)
**File**: `lib/utils/log-sanitizer.ts`

Features:
- Redact passwords (`*****`)
- Redact tokens (`***...***` with first/last 4 chars)
- Redact email addresses (`***@***.***`)
- Redact API keys
- Redact credit card numbers
- Preserve structure for debugging

```typescript
export function sanitizeForLogging(data: any) {
  const sensitive = [
    'password',
    'token',
    'api_key',
    'apiKey',
    'access_token',
    'refresh_token',
    'session_token',
  ]

  // Recursively sanitize object
  // Return sanitized copy
}
```

#### Step 3: Update Logging Service (15 minutes)
**File**: `lib/services/logging-service.ts`

Add automatic sanitization:
```typescript
import { sanitizeForLogging } from '@/lib/utils/log-sanitizer'
import { log } from '@logtail/node'

export function logInfo(message: string, data?: any) {
  const sanitized = sanitizeForLogging(data)
  log.info(message, sanitized)
}

export function logError(message: string, error: any, context?: any) {
  const sanitizedContext = sanitizeForLogging(context)
  log.error(message, { error: error.message, context: sanitizedContext })
}
```

#### Step 4: Update All Logging Calls (15 minutes)
Replace direct logging with sanitized logging service:

**Before**:
```typescript
console.log('User login:', { email, password }) // BAD!
```

**After**:
```typescript
import { logInfo } from '@/lib/services/logging-service'
logInfo('User login attempt', { email }) // Password not logged
```

### Testing Plan
- [ ] Search codebase for console.log of sensitive data
- [ ] Verify sanitization utility redacts all sensitive fields
- [ ] Test error logging doesn't expose secrets
- [ ] Check Better Stack logs for sensitive data

### Success Criteria
- [x] No passwords in logs
- [x] No full tokens in logs (only truncated)
- [x] No API keys in logs
- [x] Sanitization utility deployed
- [x] All logging goes through sanitized service

---

## 🔐 Task 4: RLS Policy Audit (3 hours)

### Overview
Audit all 137 Row Level Security policies to ensure proper data access controls.

### Scope
- **137 RLS policies** across 27 tables
- **Read policies** (SELECT)
- **Write policies** (INSERT, UPDATE, DELETE)
- **Admin vs User vs Pilot** access levels

### Implementation Steps

#### Step 1: Document Current RLS Policies (1 hour)
**File**: `docs/RLS-POLICY-AUDIT.md`

Query to extract policies:
```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Document each table:
- Policy count
- Policy types (SELECT, INSERT, UPDATE, DELETE)
- Roles covered (authenticated, anon, admin, etc.)
- Gaps identified

#### Step 2: Identify Policy Gaps (30 minutes)

**Check for**:
- Tables without RLS enabled
- Tables with only read policies (no write protection)
- Overly permissive policies (allow all)
- Missing admin policies
- Missing user policies
- Pilot portal access issues

**Common Gaps**:
```sql
-- ❌ BAD: Allows anyone to read
CREATE POLICY "Allow public read" ON pilots
FOR SELECT TO public
USING (true);

-- ✅ GOOD: Requires authentication
CREATE POLICY "Allow authenticated read" ON pilots
FOR SELECT TO authenticated
USING (true);
```

#### Step 3: Fix Critical Policy Gaps (1 hour)

**Priority 1: Overly Permissive Policies**
- Remove policies that allow `TO public` on sensitive tables
- Add authentication requirements
- Implement role-based access

**Priority 2: Missing Write Protection**
- Add INSERT policies
- Add UPDATE policies
- Add DELETE policies
- Ensure only authorized users can mutate

**Priority 3: Pilot Portal Access**
- Verify pilot users can read their own data
- Prevent pilots from reading other pilots' data
- Allow pilots to submit requests (leave, flights)
- Prevent pilots from modifying certifications

#### Step 4: Create RLS Test Suite (30 minutes)
**File**: `tests/rls-policies.test.ts`

Test scenarios:
- Anonymous user cannot read pilots
- Authenticated admin can read all pilots
- Authenticated pilot can read own data only
- Pilot cannot update certification data
- Admin can update all data
- Pilot can submit leave request
- Pilot cannot approve own leave request

### Testing Plan
- [ ] Run RLS test suite
- [ ] Test with admin user → Full access
- [ ] Test with pilot user → Limited access
- [ ] Test with anonymous → No access (where applicable)
- [ ] Verify audit logs capture policy violations

### Success Criteria
- [x] All 137 policies documented
- [x] Zero overly permissive policies
- [x] All tables have complete policies (SELECT, INSERT, UPDATE, DELETE)
- [x] Pilot portal access working correctly
- [x] Admin access working correctly
- [x] RLS test suite passing

---

## 📊 Success Metrics

### Security Improvements

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| **CSRF Protection** | 0% | 100% | 100% |
| **Rate Limited Endpoints** | 0 | 60+ | 60+ |
| **Sensitive Data in Logs** | Yes | No | No |
| **RLS Policies Audited** | 0% | 100% | 100% |
| **Security Test Coverage** | 0% | 80% | 80% |

### Health Score Impact

| Component | Before | After | Change |
|-----------|--------|-------|--------|
| **Security** | 65/100 | 85/100 | +20 |
| **Data Integrity** | 78/100 | 78/100 | 0 |
| **Overall Health** | 78/100 | 82/100 | +4 |

---

## 🧪 Testing Strategy

### Unit Tests
- [ ] CSRF token generation and verification
- [ ] Rate limiting logic
- [ ] Log sanitization utility
- [ ] RLS policy helper functions

### Integration Tests
- [ ] Form submission with CSRF token
- [ ] API endpoint rate limiting
- [ ] Authenticated vs anonymous access
- [ ] Pilot portal data access

### Security Tests
- [ ] CSRF attack prevention
- [ ] Rate limit bypass attempts
- [ ] RLS policy bypass attempts
- [ ] SQL injection attempts (existing protection)

---

## 📋 Implementation Checklist

### Pre-Implementation
- [x] Sprint 1 Days 1-2 complete (Database Integrity)
- [x] Initial monitoring results positive
- [x] Development environment ready
- [x] Backup created

### Task 1: CSRF Protection (6 hours)
- [ ] Install CSRF library
- [ ] Create CSRF utility functions
- [ ] Create CSRF middleware
- [ ] Add CSRF token provider
- [ ] Update all forms with tokens
- [ ] Update all API routes with validation
- [ ] Test CSRF protection
- [ ] Document CSRF implementation

### Task 2: Rate Limiting (2 hours)
- [ ] Set up Upstash Redis (or in-memory)
- [ ] Create rate limit utility
- [ ] Create rate limit middleware
- [ ] Apply to authentication endpoints
- [ ] Apply to API endpoints
- [ ] Apply to form submissions
- [ ] Test rate limiting
- [ ] Document rate limit configuration

### Task 3: Sensitive Logging (1 hour)
- [ ] Audit current logging
- [ ] Create log sanitization utility
- [ ] Update logging service
- [ ] Replace all logging calls
- [ ] Test sanitization
- [ ] Verify no sensitive data in logs

### Task 4: RLS Policy Audit (3 hours)
- [ ] Extract and document all policies
- [ ] Identify policy gaps
- [ ] Fix critical gaps
- [ ] Create RLS test suite
- [ ] Run tests and verify
- [ ] Document RLS architecture

### Post-Implementation
- [ ] Run full test suite
- [ ] Security audit
- [ ] Performance testing
- [ ] Documentation review
- [ ] Deploy to production

---

## 🚨 Risk Assessment

### High Risk
- **CSRF Implementation**: Breaking existing forms during token addition
  - **Mitigation**: Implement incrementally, test thoroughly

- **Rate Limiting**: Blocking legitimate users
  - **Mitigation**: Start with generous limits, monitor, adjust

### Medium Risk
- **RLS Policy Changes**: Breaking existing access patterns
  - **Mitigation**: Document current behavior, test extensively

- **Logging Changes**: Missing critical debug information
  - **Mitigation**: Keep structure, only redact values

### Low Risk
- **Log Sanitization**: Performance impact
  - **Mitigation**: Minimal overhead, runs async

---

## 📚 Documentation Deliverables

### Technical Documentation
- [ ] `CSRF-IMPLEMENTATION.md` - CSRF token architecture
- [ ] `RATE-LIMITING-GUIDE.md` - Rate limit configuration
- [ ] `LOGGING-STANDARDS.md` - Logging best practices
- [ ] `RLS-POLICY-AUDIT.md` - Complete RLS documentation

### Developer Guide
- [ ] How to add CSRF to new forms
- [ ] How to configure rate limits
- [ ] How to log safely
- [ ] How to write RLS policies

---

## 🎯 Next Steps After Completion

### Sprint 2: Performance Optimization (35 hours)
- Query optimization
- Caching strategies
- Database indexing review
- Bundle size optimization
- Image optimization

### Sprint 3: Testing Infrastructure (45 hours)
- Unit test coverage (80% target)
- Integration test suite
- E2E test expansion
- Visual regression testing
- Load testing

---

## 🔗 Related Documentation

- `SPRINT-1-DAYS-1-2-COMPLETE.md` - Previous sprint summary
- `PRODUCTION-MIGRATION-COMPLETE.md` - Database changes
- `CLAUDE.md` - Project architecture and standards
- `README.md` - Project overview

---

**Document Version**: 1.0
**Created**: October 27, 2025
**Status**: 🔄 Ready to Begin
**Estimated Completion**: October 28, 2025 (12 hours)
