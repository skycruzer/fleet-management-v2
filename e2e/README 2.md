# E2E Tests Documentation

This directory contains Playwright end-to-end tests for the Fleet Management V2 application.

## Overview

The E2E test suite covers critical user flows including:
- **Authentication** - Login, logout, session management
- **Pilot Management** - CRUD operations for pilot records
- **Certification Management** - Certification tracking and expiry alerts
- **Dashboard** - Metrics, widgets, and navigation

## Test Files

### Core Test Suites

- **`auth.spec.ts`** - Authentication flows
  - Login/logout functionality
  - Session persistence
  - Protected route access
  - Password visibility toggle
  - Remember me functionality

- **`pilots.spec.ts`** - Pilot management CRUD operations
  - Viewing pilot list
  - Creating new pilots
  - Updating pilot information
  - Deleting pilots
  - Search and filtering
  - Mobile responsive design

- **`certifications.spec.ts`** - Certification tracking
  - Viewing certifications
  - Creating/updating certifications
  - Expiry alerts and color coding
  - Status filtering (expired/expiring/current)
  - Bulk operations

- **`dashboard.spec.ts`** - Dashboard functionality
  - Metrics display
  - Fleet compliance overview
  - Expiring certifications widget
  - Navigation and quick actions
  - Charts and visualizations

### Utilities

- **`helpers/test-utils.ts`** - Reusable test utilities
  - Authentication helpers
  - Navigation helpers
  - Date utilities
  - Form utilities
  - Table utilities
  - Toast/notification utilities

## Running Tests

### Local Development

```bash
# Run all tests
npm test

# Run tests in UI mode (interactive)
npm run test:ui

# Run tests with visible browser
npm run test:headed

# Run tests in debug mode
npm run test:debug

# Run specific test file
npx playwright test e2e/auth.spec.ts

# Run specific test by name
npx playwright test -g "should login successfully"

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Mobile Testing

```bash
# Run mobile tests
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

### CI/CD

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch

See `.github/workflows/playwright.yml` for CI configuration.

## Environment Setup

### Required Environment Variables

Create a `.env.local` file with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Test User Credentials
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword123

# Test Configuration
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
```

### Test User Setup

1. Create a test user in your Supabase project
2. Add credentials to `.env.local`
3. Ensure the test user has appropriate permissions

## Writing New Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test'
import { login, navUtils } from './helpers/test-utils'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: login, navigate, etc.
    await login(page)
    await navUtils.goToFeature(page)
  })

  test('should do something', async ({ page }) => {
    // Arrange
    const button = page.getByRole('button', { name: /submit/i })

    // Act
    await button.click()

    // Assert
    await expect(page.getByText(/success/i)).toBeVisible()
  })
})
```

### Best Practices

1. **Use Semantic Selectors**
   ```typescript
   // ✅ Good - role-based selectors
   page.getByRole('button', { name: /submit/i })
   page.getByRole('heading', { name: /dashboard/i })

   // ❌ Avoid - CSS selectors
   page.locator('.btn-submit')
   ```

2. **Wait for Elements**
   ```typescript
   // ✅ Good - explicit wait
   await expect(page.getByRole('table')).toBeVisible()

   // ❌ Avoid - arbitrary timeouts
   await page.waitForTimeout(5000)
   ```

3. **Use Helper Functions**
   ```typescript
   // ✅ Good - reusable helper
   await login(page)
   await navUtils.goToPilots(page)

   // ❌ Avoid - duplicate code
   await page.goto('/auth/login')
   await page.getByLabel(/email/i).fill('test@example.com')
   // ... repeated in every test
   ```

4. **Test User Interactions, Not Implementation**
   ```typescript
   // ✅ Good - tests user behavior
   await page.getByRole('button', { name: /add pilot/i }).click()
   await expect(page.getByRole('dialog')).toBeVisible()

   // ❌ Avoid - tests implementation details
   await page.locator('#add-pilot-modal').evaluate(el => el.style.display = 'block')
   ```

5. **Handle Optional Elements**
   ```typescript
   // ✅ Good - check if element exists
   const searchInput = page.getByPlaceholder(/search/i)
   if (await searchInput.isVisible()) {
     await searchInput.fill('test')
   }

   // ❌ Avoid - assumes element exists
   await page.getByPlaceholder(/search/i).fill('test')
   ```

## Test Coverage

### Current Coverage

- ✅ Authentication flows (login, logout, session)
- ✅ Pilot CRUD operations
- ✅ Certification management
- ✅ Dashboard metrics and widgets
- ✅ Navigation and routing
- ✅ Responsive design (mobile/tablet/desktop)

### Future Coverage

- ⏳ Leave request management
- ⏳ Analytics and reporting
- ⏳ PDF generation
- ⏳ Real-time updates
- ⏳ Accessibility testing
- ⏳ Performance testing

## Debugging Tests

### Visual Debugging

```bash
# Run with UI mode (recommended)
npm run test:ui

# Run with visible browser
npm run test:headed

# Run in debug mode
npm run test:debug
```

### Trace Viewer

```bash
# Generate trace (automatic on test failure)
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

### Screenshots and Videos

- Screenshots: Captured on test failure (see `test-results/`)
- Videos: Recorded on test failure (see `test-results/`)
- Configure in `playwright.config.ts`

## Troubleshooting

### Common Issues

**Issue**: Tests fail with "Cannot find element"
**Solution**: Add explicit waits using `expect().toBeVisible()`

**Issue**: Tests timeout
**Solution**: Increase timeout in `playwright.config.ts` or specific test

**Issue**: Authentication fails
**Solution**: Verify `.env.local` has correct credentials

**Issue**: Database state issues
**Solution**: Ensure test user has proper permissions, or add cleanup logic

### Getting Help

1. Check test output and error messages
2. View screenshots/videos in `test-results/`
3. Run tests in UI mode for interactive debugging
4. Check Playwright documentation: https://playwright.dev/

## CI Integration

### GitHub Actions

Tests run automatically on CI with:
- Multiple browser engines (Chromium, Firefox, WebKit)
- Mobile viewports (iPhone, Android)
- Parallel execution for faster results
- Automatic retry on flaky tests

### Viewing Results

1. **GitHub Actions Tab** - View test runs and logs
2. **Artifacts** - Download test results and reports
3. **GitHub Pages** - View HTML report (if enabled)

### Required Secrets

Add these secrets to your GitHub repository:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `TEST_USER_EMAIL`
- `TEST_USER_PASSWORD`

## Performance

### Test Execution Time

- **Local**: ~2-3 minutes (single browser)
- **CI**: ~5-7 minutes (all browsers in parallel)

### Optimization Tips

1. Use `test.describe.configure({ mode: 'parallel' })` for independent tests
2. Reuse authentication state with `storageState`
3. Run critical tests first, optional tests later
4. Skip slow tests in dev with `test.skip()`

## Maintenance

### Regular Tasks

- ✅ Update test selectors when UI changes
- ✅ Add tests for new features
- ✅ Remove tests for deprecated features
- ✅ Update test data when database schema changes
- ✅ Review and fix flaky tests

### Test Quality Checklist

- [ ] Tests are independent (no shared state)
- [ ] Tests clean up after themselves
- [ ] Tests use semantic selectors
- [ ] Tests have descriptive names
- [ ] Tests are maintainable (use helpers)
- [ ] Tests are reliable (no random failures)

---

**Version**: 1.0.0
**Last Updated**: October 17, 2025
**Maintainer**: Maurice (Skycruzer)
