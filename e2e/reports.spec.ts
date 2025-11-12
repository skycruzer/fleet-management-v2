/**
 * E2E Tests for PDF Report Generation
 *
 * Tests PDF generation including:
 * - Roster period reports
 * - Certification reports
 * - Leave request reports
 * - Flight request reports
 * - Custom filtering
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 */

import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@test.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin123'
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('PDF Report Generation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`)
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/dashboard`)
  })

  test.describe('Reports Dashboard', () => {
    test('should display reports page', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      await expect(page.getByRole('heading', { name: /reports/i })).toBeVisible()

      // Check for report type selector
      await expect(page.locator('[data-testid="report-type-selector"]')).toBeVisible()
    })

    test('should show available report types', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      await page.click('[data-testid="report-type-selector"]')

      // Verify report types
      await expect(page.locator('text=Roster Period Report')).toBeVisible()
      await expect(page.locator('text=Leave Requests Report')).toBeVisible()
      await expect(page.locator('text=Flight Requests Report')).toBeVisible()
      await expect(page.locator('text=Certification Report')).toBeVisible()
    })
  })

  test.describe('Roster Period Reports', () => {
    test('should generate roster period PDF report', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      // Select roster period report
      await page.click('[data-testid="report-type-selector"]')
      await page.click('text=Roster Period Report')

      // Select roster period
      await page.click('[data-testid="roster-period-selector"]')
      await page.click('text=RP01/2026')

      // Generate report
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('button:has-text("Generate PDF")'),
      ])

      // Verify download
      expect(download.suggestedFilename()).toContain('roster')
      expect(download.suggestedFilename()).toContain('.pdf')
    })

    test('should preview roster report before download', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      await page.click('[data-testid="report-type-selector"]')
      await page.click('text=Roster Period Report')

      await page.click('[data-testid="roster-period-selector"]')
      await page.click('text=RP02/2026')

      // Click preview
      await page.click('button:has-text("Preview")')

      // Verify preview modal
      await expect(page.locator('[data-testid="report-preview-dialog"]')).toBeVisible()

      // Should show report content
      await expect(page.locator('text=/roster period/i')).toBeVisible()
      await expect(page.locator('text=RP02/2026')).toBeVisible()
    })

    test('should include request summary in roster report', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      await page.click('[data-testid="report-type-selector"]')
      await page.click('text=Roster Period Report')

      await page.click('[data-testid="roster-period-selector"]')
      await page.click('text=RP03/2026')

      await page.click('button:has-text("Preview")')

      // Verify summary sections
      await expect(page.locator('text=/submitted/i')).toBeVisible()
      await expect(page.locator('text=/approved/i')).toBeVisible()
      await expect(page.locator('text=/denied/i')).toBeVisible()
    })
  })

  test.describe('Leave Request Reports', () => {
    test('should generate leave request report with filters', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      await page.click('[data-testid="report-type-selector"]')
      await page.click('text=Leave Requests Report')

      // Apply filters
      await page.click('[data-testid="date-range-filter"]')
      await page.fill('[data-testid="start-date-input"]', '2026-01-01')
      await page.fill('[data-testid="end-date-input"]', '2026-12-31')

      await page.click('[data-testid="status-filter"]')
      await page.click('text=Approved')

      // Generate report
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('button:has-text("Generate PDF")'),
      ])

      expect(download.suggestedFilename()).toContain('leave')
      expect(download.suggestedFilename()).toContain('.pdf')
    })

    test('should filter leave reports by pilot', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      await page.click('[data-testid="report-type-selector"]')
      await page.click('text=Leave Requests Report')

      // Filter by specific pilot
      await page.click('[data-testid="pilot-filter"]')
      await page.fill('[data-testid="pilot-search"]', 'Smith')
      await page.click('text=Smith, John')

      await page.click('button:has-text("Preview")')

      // Verify only showing that pilot
      await expect(page.locator('text=Smith, John')).toBeVisible()
    })
  })

  test.describe('Flight Request Reports', () => {
    test('should generate flight request report', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      await page.click('[data-testid="report-type-selector"]')
      await page.click('text=Flight Requests Report')

      await page.click('[data-testid="roster-period-selector"]')
      await page.click('text=RP04/2026')

      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('button:has-text("Generate PDF")'),
      ])

      expect(download.suggestedFilename()).toContain('flight')
    })
  })

  test.describe('Certification Reports', () => {
    test('should generate certification report', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      await page.click('[data-testid="report-type-selector"]')
      await page.click('text=Certification Report')

      // Filter for expiring certifications
      await page.click('[data-testid="certification-filter"]')
      await page.click('text=Expiring Soon')

      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('button:has-text("Generate PDF")'),
      ])

      expect(download.suggestedFilename()).toContain('certification')
    })

    test('should show color-coded expiry status in report', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      await page.click('[data-testid="report-type-selector"]')
      await page.click('text=Certification Report')

      await page.click('button:has-text("Preview")')

      // Verify color coding
      const redBadge = page.locator('[data-testid="status-red"]')
      const yellowBadge = page.locator('[data-testid="status-yellow"]')
      const greenBadge = page.locator('[data-testid="status-green"]')

      // At least one should be visible
      const hasAnyStatus =
        (await redBadge.isVisible()) ||
        (await yellowBadge.isVisible()) ||
        (await greenBadge.isVisible())

      expect(hasAnyStatus).toBe(true)
    })
  })

  test.describe('Email Reports', () => {
    test('should email roster report', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      await page.click('[data-testid="report-type-selector"]')
      await page.click('text=Roster Period Report')

      await page.click('[data-testid="roster-period-selector"]')
      await page.click('text=RP05/2026')

      // Click email button
      await page.click('button:has-text("Email Report")')

      // Fill email address
      await page.fill('[data-testid="email-input"]', 'manager@example.com')

      // Send
      await page.click('button:has-text("Send Email")')

      // Verify success
      await expect(page.locator('text=/email sent/i')).toBeVisible({ timeout: 10000 })
    })

    test('should validate email address', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      await page.click('[data-testid="report-type-selector"]')
      await page.click('text=Roster Period Report')

      await page.click('[data-testid="roster-period-selector"]')
      await page.click('text=RP06/2026')

      await page.click('button:has-text("Email Report")')

      // Enter invalid email
      await page.fill('[data-testid="email-input"]', 'invalid-email')

      await page.click('button:has-text("Send Email")')

      // Should show error
      await expect(page.locator('text=/valid email/i')).toBeVisible()
    })
  })

  test.describe('Report Customization', () => {
    test('should allow selecting report columns', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      await page.click('[data-testid="report-type-selector"]')
      await page.click('text=Leave Requests Report')

      // Click customize
      await page.click('button:has-text("Customize")')

      // Select/deselect columns
      await page.click('[data-testid="column-pilot-name"]')
      await page.click('[data-testid="column-request-type"]')
      await page.click('[data-testid="column-dates"]')

      // Apply
      await page.click('button:has-text("Apply")')

      // Preview should reflect changes
      await page.click('button:has-text("Preview")')

      await expect(page.locator('[data-testid="report-preview"]')).toBeVisible()
    })

    test('should save custom report template', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      await page.click('[data-testid="report-type-selector"]')
      await page.click('text=Leave Requests Report')

      // Customize
      await page.click('button:has-text("Customize")')

      await page.click('[data-testid="column-pilot-name"]')
      await page.click('[data-testid="column-status"]')

      // Save as template
      await page.click('button:has-text("Save as Template")')

      await page.fill('[data-testid="template-name"]', 'Monthly Leave Summary')

      await page.click('button:has-text("Save Template")')

      // Verify saved
      await expect(page.locator('text=/template saved/i')).toBeVisible()

      // Should appear in templates list
      await page.click('[data-testid="templates-dropdown"]')
      await expect(page.locator('text=Monthly Leave Summary')).toBeVisible()
    })
  })

  test.describe('Performance', () => {
    test('should generate large report in reasonable time', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      await page.click('[data-testid="report-type-selector"]')
      await page.click('text=Leave Requests Report')

      // Select date range covering full year
      await page.click('[data-testid="date-range-filter"]')
      await page.fill('[data-testid="start-date-input"]', '2025-01-01')
      await page.fill('[data-testid="end-date-input"]', '2025-12-31')

      const startTime = Date.now()

      await page.click('button:has-text("Preview")')

      await expect(page.locator('[data-testid="report-preview"]')).toBeVisible({
        timeout: 30000,
      })

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should complete in < 30 seconds
      expect(duration).toBeLessThan(30000)
    })
  })
})
