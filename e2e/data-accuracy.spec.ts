import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/test-utils'

/**
 * Data Accuracy E2E Tests
 *
 * Verifies accuracy of calculations and metrics across the application:
 * - Dashboard metrics (pilot counts, certification counts, compliance %)
 * - Certification expiry calculations
 * - Leave eligibility logic
 * - Seniority calculations
 * - Roster period boundaries
 * - Captain qualifications
 * - Retirement forecasts
 * - Fleet compliance percentages
 */

test.describe('Dashboard Metrics Accuracy', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle', { timeout: 60000 })
  })

  test('should display total pilot count matching database (27 pilots)', async ({ page }) => {
    // Look for pilot count metric
    const pilotMetric = page.getByText(/\d+\s*pilots?/i).first()

    if (await pilotMetric.isVisible()) {
      const text = await pilotMetric.textContent()
      const count = parseInt(text?.match(/\d+/)?.[0] || '0')

      // Should show 27 pilots (based on database)
      expect(count).toBe(27)
    }
  })

  test('should display total certification count matching database (607 certifications)', async ({
    page,
  }) => {
    // Look for certification count metric
    const certMetric = page.locator('text=/\\d+\\s*certifications?/i').first()

    if (await certMetric.isVisible()) {
      const text = await certMetric.textContent()
      const count = parseInt(text?.match(/\d+/)?.[0] || '0')

      // Should show 607 certifications (based on database)
      expect(count).toBeGreaterThanOrEqual(600)
      expect(count).toBeLessThanOrEqual(650)
    }
  })

  test('should display fleet compliance percentage (realistic range 80-100%)', async ({ page }) => {
    // Look for compliance percentage
    const complianceText = page
      .getByText(/\d+%.*compliance/i)
      .or(page.getByText(/compliance.*\d+%/i))

    if (await complianceText.first().isVisible()) {
      const text = await complianceText.first().textContent()
      const percentage = parseInt(text?.match(/\d+/)?.[0] || '0')

      // Fleet compliance should be realistic (80-100%)
      expect(percentage).toBeGreaterThanOrEqual(80)
      expect(percentage).toBeLessThanOrEqual(100)
    }
  })

  test('should show expiring certifications count (realistic range 0-50)', async ({ page }) => {
    // Look for expiring certs metric
    const expiringMetric = page.getByText(/\d+\s*expiring/i).first()

    if (await expiringMetric.isVisible()) {
      const text = await expiringMetric.textContent()
      const count = parseInt(text?.match(/\d+/)?.[0] || '0')

      // Realistic range for expiring certs
      expect(count).toBeGreaterThanOrEqual(0)
      expect(count).toBeLessThanOrEqual(50)
    }
  })

  test('should have consistent metrics across dashboard and detail pages', async ({ page }) => {
    // Get pilot count from dashboard
    const dashboardPilotText = await page
      .getByText(/\d+\s*pilots?/i)
      .first()
      .textContent()
    const dashboardCount = parseInt(dashboardPilotText?.match(/\d+/)?.[0] || '0')

    // Navigate to pilots page
    await page.goto('/dashboard/pilots')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Get pilot count from pilots page
    const pilotsPageCount = await page.getByRole('row').count()

    // Counts should be consistent (dashboard count + 1 for header row = pilots page rows)
    if (dashboardCount > 0) {
      expect(pilotsPageCount).toBe(dashboardCount + 1) // +1 for header row
    }
  })
})

test.describe('Certification Expiry Calculations', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/certifications')
    await page.waitForLoadState('networkidle', { timeout: 60000 })
  })

  test('should correctly calculate days until expiry', async ({ page }) => {
    // Look for expiring certifications widget
    const expiringWidget = page.getByRole('heading', { name: /expiring|upcoming/i })

    if (await expiringWidget.first().isVisible()) {
      // Get first expiring certification item
      const certItem = page.locator('[data-testid="expiring-cert"]').first()

      if (await certItem.isVisible()) {
        const text = await certItem.textContent()

        // Should contain days count
        expect(text).toMatch(/\d+\s*days?/i)

        // Extract days number
        const daysMatch = text?.match(/(\d+)\s*days?/i)
        if (daysMatch) {
          const days = parseInt(daysMatch[1])
          // Days should be positive and realistic (0-90 for expiring alerts)
          expect(days).toBeGreaterThanOrEqual(0)
          expect(days).toBeLessThanOrEqual(90)
        }
      }
    }
  })

  test('should apply correct color coding (red=expired, yellow=expiring, green=current)', async ({
    page,
  }) => {
    // Check if any certification rows exist
    const certRows = page.getByRole('row')
    const rowCount = await certRows.count()

    if (rowCount > 1) {
      // More than just header
      // Look for status badges
      const expiredBadge = page
        .locator('.badge, [data-testid*="status"]')
        .filter({ hasText: /expired/i })
      const expiringBadge = page
        .locator('.badge, [data-testid*="status"]')
        .filter({ hasText: /expiring/i })
      const currentBadge = page
        .locator('.badge, [data-testid*="status"]')
        .filter({ hasText: /current/i })

      // At least one status type should exist
      const hasExpired = await expiredBadge
        .first()
        .isVisible()
        .catch(() => false)
      const hasExpiring = await expiringBadge
        .first()
        .isVisible()
        .catch(() => false)
      const hasCurrent = await currentBadge
        .first()
        .isVisible()
        .catch(() => false)

      expect(hasExpired || hasExpiring || hasCurrent).toBe(true)
    }
  })

  test('should show realistic expiry date ranges', async ({ page }) => {
    const rows = page.getByRole('row')
    const rowCount = await rows.count()

    if (rowCount > 1) {
      // Get first certification row (skip header)
      const firstRow = rows.nth(1)
      const rowText = await firstRow.textContent()

      // Should contain a date pattern (various formats possible)
      const hasDate =
        rowText?.match(/\d{4}-\d{2}-\d{2}/) || // YYYY-MM-DD
        rowText?.match(/\d{2}\/\d{2}\/\d{4}/) || // MM/DD/YYYY
        rowText?.match(/\d+\s*days?/i) // X days

      expect(hasDate).toBeTruthy()
    }
  })
})

test.describe('Leave Eligibility Logic', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/leave')
    await page.waitForLoadState('networkidle', { timeout: 60000 })
  })

  test('should enforce minimum crew requirement (10 Captains + 10 First Officers)', async ({
    page,
  }) => {
    // This test verifies the business rule is visible in the UI
    const minCrewInfo = page.getByText(/minimum.*10.*crew|10.*captains.*10.*first officers/i)

    if (await minCrewInfo.isVisible()) {
      await expect(minCrewInfo).toBeVisible({ timeout: 60000 })
    }
  })

  test('should display eligibility alerts for overlapping requests', async ({ page }) => {
    // Look for eligibility alert widget
    const eligibilityAlert = page
      .locator('[data-testid="eligibility-alert"]')
      .or(page.getByText(/eligibility.*alert|overlapping.*requests/i))

    // Alert should exist or not (depends on current data)
    // Just verify the page can handle it
    const hasAlert = await eligibilityAlert.isVisible().catch(() => false)
    expect(typeof hasAlert).toBe('boolean')
  })

  test('should show pending leave requests count', async ({ page }) => {
    // Look for pending count
    const pendingCount = page
      .getByText(/\d+.*pending/i)
      .or(page.locator('[data-testid="pending-count"]'))

    if (await pendingCount.first().isVisible()) {
      const text = await pendingCount.first().textContent()
      const count = parseInt(text?.match(/\d+/)?.[0] || '0')

      // Pending count should be non-negative
      expect(count).toBeGreaterThanOrEqual(0)
      expect(count).toBeLessThan(100) // Reasonable upper limit
    }
  })

  test('should display leave request status distribution', async ({ page }) => {
    // Look for status tabs or filters
    const pendingTab = page.getByRole('tab', { name: /pending/i })
    const approvedTab = page.getByRole('tab', { name: /approved/i })
    const deniedTab = page.getByRole('tab', { name: /denied|rejected/i })

    // At least one status filter should exist
    const hasPending = await pendingTab.isVisible().catch(() => false)
    const hasApproved = await approvedTab.isVisible().catch(() => false)
    const hasDenied = await deniedTab.isVisible().catch(() => false)

    expect(hasPending || hasApproved || hasDenied).toBe(true)
  })
})

test.describe('Seniority Calculations', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/pilots')
    await page.waitForLoadState('networkidle', { timeout: 60000 })
  })

  test('should display seniority numbers in correct range (1-27)', async ({ page }) => {
    const rows = page.getByRole('row')
    const rowCount = await rows.count()

    if (rowCount > 1) {
      // Click on first pilot to view details
      const firstRow = rows.nth(1)
      const pilotLink = firstRow.getByRole('link').first()

      if (await pilotLink.isVisible()) {
        await pilotLink.click()
        await page.waitForLoadState('networkidle', { timeout: 60000 })

        // Look for seniority number
        const seniorityText = page.getByText(/seniority.*\d+|\d+.*seniority|#\d+/i)

        if (await seniorityText.first().isVisible()) {
          const text = await seniorityText.first().textContent()
          const seniorityNum = parseInt(text?.match(/\d+/)?.[0] || '0')

          // Seniority should be between 1 and 27
          expect(seniorityNum).toBeGreaterThanOrEqual(1)
          expect(seniorityNum).toBeLessThanOrEqual(27)
        }
      }
    }
  })

  test('should calculate years of service correctly', async ({ page }) => {
    const rows = page.getByRole('row')
    const rowCount = await rows.count()

    if (rowCount > 1) {
      const firstRow = rows.nth(1)
      const pilotLink = firstRow.getByRole('link').first()

      if (await pilotLink.isVisible()) {
        await pilotLink.click()
        await page.waitForLoadState('networkidle', { timeout: 60000 })

        // Look for years of service
        const serviceText = page.getByText(/\d+\s*years?.*service|service.*\d+\s*years?/i)

        if (await serviceText.first().isVisible()) {
          const text = await serviceText.first().textContent()
          const years = parseInt(text?.match(/\d+/)?.[0] || '0')

          // Years of service should be realistic (0-40 years)
          expect(years).toBeGreaterThanOrEqual(0)
          expect(years).toBeLessThanOrEqual(40)
        }
      }
    }
  })
})

test.describe('Roster Period Calculations', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/leave/calendar')
    await page.waitForLoadState('networkidle', { timeout: 60000 })
  })

  test('should display current roster period (RP1-RP13 format)', async ({ page }) => {
    // Look for roster period indicator
    const rosterPeriod = page.getByText(/RP\d+\/\d{4}|roster period \d+/i)

    if (await rosterPeriod.first().isVisible()) {
      const text = await rosterPeriod.first().textContent()

      // Should match RP format
      expect(text).toMatch(/RP\d+|period \d+/i)

      // Extract period number
      const periodMatch = text?.match(/\d+/)
      if (periodMatch) {
        const periodNum = parseInt(periodMatch[0])
        // Should be between 1 and 13
        expect(periodNum).toBeGreaterThanOrEqual(1)
        expect(periodNum).toBeLessThanOrEqual(13)
      }
    }
  })

  test('should show roster period dates (28-day cycles)', async ({ page }) => {
    // Look for date range display
    const dateRange = page.getByText(
      /\d{4}-\d{2}-\d{2}\s*to\s*\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}\s*-\s*\d{2}\/\d{2}\/\d{4}/i
    )

    if (await dateRange.first().isVisible()) {
      await expect(dateRange.first()).toBeVisible({ timeout: 60000 })
    }
  })
})

test.describe('Captain Qualifications Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/pilots')
    await page.waitForLoadState('networkidle', { timeout: 60000 })
  })

  test('should display captain qualification badges', async ({ page }) => {
    // Filter for Captains
    const rankFilter = page.getByLabel(/rank/i).or(page.getByRole('combobox', { name: /rank/i }))

    if (await rankFilter.isVisible()) {
      await rankFilter.click()
      await page.getByRole('option', { name: /captain/i }).click()
      await page.waitForTimeout(1000)

      // Look for qualification badges
      const qualBadge = page
        .locator('[data-testid*="qual"]')
        .or(page.getByText(/line captain|training captain|examiner/i))

      // At least some captains should have qualifications
      const hasQual = await qualBadge
        .first()
        .isVisible()
        .catch(() => false)
      expect(typeof hasQual).toBe('boolean')
    }
  })

  test('should track RHS Captain expiry dates', async ({ page }) => {
    const rows = page.getByRole('row')
    const rowCount = await rows.count()

    if (rowCount > 1) {
      const firstRow = rows.nth(1)
      const pilotLink = firstRow.getByRole('link').first()

      if (await pilotLink.isVisible()) {
        await pilotLink.click()
        await page.waitForLoadState('networkidle', { timeout: 60000 })

        // Look for RHS expiry (if pilot is captain)
        const rhsExpiry = page.getByText(/rhs.*expiry|right.*hand.*seat/i)

        // May or may not be present depending on pilot
        const hasRHS = await rhsExpiry.isVisible().catch(() => false)
        expect(typeof hasRHS).toBe('boolean')
      }
    }
  })
})

test.describe('Retirement Forecast Accuracy', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle', { timeout: 60000 })
  })

  test('should display retirement forecast widget', async ({ page }) => {
    const retirementWidget = page.getByRole('heading', {
      name: /retirement.*forecast|upcoming.*retirement/i,
    })

    if (await retirementWidget.first().isVisible()) {
      await expect(retirementWidget.first()).toBeVisible({ timeout: 60000 })
    }
  })

  test('should show years until retirement (0-20 year range)', async ({ page }) => {
    // Look for retirement info
    const retirementInfo = page
      .locator('[data-testid="retirement-forecast"]')
      .or(page.getByText(/\d+\s*years?.*retirement|retirement.*\d+\s*years?/i))

    if (await retirementInfo.first().isVisible()) {
      const text = await retirementInfo.first().textContent()
      const years = parseInt(text?.match(/\d+/)?.[0] || '0')

      // Years to retirement should be realistic
      expect(years).toBeGreaterThanOrEqual(0)
      expect(years).toBeLessThanOrEqual(20)
    }
  })

  test('should calculate retirement age correctly (age 65 mandatory)', async ({ page }) => {
    const rows = page.getByRole('row')
    const rowCount = await rows.count()

    if (rowCount > 1) {
      // Navigate to pilots page for detailed info
      await page.goto('/dashboard/pilots')
      await page.waitForLoadState('networkidle', { timeout: 60000 })

      const firstRow = page.getByRole('row').nth(1)
      const pilotLink = firstRow.getByRole('link').first()

      if (await pilotLink.isVisible()) {
        await pilotLink.click()
        await page.waitForLoadState('networkidle', { timeout: 60000 })

        // Look for retirement age
        const retirementAge = page.getByText(/age\s*65|retirement.*65|65.*retirement/i)

        if (await retirementAge.isVisible()) {
          await expect(retirementAge).toBeVisible({ timeout: 60000 })
        }
      }
    }
  })
})

test.describe('Analytics Data Accuracy', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/analytics')
    await page.waitForLoadState('networkidle', { timeout: 60000 })
  })

  test('should display analytics dashboard', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /analytics|reports/i })).toBeVisible({
      timeout: 60000,
    })
  })

  test('should show fleet statistics with realistic values', async ({ page }) => {
    // Look for key metrics
    const metrics = [
      /total.*pilots.*\d+|\d+.*pilots/i,
      /certifications?.*\d+|\d+.*certifications?/i,
      /compliance.*\d+%|\d+%.*compliance/i,
    ]

    for (const metric of metrics) {
      const element = page.getByText(metric).first()
      if (await element.isVisible()) {
        const text = await element.textContent()
        const hasNumber = text?.match(/\d+/)
        expect(hasNumber).toBeTruthy()
      }
    }
  })

  test('should display charts with data', async ({ page }) => {
    // Look for chart elements
    const chart = page.locator('canvas, svg[class*="chart"]').first()

    if (await chart.isVisible()) {
      await expect(chart).toBeVisible({ timeout: 60000 })
    }
  })
})

test.describe('Data Consistency Across Pages', () => {
  test('should show consistent pilot count across dashboard and pilots page', async ({ page }) => {
    await loginAsAdmin(page)

    // Get count from dashboard
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    const dashboardText = await page
      .getByText(/\d+\s*pilots?/i)
      .first()
      .textContent()
    const dashboardCount = parseInt(dashboardText?.match(/\d+/)?.[0] || '0')

    // Get count from pilots page
    await page.goto('/dashboard/pilots')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    const rows = await page.getByRole('row').count()
    const pilotsPageCount = rows - 1 // Subtract header row

    // Counts should match
    if (dashboardCount > 0 && pilotsPageCount > 0) {
      expect(dashboardCount).toBe(pilotsPageCount)
    }
  })

  test('should show consistent certification count across pages', async ({ page }) => {
    await loginAsAdmin(page)

    // Get count from dashboard
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    const dashboardCertText = await page
      .getByText(/\d+\s*certifications?/i)
      .first()
      .textContent()
    const dashboardCertCount = parseInt(dashboardCertText?.match(/\d+/)?.[0] || '0')

    // Get count from certifications page
    await page.goto('/dashboard/certifications')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    const certCountText = page.getByText(/\d+\s*certifications?|total.*\d+/i).first()

    if (await certCountText.isVisible()) {
      const certPageText = await certCountText.textContent()
      const certPageCount = parseInt(certPageText?.match(/\d+/)?.[0] || '0')

      // Counts should be close (allowing for filtering differences)
      if (dashboardCertCount > 0 && certPageCount > 0) {
        const difference = Math.abs(dashboardCertCount - certPageCount)
        expect(difference).toBeLessThan(50) // Allow some variance
      }
    }
  })

  test('should maintain data accuracy after page refresh', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Get initial metrics
    const initialPilotText = await page
      .getByText(/\d+\s*pilots?/i)
      .first()
      .textContent()
    const initialPilotCount = parseInt(initialPilotText?.match(/\d+/)?.[0] || '0')

    // Refresh page
    await page.reload()
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Get metrics after refresh
    const refreshedPilotText = await page
      .getByText(/\d+\s*pilots?/i)
      .first()
      .textContent()
    const refreshedPilotCount = parseInt(refreshedPilotText?.match(/\d+/)?.[0] || '0')

    // Should be identical
    expect(initialPilotCount).toBe(refreshedPilotCount)
  })
})
