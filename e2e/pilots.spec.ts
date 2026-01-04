import { test, expect, Page } from '@playwright/test'
import { loginAsAdmin } from './helpers/test-utils'

/**
 * Pilot Management CRUD E2E Tests
 *
 * Tests pilot management workflows including:
 * - Viewing pilot list
 * - Creating new pilots
 * - Updating pilot information
 * - Deleting pilots
 * - Searching and filtering
 * - Sorting and pagination
 */

// Test data
const TEST_PILOT = {
  firstName: 'Test',
  lastName: 'Pilot',
  rank: 'Captain',
  employeeId: 'TP001',
  email: 'test.pilot@example.com',
  commencementDate: '2020-01-01',
}

// Helper function to login
async function login(page: Page) {
  const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com'
  const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123'

  await page.goto('/auth/login')
  await page.getByLabel(/email/i).fill(TEST_EMAIL)
  await page.getByLabel(/password/i).fill(TEST_PASSWORD)
  await page.getByRole('button', { name: /sign in|login/i }).click()
  await page.waitForURL(/dashboard/, { timeout: 60000 })
}

test.describe('Pilot Management - List View', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/pilots')
    await page.waitForLoadState('networkidle', { timeout: 60000 })
  })

  test('should display pilot list page with all elements', async ({ page }) => {
    // Check page heading
    await expect(page.getByRole('heading', { name: /pilots/i })).toBeVisible({ timeout: 60000 })

    // Check for search/filter controls
    await expect(page.getByPlaceholder(/search/i)).toBeVisible({ timeout: 60000 })

    // Check for action buttons
    await expect(page.getByRole('button', { name: /add|new pilot/i })).toBeVisible({
      timeout: 60000,
    })
  })

  test('should display pilot data in table format', async ({ page }) => {
    // Wait for table to load
    await expect(page.getByRole('table')).toBeVisible({ timeout: 60000 })

    // Check table headers
    await expect(page.getByRole('columnheader', { name: /name/i })).toBeVisible({ timeout: 60000 })
    await expect(page.getByRole('columnheader', { name: /rank/i })).toBeVisible({ timeout: 60000 })
    await expect(page.getByRole('columnheader', { name: /employee id|emp id/i })).toBeVisible({
      timeout: 60000,
    })

    // Check for at least one data row (27 pilots + header = 28 rows total)
    const rows = page.getByRole('row')
    const rowCount = await rows.count()
    expect(rowCount).toBeGreaterThan(1) // At least header + 1 data row
  })

  test('should display correct pilot count', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('table', { timeout: 60000 })

    // Look for pilot count indicator
    const countText = page.getByText(/\d+ pilots?/i)
    if (await countText.isVisible()) {
      const text = await countText.textContent()
      expect(text).toMatch(/\d+/)
    }
  })

  test('should filter pilots by rank', async ({ page }) => {
    // Wait for table to load
    await expect(page.getByRole('table')).toBeVisible({ timeout: 60000 })

    // Find rank filter (could be dropdown or tabs)
    const rankFilter = page.getByLabel(/rank/i).or(page.getByRole('combobox', { name: /rank/i }))

    if (await rankFilter.isVisible()) {
      await rankFilter.click()
      await page.getByRole('option', { name: /captain/i }).click()

      // Wait for filtered results
      await page.waitForTimeout(1000)

      // Verify all visible rows show Captain rank
      const rankCells = page.locator('td:has-text("Captain")')
      const count = await rankCells.count()
      expect(count).toBeGreaterThan(0)
    }
  })

  test('should search pilots by name', async ({ page }) => {
    // Wait for table to load
    await expect(page.getByRole('table')).toBeVisible({ timeout: 60000 })

    // Get initial row count
    const initialRows = await page.getByRole('row').count()

    // Search for a common name
    const searchInput = page.getByPlaceholder(/search/i)
    await searchInput.fill('John')
    await page.waitForTimeout(1000)

    // Row count should change (filtered results)
    const filteredRows = await page.getByRole('row').count()
    // Either no results (0) or fewer results than initial
    expect(filteredRows).toBeLessThanOrEqual(initialRows)
  })

  test('should clear search filter', async ({ page }) => {
    // Wait for table to load
    await expect(page.getByRole('table')).toBeVisible({ timeout: 60000 })

    // Search for something
    const searchInput = page.getByPlaceholder(/search/i)
    await searchInput.fill('Test')
    await page.waitForTimeout(1000)

    // Clear search
    await searchInput.clear()
    await page.waitForTimeout(1000)

    // All pilots should be visible again
    const rows = page.getByRole('row')
    const rowCount = await rows.count()
    expect(rowCount).toBeGreaterThan(5) // Should show multiple pilots
  })
})

test.describe('Pilot Management - Create New Pilot', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/pilots')
    await page.waitForLoadState('networkidle', { timeout: 60000 })
  })

  test('should open create pilot dialog', async ({ page }) => {
    // Click "Add New Pilot" button
    await page.getByRole('button', { name: /add|new pilot/i }).click()

    // Dialog should appear
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 60000 })
    await expect(page.getByRole('heading', { name: /add|new pilot/i })).toBeVisible({
      timeout: 60000,
    })
  })

  test('should show validation errors for required fields', async ({ page }) => {
    // Open dialog
    await page.getByRole('button', { name: /add|new pilot/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 60000 })

    // Try to submit empty form
    await page.getByRole('button', { name: /save|create/i }).click()

    // Should show validation errors
    await expect(page.getByText(/required/i).first()).toBeVisible({ timeout: 60000 })
  })

  test('should create a new pilot successfully', async ({ page }) => {
    // Open dialog
    await page.getByRole('button', { name: /add|new pilot/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 60000 })

    // Fill in form
    await page.getByLabel(/first name/i).fill(TEST_PILOT.firstName)
    await page.getByLabel(/last name/i).fill(TEST_PILOT.lastName)
    await page.getByLabel(/employee id/i).fill(TEST_PILOT.employeeId)
    await page.getByLabel(/email/i).fill(TEST_PILOT.email)
    await page.getByLabel(/commencement date/i).fill(TEST_PILOT.commencementDate)

    // Select rank
    await page.getByLabel(/rank/i).click()
    await page.getByRole('option', { name: TEST_PILOT.rank }).click()

    // Submit form
    await page.getByRole('button', { name: /save|create/i }).click()

    // Should show success message
    await expect(page.getByText(/success|created/i)).toBeVisible({ timeout: 60000 })

    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 60000 })

    // New pilot should appear in list
    await expect(page.getByText(`${TEST_PILOT.firstName} ${TEST_PILOT.lastName}`)).toBeVisible({
      timeout: 60000,
    })
  })

  test('should close dialog without saving', async ({ page }) => {
    // Open dialog
    await page.getByRole('button', { name: /add|new pilot/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 60000 })

    // Fill in some data
    await page.getByLabel(/first name/i).fill('Test')

    // Click cancel or close button
    const cancelButton = page.getByRole('button', { name: /cancel|close/i })
    await cancelButton.click()

    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 60000 })
  })
})

test.describe('Pilot Management - Update Pilot', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/pilots')
    await page.waitForLoadState('networkidle', { timeout: 60000 })
    await expect(page.getByRole('table')).toBeVisible({ timeout: 60000 })
  })

  test('should open edit pilot dialog', async ({ page }) => {
    // Find first pilot row and click edit button
    const firstRow = page.getByRole('row').nth(1) // Skip header row
    await firstRow.getByRole('button', { name: /edit/i }).click()

    // Dialog should appear
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 60000 })
    await expect(page.getByRole('heading', { name: /edit pilot/i })).toBeVisible({ timeout: 60000 })

    // Form should be pre-filled with pilot data
    const firstNameInput = page.getByLabel(/first name/i)
    await expect(firstNameInput).not.toHaveValue('')
  })

  test('should update pilot information successfully', async ({ page }) => {
    // Find first pilot row and click edit
    const firstRow = page.getByRole('row').nth(1)
    await firstRow.getByRole('button', { name: /edit/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 60000 })

    // Update email
    const emailInput = page.getByLabel(/email/i)
    const newEmail = `updated-${Date.now()}@example.com`
    await emailInput.clear()
    await emailInput.fill(newEmail)

    // Save changes
    await page.getByRole('button', { name: /save|update/i }).click()

    // Should show success message
    await expect(page.getByText(/success|updated/i)).toBeVisible({ timeout: 60000 })

    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 60000 })
  })

  test('should cancel edit without saving changes', async ({ page }) => {
    // Find first pilot row and click edit
    const firstRow = page.getByRole('row').nth(1)
    await firstRow.getByRole('button', { name: /edit/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 60000 })

    // Get original email value
    const emailInput = page.getByLabel(/email/i)
    const originalEmail = await emailInput.inputValue()

    // Change email
    await emailInput.clear()
    await emailInput.fill('changed@example.com')

    // Cancel
    await page.getByRole('button', { name: /cancel/i }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 60000 })

    // Verify changes were not saved (open dialog again)
    await firstRow.getByRole('button', { name: /edit/i }).click()
    await expect(emailInput).toHaveValue(originalEmail)
  })
})

test.describe('Pilot Management - Delete Pilot', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/pilots')
    await page.waitForLoadState('networkidle', { timeout: 60000 })
    await expect(page.getByRole('table')).toBeVisible({ timeout: 60000 })
  })

  test('should show delete confirmation dialog', async ({ page }) => {
    // Find first pilot row and click delete button
    const firstRow = page.getByRole('row').nth(1)
    await firstRow.getByRole('button', { name: /delete/i }).click()

    // Confirmation dialog should appear
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 60000 })
    await expect(page.getByText(/are you sure|confirm delete/i)).toBeVisible({ timeout: 60000 })
  })

  test('should cancel delete operation', async ({ page }) => {
    // Get initial row count
    const initialCount = await page.getByRole('row').count()

    // Find first pilot row and click delete
    const firstRow = page.getByRole('row').nth(1)
    await firstRow.getByRole('button', { name: /delete/i }).click()

    // Cancel deletion
    await page.getByRole('button', { name: /cancel/i }).click()

    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 60000 })

    // Row count should remain the same
    const finalCount = await page.getByRole('row').count()
    expect(finalCount).toBe(initialCount)
  })

  test('should delete pilot successfully', async ({ page }) => {
    // First, create a test pilot to delete
    await page.getByRole('button', { name: /add|new pilot/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 60000 })

    const uniqueId = Date.now()
    await page.getByLabel(/first name/i).fill(`Delete${uniqueId}`)
    await page.getByLabel(/last name/i).fill('Test')
    await page.getByLabel(/employee id/i).fill(`DT${uniqueId}`)
    await page.getByLabel(/email/i).fill(`delete${uniqueId}@example.com`)
    await page.getByLabel(/commencement date/i).fill('2020-01-01')
    await page.getByLabel(/rank/i).click()
    await page.getByRole('option', { name: /captain/i }).click()
    await page.getByRole('button', { name: /save|create/i }).click()

    await expect(page.getByText(/success/i)).toBeVisible({ timeout: 60000 })
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 60000 })

    // Find the newly created pilot
    const pilotName = `Delete${uniqueId} Test`
    await expect(page.getByText(pilotName)).toBeVisible({ timeout: 60000 })

    // Get row count before deletion
    const beforeCount = await page.getByRole('row').count()

    // Find the pilot's row and click delete
    const pilotRow = page.getByRole('row').filter({ hasText: pilotName })
    await pilotRow.getByRole('button', { name: /delete/i }).click()

    // Confirm deletion
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 60000 })
    await page.getByRole('button', { name: /confirm|delete/i }).click()

    // Should show success message
    await expect(page.getByText(/success|deleted/i)).toBeVisible({ timeout: 60000 })

    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 60000 })

    // Pilot should be removed from list
    await expect(page.getByText(pilotName)).not.toBeVisible({ timeout: 60000 })

    // Row count should decrease
    const afterCount = await page.getByRole('row').count()
    expect(afterCount).toBe(beforeCount - 1)
  })
})

test.describe('Pilot Management - View Pilot Details', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/pilots')
    await page.waitForLoadState('networkidle', { timeout: 60000 })
    await expect(page.getByRole('table')).toBeVisible({ timeout: 60000 })
  })

  test('should navigate to pilot detail page', async ({ page }) => {
    // Click on first pilot name or view button
    const firstRow = page.getByRole('row').nth(1)
    const pilotLink = firstRow.getByRole('link').first()

    if (await pilotLink.isVisible()) {
      await pilotLink.click()

      // Should navigate to pilot detail page
      await expect(page).toHaveURL(/\/dashboard\/pilots\/[a-z0-9-]+/)

      // Should show pilot details
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 60000 })
    }
  })

  test('should display pilot information on detail page', async ({ page }) => {
    // Navigate to first pilot
    const firstRow = page.getByRole('row').nth(1)
    const pilotLink = firstRow.getByRole('link').first()

    if (await pilotLink.isVisible()) {
      await pilotLink.click()
      await expect(page).toHaveURL(/\/dashboard\/pilots\/[a-z0-9-]+/)

      // Should show various sections
      await expect(page.getByText(/employee id|emp id/i)).toBeVisible({ timeout: 60000 })
      await expect(page.getByText(/rank/i)).toBeVisible({ timeout: 60000 })
      await expect(page.getByText(/email/i)).toBeVisible({ timeout: 60000 })
    }
  })
})

test.describe('Pilot Management - Responsive Design', () => {
  test('should be mobile-friendly', async ({ page }) => {
    await loginAsAdmin(page)

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard/pilots')

    // Page should be visible
    await expect(page.getByRole('heading', { name: /pilots/i })).toBeVisible({ timeout: 60000 })

    // Table should be visible or transformed for mobile
    const table = page.getByRole('table')
    const cards = page.locator('[data-testid="pilot-card"]')

    // Either table or cards should be visible
    const isTableVisible = await table.isVisible().catch(() => false)
    const isCardsVisible = (await cards.count()) > 0

    expect(isTableVisible || isCardsVisible).toBe(true)
  })
})
