# Testing Enhancement Plan
**Fleet Management V2 - B767 Pilot Management System**

**Date**: October 27, 2025
**Phase**: 3 - Testing Strategy & Coverage Analysis
**Status**: Strategic Recommendations

---

## Executive Summary

Fleet Management V2 has 24 E2E test suites with 460 test cases (6,643 lines of test code). However, comprehensive analysis reveals significant gaps in test coverage, especially for critical business logic and edge cases.

**Current Testing Baseline**:
- E2E Tests: 24 suites, 460 test cases
- Unit Tests: 0 (CRITICAL GAP)
- Integration Tests: 0 (missing)
- Test Coverage: ~35% of critical paths
- Test Reliability: ~75% (flaky tests exist)

**Target After Enhancements**:
- E2E Tests: 30 suites, 600+ test cases
- Unit Tests: 150+ tests for service layer
- Integration Tests: 50+ tests for API routes
- Test Coverage: ~85% of critical paths
- Test Reliability: ~95% (eliminate flaky tests)

---

## 1. Current Test Coverage Analysis

### 1.1 Existing E2E Tests

**Test Suites** (24 files):
```
✅ auth.spec.ts                    - Authentication flows
✅ pilots.spec.ts                  - Pilot management (CRUD)
✅ certifications.spec.ts          - Certification tracking
✅ leave-requests.spec.ts          - Leave request workflows
✅ flight-requests.spec.ts         - Flight request workflows
✅ feedback.spec.ts                - Pilot feedback system
✅ dashboard.spec.ts               - Dashboard metrics display
✅ pilot-portal.spec.ts            - Pilot portal integration
✅ pilot-registration.spec.ts      - Pilot registration approval
✅ leave-approval.spec.ts          - Leave approval workflows
✅ leave-bids.spec.ts              - Annual leave bidding
✅ accessibility.spec.ts           - WCAG compliance checks
✅ pwa.spec.ts                     - PWA functionality
✅ performance.spec.ts             - Performance benchmarks
✅ professional-ui-integration.spec.ts - UI consistency
✅ rate-limiting.spec.ts           - API rate limiting
✅ admin-leave-requests.spec.ts    - Admin leave management
✅ leave-approval-authenticated.spec.ts - Authenticated leave approval
✅ leave-approval-full-test.spec.ts - Full leave approval flow
✅ portal-error-check.spec.ts      - Portal error handling
✅ portal-quick-test.spec.ts       - Quick smoke tests
✅ comprehensive-functionality.spec.ts - Comprehensive integration
✅ comprehensive-manual-test.spec.ts - Manual test scenarios
✅ example.spec.ts                 - Playwright example (can remove)
```

**Test Coverage by Feature** (estimated):
- Authentication: 80% ✅ Well covered
- Pilot Management: 70% ⚠️ Missing edge cases
- Certifications: 60% ⚠️ Missing expiry logic tests
- Leave Requests: 75% ✅ Good coverage
- Leave Eligibility: 40% ❌ CRITICAL GAP
- Flight Requests: 65% ⚠️ Missing RDO/SDO tests
- Dashboard: 50% ❌ Missing metrics validation
- Pilot Portal: 70% ⚠️ Missing error scenarios
- Analytics: 20% ❌ CRITICAL GAP
- Retirement Forecasting: 10% ❌ CRITICAL GAP
- Audit Logs: 30% ❌ Missing comprehensive tests

---

## 2. Critical Test Gaps

### 2.1 Missing Unit Tests (CRITICAL)

**Issue**: ZERO unit tests for service layer (30 services)

**Impact**:
- Business logic not validated in isolation
- Refactoring is risky (no safety net)
- Bugs discovered late (in E2E tests only)
- Slow test feedback (E2E tests are slow)

**Recommendation**: Add unit tests for all services

**Priority Services** (test first):
1. `leave-eligibility-service.ts` ✅ CRITICAL (complex business logic)
2. `dashboard-service.ts` ✅ HIGH (aggregation logic)
3. `certification-service.ts` ✅ HIGH (expiry calculations)
4. `pilot-service.ts` ⚠️ MEDIUM
5. `leave-service.ts` ⚠️ MEDIUM

**Example Unit Test Structure**:

```typescript
// NEW: lib/services/__tests__/leave-eligibility-service.test.ts
import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  checkLeaveEligibility,
  calculateCrewAvailability,
  getConflictingPendingRequests
} from '../leave-eligibility-service'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase
vi.mock('@/lib/supabase/server')

describe('Leave Eligibility Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkLeaveEligibility', () => {
    test('should approve leave request with sufficient crew', async () => {
      // Mock: 15 Captains available, 1 requesting leave
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: 'Captain', seniority_number: 5 },
          error: null
        })
      }

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

      const result = await checkLeaveEligibility({
        pilotId: 'pilot-1',
        pilotRole: 'Captain',
        startDate: '2025-11-01',
        endDate: '2025-11-07',
        requestType: 'ANNUAL'
      })

      expect(result.isEligible).toBe(true)
      expect(result.recommendation).toBe('APPROVE')
      expect(result.conflicts).toHaveLength(0)
    })

    test('should deny leave request with insufficient crew', async () => {
      // Mock: 10 Captains available (at minimum), 1 requesting leave
      // Remaining: 9 Captains (BELOW minimum of 10) → DENY
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnValue({
          data: [
            { id: '1', role: 'Captain' }, // ... 10 captains total
          ],
          error: null
        }),
        eq: vi.fn().mockReturnThis()
      }

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

      const result = await checkLeaveEligibility({
        pilotId: 'pilot-1',
        pilotRole: 'Captain',
        startDate: '2025-11-01',
        endDate: '2025-11-07',
        requestType: 'ANNUAL'
      })

      expect(result.isEligible).toBe(false)
      expect(result.recommendation).toBe('DENY')
      expect(result.conflicts.length).toBeGreaterThan(0)
    })

    test('should handle seniority priority correctly', async () => {
      // Mock: 2 Captains requesting same dates
      // Captain #3 (higher seniority) vs Captain #10 (lower seniority)
      // Expected: #3 gets priority

      const result = await checkLeaveEligibility({
        pilotId: 'pilot-10',
        pilotRole: 'Captain',
        startDate: '2025-11-01',
        endDate: '2025-11-07',
        requestType: 'ANNUAL'
      })

      expect(result.conflictingRequests).toBeDefined()
      expect(result.conflictingRequests![0].isPriority).toBe(true)
      expect(result.seniorityRecommendation).toContain('higher seniority')
    })

    test('should separate Captain and First Officer minimums', async () => {
      // Mock: 15 Captains, 10 First Officers (at minimum)
      // First Officer requesting leave should be DENIED
      // Captain requesting leave should be APPROVED

      const captainResult = await checkLeaveEligibility({
        pilotId: 'captain-1',
        pilotRole: 'Captain',
        startDate: '2025-11-01',
        endDate: '2025-11-07',
        requestType: 'ANNUAL'
      })

      const foResult = await checkLeaveEligibility({
        pilotId: 'fo-1',
        pilotRole: 'First Officer',
        startDate: '2025-11-01',
        endDate: '2025-11-07',
        requestType: 'ANNUAL'
      })

      expect(captainResult.isEligible).toBe(true)
      expect(foResult.isEligible).toBe(false)
    })
  })

  describe('calculateCrewAvailability', () => {
    test('should calculate availability for date range', async () => {
      const availability = await calculateCrewAvailability(
        '2025-11-01',
        '2025-11-07'
      )

      expect(availability).toHaveLength(7) // 7 days
      availability.forEach(day => {
        expect(day).toHaveProperty('date')
        expect(day).toHaveProperty('availableCaptains')
        expect(day).toHaveProperty('availableFirstOfficers')
        expect(day).toHaveProperty('meetsMinimum')
      })
    })
  })

  describe('getConflictingPendingRequests', () => {
    test('should find conflicting requests for same dates', async () => {
      const { conflictingRequests } = await getConflictingPendingRequests({
        pilotId: 'pilot-1',
        pilotRole: 'Captain',
        startDate: '2025-11-01',
        endDate: '2025-11-07',
        requestType: 'ANNUAL'
      })

      expect(Array.isArray(conflictingRequests)).toBe(true)
    })

    test('should sort by seniority (lowest first)', async () => {
      const { conflictingRequests } = await getConflictingPendingRequests({
        pilotId: 'pilot-5',
        pilotRole: 'Captain',
        startDate: '2025-11-01',
        endDate: '2025-11-07',
        requestType: 'ANNUAL'
      })

      if (conflictingRequests.length > 1) {
        for (let i = 0; i < conflictingRequests.length - 1; i++) {
          expect(conflictingRequests[i].seniorityNumber).toBeLessThanOrEqual(
            conflictingRequests[i + 1].seniorityNumber
          )
        }
      }
    })
  })
})
```

**Testing Framework**: Vitest (recommended over Jest for Vite/Next.js compatibility)

```bash
# Install Vitest
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom

# Add test script to package.json
{
  "scripts": {
    "test:unit": "vitest",
    "test:unit:ui": "vitest --ui",
    "test:unit:coverage": "vitest --coverage"
  }
}

# Create vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './lib/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/services/**/*.ts', 'lib/utils/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
})
```

**Impact**:
- Effort: High (40-50 hours for 150 tests)
- Expected Coverage: 85% of service layer
- Risk: Low (improves confidence)

---

### 2.2 Missing Integration Tests

**Issue**: No API route integration tests

**Current**: E2E tests cover API routes indirectly (through UI)
**Problem**: Can't test API routes in isolation, slow feedback

**Recommendation**: Add integration tests for all API routes

**Example**:

```typescript
// NEW: app/api/pilots/__tests__/route.test.ts
import { describe, test, expect } from 'vitest'
import { GET, POST, PUT, DELETE } from '../route'
import { createMocks } from 'node-mocks-http'

describe('Pilots API', () => {
  describe('GET /api/pilots', () => {
    test('should return all pilots', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/pilots'
      })

      const response = await GET(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    })

    test('should require authentication', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/pilots',
        headers: {} // No auth header
      })

      const response = await GET(req as any)
      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/pilots', () => {
    test('should create new pilot', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/pilots',
        body: {
          first_name: 'John',
          last_name: 'Doe',
          employee_id: 'EMP001',
          role: 'Captain',
          email: 'john.doe@example.com',
          date_of_birth: '1980-01-01',
          commencement_date: '2020-01-01'
        }
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('id')
    })

    test('should validate required fields', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/pilots',
        body: {
          first_name: 'John'
          // Missing required fields
        }
      })

      const response = await POST(req as any)
      expect(response.status).toBe(400)
    })
  })
})
```

---

### 2.3 Missing Test Scenarios

**Critical Scenarios Not Tested**:

#### Leave Eligibility Edge Cases
- [ ] Test when ALL Captains request leave (impossible scenario)
- [ ] Test roster period boundaries (RP13 → RP1 rollover)
- [ ] Test leave request spanning multiple roster periods
- [ ] Test seniority tie-breaking (same seniority number)
- [ ] Test leave eligibility with pending vs approved leave

#### Certification Expiry Logic
- [ ] Test expiry calculations with timezone differences
- [ ] Test certifications expiring on weekends
- [ ] Test email notifications for expiring certifications
- [ ] Test bulk certification renewal scenarios
- [ ] Test FAA color coding (red/yellow/green) edge cases

#### Dashboard Metrics
- [ ] Test dashboard with zero data (new system)
- [ ] Test dashboard with large datasets (100+ pilots)
- [ ] Test dashboard cache invalidation
- [ ] Test retirement calculations accuracy
- [ ] Test compliance rate calculations

#### Authentication & Authorization
- [ ] Test session expiry handling
- [ ] Test concurrent login attempts
- [ ] Test password reset flow
- [ ] Test pilot portal vs admin portal isolation
- [ ] Test role-based access control (RBAC)

#### Error Scenarios
- [ ] Test database connection failures
- [ ] Test Supabase timeout scenarios
- [ ] Test malformed request payloads
- [ ] Test SQL injection attempts
- [ ] Test XSS attack vectors

---

## 3. Test Quality Issues

### 3.1 Flaky Tests

**Issue**: Some tests fail intermittently

**Examples**:
```typescript
// FLAKY: leave-requests.spec.ts (line 65)
test('should submit leave request successfully', async ({ page }) => {
  // ...
  await expect(page.getByText(/success|submitted/i)).toBeVisible({ timeout: 10000 })
  // Sometimes times out due to slow API response
})

// FIX: Add proper wait conditions
test('should submit leave request successfully', async ({ page }) => {
  // ...

  // Wait for API call to complete
  await page.waitForResponse(response =>
    response.url().includes('/api/portal/leave-requests') &&
    response.status() === 201
  )

  await expect(page.getByText(/success|submitted/i)).toBeVisible()
})
```

**Common Causes of Flaky Tests**:
1. Race conditions (DOM updates before data loads)
2. Timeouts too short
3. Non-deterministic test data
4. Missing wait conditions
5. Test interdependence

**Recommendation**: Test Stabilization Pass

```typescript
// Best Practices for Stable Tests:

// 1. Use explicit waits instead of arbitrary timeouts
await page.waitForSelector('[data-testid="leave-request"]')
// Instead of: await page.waitForTimeout(1000)

// 2. Wait for network requests
await page.waitForResponse(response =>
  response.url().includes('/api/leave-requests')
)

// 3. Use test data isolation
beforeEach(async () => {
  // Reset database state
  await clearTestData()
  await seedTestData()
})

// 4. Make tests independent
// Each test should work in isolation, regardless of order

// 5. Use deterministic test data
const TEST_PILOT = {
  id: 'test-pilot-123',
  first_name: 'Test',
  last_name: 'Pilot',
  seniority_number: 99 // Fixed seniority for predictable testing
}
```

---

### 3.2 Test Data Management

**Issue**: Tests use production-like data (creates conflicts)

**Recommendation**: Implement test data fixtures

```typescript
// NEW: e2e/fixtures/test-data.ts
export const TEST_PILOTS = {
  CAPTAIN_SENIOR: {
    id: 'test-captain-1',
    first_name: 'Senior',
    last_name: 'Captain',
    employee_id: 'TEST001',
    role: 'Captain',
    seniority_number: 1,
    is_active: true
  },
  CAPTAIN_JUNIOR: {
    id: 'test-captain-2',
    first_name: 'Junior',
    last_name: 'Captain',
    employee_id: 'TEST002',
    role: 'Captain',
    seniority_number: 10,
    is_active: true
  },
  FIRST_OFFICER: {
    id: 'test-fo-1',
    first_name: 'Test',
    last_name: 'FirstOfficer',
    employee_id: 'TEST003',
    role: 'First Officer',
    seniority_number: 5,
    is_active: true
  }
}

export const TEST_LEAVE_REQUESTS = {
  PENDING_ANNUAL: {
    id: 'test-leave-1',
    pilot_id: 'test-captain-1',
    start_date: '2025-12-01',
    end_date: '2025-12-07',
    status: 'PENDING',
    request_type: 'ANNUAL'
  }
}

// Usage in tests:
import { TEST_PILOTS, TEST_LEAVE_REQUESTS } from './fixtures/test-data'

test('should approve leave request', async ({ page }) => {
  // Seed test data
  await seedTestData({
    pilots: [TEST_PILOTS.CAPTAIN_SENIOR],
    leave_requests: [TEST_LEAVE_REQUESTS.PENDING_ANNUAL]
  })

  // Run test
  await page.goto('/dashboard/leave-requests')
  // ...
})
```

---

## 4. Testing Enhancement Roadmap

### Week 1: Foundation
- [ ] Set up Vitest for unit testing
- [ ] Create test data fixtures
- [ ] Write unit tests for leave-eligibility-service.ts (HIGH PRIORITY)
- [ ] Write unit tests for dashboard-service.ts

**Deliverables**:
- 40+ unit tests
- Test coverage: 0% → 40% for critical services

---

### Week 2: Service Layer Coverage
- [ ] Write unit tests for certification-service.ts
- [ ] Write unit tests for pilot-service.ts
- [ ] Write unit tests for leave-service.ts
- [ ] Fix flaky E2E tests

**Deliverables**:
- 70+ unit tests total
- Test coverage: 40% → 70%
- Test reliability: 75% → 90%

---

### Week 3: Integration Tests
- [ ] Write integration tests for API routes
- [ ] Add tests for authentication flows
- [ ] Add tests for error scenarios
- [ ] Implement test data seeding

**Deliverables**:
- 50+ integration tests
- Test coverage: 70% → 85%
- Comprehensive API route coverage

---

### Week 4: Edge Cases & Documentation
- [ ] Add tests for leave eligibility edge cases
- [ ] Add tests for certification expiry logic
- [ ] Add tests for dashboard metrics
- [ ] Document testing guidelines

**Deliverables**:
- 150+ tests total (unit + integration + E2E)
- Test coverage: 85%+
- Testing documentation complete

---

## 5. Continuous Integration

### 5.1 GitHub Actions Workflow

```yaml
# NEW: .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - name: Install dependencies
        run: npm ci

      - name: Run integration tests
        run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm test

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check
```

---

## 6. Test Metrics Dashboard

**Add testing metrics to CI/CD**:

```typescript
// NEW: lib/test/metrics.ts
export interface TestMetrics {
  totalTests: number
  passingTests: number
  failingTests: number
  skippedTests: number
  duration: number
  coverage: {
    statements: number
    branches: number
    functions: number
    lines: number
  }
}

export async function generateTestReport(metrics: TestMetrics): Promise<void> {
  const report = `
# Test Report

**Date**: ${new Date().toISOString()}

## Summary
- Total Tests: ${metrics.totalTests}
- Passing: ${metrics.passingTests} ✅
- Failing: ${metrics.failingTests} ❌
- Skipped: ${metrics.skippedTests} ⏭️
- Duration: ${(metrics.duration / 1000).toFixed(2)}s

## Coverage
- Statements: ${metrics.coverage.statements}%
- Branches: ${metrics.coverage.branches}%
- Functions: ${metrics.coverage.functions}%
- Lines: ${metrics.coverage.lines}%
  `

  await fs.writeFile('test-report.md', report)
}
```

---

## 7. Success Metrics

**Before**:
- Unit Tests: 0
- Integration Tests: 0
- E2E Tests: 24 suites, 460 tests
- Test Coverage: ~35%
- Test Reliability: ~75%

**After** (Target):
- Unit Tests: 150+ tests ✅
- Integration Tests: 50+ tests ✅
- E2E Tests: 30 suites, 600+ tests ✅
- Test Coverage: ~85% ✅
- Test Reliability: ~95% ✅

**ROI**:
- Development time: ~60 hours
- Bug reduction: ~60% (earlier detection)
- Refactoring confidence: High
- Release velocity: Faster (CI/CD automation)

---

**Document Version**: 1.0
**Last Updated**: October 27, 2025
**Next Review**: November 10, 2025
