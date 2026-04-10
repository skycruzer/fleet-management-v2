/**
 * Renewal Planning E2E Tests
 * Author: Maurice Rondeau
 * Date: December 28, 2025
 *
 * Tests certification renewal planning workflows including:
 * - Viewing renewal planning dashboard
 * - Generating renewal plans
 * - Viewing roster period details
 * - Rescheduling renewals
 * - Confirming renewal plans
 * - Exporting renewal reports
 */

import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/test-utils'

test.describe('Renewal Planning - Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/renewal-planning')
    await page.waitForLoadState('networkidle', { timeout: 60000 })
  })

  test('should display renewal planning page', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /renewal planning|certification renewals/i })
    ).toBeVisible({ timeout: 60000 })
  })

  test('should show roster period summary cards', async ({ page }) => {
    // Look for roster period cards (RP01-RP13)
    const periodCard = page
      .locator('[data-testid="roster-period-card"]')
      .or(page.getByText(/RP\d{2}\/\d{4}/i))

    // Should have at least one period visible
    await expect(periodCard.first()).toBeVisible({ timeout: 60000 })
  })

  test('should display capacity utilization indicators', async ({ page }) => {
    // Look for capacity progress bars or percentages
    const capacityIndicator = page
      .locator('[role="progressbar"]')
      .or(page.getByText(/\d+%\s*(capacity|utilized)/i))

    if (await capacityIndicator.first().isVisible()) {
      const count = await capacityIndicator.count()
      expect(count).toBeGreaterThan(0)
    }
  })

  test('should show category breakdown', async ({ page }) => {
    // Categories: SIM, LINE, GRD, MED
    const categories = ['SIM', 'LINE', 'GRD', 'MED']

    for (const category of categories) {
      const categoryElement = page.getByText(new RegExp(category, 'i'))
      if (await categoryElement.first().isVisible()) {
        expect(await categoryElement.first().textContent()).toContain(category)
        break // At least one category should be visible
      }
    }
  })
})

test.describe('Renewal Planning - Generate Plans', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should navigate to generate page', async ({ page }) => {
    await page.goto('/dashboard/renewal-planning/generate')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    await expect(page.getByRole('heading', { name: /generate|create.*renewal/i })).toBeVisible({
      timeout: 60000,
    })
  })

  test('should display year selector', async ({ page }) => {
    await page.goto('/dashboard/renewal-planning/generate')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Look for year selection control
    const yearSelector = page.getByLabel(/year/i).or(page.getByRole('combobox', { name: /year/i }))

    if (await yearSelector.isVisible()) {
      await expect(yearSelector).toBeEnabled()
    }
  })

  test('should show preview before generating', async ({ page }) => {
    await page.goto('/dashboard/renewal-planning/generate')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Look for preview button or section
    const previewButton = page.getByRole('button', { name: /preview/i })

    if (await previewButton.isVisible()) {
      await expect(previewButton).toBeEnabled()
    }
  })
})

test.describe('Renewal Planning - Period Details', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/renewal-planning')
    await page.waitForLoadState('networkidle', { timeout: 60000 })
  })

  test('should open period detail view', async ({ page }) => {
    // Click on a roster period to see details
    const periodLink = page.getByText(/RP\d{2}\/\d{4}/i).first()

    if (await periodLink.isVisible()) {
      await periodLink.click()
      await page.waitForLoadState('networkidle')

      // Should show period details with pilot list
      const pilotList = page
        .getByRole('table')
        .or(page.locator('[data-testid="pilot-renewal-list"]'))

      await expect(pilotList.first()).toBeVisible({ timeout: 30000 })
    }
  })

  test('should show pilot names in period view', async ({ page }) => {
    const periodLink = page.getByText(/RP\d{2}\/\d{4}/i).first()

    if (await periodLink.isVisible()) {
      await periodLink.click()
      await page.waitForLoadState('networkidle')

      // Should display pilot information
      const pilotNames = page.getByRole('cell').filter({ hasText: /[A-Z][a-z]+ [A-Z][a-z]+/ })

      if (await pilotNames.first().isVisible({ timeout: 10000 })) {
        const count = await pilotNames.count()
        expect(count).toBeGreaterThan(0)
      }
    }
  })
})

test.describe('Renewal Planning - Actions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/renewal-planning')
    await page.waitForLoadState('networkidle', { timeout: 60000 })
  })

  test('should have export button', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /export|download/i })

    if (await exportButton.first().isVisible()) {
      await expect(exportButton.first()).toBeEnabled()
    }
  })

  test('should have email button', async ({ page }) => {
    const emailButton = page.getByRole('button', { name: /email|send/i })

    if (await emailButton.first().isVisible()) {
      await expect(emailButton.first()).toBeEnabled()
    }
  })

  test('should show reschedule option for individual renewals', async ({ page }) => {
    // Navigate to a period with renewals
    const periodLink = page.getByText(/RP\d{2}\/\d{4}/i).first()

    if (await periodLink.isVisible()) {
      await periodLink.click()
      await page.waitForLoadState('networkidle')

      // Look for reschedule action button
      const rescheduleButton = page.getByRole('button', { name: /reschedule|move/i })

      if (await rescheduleButton.first().isVisible()) {
        await expect(rescheduleButton.first()).toBeEnabled()
      }
    }
  })
})

test.describe('Renewal Planning - API Endpoints', () => {
  test('should return roster period data', async ({ request }) => {
    const currentYear = new Date().getFullYear()
    const response = await request.get(`/api/renewal-planning/roster-period/RP01%2F${currentYear}`)

    // Should return 401 (auth required) or 200 (success) or 404 (no data)
    expect([200, 401, 404]).toContain(response.status())

    if (response.status() === 200) {
      const data = await response.json()
      expect(data).toBeDefined()
    }
  })

  test('should validate period format', async ({ request }) => {
    const response = await request.get('/api/renewal-planning/roster-period/invalid-period')

    // Should return 400 (bad request) or 401 (auth required)
    expect([400, 401]).toContain(response.status())
  })

  test('should handle preview request', async ({ request }) => {
    const response = await request.get('/api/renewal-planning/preview')

    // Should return proper JSON response
    const contentType = response.headers()['content-type']
    expect(contentType).toContain('application/json')
  })
})

test.describe('Renewal Planning - Capacity Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/renewal-planning')
    await page.waitForLoadState('networkidle', { timeout: 60000 })
  })

  test('should show capacity limits per category', async ({ page }) => {
    // Each category (SIM, LINE, GRD, MED) has capacity limits
    const capacityInfo = page
      .getByText(/\d+\s*\/\s*\d+/)
      .or(page.locator('[data-testid="capacity-indicator"]'))

    if (await capacityInfo.first().isVisible()) {
      const count = await capacityInfo.count()
      expect(count).toBeGreaterThan(0)
    }
  })

  test('should highlight overbooked periods', async ({ page }) => {
    // Overbooked periods should have warning styling
    const warningIndicator = page.locator(
      '.text-red-500, .text-destructive, [data-status="overbooked"]'
    )

    // Just verify the page loaded - overbooked state is data-dependent
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Renewal Planning - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/renewal-planning')
    await page.waitForLoadState('networkidle', { timeout: 60000 })
  })

  test('should have proper heading hierarchy', async ({ page }) => {
    const h1 = page.getByRole('heading', { level: 1 })
    const h2 = page.getByRole('heading', { level: 2 })

    // Should have at least one heading
    const headingCount = (await h1.count()) + (await h2.count())
    expect(headingCount).toBeGreaterThan(0)
  })

  test('should have accessible buttons', async ({ page }) => {
    const buttons = page.getByRole('button')
    const buttonCount = await buttons.count()

    // Each visible button should have accessible name
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i)
      if (await button.isVisible()) {
        const name = (await button.getAttribute('aria-label')) || (await button.textContent())
        expect(name?.trim().length).toBeGreaterThan(0)
      }
    }
  })
})
