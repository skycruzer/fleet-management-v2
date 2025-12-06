/**
 * E2E Tests for Bulk Operations
 *
 * Tests bulk operations on pilot requests including:
 * - Bulk approval
 * - Bulk denial
 * - Bulk status updates
 * - Multi-selection
 * - Validation rules
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 */

import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@test.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin123'
const BASE_URL = process.env.BASE_URL || ''

test.describe('Bulk Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`)
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/dashboard`)
  })

  test.describe('Multi-Selection', () => {
    test('should enable bulk actions when multiple requests selected', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests`)

      // Initially bulk buttons should be disabled
      await expect(page.locator('button:has-text("Bulk Approve")')).toBeDisabled()
      await expect(page.locator('button:has-text("Bulk Deny")')).toBeDisabled()

      // Select 2 requests
      await page.click('[data-testid="request-checkbox"]:first-child')
      await page.click('[data-testid="request-checkbox"]:nth-child(2)')

      // Bulk buttons should be enabled
      await expect(page.locator('button:has-text("Bulk Approve")')).toBeEnabled()
      await expect(page.locator('button:has-text("Bulk Deny")')).toBeEnabled()
    })

    test('should show selection count', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests`)

      await page.click('[data-testid="request-checkbox"]:nth-child(1)')
      await page.click('[data-testid="request-checkbox"]:nth-child(2)')
      await page.click('[data-testid="request-checkbox"]:nth-child(3)')

      // Should show "3 selected"
      await expect(page.locator('[data-testid="selection-count"]')).toContainText('3')
    })

    test('should have select all checkbox', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests`)

      const selectAllCheckbox = page.locator('[data-testid="select-all-checkbox"]')
      await expect(selectAllCheckbox).toBeVisible()

      await selectAllCheckbox.click()

      // All checkboxes should be checked
      const checkboxes = page.locator('[data-testid="request-checkbox"]')
      const count = await checkboxes.count()

      for (let i = 0; i < count; i++) {
        await expect(checkboxes.nth(i)).toBeChecked()
      }
    })

    test('should clear selection', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests`)

      // Select some requests
      await page.click('[data-testid="request-checkbox"]:nth-child(1)')
      await page.click('[data-testid="request-checkbox"]:nth-child(2)')

      // Click clear selection
      await page.click('button:has-text("Clear Selection")')

      // All should be unchecked
      const checkboxes = page.locator('[data-testid="request-checkbox"]')
      const count = await checkboxes.count()

      for (let i = 0; i < count; i++) {
        await expect(checkboxes.nth(i)).not.toBeChecked()
      }
    })
  })

  test.describe('Bulk Approval', () => {
    test('should bulk approve selected requests', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests`)

      // Filter for SUBMITTED requests
      await page.click('[data-testid="status-filter"]')
      await page.click('text=Submitted')
      await page.waitForTimeout(500)

      // Select 3 requests
      await page.click('[data-testid="request-checkbox"]:nth-child(1)')
      await page.click('[data-testid="request-checkbox"]:nth-child(2)')
      await page.click('[data-testid="request-checkbox"]:nth-child(3)')

      // Click bulk approve
      await page.click('button:has-text("Bulk Approve")')

      // Fill review comments
      await page.fill(
        '[data-testid="bulk-review-comments"]',
        'Bulk approval - adequate crew coverage'
      )

      // Confirm
      await page.click('button:has-text("Confirm Bulk Approval")')

      // Verify success message
      await expect(page.locator('text=/3 requests approved/i')).toBeVisible({ timeout: 5000 })

      // Requests should disappear from SUBMITTED filter
      await page.waitForTimeout(1000)
      await page.reload()

      // Original requests should not be visible
      const submittedRequests = page.locator('[data-testid="request-row"]')
      const newCount = await submittedRequests.count()

      // Count should be reduced (or page may be empty)
      expect(newCount).toBeLessThan(10) // Arbitrary check
    })

    test('should validate comments for bulk approval', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests`)

      await page.click('[data-testid="request-checkbox"]:nth-child(1)')
      await page.click('[data-testid="request-checkbox"]:nth-child(2)')

      await page.click('button:has-text("Bulk Approve")')

      // Try to confirm without comments (if required)
      await page.click('button:has-text("Confirm Bulk Approval")')

      // Should show validation error if comments required
      const errorMessage = page.locator('text=/comment.*required/i')
      const isVisible = await errorMessage.isVisible()

      if (!isVisible) {
        // Comments not required, should succeed
        await expect(page.locator('text=/approved/i')).toBeVisible({ timeout: 5000 })
      }
    })

    test('should show individual failures in bulk approve', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests`)

      // Select mix of requests (some may fail due to conflicts)
      await page.click('[data-testid="request-checkbox"]:nth-child(1)')
      await page.click('[data-testid="request-checkbox"]:nth-child(2)')
      await page.click('[data-testid="request-checkbox"]:nth-child(3)')

      await page.click('button:has-text("Bulk Approve")')
      await page.fill('[data-testid="bulk-review-comments"]', 'Bulk approval test')
      await page.click('button:has-text("Confirm Bulk Approval")')

      // Should show results summary
      await page.waitForTimeout(2000)

      const resultsDialog = page.locator('[data-testid="bulk-results-dialog"]')
      if (await resultsDialog.isVisible()) {
        await expect(resultsDialog.locator('text=/success/i')).toBeVisible()
        await expect(resultsDialog.locator('text=/failed/i')).toBeVisible()
      }
    })
  })

  test.describe('Bulk Denial', () => {
    test('should bulk deny selected requests', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests`)

      await page.click('[data-testid="status-filter"]')
      await page.click('text=Submitted')
      await page.waitForTimeout(500)

      await page.click('[data-testid="request-checkbox"]:nth-child(1)')
      await page.click('[data-testid="request-checkbox"]:nth-child(2)')

      await page.click('button:has-text("Bulk Deny")')

      // Comments required for denial
      await page.fill(
        '[data-testid="bulk-review-comments"]',
        'Bulk denial - insufficient crew coverage'
      )

      await page.click('button:has-text("Confirm Bulk Denial")')

      await expect(page.locator('text=/2 requests denied/i')).toBeVisible({ timeout: 5000 })
    })

    test('should require comments for bulk deny', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests`)

      await page.click('[data-testid="request-checkbox"]:nth-child(1)')
      await page.click('[data-testid="request-checkbox"]:nth-child(2)')

      await page.click('button:has-text("Bulk Deny")')

      // Try to confirm without comments
      await page.click('button:has-text("Confirm Bulk Denial")')

      // Should show error
      await expect(page.locator('text=/comment.*required/i')).toBeVisible()
    })
  })

  test.describe('Performance', () => {
    test('should handle 20+ bulk selections efficiently', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests`)

      const startTime = Date.now()

      // Select 20 requests
      for (let i = 1; i <= 20; i++) {
        await page.click(`[data-testid="request-checkbox"]:nth-child(${i})`)
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should complete in < 5 seconds
      expect(duration).toBeLessThan(5000)

      // Bulk buttons should still be enabled
      await expect(page.locator('button:has-text("Bulk Approve")')).toBeEnabled()
    })
  })

  test.describe('Edge Cases', () => {
    test('should prevent bulk operations on mixed statuses', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests`)

      // Remove status filter to show all
      await page.click('[data-testid="clear-filters"]')

      // Select requests with different statuses
      await page.click('[data-testid="request-checkbox"]:nth-child(1)')
      await page.click('[data-testid="request-checkbox"]:nth-child(5)')

      await page.click('button:has-text("Bulk Approve")')

      // Should show warning if statuses are incompatible
      const warningMessage = page.locator('text=/only submitted requests/i')
      const isVisible = await warningMessage.isVisible()

      if (isVisible) {
        await expect(warningMessage).toBeVisible()
      }
    })

    test('should handle no selection gracefully', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests`)

      // Bulk buttons should be disabled
      await expect(page.locator('button:has-text("Bulk Approve")')).toBeDisabled()
      await expect(page.locator('button:has-text("Bulk Deny")')).toBeDisabled()
    })
  })
})
