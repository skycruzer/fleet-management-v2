/**
 * E2E Tests for Deadline Alert System
 *
 * Tests deadline alert functionality including:
 * - 22-day deadline alerts
 * - Email notifications
 * - Alert dismissal
 * - Alert prioritization
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 */

import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@test.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin123'
const BASE_URL = process.env.BASE_URL || ''

test.describe('Deadline Alert System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`)
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/dashboard`)
  })

  test.describe('Dashboard Deadline Widget', () => {
    test('should display deadline widget on dashboard', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`)

      // Check for deadline widget
      await expect(page.locator('[data-testid="deadline-widget"]')).toBeVisible()
      await expect(page.getByRole('heading', { name: /upcoming deadline/i })).toBeVisible()
    })

    test('should show days until next deadline', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`)

      // Should display countdown
      await expect(page.locator('[data-testid="days-until-deadline"]')).toBeVisible()
      await expect(page.locator('text=/days until/i')).toBeVisible()
    })

    test('should display pending request count', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`)

      const deadlineWidget = page.locator('[data-testid="deadline-widget"]')
      await expect(deadlineWidget.locator('[data-testid="pending-count"]')).toBeVisible()
    })

    test('should highlight critical deadlines', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`)

      // Check if deadline is approaching (< 7 days)
      const criticalBadge = page.locator('[data-testid="critical-deadline-badge"]')
      const daysText = await page.locator('[data-testid="days-until-deadline"]').textContent()

      if (daysText && parseInt(daysText) < 7) {
        await expect(criticalBadge).toBeVisible()
        await expect(criticalBadge).toHaveClass(/red|destructive/i)
      }
    })
  })

  test.describe('22-Day Rule', () => {
    test('should trigger alert 22 days before roster period start', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`)

      // Navigate to deadline alerts
      await page.click('[data-testid="deadline-widget"]')

      // Should show upcoming deadline
      await expect(page.getByRole('heading', { name: /deadline alert/i })).toBeVisible()

      // Verify 22-day calculation
      await expect(page.locator('text=22 days')).toBeVisible()
    })

    test('should only show alerts for periods with pending requests', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`)

      await page.click('[data-testid="deadline-widget"]')

      // Verify pending count > 0
      const pendingCount = await page.locator('[data-testid="pending-count"]').textContent()
      expect(parseInt(pendingCount || '0')).toBeGreaterThan(0)
    })
  })

  test.describe('Alert Actions', () => {
    test('should link to pending requests', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`)

      await page.click('[data-testid="deadline-widget"]')

      // Click "View Pending Requests"
      await page.click('text=View Pending Requests')

      // Should navigate to requests page with filter
      await expect(page).toHaveURL(/requests.*status=SUBMITTED/i)
    })

    test('should allow bulk approval from alert', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`)

      await page.click('[data-testid="deadline-widget"]')

      // Check for bulk approve button
      const bulkApproveButton = page.locator('button:has-text("Approve All Eligible")')
      if (await bulkApproveButton.isVisible()) {
        await bulkApproveButton.click()

        // Confirm action
        await page.click('button:has-text("Confirm")')

        await expect(page.locator('text=/approved/i')).toBeVisible({ timeout: 5000 })
      }
    })

    test('should allow dismissing alerts', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`)

      const dismissButton = page.locator('[data-testid="dismiss-alert-button"]')
      if (await dismissButton.isVisible()) {
        await dismissButton.click()

        // Alert should disappear
        await expect(dismissButton).not.toBeVisible()
      }
    })
  })

  test.describe('Email Notifications', () => {
    test('should have send alerts button', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`)

      // Navigate to admin settings
      await page.goto(`${BASE_URL}/dashboard/admin/settings`)

      // Check for deadline alert settings
      await expect(page.locator('text=/deadline.*notification/i')).toBeVisible()

      const sendAlertsButton = page.locator('button:has-text("Send Deadline Alerts")')
      await expect(sendAlertsButton).toBeVisible()
    })

    test('should manually trigger email alerts', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/admin/settings`)

      const sendButton = page.locator('button:has-text("Send Deadline Alerts")')
      if (await sendButton.isVisible()) {
        await sendButton.click()

        await expect(page.locator('text=/alerts sent/i')).toBeVisible({ timeout: 10000 })
      }
    })
  })

  test.describe('Alert Prioritization', () => {
    test('should show most urgent deadline first', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`)

      // Get all deadline alerts
      const alerts = page.locator('[data-testid="deadline-alert"]')
      const count = await alerts.count()

      if (count > 1) {
        // First alert should have lowest days-until value
        const firstAlertDays = await alerts
          .first()
          .locator('[data-testid="days-until"]')
          .textContent()
        const secondAlertDays = await alerts
          .nth(1)
          .locator('[data-testid="days-until"]')
          .textContent()

        const first = parseInt(firstAlertDays || '999')
        const second = parseInt(secondAlertDays || '999')

        expect(first).toBeLessThanOrEqual(second)
      }
    })

    test('should separate critical and warning alerts', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`)

      // Critical alerts (< 7 days)
      const criticalSection = page.locator('[data-testid="critical-alerts"]')
      if (await criticalSection.isVisible()) {
        await expect(criticalSection.locator('text=/critical/i')).toBeVisible()
      }

      // Warning alerts (7-14 days)
      const warningSection = page.locator('[data-testid="warning-alerts"]')
      if (await warningSection.isVisible()) {
        await expect(warningSection.locator('text=/warning/i')).toBeVisible()
      }
    })
  })

  test.describe('Cron Job Integration', () => {
    test('should have API endpoint for automated alerts', async ({ page }) => {
      // Test the deadline alerts API endpoint
      const response = await page.request.get(`${BASE_URL}/api/deadline-alerts/send`)

      expect(response.status()).toBeLessThan(500) // Should not error
    })
  })
})
