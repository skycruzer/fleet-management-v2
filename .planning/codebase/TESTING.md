# Testing Patterns

**Analysis Date:** 2026-03-14

## Test Framework

**Test Runners:**

- **E2E Tests:** Playwright 1.58.0 (primary testing framework)
  - Config: `playwright.config.ts`
  - Browsers: Chromium only (Firefox/WebKit disabled for speed)
  - Workers: 1 (sequential to avoid database overload)

- **Unit Tests:** Vitest 2.1.9 (secondary; minimal unit test coverage)
  - Config: `vitest.config.mts`
  - Environment: jsdom
  - Minimal adoption (only `tests/unit/` directory with 2 test files)

**Assertion Libraries:**

- Playwright: Native assertions (`expect()`)
- Vitest: Native assertions (`expect()`) with Testing Library

**Run Commands:**

```bash
npm test                  # Run all E2E tests (auto-starts dev server on :3005)
npm run test:ui          # Playwright UI mode (interactive)
npm run test:headed      # Run with browser visible
npm run test:debug       # Debug mode
npx playwright test e2e/auth.spec.ts        # Single test file
npx playwright test --grep "leave request"  # Pattern match

npm run test:unit        # Run unit tests (Vitest)
npm run test:unit:watch  # Watch mode
npm run test:unit:coverage  # Coverage report
```

## Test File Organization

**Location:**

- **E2E Tests:** `e2e/**/*.spec.ts` (20+ test files)
- **Unit Tests:** `tests/unit/**/*.test.ts` or `tests/unit/**/*.test.tsx` (minimal)

**Naming:**

- E2E: `{feature}.spec.ts` (e.g., `auth.spec.ts`, `certifications.spec.ts`, `admin-leave-requests.spec.ts`)
- Unit: `{name}.test.ts` or `{name}.test.tsx` (e.g., `utils.test.ts`, `cert-expiry-card.test.tsx`)

**Structure:**

```
e2e/
├── helpers/
│   ├── test-utils.ts       # Shared test utilities, login helpers, TEST_CONFIG
│   └── auth-helpers.ts     # Authentication-specific helpers
├── auth.spec.ts
├── certifications.spec.ts
├── admin-leave-requests.spec.ts
├── dashboard.spec.ts
└── ... (20+ more)

tests/unit/
├── setup.ts                # Vitest setup (@testing-library/jest-dom)
├── lib/
│   └── utils.test.ts
└── components/
    └── cert-expiry-card.test.tsx
```

## Test Structure

**E2E Test Suite Organization:**

```typescript
import { test, expect } from '@playwright/test'
import { TEST_CONFIG, loginAsAdmin, logout } from './helpers/test-utils'

/**
 * Authentication Flow E2E Tests
 *
 * Tests authentication workflows including:
 * - Login flow
 * - Logout flow
 * - Session persistence
 */

test.describe('Authentication Flow', () => {
  const LOGIN_URL = '/auth/login'
  const DASHBOARD_URL = '/dashboard'

  test.beforeEach(async ({ page }) => {
    // Clear cookies and storage before each test
    await page.context().clearCookies()
  })

  test('should display login page with all required elements', async ({ page }) => {
    await page.goto(LOGIN_URL)

    // Check for login form elements
    await expect(page.getByRole('heading', { name: /administration/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible()
  })

  test('should show validation errors for empty form submission', async ({ page }) => {
    await page.goto(LOGIN_URL)

    // Try to submit empty form
    await page.getByRole('button', { name: /sign in|login/i }).click()

    // HTML5 required validation prevents submission
    // Verify form didn't navigate away — still on login page
    await expect(page).toHaveURL(new RegExp(LOGIN_URL))
    const emailInput = page.getByLabel(/email/i)
    await expect(emailInput).toHaveJSProperty('validity.valueMissing', true)
  })

  test('should successfully login with valid credentials', async ({ page }) => {
    await page.goto(LOGIN_URL)

    // Fill in valid credentials from TEST_CONFIG
    await page.getByLabel(/email/i).fill(TEST_CONFIG.admin.email)
    await page.getByLabel('Password', { exact: true }).fill(TEST_CONFIG.admin.password)
    await page.getByRole('button', { name: /sign in|login/i }).click()

    // Wait for redirect to dashboard
    await page.waitForURL(DASHBOARD_URL, { timeout: 60000 })

    // Verify user is on dashboard
    await expect(page).toHaveURL(new RegExp(DASHBOARD_URL))
  })
})
```

**Patterns:**

- Suite: `test.describe('Feature Name', () => { ... })`
- Hook setup: `test.beforeEach()` for per-test setup
- Hook teardown: `test.afterEach()` (rarely used)
- Assertions: `await expect(element).toBeVisible()`, `toHaveURL()`, `toHaveJSProperty()`

**Unit Test Structure:**

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CertExpiryCard } from '@/components/portal/cert-expiry-card'

const mockChecks = [
  {
    id: 1,
    check_code: 'LPC-2024',
    check_description: 'Line Proficiency Check',
    expiry_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

describe('CertExpiryCard', () => {
  it('renders nothing when checks array is empty', () => {
    const { container } = render(
      <CertExpiryCard variant="expired" title="Test" description="" checks={[]} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders the title and check code', () => {
    render(
      <CertExpiryCard
        variant="expired"
        title="Expired Certifications"
        description="Renew immediately"
        checks={mockChecks}
      />
    )
    expect(screen.getByText('Expired Certifications')).toBeInTheDocument()
    expect(screen.getByText('LPC-2024')).toBeInTheDocument()
  })
})
```

## Mocking

**Framework:** Native Playwright mocking + manual HTTP stubs

**Patterns:**

1. **Page Mocking (Playwright):**

   ```typescript
   // Mock API response
   await page.route('/api/pilots', (route) => {
     route.abort('failed')
   })

   // Mock with custom response
   await page.route('/api/pilots', (route) => {
     route.fulfill({
       status: 200,
       body: JSON.stringify([{ id: 1, name: 'John Doe' }]),
     })
   })
   ```

2. **Test Data (Fixtures):**
   Mock data defined inline or in shared `test-utils.ts`:

   ```typescript
   const TEST_CONFIG = {
     admin: {
       email: process.env.TEST_ADMIN_EMAIL || throwMissingEnvError('TEST_ADMIN_EMAIL'),
       password: process.env.TEST_ADMIN_PASSWORD || throwMissingEnvError('TEST_ADMIN_PASSWORD'),
     },
     pilot: {
       email: process.env.TEST_PILOT_EMAIL || throwMissingEnvError('TEST_PILOT_EMAIL'),
       password: process.env.TEST_PILOT_PASSWORD || throwMissingEnvError('TEST_PILOT_PASSWORD'),
     },
     baseUrl: process.env.PLAYWRIGHT_TEST_BASE_URL || '',
     timeout: 10000,
   }
   ```

3. **Auth Mocking (Playwright):**
   No API mocking for auth — tests authenticate via helpers:

   ```typescript
   // Admin login
   await loginAsAdmin(page)

   // Pilot login
   await loginAsPilot(page)

   // Logout
   await logout(page)

   // Clear auth
   await clearAuth(page)
   ```

**What to Mock:**

- External API calls that are slow or unreliable
- Third-party integrations (Stripe, email services) — but integration tests should call them
- File uploads/downloads
- Network failures (test error handling)

**What NOT to Mock:**

- Database operations (use real test DB via Supabase)
- Authentication (use real credentials in TEST_CONFIG)
- Core business logic (test real flows)
- UI component behavior (test rendered output)

## Fixtures and Factories

**Test Data:**
Stored in `e2e/helpers/test-utils.ts`:

```typescript
export const TEST_CONFIG = {
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || throwMissingEnvError('TEST_ADMIN_EMAIL'),
    password: process.env.TEST_ADMIN_PASSWORD || throwMissingEnvError('TEST_ADMIN_PASSWORD'),
  },
  pilot: {
    email: process.env.TEST_PILOT_EMAIL || throwMissingEnvError('TEST_PILOT_EMAIL'),
    password: process.env.TEST_PILOT_PASSWORD || throwMissingEnvError('TEST_PILOT_PASSWORD'),
  },
  baseUrl: process.env.PLAYWRIGHT_TEST_BASE_URL || '',
  timeout: 10000,
}
```

**Location:**

- `e2e/helpers/test-utils.ts` — Shared test utilities and configuration
- `e2e/helpers/auth-helpers.ts` — Authentication-specific helpers
- Inline in test files for component-specific mock data

**Environment Variables:**
Test credentials loaded from `.env.test.local` (never from `.env.local`):

```bash
TEST_ADMIN_EMAIL=admin@example.com
TEST_ADMIN_PASSWORD=securepassword
TEST_PILOT_EMAIL=pilot@example.com
TEST_PILOT_PASSWORD=securepassword
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3005
```

Security: All credentials are environment variables; never hardcoded in test files.

## Coverage

**Requirements:** Not enforced; coverage is optional

**View Coverage:**

```bash
npm run test:unit:coverage
```

**Output:** Coverage report generated in `coverage/` directory with:

- Statement coverage
- Branch coverage
- Function coverage
- Line coverage

**Note:** Coverage is low across the codebase. E2E tests provide integration coverage; unit tests are sparse.

## Test Types

**E2E Tests (Primary):**

- **Scope:** Full user flows from login to data mutation
- **Approach:** Use real database, real auth, real API routes
- **Example:** Complete a leave request, verify email notification, check dashboard update
- **20+ test files** covering:
  - Authentication (login, logout, session persistence)
  - Certifications (listing, expiry filtering)
  - Leave/flight requests (create, review, approve, reject)
  - Admin dashboard (pilots, reports, settings)
  - Pilot portal (feedback, requests, dashboard)
  - Data accuracy (race conditions, concurrent updates)
  - Accessibility (keyboard nav, screen reader compatibility)

**Unit Tests (Minimal):**

- **Scope:** Utility functions, components in isolation
- **Approach:** Mock dependencies, test single responsibility
- **Example:** Test `cn()` utility for correct Tailwind class merging
- **2 test files:**
  - `tests/unit/lib/utils.test.ts` — Utility function tests
  - `tests/unit/components/cert-expiry-card.test.tsx` — Component rendering tests

**Integration Tests:**
Not separate category; E2E tests cover integration (full stack with database).

## Common Patterns

**Async Testing (E2E):**

```typescript
test('should load pilots and filter by role', async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto('/dashboard/pilots')

  // Wait for data to load
  await page.waitForSelector('[data-testid="pilot-list"]', { timeout: 10000 })

  // Filter by role
  await page.selectOption('select[aria-label="Role"]', 'Captain')

  // Wait for filtered results
  await page.waitForLoadState('networkidle', { timeout: 30000 })

  // Assert filtered list
  const pilotCards = page.locator('[data-testid="pilot-card"]')
  const count = await pilotCards.count()
  expect(count).toBeGreaterThan(0)
})
```

**Error Testing (E2E):**

```typescript
test('should show error when login fails', async ({ page }) => {
  await page.goto('/auth/login')

  await page.getByLabel(/email/i).fill('invalid@example.com')
  await page.getByLabel('Password', { exact: true }).fill('wrongpassword')
  await page.getByRole('button', { name: /sign in/i }).click()

  // Check for error message
  await expect(page.getByText(/invalid|incorrect|wrong/i)).toBeVisible({ timeout: 10000 })

  // Verify still on login page (not redirected)
  await expect(page).toHaveURL(/\/auth\/login/)
})
```

**Navigation Testing:**

```typescript
test('should navigate between pages correctly', async ({ page }) => {
  await loginAsAdmin(page)

  // Navigate to pilots page
  await page.click('a[href="/dashboard/pilots"]')
  await page.waitForURL(/\/dashboard\/pilots/)
  await expect(page.getByRole('heading', { name: /pilots/i })).toBeVisible()

  // Navigate to certifications
  await page.click('a[href="/dashboard/certifications"]')
  await page.waitForURL(/\/dashboard\/certifications/)
  await expect(page.getByRole('heading', { name: /certification/i })).toBeVisible()
})
```

**Waiting for Elements:**

```typescript
// Wait for visible element
await expect(page.locator('.alert')).toBeVisible({ timeout: 5000 })

// Wait for URL change
await page.waitForURL(/\/dashboard\/pilots/, { timeout: 30000 })

// Wait for network idle (all requests complete)
await page.waitForLoadState('networkidle')

// Wait for DOM content loaded
await page.waitForLoadState('domcontentloaded')

// Wait for specific network request
await page.waitForResponse('/api/pilots')

// Wait for condition
await page.waitForFunction(() => {
  return document.querySelectorAll('.pilot-card').length > 0
})
```

## Playwright Configuration Details

**Key Settings** (`playwright.config.ts`):

- **baseURL:** `http://localhost:3005` (test server on port 3005, not 3000)
- **actionTimeout:** 60 seconds (per action — increased from 30s default)
- **navigationTimeout:** 60 seconds (page navigation)
- **trace:** `on-first-retry` (capture trace for failed tests)
- **screenshot:** `only-on-failure` (save screenshots of failures)
- **video:** `retain-on-failure` (record video of failures)
- **webServer:** Starts dev server automatically on `PORT=3005 npm run dev`
- **workers:** 1 (sequential execution to prevent database conflicts)

## Accessibility Testing

**Framework:** Axe Core (`@axe-core/playwright`) for automated checks

**Included in E2E tests:**

- `e2e/accessibility.spec.ts` — Full accessibility audit
- Tests keyboard navigation, screen reader compatibility, color contrast, ARIA labels

**Run specific accessibility tests:**

```bash
npx playwright test e2e/accessibility.spec.ts
```

---

_Testing analysis: 2026-03-14_
