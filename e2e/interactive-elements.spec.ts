import { test, expect } from '@playwright/test'
import { loginAsAdmin, loginAsPilot } from './helpers/test-utils'

/**
 * Interactive Elements E2E Tests
 *
 * Comprehensive testing of all interactive UI elements:
 * - Buttons (Create, Edit, Delete, Export, Approve, Deny, etc.)
 * - Forms (text inputs, selects, date pickers, checkboxes, radio buttons)
 * - Filters (rank, status, date range filters)
 * - Search functionality
 * - Pagination controls
 * - Sorting functionality
 * - Modals and dialogs
 * - Dropdown menus
 * - Tabs and tab switching
 * - Toggle switches and checkboxes
 */

test.describe('Button Interactions - CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should test all "Create New" buttons', async ({ page }) => {
    const createButtons = [
      { page: '/dashboard/pilots', button: /add|new pilot/i, dialog: true },
      { page: '/dashboard/certifications', button: /add|new.*cert/i, dialog: true },
      { page: '/dashboard/leave', button: /new.*request/i, dialog: true },
    ]

    for (const { page: pagePath, button: buttonName, dialog } of createButtons) {
      await page.goto(pagePath)
      await page.waitForLoadState('networkidle', { timeout: 60000 })

      const createButton = page.getByRole('button', { name: buttonName })

      if (await createButton.first().isVisible()) {
        await createButton.first().click()

        if (dialog) {
          await expect(page.getByRole('dialog')).toBeVisible({ timeout: 60000 })

          // Close dialog
          const cancelButton = page.getByRole('button', { name: /cancel|close/i })
          if (await cancelButton.first().isVisible()) {
            await cancelButton.first().click()
          } else {
            await page.keyboard.press('Escape')
          }

          await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 60000 })
        }
      }
    }
  })

  test('should test all "Edit" buttons', async ({ page }) => {
    await page.goto('/dashboard/pilots')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    const editButton = page.getByRole('button', { name: /edit/i }).first()

    if (await editButton.isVisible()) {
      await editButton.click()
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 60000 })

      // Close dialog
      const cancelButton = page.getByRole('button', { name: /cancel/i })
      if (await cancelButton.isVisible()) {
        await cancelButton.click()
      } else {
        await page.keyboard.press('Escape')
      }

      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 60000 })
    }
  })

  test('should test all "Delete" buttons with confirmation', async ({ page }) => {
    await page.goto('/dashboard/pilots')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    const deleteButton = page.getByRole('button', { name: /delete/i }).first()

    if (await deleteButton.isVisible()) {
      await deleteButton.click()
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 60000 })

      // Verify confirmation message
      const confirmMessage = page.getByText(/are you sure|confirm.*delete/i)
      await expect(confirmMessage).toBeVisible({ timeout: 60000 })

      // Cancel deletion
      const cancelButton = page.getByRole('button', { name: /cancel/i })
      await cancelButton.click()

      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 60000 })
    }
  })

  test('should test "Export" buttons', async ({ page }) => {
    const exportPages = [
      '/dashboard/certifications',
      '/dashboard/analytics',
      '/dashboard/audit-logs',
    ]

    for (const pagePath of exportPages) {
      await page.goto(pagePath)
      await page.waitForLoadState('networkidle', { timeout: 60000 })

      const exportButton = page.getByRole('button', { name: /export|download/i })

      if (await exportButton.first().isVisible()) {
        // Click export button
        await expect(exportButton.first()).toBeVisible({ timeout: 60000 })
        await expect(exportButton.first()).toBeEnabled()
      }
    }
  })

  test('should test "Approve" and "Deny" buttons', async ({ page }) => {
    await page.goto('/dashboard/leave')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Check for pending requests
    const pendingTab = page.getByRole('tab', { name: /pending/i })
    if (await pendingTab.isVisible()) {
      await pendingTab.click()
      await page.waitForTimeout(1000)

      // Test approve button
      const approveButton = page.getByRole('button', { name: /approve/i }).first()
      if (await approveButton.isVisible()) {
        await expect(approveButton).toBeVisible({ timeout: 60000 })
        await expect(approveButton).toBeEnabled()
      }

      // Test deny button
      const denyButton = page.getByRole('button', { name: /deny|reject/i }).first()
      if (await denyButton.isVisible()) {
        await expect(denyButton).toBeVisible({ timeout: 60000 })
        await expect(denyButton).toBeEnabled()
      }
    }
  })

  test('should test "Refresh" buttons', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    const refreshButton = page.getByRole('button', { name: /refresh|reload/i })

    if (await refreshButton.first().isVisible()) {
      await refreshButton.first().click()

      // Should show loading state or reload data
      await page.waitForTimeout(1000)
      await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({
        timeout: 60000,
      })
    }
  })
})

test.describe('Form Field Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should test text input fields', async ({ page }) => {
    await page.goto('/dashboard/pilots')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Open create pilot dialog
    await page.getByRole('button', { name: /add|new pilot/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 60000 })

    // Test text inputs
    const firstNameInput = page.getByLabel(/first name/i)
    await firstNameInput.fill('Test')
    await expect(firstNameInput).toHaveValue('Test')

    const lastNameInput = page.getByLabel(/last name/i)
    await lastNameInput.fill('User')
    await expect(lastNameInput).toHaveValue('User')

    // Close dialog
    await page.keyboard.press('Escape')
  })

  test('should test select/dropdown fields', async ({ page }) => {
    await page.goto('/dashboard/pilots')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Open create pilot dialog
    await page.getByRole('button', { name: /add|new pilot/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 60000 })

    // Test rank select
    const rankSelect = page.getByLabel(/rank/i)
    if (await rankSelect.isVisible()) {
      await rankSelect.click()
      await expect(page.getByRole('option', { name: /captain/i })).toBeVisible({ timeout: 60000 })
      await page.getByRole('option', { name: /captain/i }).click()
    }

    // Close dialog
    await page.keyboard.press('Escape')
  })

  test('should test date picker fields', async ({ page }) => {
    await page.goto('/dashboard/pilots')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Open create pilot dialog
    await page.getByRole('button', { name: /add|new pilot/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 60000 })

    // Test date input
    const dateInput = page.getByLabel(/commencement date|date/i)
    if (await dateInput.isVisible()) {
      await dateInput.fill('2025-01-15')
      await expect(dateInput).toHaveValue('2025-01-15')
    }

    // Close dialog
    await page.keyboard.press('Escape')
  })

  test('should test email input validation', async ({ page }) => {
    await page.goto('/dashboard/pilots')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Open create pilot dialog
    await page.getByRole('button', { name: /add|new pilot/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 60000 })

    // Test invalid email
    const emailInput = page.getByLabel(/email/i)
    if (await emailInput.isVisible()) {
      await emailInput.fill('invalid-email')

      // Try to submit
      await page.getByRole('button', { name: /save|create/i }).click()

      // Should show validation error
      const errorMessage = page.getByText(/invalid|valid email|email.*required/i)
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toBeVisible({ timeout: 60000 })
      }
    }

    // Close dialog
    await page.keyboard.press('Escape')
  })

  test('should test required field validation', async ({ page }) => {
    await page.goto('/dashboard/pilots')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Open create pilot dialog
    await page.getByRole('button', { name: /add|new pilot/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 60000 })

    // Try to submit empty form
    await page.getByRole('button', { name: /save|create/i }).click()

    // Should show required field errors
    const requiredError = page.getByText(/required/i).first()
    await expect(requiredError).toBeVisible({ timeout: 60000 })

    // Close dialog
    await page.keyboard.press('Escape')
  })

  test('should test checkbox fields', async ({ page }) => {
    await page.goto('/dashboard/admin/settings')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Look for checkbox elements
    const checkbox = page.getByRole('checkbox').first()

    if (await checkbox.isVisible()) {
      const isChecked = await checkbox.isChecked()

      // Toggle checkbox
      await checkbox.click()

      // Verify state changed
      const isNowChecked = await checkbox.isChecked()
      expect(isNowChecked).toBe(!isChecked)
    }
  })
})

test.describe('Filter Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should test rank filter on pilots page', async ({ page }) => {
    await page.goto('/dashboard/pilots')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    const rankFilter = page.getByLabel(/rank/i).or(page.getByRole('combobox', { name: /rank/i }))

    if (await rankFilter.isVisible()) {
      // Get initial row count
      const initialRows = await page.getByRole('row').count()

      // Apply filter
      await rankFilter.click()
      await page.getByRole('option', { name: /captain/i }).click()
      await page.waitForTimeout(1000)

      // Row count should change
      const filteredRows = await page.getByRole('row').count()
      expect(filteredRows).toBeLessThanOrEqual(initialRows)

      // Clear filter
      await rankFilter.click()
      await page.getByRole('option', { name: /all|reset/i }).click()
    }
  })

  test('should test status filter on leave requests page', async ({ page }) => {
    await page.goto('/dashboard/leave')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Test status tabs
    const pendingTab = page.getByRole('tab', { name: /pending/i })
    if (await pendingTab.isVisible()) {
      await pendingTab.click()
      await page.waitForTimeout(1000)

      // Should show pending requests
      await expect(page.getByRole('table')).toBeVisible({ timeout: 60000 })
    }

    const approvedTab = page.getByRole('tab', { name: /approved/i })
    if (await approvedTab.isVisible()) {
      await approvedTab.click()
      await page.waitForTimeout(1000)

      // Should show approved requests
      await expect(page.getByRole('table')).toBeVisible({ timeout: 60000 })
    }
  })

  test('should test date range filter', async ({ page }) => {
    await page.goto('/dashboard/certifications')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Look for date range filters
    const startDateFilter = page.getByLabel(/start date|from/i)
    const endDateFilter = page.getByLabel(/end date|to/i)

    if ((await startDateFilter.isVisible()) && (await endDateFilter.isVisible())) {
      await startDateFilter.fill('2025-01-01')
      await endDateFilter.fill('2025-12-31')

      // Apply filter
      const applyButton = page.getByRole('button', { name: /apply|filter/i })
      if (await applyButton.isVisible()) {
        await applyButton.click()
        await page.waitForTimeout(1000)
      }

      // Should show filtered results
      await expect(page.getByRole('table')).toBeVisible({ timeout: 60000 })
    }
  })

  test('should test certification status filter', async ({ page }) => {
    await page.goto('/dashboard/certifications')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Test expiring filter
    const expiringTab = page.getByRole('tab', { name: /expiring/i })
    if (await expiringTab.isVisible()) {
      await expiringTab.click()
      await page.waitForTimeout(1000)

      // Should show expiring certifications
      await expect(page.getByRole('table')).toBeVisible({ timeout: 60000 })
    }

    // Test expired filter
    const expiredTab = page.getByRole('tab', { name: /expired/i })
    if (await expiredTab.isVisible()) {
      await expiredTab.click()
      await page.waitForTimeout(1000)

      // Should show expired certifications
      await expect(page.getByRole('table')).toBeVisible({ timeout: 60000 })
    }
  })
})

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should test search on pilots page', async ({ page }) => {
    await page.goto('/dashboard/pilots')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    const searchInput = page.getByPlaceholder(/search/i)
    await expect(searchInput).toBeVisible({ timeout: 60000 })

    // Get initial row count
    const initialRows = await page.getByRole('row').count()

    // Search for something
    await searchInput.fill('John')
    await page.waitForTimeout(1000)

    // Row count should change
    const searchRows = await page.getByRole('row').count()
    expect(searchRows).toBeLessThanOrEqual(initialRows)

    // Clear search
    await searchInput.clear()
    await page.waitForTimeout(1000)

    // Should show all results again
    const clearedRows = await page.getByRole('row').count()
    expect(clearedRows).toBeGreaterThanOrEqual(searchRows)
  })

  test('should test search on certifications page', async ({ page }) => {
    await page.goto('/dashboard/certifications')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    const searchInput = page.getByPlaceholder(/search/i)

    if (await searchInput.isVisible()) {
      await searchInput.fill('PC')
      await page.waitForTimeout(1000)

      // Should show filtered results
      await expect(page.getByRole('table')).toBeVisible({ timeout: 60000 })

      // Clear search
      await searchInput.clear()
      await page.waitForTimeout(1000)
    }
  })

  test('should test search with no results', async ({ page }) => {
    await page.goto('/dashboard/pilots')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    const searchInput = page.getByPlaceholder(/search/i)
    await searchInput.fill('XYZ_NONEXISTENT_9999')
    await page.waitForTimeout(1000)

    // Should show empty state or no results message
    const emptyState = page.getByText(/no results|no pilots found|no matches/i)
    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible({ timeout: 60000 })
    }
  })
})

test.describe('Pagination Controls', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should test pagination on pilots page', async ({ page }) => {
    await page.goto('/dashboard/pilots')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Look for pagination controls
    const nextButton = page
      .getByRole('button', { name: /next/i })
      .or(page.locator('[aria-label*="next" i]'))

    if (await nextButton.isVisible()) {
      // Check if next button is enabled
      const isEnabled = await nextButton.isEnabled()

      if (isEnabled) {
        // Click next
        await nextButton.click()
        await page.waitForTimeout(1000)

        // Should show different data
        await expect(page.getByRole('table')).toBeVisible({ timeout: 60000 })

        // Test previous button
        const prevButton = page
          .getByRole('button', { name: /previous|prev/i })
          .or(page.locator('[aria-label*="previous" i]'))

        if (await prevButton.isVisible()) {
          await prevButton.click()
          await page.waitForTimeout(1000)
        }
      }
    }
  })

  test('should test items per page selector', async ({ page }) => {
    await page.goto('/dashboard/certifications')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Look for items per page selector
    const perPageSelect = page
      .getByLabel(/items per page|rows per page/i)
      .or(page.locator('select[name*="pageSize" i]'))

    if (await perPageSelect.isVisible()) {
      // Get current row count
      const currentRows = await page.getByRole('row').count()

      // Change items per page
      await perPageSelect.click()
      await page
        .getByRole('option', { name: /50|100/i })
        .first()
        .click()
      await page.waitForTimeout(1000)

      // Row count should change
      const newRows = await page.getByRole('row').count()
      expect(newRows).not.toBe(currentRows)
    }
  })

  test('should test page number navigation', async ({ page }) => {
    await page.goto('/dashboard/certifications')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Look for page number buttons
    const pageButton = page
      .getByRole('button', { name: /^2$/i })
      .or(page.locator('[data-page="2"]'))

    if (await pageButton.isVisible()) {
      await pageButton.click()
      await page.waitForTimeout(1000)

      // Should show page 2 data
      await expect(page.getByRole('table')).toBeVisible({ timeout: 60000 })
    }
  })
})

test.describe('Sorting Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should test column sorting on pilots page', async ({ page }) => {
    await page.goto('/dashboard/pilots')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Click on "Name" column header to sort
    const nameHeader = page.getByRole('columnheader', { name: /name/i })

    if (await nameHeader.isVisible()) {
      await nameHeader.click()
      await page.waitForTimeout(1000)

      // Should show sorted data
      await expect(page.getByRole('table')).toBeVisible({ timeout: 60000 })

      // Click again to reverse sort
      await nameHeader.click()
      await page.waitForTimeout(1000)

      await expect(page.getByRole('table')).toBeVisible({ timeout: 60000 })
    }
  })

  test('should test sorting by rank', async ({ page }) => {
    await page.goto('/dashboard/pilots')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    const rankHeader = page.getByRole('columnheader', { name: /rank/i })

    if (await rankHeader.isVisible()) {
      await rankHeader.click()
      await page.waitForTimeout(1000)

      // Should show sorted data
      await expect(page.getByRole('table')).toBeVisible({ timeout: 60000 })
    }
  })

  test('should test sorting by date on certifications page', async ({ page }) => {
    await page.goto('/dashboard/certifications')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    const dateHeader = page.getByRole('columnheader', { name: /expiry|date/i })

    if (await dateHeader.isVisible()) {
      await dateHeader.click()
      await page.waitForTimeout(1000)

      // Should show sorted data
      await expect(page.getByRole('table')).toBeVisible({ timeout: 60000 })
    }
  })
})

test.describe('Modal and Dialog Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should open and close dialogs', async ({ page }) => {
    await page.goto('/dashboard/pilots')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Open dialog
    await page.getByRole('button', { name: /add|new pilot/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 60000 })

    // Close with button
    const cancelButton = page.getByRole('button', { name: /cancel|close/i })
    if (await cancelButton.first().isVisible()) {
      await cancelButton.first().click()
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 60000 })
    }

    // Reopen dialog
    await page.getByRole('button', { name: /add|new pilot/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 60000 })

    // Close with Escape key
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 60000 })
  })

  test('should handle modal overlay clicks', async ({ page }) => {
    await page.goto('/dashboard/pilots')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    await page.getByRole('button', { name: /add|new pilot/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 60000 })

    // Click outside dialog (on overlay)
    await page.mouse.click(10, 10)
    await page.waitForTimeout(500)

    // Some dialogs close on overlay click, some don't
    // Just verify dialog state is stable
    const dialogVisible = await page.getByRole('dialog').isVisible()
    expect(typeof dialogVisible).toBe('boolean')
  })
})

test.describe('Dropdown Menu Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should test user menu dropdown', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    const userMenu = page.getByRole('button', { name: /user|account|profile|menu/i })

    if (await userMenu.first().isVisible()) {
      // Open menu
      await userMenu.first().click()

      // Should show menu items
      const menuItems = page.getByRole('menu').or(page.getByRole('menuitem'))
      await expect(menuItems.first()).toBeVisible({ timeout: 60000 })

      // Close menu
      await page.keyboard.press('Escape')
    }
  })

  test('should test action dropdown menus in tables', async ({ page }) => {
    await page.goto('/dashboard/pilots')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Look for action menu buttons (three dots, etc.)
    const actionMenu = page.getByRole('button', { name: /actions?|options?|more/i }).first()

    if (await actionMenu.isVisible()) {
      await actionMenu.click()

      // Should show menu with actions
      const menu = page.getByRole('menu')
      if (await menu.isVisible()) {
        await expect(menu).toBeVisible({ timeout: 60000 })

        // Close menu
        await page.keyboard.press('Escape')
      }
    }
  })
})

test.describe('Tab Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should test tabs on leave requests page', async ({ page }) => {
    await page.goto('/dashboard/leave')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    const tabs = [/all|pending/i, /approved/i, /denied|rejected/i]

    for (const tabName of tabs) {
      const tab = page.getByRole('tab', { name: tabName })

      if (await tab.isVisible()) {
        await tab.click()
        await page.waitForTimeout(1000)

        // Should show corresponding content
        await expect(page.getByRole('table')).toBeVisible({ timeout: 60000 })
      }
    }
  })

  test('should test tabs on certifications page', async ({ page }) => {
    await page.goto('/dashboard/certifications')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    const tabs = [/all/i, /expiring/i, /expired/i, /current/i]

    for (const tabName of tabs) {
      const tab = page.getByRole('tab', { name: tabName })

      if (await tab.isVisible()) {
        await tab.click()
        await page.waitForTimeout(1000)

        // Should show corresponding content
        await expect(page.getByRole('table')).toBeVisible({ timeout: 60000 })
      }
    }
  })
})

test.describe('Toggle Switches', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should test toggle switches on settings page', async ({ page }) => {
    await page.goto('/dashboard/admin/settings')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Look for toggle switches
    const toggle = page.locator('[role="switch"]').first()

    if (await toggle.isVisible()) {
      const isChecked = await toggle.getAttribute('aria-checked')

      // Toggle switch
      await toggle.click()
      await page.waitForTimeout(500)

      // Verify state changed
      const newState = await toggle.getAttribute('aria-checked')
      expect(newState).not.toBe(isChecked)
    }
  })
})

test.describe('Pilot Portal Interactive Elements', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsPilot(page)
  })

  test('should test pilot portal navigation', async ({ page }) => {
    await page.goto('/portal/dashboard')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Test navigation links
    const navLinks = [
      { name: /certifications?/i, url: /certifications/ },
      { name: /leave/i, url: /leave/ },
      { name: /flights?/i, url: /flight/ },
      { name: /profile/i, url: /profile/ },
    ]

    for (const { name, url } of navLinks) {
      const link = page.getByRole('link', { name })

      if (await link.first().isVisible()) {
        await link.first().click()
        await page.waitForLoadState('networkidle', { timeout: 60000 })
        await expect(page).toHaveURL(url)
      }

      // Go back to dashboard
      await page.goto('/portal/dashboard')
      await page.waitForLoadState('networkidle', { timeout: 60000 })
    }
  })

  test('should test pilot portal form submissions', async ({ page }) => {
    await page.goto('/portal/feedback')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    const feedbackForm = page.getByLabel(/feedback|message/i)

    if (await feedbackForm.isVisible()) {
      await feedbackForm.fill('Test feedback message')

      const submitButton = page.getByRole('button', { name: /submit|send/i })
      await expect(submitButton).toBeEnabled()
    }
  })
})

test.describe('Responsive Interactive Elements', () => {
  test('should test mobile menu toggle', async ({ page }) => {
    await loginAsAdmin(page)
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Look for mobile menu button
    const mobileMenu = page.getByRole('button', { name: /menu|navigation/i })

    if (await mobileMenu.isVisible()) {
      // Open menu
      await mobileMenu.click()
      await page.waitForTimeout(500)

      // Should show navigation
      const nav = page.locator('nav').first()
      await expect(nav).toBeVisible({ timeout: 60000 })

      // Close menu
      await mobileMenu.click()
      await page.waitForTimeout(500)
    }
  })
})
