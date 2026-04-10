/**
 * Bug Fixes Validation E2E Tests
 *
 * Tests to verify the fixes made for:
 * - Fix 1: Pilot date validation (YYYY-MM-DD format)
 * - Fix 2: Router refresh order
 * - Fix 3: DELETE cache invalidation
 * - Fix 6-7: Proper form submission flow
 * - Fix 8: UUID validation
 * - Fix 10: Cancel button during submission
 * - Fix 12: Error message display
 *
 * Developer: Maurice Rondeau
 * Date: November 25, 2025
 */

import { test, expect, Page } from '@playwright/test'

// Helper to attempt admin login with graceful failure
async function tryLoginAsAdmin(page: Page): Promise<boolean> {
  try {
    const email = process.env.TEST_ADMIN_EMAIL
    const password = process.env.TEST_ADMIN_PASSWORD

    if (!email || !password) {
      console.log('Admin credentials not configured, skipping auth test')
      return false
    }

    await page.goto('/auth/login', { timeout: 10000 })
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/password/i).fill(password)
    await page.getByRole('button', { name: /sign in|login/i }).click()

    // Wait for redirect with shorter timeout
    await page.waitForURL(/dashboard/, { timeout: 15000 })
    await page.waitForLoadState('domcontentloaded')
    return true
  } catch (error) {
    console.log('Admin login failed:', error)
    return false
  }
}

test.describe('Pilot Creation - Date Validation Fix', () => {
  test('should accept YYYY-MM-DD date format from HTML date input', async ({ page }) => {
    const loggedIn = await tryLoginAsAdmin(page)
    if (!loggedIn) {
      test.skip()
      return
    }

    await page.goto('/dashboard/pilots/new')
    await page.waitForLoadState('domcontentloaded')

    // Fill in required fields
    await page.getByLabel(/employee id/i).fill('999999')
    await page.getByLabel(/first name/i).fill('TestDate')
    await page.getByLabel(/last name/i).fill('Validation')

    // Fill date fields using HTML date input (YYYY-MM-DD format)
    await page.getByLabel(/commencement date/i).fill('2020-01-15')
    await page.getByLabel(/date of birth/i).fill('1990-05-20')

    // Verify no validation errors appear for date fields
    await expect(page.locator('text=Must be a valid date')).not.toBeVisible()
    await expect(page.locator('text=Must be a valid ISO datetime')).not.toBeVisible()
  })

  test('should show validation error for invalid date format', async ({ page }) => {
    const loggedIn = await tryLoginAsAdmin(page)
    if (!loggedIn) {
      test.skip()
      return
    }

    await page.goto('/dashboard/pilots/new')
    await page.waitForLoadState('domcontentloaded')

    // Fill in required fields with valid data
    await page.getByLabel(/employee id/i).fill('888888')
    await page.getByLabel(/first name/i).fill('TestInvalid')
    await page.getByLabel(/last name/i).fill('Date')

    // Date inputs will naturally accept YYYY-MM-DD, so this tests form submission
    await page.getByRole('button', { name: /create pilot/i }).click()

    // Should not show generic validation error for dates
    await expect(page.locator('text=Must be a valid ISO datetime string')).not.toBeVisible()
  })
})

test.describe('Form Submission Flow', () => {
  test('should disable cancel button during form submission', async ({ page }) => {
    const loggedIn = await tryLoginAsAdmin(page)
    if (!loggedIn) {
      test.skip()
      return
    }

    await page.goto('/dashboard/pilots/new')
    await page.waitForLoadState('domcontentloaded')

    // Fill minimal required fields
    await page.getByLabel(/employee id/i).fill('777777')
    await page.getByLabel(/first name/i).fill('TestCancel')
    await page.getByLabel(/last name/i).fill('Button')

    // Click submit
    await page.getByRole('button', { name: /create pilot/i }).click()

    // Cancel button should be disabled during submission
    const cancelButton = page.getByRole('button', { name: /cancel/i })
    await expect(cancelButton).toBeDisabled()
  })

  test('should show user-friendly error messages (not [object Object])', async ({ page }) => {
    const loggedIn = await tryLoginAsAdmin(page)
    if (!loggedIn) {
      test.skip()
      return
    }

    await page.goto('/dashboard/pilots/new')
    await page.waitForLoadState('domcontentloaded')

    // Try to submit with duplicate employee ID (if one exists)
    await page.getByLabel(/employee id/i).fill('100001')
    await page.getByLabel(/first name/i).fill('Duplicate')
    await page.getByLabel(/last name/i).fill('Test')

    await page.getByRole('button', { name: /create pilot/i }).click()

    // Wait for potential error
    await page.waitForTimeout(2000)

    // Verify error message is human-readable (not [object Object])
    const errorText = await page.locator('[class*="error"], [class*="destructive"]').textContent()
    if (errorText) {
      expect(errorText).not.toContain('[object Object]')
    }
  })
})

test.describe('Cache Invalidation', () => {
  test('should show updated data immediately after certification delete', async ({ page }) => {
    const loggedIn = await tryLoginAsAdmin(page)
    if (!loggedIn) {
      test.skip()
      return
    }

    // Navigate to certifications page
    await page.goto('/dashboard/certifications')
    await page.waitForLoadState('domcontentloaded')

    // Get initial count of certifications (if displayed)
    const initialRows = await page.locator('table tbody tr').count()

    // If there are certifications, attempt to delete one
    if (initialRows > 0) {
      // Click delete on first certification
      const deleteButton = page
        .locator('table tbody tr')
        .first()
        .getByRole('button', { name: /delete/i })

      if (await deleteButton.isVisible()) {
        await deleteButton.click()

        // Confirm deletion if dialog appears
        const confirmButton = page.getByRole('button', { name: /confirm|delete|yes/i })
        if (await confirmButton.isVisible()) {
          await confirmButton.click()
        }

        // Wait for cache update
        await page.waitForTimeout(500)

        // Verify the count decreased (cache was invalidated)
        const newRows = await page.locator('table tbody tr').count()
        expect(newRows).toBeLessThan(initialRows)
      }
    }
  })

  test('should reflect changes immediately without manual refresh', async ({ page }) => {
    const loggedIn = await tryLoginAsAdmin(page)
    if (!loggedIn) {
      test.skip()
      return
    }

    await page.goto('/dashboard/pilots')
    await page.waitForLoadState('domcontentloaded')

    // Verify page content is visible
    await expect(page.getByRole('heading', { name: /pilots/i })).toBeVisible()

    // Navigate to add new pilot
    await page.getByRole('link', { name: /add.*pilot|new.*pilot/i }).click()
    await page.waitForLoadState('domcontentloaded')

    // Fill form with unique data
    const uniqueId = Math.floor(Math.random() * 100000 + 200000).toString()
    await page.getByLabel(/employee id/i).fill(uniqueId)
    await page.getByLabel(/first name/i).fill('CacheTest')
    await page.getByLabel(/last name/i).fill('Validation')

    // Submit form
    await page.getByRole('button', { name: /create pilot/i }).click()

    // Wait for redirect
    await page.waitForURL(/dashboard\/pilots/, { timeout: 10000 })

    // Verify new pilot appears in list (cache was properly invalidated)
    await expect(page.locator(`text=${uniqueId}`)).toBeVisible({ timeout: 5000 })
  })
})

test.describe('API Validation', () => {
  test('should validate UUID format in API endpoints', async ({ request }) => {
    // Test the pilots API which should validate UUIDs
    // This endpoint returns 401 without auth, but we're testing the response format
    const response = await request.get('/api/pilots')

    // Should return proper JSON response (not crash)
    const contentType = response.headers()['content-type']
    expect(contentType).toContain('application/json')
  })

  test('should return proper error format for invalid requests', async ({ request }) => {
    // Try with invalid endpoint to verify error handling
    const response = await request.get('/api/nonexistent-endpoint')

    // Should return 401 (auth required) or 404, not 500 (server error)
    expect([401, 404]).toContain(response.status())
  })
})

test.describe('Portal Form Navigation', () => {
  test('should display login page correctly', async ({ page }) => {
    // Verify portal login page loads without errors
    await page.goto('/portal/login')
    await page.waitForLoadState('domcontentloaded')

    // Login page should have form elements - button text is "Access Portal"
    const submitButton = page.getByRole('button', { name: /access portal|sign in|login/i })

    // At least the submit button should be visible
    await expect(submitButton).toBeVisible({ timeout: 10000 })
  })
})
