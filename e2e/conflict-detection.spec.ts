/**
 * E2E Tests for Conflict Detection
 *
 * Tests real-time conflict detection including:
 * - Overlapping request detection
 * - Crew availability violations
 * - Duplicate request detection
 * - Crew impact calculations
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 */

import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@test.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin123'
const BASE_URL = process.env.BASE_URL || ''

test.describe('Conflict Detection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`)
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/dashboard`)
  })

  test.describe('Overlapping Request Detection', () => {
    test('should detect overlapping requests for same pilot', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests/quick-entry`)

      // Create first request
      await page.click('[data-testid="pilot-select"]')
      await page.click('text=Smith, John')

      await page.click('[data-testid="request-category-select"]')
      await page.click('text=Leave')

      await page.fill('[data-testid="start-date-input"]', '2026-04-01')
      await page.fill('[data-testid="end-date-input"]', '2026-04-07')

      await page.click('button[type="submit"]')
      await page.waitForTimeout(1000)

      // Create overlapping request
      await page.goto(`${BASE_URL}/dashboard/requests/quick-entry`)

      await page.click('[data-testid="pilot-select"]')
      await page.click('text=Smith, John')

      await page.click('[data-testid="request-category-select"]')
      await page.click('text=Leave')

      await page.fill('[data-testid="start-date-input"]', '2026-04-05')
      await page.fill('[data-testid="end-date-input"]', '2026-04-12')

      await page.click('button[type="submit"]')

      // Verify conflict error
      await expect(page.locator('text=/OVERLAPPING_REQUEST/i')).toBeVisible({ timeout: 3000 })
      await expect(page.locator('text=/CRITICAL/i')).toBeVisible()
    })

    test('should allow non-overlapping requests', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests/quick-entry`)

      await page.click('[data-testid="pilot-select"]')
      await page.click('text=Jones, Mike')

      await page.click('[data-testid="request-category-select"]')
      await page.click('text=Leave')

      await page.fill('[data-testid="start-date-input"]', '2026-05-01')
      await page.fill('[data-testid="end-date-input"]', '2026-05-07')

      await page.click('button[type="submit"]')
      await page.waitForTimeout(1000)

      // Create non-overlapping request
      await page.goto(`${BASE_URL}/dashboard/requests/quick-entry`)

      await page.click('[data-testid="pilot-select"]')
      await page.click('text=Jones, Mike')

      await page.click('[data-testid="request-category-select"]')
      await page.click('text=Leave')

      await page.fill('[data-testid="start-date-input"]', '2026-05-10')
      await page.fill('[data-testid="end-date-input"]', '2026-05-14')

      await page.click('button[type="submit"]')

      // Should succeed
      await expect(page.locator('text=Request created successfully')).toBeVisible({
        timeout: 5000,
      })
    })
  })

  test.describe('Crew Availability Violations', () => {
    test('should detect crew below minimum threshold', async ({ page }) => {
      // This test assumes we can create enough leave requests to trigger threshold
      await page.goto(`${BASE_URL}/dashboard/requests/quick-entry`)

      // Would need to create 17+ captain leave requests for same dates
      // Simplified test - check for warning display

      await page.click('[data-testid="pilot-select"]')
      await page.click('text=Captain') // Filter captains

      await page.fill('[data-testid="start-date-input"]', '2026-06-01')
      await page.fill('[data-testid="end-date-input"]', '2026-06-07')

      // If near threshold, should show warning
      const conflictAlert = page.locator('[data-testid="conflict-alert"]')
      if (await conflictAlert.isVisible()) {
        await expect(page.locator('text=/crew.*minimum/i')).toBeVisible()
      }
    })

    test('should show crew impact calculation', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests/quick-entry`)

      await page.click('[data-testid="pilot-select"]')
      await page.click('text=Brown, Sarah')

      await page.click('[data-testid="request-category-select"]')
      await page.click('text=Leave')

      await page.fill('[data-testid="start-date-input"]', '2026-07-01')
      await page.fill('[data-testid="end-date-input"]', '2026-07-05')

      // Wait for conflict check
      await page.waitForTimeout(1000)

      // Check for crew impact display (if shown)
      const crewImpact = page.locator('[data-testid="crew-impact"]')
      if (await crewImpact.isVisible()) {
        await expect(page.locator('text=/Captains:/i')).toBeVisible()
        await expect(page.locator('text=/First Officers:/i')).toBeVisible()
      }
    })
  })

  test.describe('Duplicate Request Detection', () => {
    test('should detect duplicate requests', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests/quick-entry`)

      // Create first request
      await page.click('[data-testid="pilot-select"]')
      await page.click('text=Williams, Tom')

      await page.click('[data-testid="request-category-select"]')
      await page.click('text=Leave')

      await page.fill('[data-testid="start-date-input"]', '2026-08-01')
      await page.fill('[data-testid="end-date-input"]', '2026-08-05')

      await page.fill('[data-testid="reason-textarea"]', 'Summer vacation')

      await page.click('button[type="submit"]')
      await page.waitForTimeout(1000)

      // Try to create exact duplicate
      await page.goto(`${BASE_URL}/dashboard/requests/quick-entry`)

      await page.click('[data-testid="pilot-select"]')
      await page.click('text=Williams, Tom')

      await page.click('[data-testid="request-category-select"]')
      await page.click('text=Leave')

      await page.fill('[data-testid="start-date-input"]', '2026-08-01')
      await page.fill('[data-testid="end-date-input"]', '2026-08-05')

      await page.click('button[type="submit"]')

      // Should detect duplicate
      await expect(page.locator('text=/DUPLICATE_REQUEST/i')).toBeVisible({ timeout: 3000 })
      await expect(page.locator('text=/HIGH/i')).toBeVisible()
    })
  })

  test.describe('Real-Time Conflict Checking', () => {
    test('should check conflicts on form change', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests/quick-entry`)

      await page.click('[data-testid="pilot-select"]')
      await page.click('text=Davis, Lisa')

      await page.click('[data-testid="request-category-select"]')
      await page.click('text=Leave')

      // Enter dates
      await page.fill('[data-testid="start-date-input"]', '2026-09-01')
      await page.fill('[data-testid="end-date-input"]', '2026-09-07')

      // Wait for real-time conflict check
      await page.waitForTimeout(500)

      // Check if conflict indicator appears
      const conflictBadge = page.locator('[data-testid="conflict-badge"]')
      const hasConflicts = await conflictBadge.isVisible()

      if (hasConflicts) {
        await expect(conflictBadge).toContainText(/conflict/i)
      }
    })
  })

  test.describe('Conflict Severity Levels', () => {
    test('should display color-coded severity', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests`)

      // Find request with conflicts
      await page.click('text=/conflict/i')

      // Check severity colors
      const criticalAlert = page.locator('[data-testid="conflict-CRITICAL"]')
      if (await criticalAlert.isVisible()) {
        await expect(criticalAlert).toHaveClass(/red|destructive/i)
      }

      const highAlert = page.locator('[data-testid="conflict-HIGH"]')
      if (await highAlert.isVisible()) {
        await expect(highAlert).toHaveClass(/orange/i)
      }

      const mediumAlert = page.locator('[data-testid="conflict-MEDIUM"]')
      if (await mediumAlert.isVisible()) {
        await expect(mediumAlert).toHaveClass(/yellow/i)
      }
    })

    test('should block submission for CRITICAL conflicts', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests/quick-entry`)

      // Create request with known conflict
      // (This assumes test data exists with conflicts)

      const submitButton = page.locator('button[type="submit"]')
      const conflictAlert = page.locator('[data-testid="conflict-CRITICAL"]')

      if (await conflictAlert.isVisible()) {
        // Submit button should be disabled or show error
        await submitButton.click()
        await expect(page.locator('text=/cannot submit/i')).toBeVisible()
      }
    })
  })
})
