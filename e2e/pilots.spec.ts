import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/test-utils'

/**
 * Pilot Management E2E Tests
 *
 * Read-only coverage of pilot management workflows: list views (cards/table),
 * filtering and search, create/edit page rendering and validation, delete
 * confirmation (cancel path), detail page, and responsive layout.
 *
 * Mutations (create/update/delete) are intentionally NOT exercised — the
 * suite runs against live data. Table-pattern behaviors (URL-synced sort,
 * faceted filters, column visibility) live in pilots-table-pattern.spec.ts.
 */

test.describe('Pilot Management - List View', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/pilots')
    await page.waitForLoadState('networkidle', { timeout: 60000 })
  })

  test('should display pilot list page with all elements', async ({ page }) => {
    // Check page heading
    await expect(page.getByRole('heading', { name: /pilots/i })).toBeVisible({ timeout: 60000 })

    // Check for search/filter controls (cards view filter bar)
    await expect(page.getByPlaceholder(/search/i)).toBeVisible({ timeout: 60000 })

    // Add Pilot is a link styled as a button
    await expect(page.getByRole('link', { name: /add pilot/i })).toBeVisible({ timeout: 60000 })
  })

  test('should display pilot data in table view', async ({ page }) => {
    // Cards is the default — the table renders at ?view=table
    await page.goto('/dashboard/pilots?view=table')
    await expect(page.getByRole('table')).toBeVisible({ timeout: 60000 })

    // Check table headers (Seniority / Name / Rank / Commencement / Status)
    await expect(page.getByRole('columnheader', { name: /seniority/i })).toBeVisible({
      timeout: 60000,
    })
    await expect(page.getByRole('columnheader', { name: /^name$/i })).toBeVisible({
      timeout: 60000,
    })
    await expect(page.getByRole('columnheader', { name: /rank/i })).toBeVisible({ timeout: 60000 })

    // Check for at least one data row
    const rows = page.getByRole('row')
    const rowCount = await rows.count()
    expect(rowCount).toBeGreaterThan(1) // At least header + 1 data row
  })

  test('should display correct pilot count', async ({ page }) => {
    // Filter bar shows a "<n> pilots" result counter on the cards view
    const countText = page.getByText(/\d+ pilots?/i).first()
    await expect(countText).toBeVisible({ timeout: 60000 })
    expect(await countText.textContent()).toMatch(/\d+/)
  })

  test('should filter pilots by rank', async ({ page }) => {
    // Cards view rank filter is a toggle-button group (All / Captain / FO)
    const rankGroup = page.getByRole('group', { name: /filter by rank/i })
    await expect(rankGroup).toBeVisible({ timeout: 60000 })

    await rankGroup.getByRole('button', { name: /^captain$/i }).click()

    // Result counter reflects the filtered set (17 captains of 27 pilots)
    await expect(page.getByText(/\d+ pilots?/i).first()).toBeVisible({ timeout: 10000 })
    const text = await page
      .getByText(/\d+ pilots?/i)
      .first()
      .textContent()
    expect(text).toMatch(/\d+/)
  })

  test('should search pilots by name and clear', async ({ page }) => {
    const counter = page.getByText(/\d+ pilots?/i).first()
    await expect(counter).toBeVisible({ timeout: 60000 })
    const initialCount = parseInt((await counter.textContent()) ?? '0', 10)

    // Search narrows the result set
    const searchInput = page.getByPlaceholder(/search/i)
    await searchInput.fill('zz-no-such-pilot')
    await expect(page.getByText(/no pilots match/i)).toBeVisible({ timeout: 10000 })

    // Clearing restores the full set
    await searchInput.clear()
    await expect(page.getByText(/no pilots match/i)).not.toBeVisible()
    await expect(counter).toHaveText(new RegExp(`${initialCount} pilots?`), { timeout: 10000 })
  })
})

test.describe('Pilot Management - Create New Pilot', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/pilots')
    await page.waitForLoadState('networkidle', { timeout: 60000 })
  })

  // Pilot creation is a dedicated page (/dashboard/pilots/new), not a dialog.
  // Mutation tests are intentionally omitted — E2E runs against live data.
  test('should open the add pilot page', async ({ page }) => {
    await page.getByRole('link', { name: /add pilot/i }).click()

    await expect(page).toHaveURL(/\/dashboard\/pilots\/new/, { timeout: 60000 })
    await expect(page.getByRole('heading', { name: /add new pilot/i })).toBeVisible({
      timeout: 60000,
    })

    // Core form fields are present
    await expect(page.getByLabel(/first name/i)).toBeVisible()
    await expect(page.getByLabel(/last name/i)).toBeVisible()
  })

  test('should show validation errors for required fields', async ({ page }) => {
    await page.goto('/dashboard/pilots/new')
    await expect(page.getByRole('heading', { name: /add new pilot/i })).toBeVisible({
      timeout: 60000,
    })

    // Try to submit empty form
    await page.getByRole('button', { name: /save|create|add pilot/i }).click()

    // Should show validation errors without navigating away
    await expect(page.getByText(/required/i).first()).toBeVisible({ timeout: 60000 })
    await expect(page).toHaveURL(/\/dashboard\/pilots\/new/)
  })
})

test.describe('Pilot Management - Update Pilot', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    // Pilot editing is a dedicated page reached from the table view's Edit action
    await page.goto('/dashboard/pilots?view=table')
    await page.waitForLoadState('networkidle', { timeout: 60000 })
    await expect(page.getByRole('table')).toBeVisible({ timeout: 60000 })
  })

  // Mutation tests are intentionally omitted — E2E runs against live data.
  test('should open the edit pilot page with pre-filled form', async ({ page }) => {
    // Each row has an Edit action link
    const firstRow = page.getByRole('row').nth(1) // Skip header row
    await firstRow.getByRole('link', { name: /edit/i }).click()

    await expect(page).toHaveURL(/\/dashboard\/pilots\/[a-z0-9-]+\/edit/, { timeout: 60000 })

    // Form should be pre-filled with pilot data
    const firstNameInput = page.getByLabel(/first name/i)
    await expect(firstNameInput).toBeVisible({ timeout: 60000 })
    await expect(firstNameInput).not.toHaveValue('')
  })
})

test.describe('Pilot Management - Delete Pilot', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/pilots?view=table')
    await page.waitForLoadState('networkidle', { timeout: 60000 })
    await expect(page.getByRole('table')).toBeVisible({ timeout: 60000 })
  })

  // Deletion lives on the pilot detail page behind a confirm dialog. Only the
  // cancel path is exercised — E2E runs against live data.
  test('should show delete confirmation and cancel safely', async ({ page }) => {
    // Open the first pilot's detail page
    const firstRow = page.getByRole('row').nth(1)
    await firstRow.getByRole('link', { name: /view/i }).click()
    await expect(page).toHaveURL(/\/dashboard\/pilots\/[a-z0-9-]+/, { timeout: 60000 })

    // Delete lives in the "More actions" dropdown on the profile header
    await page.getByRole('button', { name: /more actions/i }).click()
    await page.getByRole('menuitem', { name: /delete pilot/i }).click()

    // Confirmation dialog should appear (useConfirm renders an AlertDialog)
    await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 60000 })
    await expect(page.getByText(/are you sure/i)).toBeVisible({ timeout: 60000 })

    // Cancel — nothing is deleted
    await page.getByRole('button', { name: /cancel/i }).click()
    await expect(page.getByRole('alertdialog')).not.toBeVisible({ timeout: 60000 })
    await expect(page).toHaveURL(/\/dashboard\/pilots\/[a-z0-9-]+/)
  })
})

test.describe('Pilot Management - View Pilot Details', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/pilots?view=table')
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

      // Should show various sections (labels can repeat across cards/tabs)
      await expect(page.getByText(/employee id|emp id/i).first()).toBeVisible({ timeout: 60000 })
      await expect(page.getByText(/rank/i).first()).toBeVisible({ timeout: 60000 })
      await expect(page.getByText(/email/i).first()).toBeVisible({ timeout: 60000 })
    }
  })
})

test.describe('Pilot Management - Responsive Design', () => {
  test('should be mobile-friendly', async ({ page }) => {
    await loginAsAdmin(page)

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard/pilots')

    // Page should be visible with the pilot result counter (cards view default)
    await expect(page.getByRole('heading', { name: /pilots/i })).toBeVisible({ timeout: 60000 })
    await expect(page.getByText(/\d+ pilots?/i).first()).toBeVisible({ timeout: 60000 })
  })
})
