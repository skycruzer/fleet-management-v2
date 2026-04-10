# Fleet Management V2 - Action Items

**Generated**: October 23, 2025
**Based On**: Start-to-Finish Review (YOLO Mode)
**Priority**: Critical → High → Medium → Low

---

## 🔴 CRITICAL - BLOCKING DEPLOYMENT (4 hours)

### Security Issue #1: Exposed VERCEL_OIDC_TOKEN

**Estimated Time**: 30 minutes
**Priority**: P0 (Immediate)
**Assignee**: DevOps/Security Lead

**Steps**:

- [ ] Access Vercel dashboard → Settings → Tokens
- [ ] Revoke all exposed VERCEL_OIDC_TOKEN values
- [ ] Generate new tokens if needed
- [ ] Add `.env.production` to `.gitignore`
- [ ] Remove `.env 2.production` and `.env 3.production` files
- [ ] Remove all .env files from git history:
  ```bash
  git filter-branch --force --index-filter \
    "git rm --cached --ignore-unmatch .env*.production" \
    --prune-empty --tag-name-filter cat -- --all
  ```
- [ ] Force push to remote (coordinate with team)
- [ ] Configure Vercel environment variables in dashboard only

**Verification**:

- [ ] No .env.production files in repository
- [ ] .env.production in .gitignore
- [ ] Old tokens revoked in Vercel dashboard
- [ ] New tokens configured in Vercel dashboard only

---

### Security Issue #2: Missing Rate Limiting

**Estimated Time**: 2 hours
**Priority**: P0 (Immediate)
**Assignee**: Backend Developer

**Steps**:

- [ ] Create rate limit middleware: `lib/middleware/rate-limit-middleware.ts`
- [ ] Configure Upstash Redis rate limiter (already in package.json)
- [ ] Apply rate limiting to ALL mutation endpoints:
  - [ ] `/app/api/pilots/route.ts` (POST)
  - [ ] `/app/api/certifications/route.ts` (POST)
  - [ ] `/app/api/leave-requests/route.ts` (POST)
  - [ ] `/app/api/users/route.ts` (POST/PUT/DELETE)
  - [ ] `/app/api/settings/[id]/route.ts` (PUT/DELETE)
  - [ ] `/app/api/tasks/route.ts` (POST)
  - [ ] `/app/api/disciplinary/route.ts` (POST)
  - [ ] `/app/api/flight-requests/route.ts` (POST)
- [ ] Set rate limits:
  - Reads: 100 requests/minute
  - Mutations: 20 requests/minute
  - Auth: 5 attempts/minute

**Example Implementation**:

```typescript
// lib/middleware/rate-limit-middleware.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

export const mutationRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
})

// Usage in API routes:
export async function POST(request: NextRequest) {
  const identifier = request.ip ?? 'anonymous'
  const { success } = await mutationRateLimit.limit(identifier)

  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  // Proceed with request
}
```

**Verification**:

- [ ] Rate limiting applied to all mutation endpoints
- [ ] Test with curl/Postman (should get 429 after limit)
- [ ] Monitor Upstash Redis dashboard for rate limit hits

---

### Security Issue #3: XSS Vulnerability (dangerouslySetInnerHTML)

**Estimated Time**: 1.5 hours
**Priority**: P0 (Immediate)
**Assignee**: Frontend Developer

**Steps**:

- [ ] Audit all `dangerouslySetInnerHTML` usage:
  ```bash
  grep -r "dangerouslySetInnerHTML" lib/ components/ app/
  ```
- [ ] For each instance, ensure DOMPurify sanitization:

  ```typescript
  import DOMPurify from 'isomorphic-dompurify'

  const sanitized = DOMPurify.sanitize(userInput)
  <div dangerouslySetInnerHTML={{ __html: sanitized }} />
  ```

- [ ] Files to check:
  - [ ] `lib/utils.ts`
  - [ ] `lib/error-logger.ts`
  - [ ] `lib/examples/error-message-examples.tsx`
- [ ] Add unit tests for XSS prevention
- [ ] Document sanitization patterns in CLAUDE.md

**Verification**:

- [ ] All dangerouslySetInnerHTML uses DOMPurify
- [ ] Unit tests prevent XSS injection
- [ ] No user input rendered without sanitization

---

## 🟡 HIGH PRIORITY - Sprint 1 (40 hours)

### Code Quality #1: Replace `any` Types (12 hours)

**Priority**: P1
**Assignee**: TypeScript Lead

**Files** (63 instances across 37 files):

- [ ] `app/dashboard/admin/settings/settings-client.tsx` (22 instances)
- [ ] `app/api/pilots/[id]/route.ts` (3 instances)
- [ ] `app/api/tasks/route.ts` (2 instances)
- [ ] 34 other files (1-2 instances each)

**Strategy**:

- Replace `any` with `unknown` + type guards
- Use proper Supabase types from `@/types/supabase`
- Enable ESLint rule: `@typescript-eslint/no-explicit-any: error`

---

### Code Quality #2: Remove console.log Statements (8 hours)

**Priority**: P1
**Assignee**: Backend Developer

**Steps**:

- [ ] Find all console.log statements:
  ```bash
  grep -r "console.log" app/ lib/ components/ | wc -l
  ```
- [ ] Replace with proper error logging:

  ```typescript
  import { logError } from '@/lib/error-logger'

  // Instead of: console.log(error)
  logError('Context', error)
  ```

- [ ] Remove debug console.logs
- [ ] Keep only production-appropriate logging

**Files**: 106 statements across 27 files

---

### Testing #1: Add Unit Tests for Service Layer (16 hours)

**Priority**: P1
**Assignee**: QA Engineer + Backend Developer

**Steps**:

- [ ] Set up Vitest or Jest
- [ ] Add unit tests for top 10 services:
  - [ ] `pilot-service.ts`
  - [ ] `certification-service.ts`
  - [ ] `leave-service.ts`
  - [ ] `leave-eligibility-service.ts`
  - [ ] `dashboard-service.ts`
  - [ ] `analytics-service.ts`
  - [ ] `audit-service.ts`
  - [ ] `user-service.ts`
  - [ ] `task-service.ts`
  - [ ] `cache-service.ts`
- [ ] Target 70% code coverage
- [ ] Mock Supabase calls with test fixtures

---

### Security #1: Add RBAC to API Routes (4 hours)

**Priority**: P1
**Assignee**: Backend Developer

**Steps**:

- [ ] Create RBAC middleware: `lib/middleware/rbac-middleware.ts`
- [ ] Define role permissions:
  ```typescript
  const permissions = {
    admin: ['pilots:create', 'pilots:update', 'pilots:delete', ...],
    manager: ['pilots:read', 'leave:approve', ...],
    pilot: ['portal:read', 'leave:create', ...]
  }
  ```
- [ ] Apply to all API routes that modify data
- [ ] Check user role from database before allowing mutations

---

## 🟢 MEDIUM PRIORITY - Sprint 2 (16 hours)

### Performance #1: Expand Caching (3 hours)

**Priority**: P2
**Assignee**: Backend Developer

**Steps**:

- [ ] Add caching to `certification-service.ts`:
  ```typescript
  export async function getCertificationsByPilot(pilotId: string) {
    return getOrSetCache(
      `certs:pilot:${pilotId}`,
      async () => {
        // existing logic
      },
      5 * 60 * 1000
    )
  }
  ```
- [ ] Add caching to `leave-service.ts`
- [ ] Add caching to `analytics-service.ts`
- [ ] Monitor cache hit rates

**Expected Impact**: 50-70% faster repeat page loads

---

### Performance #2: Optimize Bundle Size (15 minutes)

**Priority**: P2
**Assignee**: Frontend Developer

**Steps**:

- [ ] Update `next.config.js`:
  ```javascript
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-popover',
    ],
  }
  ```
- [ ] Run production build and verify bundle size reduction
- [ ] Test all components still work correctly

**Expected Impact**: 15-25KB smaller bundles

---

### Database #1: Query Optimization (8 hours)

**Priority**: P2
**Assignee**: Backend Developer

**Steps**:

- [ ] Replace `select('*')` with specific columns in:
  - [ ] `pilot-service.ts` (4 instances)
  - [ ] `audit-service.ts` (5 instances)
  - [ ] `task-service.ts` (6 instances)
  - [ ] `disciplinary-service.ts` (3 instances)
- [ ] Test all queries return expected data
- [ ] Measure performance improvement

**Expected Impact**: 20-30% less data transfer

---

### Testing #2: Fix Mobile Navigation Test (15 minutes)

**Priority**: P2
**Assignee**: QA Engineer

**Steps**:

- [ ] Open `e2e/mobile-navigation.spec.ts`
- [ ] Move `test.use({ ...devices['iPhone 12'] })` to top-level
- [ ] Run test to verify fix
- [ ] Update other mobile tests if needed

---

### Code Quality #3: Fix React Hook Dependencies (2 hours)

**Priority**: P2
**Assignee**: Frontend Developer

**Files**:

- [ ] `app/dashboard/pilots/[id]/edit/page.tsx` (line 68)
- [ ] `app/dashboard/pilots/[id]/page.tsx` (line 66)
- [ ] Other components with ESLint warnings

---

### Documentation #1: Update README (1 hour)

**Priority**: P2
**Assignee**: Tech Lead

**Steps**:

- [ ] Add security best practices section
- [ ] Document rate limiting configuration
- [ ] Update deployment checklist
- [ ] Add troubleshooting for common issues

---

## ⚪ LOW PRIORITY - Technical Debt (8 hours)

### Cleanup #1: Remove Duplicate .env Files (5 minutes)

**Priority**: P3

- [ ] Delete `.env 2.production`
- [ ] Delete `.env 3.production`
- [ ] Verify single `.env.local` for development

---

### Cleanup #2: Resolve TODO/FIXME Comments (4 hours)

**Priority**: P3

- [ ] Find all TODOs:
  ```bash
  grep -r "TODO\|FIXME" app/ lib/ components/
  ```
- [ ] Create GitHub issues for each TODO
- [ ] Remove or address 29 TODO comments

---

### Testing #3: Expand Storybook Coverage (4 hours)

**Priority**: P3

**Steps**:

- [ ] Add stories for remaining 19/34 components
- [ ] Document edge cases and error states
- [ ] Add accessibility tests to stories

---

## 📊 Quick Wins (30 minutes total)

### Quick Win #1: Enable TanStack Query Devtools (5 min)

```typescript
// app/layout.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<ReactQueryDevtools initialIsOpen={false} />
```

---

### Quick Win #2: Add Database Indexes (10 min)

```sql
CREATE INDEX IF NOT EXISTS idx_pilots_seniority ON pilots(seniority_number);
CREATE INDEX IF NOT EXISTS idx_pilot_checks_expiry ON pilot_checks(expiry_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
```

---

### Quick Win #3: HTTP Caching Headers (15 min)

```typescript
// For rarely-changing API responses
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'public, max-age=3600, s-maxage=3600',
  },
})
```

---

## 📅 Sprint Planning

### Sprint 0 (Pre-Production) - 4 hours

**Goal**: Fix critical security issues

- Security Issue #1: Exposed tokens (30 min)
- Security Issue #2: Rate limiting (2 hours)
- Security Issue #3: XSS prevention (1.5 hours)
- Security audit and testing

**Exit Criteria**: Zero critical security issues

---

### Sprint 1 (Post-Production) - 40 hours

**Goal**: Code quality and testing

- Replace `any` types (12 hours)
- Remove console.log (8 hours)
- Add unit tests (16 hours)
- Add RBAC (4 hours)

**Exit Criteria**:

- 70% unit test coverage
- Zero `any` types in critical paths
- RBAC enforced on all mutations

---

### Sprint 2 (Optimization) - 16 hours

**Goal**: Performance and polish

- Expand caching (3 hours)
- Optimize bundle (15 min)
- Query optimization (8 hours)
- Fix React hooks (2 hours)
- Fix mobile test (15 min)
- Update docs (1 hour)

**Exit Criteria**:

- 50%+ faster page loads
- 15KB+ smaller bundles
- All Playwright tests passing

---

### Sprint 3 (Technical Debt) - 8 hours

**Goal**: Cleanup and documentation

- Resolve TODOs (4 hours)
- Expand Storybook (4 hours)
- Clean up duplicate files

---

## 🎯 Success Metrics

### Pre-Production Gate

- [ ] Zero critical security issues
- [ ] Security audit passed
- [ ] All E2E tests passing
- [ ] Load testing completed

### Post-Sprint 1

- [ ] 70% unit test coverage
- [ ] Zero `any` types in services
- [ ] RBAC enforced
- [ ] Zero console.log in production code

### Post-Sprint 2

- [ ] P95 response time < 500ms
- [ ] Cache hit rate > 60%
- [ ] Bundle size reduced by 15KB+
- [ ] All Playwright tests green

---

## 📞 Assignment Summary

| Role                   | Tasks                                       | Hours |
| ---------------------- | ------------------------------------------- | ----- |
| **DevOps/Security**    | Revoke tokens, rate limiting setup          | 2.5   |
| **Backend Developer**  | Rate limiting, RBAC, caching, queries       | 25    |
| **Frontend Developer** | XSS fixes, `any` types, React hooks, bundle | 15.25 |
| **QA Engineer**        | Unit tests, fix mobile test                 | 16.25 |
| **Tech Lead**          | Documentation, code review                  | 1     |

**Total Effort**: 60 hours across team

---

## 🚀 Next Steps

1. **Assign tasks** to team members
2. **Create GitHub issues** for each action item
3. **Schedule Sprint 0** (security fixes) immediately
4. **Deploy to staging** after Sprint 0
5. **Production deployment** after security audit
6. **Start Sprint 1** day after production deployment

---

**Based On**: docs/START-TO-FINISH-REVIEW-2025-10-23.md
**Generated**: October 23, 2025
**Status**: Ready for sprint planning
