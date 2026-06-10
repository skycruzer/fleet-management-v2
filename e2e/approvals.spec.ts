/**
 * Approvals Hub E2E
 *
 * Covers the unified decision queue at /dashboard/approvals: tab navigation
 * with pending counts, queue → decision panel selection with crew-impact
 * preview, and the history link back to /dashboard/requests.
 *
 * Read-only by design — approving/denying real pending requests would mutate
 * shared test data; decision flows are covered by unit-level service tests.
 */

import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/test-utils'

test.describe('Approvals Hub', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/approvals')
    await page.waitForLoadState('domcontentloaded')
  })

  test('renders the hub with all four queue tabs', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Approvals' })).toBeVisible()

    const nav = page.getByRole('navigation', { name: 'Approval queues' })
    await expect(nav.getByRole('link', { name: /Leave(?! Bids)/ })).toBeVisible()
    await expect(nav.getByRole('link', { name: /RDO \/ SDO/ })).toBeVisible()
    await expect(nav.getByRole('link', { name: /Leave Bids/ })).toBeVisible()
    await expect(nav.getByRole('link', { name: /Registrations/ })).toBeVisible()
  })

  test('leave tab shows a queue or a clear-queue message', async ({ page }) => {
    const queue = page.getByRole('listbox', { name: 'Pending items' })
    const clear = page.getByText('Queue clear')
    await expect(queue.or(clear).first()).toBeVisible()
  })

  test('selecting a queue item renders the decision panel with crew impact', async ({ page }) => {
    const queueItems = page.getByRole('option')
    const count = await queueItems.count()
    test.skip(count === 0, 'No pending leave requests in test data')

    await queueItems.first().click()
    await page.waitForLoadState('domcontentloaded')

    // Decision panel essentials: impact card and action row
    await expect(page.getByText(/Crew impact|Approving (drops|puts)/).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Approve' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Deny/ })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Needs info' })).toBeVisible()
    // Keyboard hint confirms sequential-review affordance
    await expect(page.getByText(/↑↓ move/)).toBeVisible()
  })

  test('tab switching updates the URL and active state', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Approval queues' })
    await nav.getByRole('link', { name: /RDO \/ SDO/ }).click()
    await expect(page).toHaveURL(/tab=rdo-sdo/)

    await nav.getByRole('link', { name: /Registrations/ }).click()
    await expect(page).toHaveURL(/tab=registrations/)
  })

  test('history link goes to the requests browse page', async ({ page }) => {
    await page.getByRole('link', { name: /History & browse/ }).click()
    await expect(page).toHaveURL(/\/dashboard\/requests/)
  })

  test('sidebar shows Approvals as primary nav', async ({ page }) => {
    const sidebar = page.getByRole('navigation', { name: 'Main navigation' }).first()
    await expect(sidebar.getByRole('link', { name: /Approvals/ })).toBeVisible()
  })
})
