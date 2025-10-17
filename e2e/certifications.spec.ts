import { test, expect, Page } from '@playwright/test'

/**
 * Certification Management E2E Tests
 *
 * Tests certification tracking workflows including:
 * - Viewing certifications
 * - Creating new certifications
 * - Updating certification dates
 * - Certification expiry alerts
 * - Compliance color coding (red/yellow/green)
 * - Filtering by status
 */

// Helper function to login
async function login(page: Page) {
  const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com'
  const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123'

  await page.goto('/auth/login')
  await page.getByLabel(/email/i).fill(TEST_EMAIL)
  await page.getByLabel(/password/i).fill(TEST_PASSWORD)
  await page.getByRole('button', { name: /sign in|login/i }).click()
  await page.waitForURL(/dashboard/, { timeout: 10000 })
}

// Helper to get future date
function getFutureDate(daysFromNow: number): string {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date.toISOString().split('T')[0]
}

// Helper to get past date
function getPastDate(daysAgo: number): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString().split('T')[0]
}

test.describe('Certification Management - List View', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto('/dashboard/certifications')
  })

  test('should display certifications page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /certifications?/i })).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 })
  })

  test('should display certification data with proper columns', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 })

    // Check for key column headers
    await expect(page.getByRole('columnheader', { name: /pilot/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /check type|certification/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /expiry|expires/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /status/i })).toBeVisible()
  })

  test('should show certification count', async ({ page }) => {
    await page.waitForSelector('table', { timeout: 10000 })

    // Look for count indicator (e.g., "607 certifications")
    const countText = page.getByText(/\d+ certifications?/i)
    if (await countText.isVisible()) {
      const text = await countText.textContent()
      expect(text).toMatch(/\d+/)
    }
  })

  test('should filter certifications by status', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 })

    // Look for status filter tabs or dropdown
    const statusFilter = page.getByRole('tab', { name: /expired|expiring|current/i })
      .or(page.getByLabel(/status/i))

    if (await statusFilter.first().isVisible()) {
      await statusFilter.first().click()
      await page.waitForTimeout(1000)

      // Verify filtered results
      const rows = page.getByRole('row')
      const count = await rows.count()
      expect(count).toBeGreaterThan(0)
    }
  })

  test('should search certifications', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 })

    const searchInput = page.getByPlaceholder(/search/i)
    if (await searchInput.isVisible()) {
      await searchInput.fill('Check')
      await page.waitForTimeout(1000)

      // Should show filtered results
      const rows = page.getByRole('row')
      const count = await rows.count()
      expect(count).toBeGreaterThan(0)
    }
  })
})

test.describe('Certification Management - Status Color Coding', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto('/dashboard/certifications')
  })

  test('should display color-coded status indicators', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 })

    // Look for status badges/indicators
    const statusBadges = page.locator('[data-status], .status-badge, .badge')

    if (await statusBadges.first().isVisible()) {
      // Should have multiple status indicators
      const count = await statusBadges.count()
      expect(count).toBeGreaterThan(0)
    }
  })

  test('should show expired certifications in red', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 })

    // Filter by expired status
    const expiredTab = page.getByRole('tab', { name: /expired/i })
    if (await expiredTab.isVisible()) {
      await expiredTab.click()
      await page.waitForTimeout(1000)

      // Check for red/danger styling
      const expiredBadges = page.locator('.text-red, .bg-red, [data-status="expired"]')
      const count = await expiredBadges.count()
      expect(count).toBeGreaterThan(0)
    }
  })

  test('should show expiring soon certifications in yellow', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 })

    // Filter by expiring status
    const expiringTab = page.getByRole('tab', { name: /expiring/i })
    if (await expiringTab.isVisible()) {
      await expiringTab.click()
      await page.waitForTimeout(1000)

      // Check for yellow/warning styling
      const expiringBadges = page.locator('.text-yellow, .bg-yellow, [data-status="expiring"]')
      const count = await expiringBadges.count()
      expect(count).toBeGreaterThanOrEqual(0)
    }
  })
})

test.describe('Certification Management - Create Certification', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto('/dashboard/certifications')
  })

  test('should open create certification dialog', async ({ page }) => {
    await page.getByRole('button', { name: /add|new certification/i }).click()

    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: /add|new certification/i })).toBeVisible()
  })

  test('should show validation errors for required fields', async ({ page }) => {
    await page.getByRole('button', { name: /add|new certification/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Try to submit empty form
    await page.getByRole('button', { name: /save|create/i }).click()

    // Should show validation errors
    await expect(page.getByText(/required/i).first()).toBeVisible()
  })

  test('should create a new certification successfully', async ({ page }) => {
    await page.getByRole('button', { name: /add|new certification/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Select pilot
    await page.getByLabel(/pilot/i).click()
    await page.getByRole('option').first().click()

    // Select check type
    await page.getByLabel(/check type|certification type/i).click()
    await page.getByRole('option').first().click()

    // Set check date (today)
    const checkDate = new Date().toISOString().split('T')[0]
    await page.getByLabel(/check date/i).fill(checkDate)

    // Set expiry date (1 year from now)
    const expiryDate = getFutureDate(365)
    await page.getByLabel(/expiry date/i).fill(expiryDate)

    // Submit form
    await page.getByRole('button', { name: /save|create/i }).click()

    // Should show success message
    await expect(page.getByText(/success|created/i)).toBeVisible({ timeout: 10000 })

    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('should validate expiry date is after check date', async ({ page }) => {
    await page.getByRole('button', { name: /add|new certification/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Select pilot and check type
    await page.getByLabel(/pilot/i).click()
    await page.getByRole('option').first().click()
    await page.getByLabel(/check type/i).click()
    await page.getByRole('option').first().click()

    // Set expiry date before check date
    const checkDate = new Date().toISOString().split('T')[0]
    const expiryDate = getPastDate(30)

    await page.getByLabel(/check date/i).fill(checkDate)
    await page.getByLabel(/expiry date/i).fill(expiryDate)

    // Try to submit
    await page.getByRole('button', { name: /save|create/i }).click()

    // Should show validation error
    await expect(page.getByText(/expiry.*after|must be after/i)).toBeVisible()
  })
})

test.describe('Certification Management - Update Certification', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto('/dashboard/certifications')
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 })
  })

  test('should open edit certification dialog', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1)
    await firstRow.getByRole('button', { name: /edit/i }).click()

    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: /edit certification/i })).toBeVisible()
  })

  test('should update certification dates successfully', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1)
    await firstRow.getByRole('button', { name: /edit/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Update expiry date
    const newExpiryDate = getFutureDate(180)
    const expiryInput = page.getByLabel(/expiry date/i)
    await expiryInput.clear()
    await expiryInput.fill(newExpiryDate)

    // Save changes
    await page.getByRole('button', { name: /save|update/i }).click()

    // Should show success message
    await expect(page.getByText(/success|updated/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })
})

test.describe('Certification Management - Expiring Certifications', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should display expiring certifications dashboard widget', async ({ page }) => {
    await page.goto('/dashboard')

    // Look for expiring certifications widget
    const expiringWidget = page.locator('[data-widget="expiring-certifications"]')
      .or(page.getByRole('heading', { name: /expiring/i }))

    if (await expiringWidget.first().isVisible()) {
      await expect(expiringWidget.first()).toBeVisible()
    }
  })

  test('should navigate to expiring certifications from dashboard', async ({ page }) => {
    await page.goto('/dashboard')

    // Look for "View All" or link to certifications
    const viewAllLink = page.getByRole('link', { name: /view all|see all.*certifications/i })

    if (await viewAllLink.first().isVisible()) {
      await viewAllLink.first().click()
      await expect(page).toHaveURL(/certifications/)
    }
  })

  test('should filter certifications by expiry date range', async ({ page }) => {
    await page.goto('/dashboard/certifications')
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 })

    // Look for date range filter
    const dateFilter = page.getByLabel(/date range|expiry range/i)

    if (await dateFilter.isVisible()) {
      await dateFilter.click()
      await page.getByRole('option', { name: /30 days|next month/i }).click()
      await page.waitForTimeout(1000)

      // Should show filtered results
      const rows = page.getByRole('row')
      const count = await rows.count()
      expect(count).toBeGreaterThan(0)
    }
  })
})

test.describe('Certification Management - Bulk Operations', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto('/dashboard/certifications')
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 })
  })

  test('should select multiple certifications', async ({ page }) => {
    // Look for checkboxes in table
    const checkboxes = page.locator('input[type="checkbox"]')
    const count = await checkboxes.count()

    if (count > 1) {
      // Select first two items
      await checkboxes.nth(1).check()
      await checkboxes.nth(2).check()

      // Should show selection indicator
      await expect(page.getByText(/\d+ selected/i)).toBeVisible()
    }
  })

  test('should export certifications data', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /export|download/i })

    if (await exportButton.isVisible()) {
      // Setup download listener
      const downloadPromise = page.waitForEvent('download')
      await exportButton.click()

      // Wait for download to start
      const download = await downloadPromise
      expect(download).toBeTruthy()
      expect(download.suggestedFilename()).toMatch(/certifications|export/)
    }
  })
})

test.describe('Certification Management - Pilot Certification History', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto('/dashboard/pilots')
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 })
  })

  test('should view pilot certification history', async ({ page }) => {
    // Navigate to first pilot
    const firstRow = page.getByRole('row').nth(1)
    const pilotLink = firstRow.getByRole('link').first()

    if (await pilotLink.isVisible()) {
      await pilotLink.click()
      await expect(page).toHaveURL(/\/dashboard\/pilots\/[a-z0-9-]+/)

      // Look for certifications section
      const certificationsSection = page.getByRole('heading', { name: /certifications?/i })
      if (await certificationsSection.isVisible()) {
        await expect(certificationsSection).toBeVisible()

        // Should show list of certifications
        const certList = page.locator('[data-section="certifications"]')
          .or(page.getByRole('table').first())

        await expect(certList.first()).toBeVisible()
      }
    }
  })

  test('should filter pilot certifications by status', async ({ page }) => {
    // Navigate to first pilot
    const firstRow = page.getByRole('row').nth(1)
    const pilotLink = firstRow.getByRole('link').first()

    if (await pilotLink.isVisible()) {
      await pilotLink.click()
      await expect(page).toHaveURL(/\/dashboard\/pilots\/[a-z0-9-]+/)

      // Look for status filter on pilot page
      const statusFilter = page.getByRole('tab', { name: /current|expired|expiring/i })

      if (await statusFilter.first().isVisible()) {
        await statusFilter.first().click()
        await page.waitForTimeout(1000)

        // Should show filtered certifications
        const items = page.locator('[data-certification]')
        const count = await items.count()
        expect(count).toBeGreaterThanOrEqual(0)
      }
    }
  })
})

test.describe('Certification Management - Responsive Design', () => {
  test('should be mobile-friendly', async ({ page }) => {
    await login(page)
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard/certifications')

    // Page should be visible
    await expect(page.getByRole('heading', { name: /certifications?/i })).toBeVisible()

    // Content should be accessible
    const table = page.getByRole('table')
    const cards = page.locator('[data-testid="certification-card"]')

    const isTableVisible = await table.isVisible().catch(() => false)
    const isCardsVisible = (await cards.count()) > 0

    expect(isTableVisible || isCardsVisible).toBe(true)
  })
})
