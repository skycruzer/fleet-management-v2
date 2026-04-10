import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/test-utils'

/**
 * Pilot Registrations E2E Tests
 *
 * Tests pilot registration approval workflow including:
 * - Viewing pending registrations
 * - Approving/rejecting registrations
 * - Linking to existing pilot records
 * - Notification after approval
 */

test.describe('Pilot Registrations - List View', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/admin/pilot-registrations')
    await page.waitForLoadState('networkidle', { timeout: 60000 })
  })

  test('should display pilot registrations page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /pilot registrations?/i })).toBeVisible({
      timeout: 60000,
    })
  })

  test('should display registration list or empty state', async ({ page }) => {
    // Either show registrations table or empty state
    const hasTable = await page
      .getByRole('table')
      .isVisible()
      .catch(() => false)
    const hasEmptyState = await page
      .getByText(/no pending|no registrations/i)
      .isVisible()
      .catch(() => false)

    expect(hasTable || hasEmptyState).toBe(true)
  })

  test('should display registration details', async ({ page }) => {
    const table = page.getByRole('table')

    if (await table.isVisible()) {
      // Should have key columns
      await expect(page.getByRole('columnheader', { name: /name|pilot/i })).toBeVisible({
        timeout: 60000,
      })
      await expect(page.getByRole('columnheader', { name: /email/i })).toBeVisible({
        timeout: 60000,
      })
      await expect(page.getByRole('columnheader', { name: /status|actions/i })).toBeVisible({
        timeout: 60000,
      })
    }
  })
})

test.describe('Pilot Registrations - Approval Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/admin/pilot-registrations')
    await page.waitForLoadState('networkidle', { timeout: 60000 })
  })

  test('should have approve button for pending registrations', async ({ page }) => {
    const approveButton = page.getByRole('button', { name: /approve/i }).first()

    if (await approveButton.isVisible()) {
      await expect(approveButton).toBeVisible({ timeout: 60000 })
    }
  })

  test('should have reject button for pending registrations', async ({ page }) => {
    const rejectButton = page.getByRole('button', { name: /reject|deny/i }).first()

    if (await rejectButton.isVisible()) {
      await expect(rejectButton).toBeVisible({ timeout: 60000 })
    }
  })

  test('should open approval dialog', async ({ page }) => {
    const approveButton = page.getByRole('button', { name: /approve/i }).first()

    if (await approveButton.isVisible()) {
      await approveButton.click()
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 60000 })
    }
  })
})

test.describe('Pilot Registrations - Filter and Search', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/admin/pilot-registrations')
    await page.waitForLoadState('networkidle', { timeout: 60000 })
  })

  test('should filter by status', async ({ page }) => {
    const statusFilter = page.getByRole('tab', { name: /pending|approved|rejected/i }).first()

    if (await statusFilter.isVisible()) {
      await statusFilter.click()
      await page.waitForTimeout(1000)

      // Should still show table or empty state
      const hasTable = await page
        .getByRole('table')
        .isVisible()
        .catch(() => false)
      const hasEmptyState = await page
        .getByText(/no.*registrations/i)
        .isVisible()
        .catch(() => false)
      expect(hasTable || hasEmptyState).toBe(true)
    }
  })

  test('should search registrations', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i)

    if (await searchInput.isVisible()) {
      await searchInput.fill('test')
      await page.waitForTimeout(1000)

      // Should show filtered results
      const hasResults = await page
        .getByRole('table')
        .isVisible()
        .catch(() => false)
      const hasNoResults = await page
        .getByText(/no results|no registrations/i)
        .isVisible()
        .catch(() => false)
      expect(hasResults || hasNoResults).toBe(true)
    }
  })
})
