/**
 * E2E Tests for Unified Request System
 *
 * Tests CRUD operations for pilot requests including:
 * - Creating leave requests
 * - Creating flight requests
 * - Approving/denying requests
 * - Bulk operations
 * - Conflict detection
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 */

import { test, expect } from '@playwright/test'

// Test configuration
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@test.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin123'
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('Unified Request System', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await page.goto(`${BASE_URL}/auth/login`)
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/dashboard`)
  })

  test.describe('Request List View', () => {
    test('should display requests dashboard', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests`)

      // Check for page heading
      await expect(page.getByRole('heading', { name: /requests/i })).toBeVisible()

      // Check for filter controls
      await expect(page.locator('[data-testid="roster-period-filter"]')).toBeVisible()
      await expect(page.locator('[data-testid="status-filter"]')).toBeVisible()
      await expect(page.locator('[data-testid="category-filter"]')).toBeVisible()
    })

    test('should filter requests by roster period', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests`)

      // Select a roster period
      await page.click('[data-testid="roster-period-filter"]')
      await page.click('text=RP01/2026')

      // Verify URL updated with filter
      await expect(page).toHaveURL(/roster_period=RP01/)

      // Verify table updated
      await page.waitForTimeout(500) // Wait for data to load
    })

    test('should filter requests by status', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests`)

      // Select SUBMITTED status
      await page.click('[data-testid="status-filter"]')
      await page.click('text=Submitted')

      // Verify filter applied
      await expect(page).toHaveURL(/status=SUBMITTED/)
    })

    test('should filter requests by category', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests`)

      // Select LEAVE category
      await page.click('[data-testid="category-filter"]')
      await page.click('text=Leave')

      // Verify filter applied
      await expect(page).toHaveURL(/category=LEAVE/)
    })
  })

  test.describe('Create Leave Request', () => {
    test('should create leave request via Quick Entry', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests/quick-entry`)

      // Fill Quick Entry form
      await page.click('[data-testid="pilot-select"]')
      await page.click('text=Smith, John') // Select first pilot

      await page.click('[data-testid="request-category-select"]')
      await page.click('text=Leave')

      await page.click('[data-testid="request-type-select"]')
      await page.click('text=Annual Leave')

      await page.fill('[data-testid="start-date-input"]', '2026-02-01')
      await page.fill('[data-testid="end-date-input"]', '2026-02-07')

      await page.fill('[data-testid="reason-textarea"]', 'Family vacation')

      // Submit form
      await page.click('button[type="submit"]')

      // Verify success message
      await expect(page.locator('text=Request created successfully')).toBeVisible({
        timeout: 5000,
      })

      // Verify redirected to requests list
      await expect(page).toHaveURL(/\/dashboard\/requests/)
    })

    test('should show conflict alert for overlapping dates', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests/quick-entry`)

      // Submit first request
      await page.click('[data-testid="pilot-select"]')
      await page.click('text=Smith, John')

      await page.click('[data-testid="request-category-select"]')
      await page.click('text=Leave')

      await page.fill('[data-testid="start-date-input"]', '2026-03-01')
      await page.fill('[data-testid="end-date-input"]', '2026-03-07')

      await page.click('button[type="submit"]')
      await page.waitForTimeout(1000)

      // Try to submit overlapping request
      await page.goto(`${BASE_URL}/dashboard/requests/quick-entry`)

      await page.click('[data-testid="pilot-select"]')
      await page.click('text=Smith, John')

      await page.click('[data-testid="request-category-select"]')
      await page.click('text=Leave')

      await page.fill('[data-testid="start-date-input"]', '2026-03-03')
      await page.fill('[data-testid="end-date-input"]', '2026-03-10')

      await page.click('button[type="submit"]')

      // Verify conflict error
      await expect(page.locator('text=/overlapping/i')).toBeVisible({ timeout: 5000 })
    })

    test('should calculate roster period automatically', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests/quick-entry`)

      await page.click('[data-testid="pilot-select"]')
      await page.click('text=Smith, John')

      await page.fill('[data-testid="start-date-input"]', '2026-01-10')

      // Verify roster period calculated (RP01/2026 for dates around Jan 10)
      await expect(page.locator('text=RP01/2026')).toBeVisible({ timeout: 2000 })
    })
  })

  test.describe('Create Flight Request', () => {
    test('should create flight request', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests/quick-entry`)

      await page.click('[data-testid="pilot-select"]')
      await page.click('text=Jones, Mike')

      await page.click('[data-testid="request-category-select"]')
      await page.click('text=Flight')

      await page.click('[data-testid="request-type-select"]')
      await page.click('text=Flight Request')

      await page.fill('[data-testid="flight-date-input"]', '2026-02-15')

      await page.fill('[data-testid="notes-textarea"]', 'Additional flight request for training')

      await page.click('button[type="submit"]')

      await expect(page.locator('text=Request created successfully')).toBeVisible({
        timeout: 5000,
      })
    })
  })

  test.describe('Request Approval Workflow', () => {
    test('should approve a submitted request', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests`)

      // Filter for SUBMITTED requests
      await page.click('[data-testid="status-filter"]')
      await page.click('text=Submitted')

      await page.waitForTimeout(500)

      // Click first request
      await page.click('[data-testid="request-row"]:first-child')

      // Approve request
      await page.click('button:has-text("Approve")')

      // Add review comment
      await page.fill('[data-testid="review-comments"]', 'Approved - adequate coverage')

      await page.click('button:has-text("Confirm Approval")')

      // Verify success message
      await expect(page.locator('text=/approved/i')).toBeVisible({ timeout: 5000 })

      // Verify status updated
      await expect(page.locator('text=APPROVED')).toBeVisible()
    })

    test('should deny a request with comments', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests`)

      await page.click('[data-testid="status-filter"]')
      await page.click('text=Submitted')

      await page.waitForTimeout(500)

      await page.click('[data-testid="request-row"]:first-child')

      await page.click('button:has-text("Deny")')

      // Comments required for denial
      await page.fill('[data-testid="review-comments"]', 'Denied - insufficient crew coverage')

      await page.click('button:has-text("Confirm Denial")')

      await expect(page.locator('text=/denied/i')).toBeVisible({ timeout: 5000 })

      await expect(page.locator('text=DENIED')).toBeVisible()
    })

    test('should not allow denial without comments', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests`)

      await page.click('[data-testid="status-filter"]')
      await page.click('text=Submitted')

      await page.waitForTimeout(500)

      await page.click('[data-testid="request-row"]:first-child')

      await page.click('button:has-text("Deny")')

      // Try to submit without comments
      await page.click('button:has-text("Confirm Denial")')

      // Verify error message
      await expect(page.locator('text=/comments.*required/i')).toBeVisible()
    })
  })

  test.describe('Bulk Operations', () => {
    test('should select multiple requests', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests`)

      // Select multiple checkboxes
      await page.click('[data-testid="request-checkbox-1"]')
      await page.click('[data-testid="request-checkbox-2"]')
      await page.click('[data-testid="request-checkbox-3"]')

      // Verify bulk actions enabled
      await expect(page.locator('button:has-text("Bulk Approve")')).toBeEnabled()
      await expect(page.locator('button:has-text("Bulk Deny")')).toBeEnabled()
    })

    test('should bulk approve requests', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests`)

      await page.click('[data-testid="status-filter"]')
      await page.click('text=Submitted')

      await page.waitForTimeout(500)

      // Select 3 requests
      await page.click('[data-testid="request-checkbox-1"]')
      await page.click('[data-testid="request-checkbox-2"]')
      await page.click('[data-testid="request-checkbox-3"]')

      await page.click('button:has-text("Bulk Approve")')

      await page.fill('[data-testid="bulk-review-comments"]', 'Bulk approval - crew adequate')

      await page.click('button:has-text("Confirm Bulk Approval")')

      await expect(page.locator('text=/3 requests approved/i')).toBeVisible({ timeout: 5000 })
    })

    test('should bulk deny requests', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests`)

      await page.click('[data-testid="status-filter"]')
      await page.click('text=Submitted')

      await page.waitForTimeout(500)

      await page.click('[data-testid="request-checkbox-1"]')
      await page.click('[data-testid="request-checkbox-2"]')

      await page.click('button:has-text("Bulk Deny")')

      await page.fill('[data-testid="bulk-review-comments"]', 'Bulk denial - operational constraints')

      await page.click('button:has-text("Confirm Bulk Denial")')

      await expect(page.locator('text=/2 requests denied/i')).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Request Details', () => {
    test('should display request details', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests`)

      await page.click('[data-testid="request-row"]:first-child')

      // Verify details displayed
      await expect(page.locator('[data-testid="pilot-name"]')).toBeVisible()
      await expect(page.locator('[data-testid="request-type"]')).toBeVisible()
      await expect(page.locator('[data-testid="start-date"]')).toBeVisible()
      await expect(page.locator('[data-testid="roster-period"]')).toBeVisible()
      await expect(page.locator('[data-testid="submission-channel"]')).toBeVisible()
      await expect(page.locator('[data-testid="workflow-status"]')).toBeVisible()
    })

    test('should show conflict information', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests`)

      // Find a request with conflicts
      await page.click('text=/conflict/i')

      // Verify conflict details
      await expect(page.locator('[data-testid="conflict-list"]')).toBeVisible()
      await expect(page.locator('[data-testid="crew-impact"]')).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests`)

      // Tab through interactive elements
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // Verify focus visible
      await expect(page.locator(':focus')).toBeVisible()
    })

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests`)

      // Check for ARIA labels
      await expect(page.locator('[aria-label="Filter by roster period"]')).toBeVisible()
      await expect(page.locator('[aria-label="Filter by status"]')).toBeVisible()
      await expect(page.locator('[aria-label="Filter by category"]')).toBeVisible()
    })
  })
})
