import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/test-utils'

/**
 * Pilots Table Pattern E2E Tests
 *
 * Verifies the TanStack data-table pattern on the pilots table view
 * (?view=table): toolbar filters, faceted filters, column visibility,
 * and nuqs URL-synced state.
 */

test.describe('Pilots Table — data-table pattern', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/pilots?view=table')
    await page.waitForLoadState('networkidle', { timeout: 60000 })
  })

  test('renders table with toolbar, headers, and rows', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible({ timeout: 60000 })

    // Toolbar controls (scoped — column headers reuse the same accessible names)
    const toolbar = page.getByRole('toolbar')
    await expect(toolbar.getByPlaceholder(/search name/i)).toBeVisible()
    await expect(toolbar.getByRole('button', { name: /^rank$/i })).toBeVisible()
    await expect(toolbar.getByRole('button', { name: /^status$/i })).toBeVisible()
    await expect(toolbar.getByRole('button', { name: /toggle columns/i })).toBeVisible()
    await expect(toolbar.getByRole('button', { name: /export csv/i })).toBeVisible()

    // Sortable column headers
    await expect(page.getByRole('columnheader', { name: /seniority/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /^name$/i })).toBeVisible()

    // Data rows (27 pilots, page size 25)
    const rows = page.getByRole('row')
    expect(await rows.count()).toBeGreaterThan(5)
  })

  test('name search filters rows and syncs to URL', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible({ timeout: 60000 })
    const initialRows = await page.getByRole('row').count()

    const search = page.getByRole('toolbar').getByPlaceholder(/search name/i)
    await search.fill('zz-no-such-pilot')
    await expect(page.getByText('No results.')).toBeVisible({ timeout: 10000 })
    await expect(page).toHaveURL(/name=zz-no-such-pilot/, { timeout: 10000 })

    // Reset button clears filters and restores rows
    await page.getByRole('button', { name: /reset filters/i }).click()
    await expect(page.getByText('No results.')).not.toBeVisible()
    expect(await page.getByRole('row').count()).toBe(initialRows)
  })

  test('rank faceted filter narrows rows and syncs to URL', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible({ timeout: 60000 })

    await page
      .getByRole('toolbar')
      .getByRole('button', { name: /^rank$/i })
      .click()
    await page.getByRole('option', { name: /first officer/i }).click()
    await page.keyboard.press('Escape')

    await expect(page).toHaveURL(/role=First.Officer/, { timeout: 10000 })

    // Every visible data row shows First Officer rank
    const captainCells = page.locator('tbody td', { hasText: /^Captain$/ })
    expect(await captainCells.count()).toBe(0)
  })

  test('deep link restores filter state from URL', async ({ page }) => {
    await page.goto('/dashboard/pilots?view=table&role=Captain')
    await expect(page.getByRole('table')).toBeVisible({ timeout: 60000 })

    // Filter chip shows the selection from the URL (chip contains a nested
    // clear button, so take the outer match)
    await expect(
      page.getByRole('toolbar').getByRole('button', { name: /rank/i }).first()
    ).toContainText('Captain')

    const foCells = page.locator('tbody td', { hasText: /^First Officer$/ })
    expect(await foCells.count()).toBe(0)
  })

  test('column visibility toggle hides a column', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible({ timeout: 60000 })
    await expect(page.getByRole('columnheader', { name: /commencement/i })).toBeVisible()

    await page
      .getByRole('toolbar')
      .getByRole('button', { name: /toggle columns/i })
      .click()
    await page.getByRole('option', { name: /commencement/i }).click()
    await page.keyboard.press('Escape')

    await expect(page.getByRole('columnheader', { name: /commencement/i })).not.toBeVisible()
  })

  test('sorting via column header syncs to URL', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible({ timeout: 60000 })

    await page
      .getByRole('columnheader', { name: /^name$/i })
      .getByRole('button')
      .click()
    await page.getByRole('menuitemcheckbox', { name: /desc/i }).click()

    await expect(page).toHaveURL(/sort=/, { timeout: 10000 })
  })
})
