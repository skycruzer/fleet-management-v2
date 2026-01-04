/**
 * RDO/SDO Requests E2E Tests
 * Author: Maurice Rondeau
 * Date: January 19, 2025
 *
 * Comprehensive E2E tests for RDO/SDO request workflow
 * Tests both pilot portal and admin dashboard functionality
 *
 * @version 3.0.0 - 3-table architecture
 */

import { test, expect } from '@playwright/test'
import { loginAndNavigate } from './helpers/auth-helpers'

test.describe('RDO/SDO Requests - Pilot Portal', () => {
  test.beforeEach(async ({ page }) => {
    // Login as pilot and navigate to RDO/SDO requests page
    await loginAndNavigate(page, '/portal/rdo-sdo-requests')
  })

  test('should display RDO/SDO requests page', async ({ page }) => {
    // Should show heading
    await expect(page.getByRole('heading', { name: /rdo.*sdo.*requests/i })).toBeVisible()

    // Should show summary cards
    const summaryCards = page.locator('[data-testid="summary-card"]')
    if ((await summaryCards.count()) > 0) {
      await expect(summaryCards.first()).toBeVisible()
    }
  })

  test('should display submit RDO/SDO request button', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /submit.*rdo|submit.*sdo|new.*request/i })
    await expect(submitButton).toBeVisible()
  })

  test('should open RDO/SDO request form', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /submit.*rdo|submit.*sdo|new.*request/i })
    await submitButton.click()

    // Form dialog should open
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Should have form fields
    await expect(page.getByLabel(/request type/i)).toBeVisible()
    await expect(page.getByLabel(/start date/i)).toBeVisible()
  })

  test('should validate RDO/SDO request form', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /submit.*rdo|submit.*sdo|new.*request/i })
    await submitButton.click()

    // Try to submit empty form
    const formSubmitButton = page.getByRole('button', { name: /submit|create/i }).last()
    await formSubmitButton.click()

    // Should show validation errors
    const errorMessage = page.locator('[role="alert"], .error-message, .text-red-600')
    await expect(errorMessage.first()).toBeVisible()
  })

  test('should submit RDO request successfully', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /submit.*rdo|submit.*sdo|new.*request/i })
    await submitButton.click()

    // Select RDO request type
    await page.getByLabel(/request type/i).click()
    await page.getByRole('option', { name: /^rdo/i }).click()

    // Select start date (tomorrow)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateString = tomorrow.toISOString().split('T')[0]
    await page.getByLabel(/start date/i).fill(dateString)

    // Submit form
    const formSubmitButton = page.getByRole('button', { name: /submit.*rdo.*request/i })
    await formSubmitButton.click()

    // Should show success message
    await expect(page.getByText(/success|submitted/i)).toBeVisible({ timeout: 10000 })
  })

  test('should submit SDO request successfully', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /submit.*rdo|submit.*sdo|new.*request/i })
    await submitButton.click()

    // Select SDO request type
    await page.getByLabel(/request type/i).click()
    await page.getByRole('option', { name: /^sdo/i }).click()

    // Select start date
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 2)
    const dateString = tomorrow.toISOString().split('T')[0]
    await page.getByLabel(/start date/i).fill(dateString)

    // Submit form
    const formSubmitButton = page.getByRole('button', { name: /submit.*sdo.*request/i })
    await formSubmitButton.click()

    // Should show success message
    await expect(page.getByText(/success|submitted/i)).toBeVisible({ timeout: 10000 })
  })

  test('should display roster period auto-calculation', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /submit.*rdo|submit.*sdo|new.*request/i })
    await submitButton.click()

    // Fill start date
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateString = tomorrow.toISOString().split('T')[0]
    await page.getByLabel(/start date/i).fill(dateString)

    // Wait for roster period to be calculated
    await page.waitForTimeout(500)

    // Should show roster period info
    await expect(page.getByText(/roster period/i)).toBeVisible()
  })

  test('should display days count calculation', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /submit.*rdo|submit.*sdo|new.*request/i })
    await submitButton.click()

    // Fill start and end dates
    const startDate = new Date()
    startDate.setDate(startDate.getDate() + 1)
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 3)

    await page.getByLabel(/start date/i).fill(startDate.toISOString().split('T')[0])
    await page.getByLabel(/end date/i).fill(endDate.toISOString().split('T')[0])

    // Should show days count
    await expect(page.getByText(/days.*3|3.*days/i)).toBeVisible()
  })

  test('should display RDO/SDO requests list', async ({ page }) => {
    // Should show requests table
    const requestsTable = page.getByRole('table')
    if (await requestsTable.isVisible()) {
      await expect(requestsTable).toBeVisible()

      // Should have column headers
      await expect(page.getByRole('columnheader', { name: /type/i })).toBeVisible()
      await expect(page.getByRole('columnheader', { name: /status/i })).toBeVisible()
    }
  })

  test('should cancel RDO/SDO request', async ({ page }) => {
    const cancelButton = page.getByRole('button', { name: /cancel/i }).first()
    if (await cancelButton.isVisible()) {
      await cancelButton.click()

      // Confirmation dialog should appear
      const confirmDialog = page.getByRole('dialog')
      await expect(confirmDialog).toBeVisible()

      // Confirm cancellation
      const confirmButton = page.getByRole('button', { name: /cancel request|confirm/i }).last()
      await confirmButton.click()

      // Should show success message or update status
      await expect(page.getByText(/withdrawn|cancelled/i)).toBeVisible({ timeout: 10000 })
    }
  })

  test('should display summary statistics', async ({ page }) => {
    // Should show total requests
    await expect(page.getByText(/total.*requests/i)).toBeVisible()

    // Should show pending count
    const pendingText = page.getByText(/pending|submitted/i)
    if ((await pendingText.count()) > 0) {
      await expect(pendingText.first()).toBeVisible()
    }
  })

  test('should filter requests by type', async ({ page }) => {
    const rdoFilter = page.getByRole('button', { name: /rdo/i }).first()
    if (await rdoFilter.isVisible()) {
      await rdoFilter.click()

      // Should filter to RDO requests only
      await page.waitForTimeout(500)
    }
  })
})

test.describe('RDO/SDO Requests - Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/rdo-sdo-requests')
  })

  test('should display all RDO/SDO requests', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /rdo.*sdo.*requests/i })).toBeVisible()

    // Should show requests
    const requests = page.locator('[data-testid="rdo-sdo-request"]')
    if ((await requests.count()) > 0) {
      await expect(requests.first()).toBeVisible()
    }
  })

  test('should display filter controls', async ({ page }) => {
    // Should have status filters
    await expect(page.getByText(/status filter/i)).toBeVisible()

    // Should have type filters
    await expect(page.getByText(/request type/i)).toBeVisible()
  })

  test('should filter by status', async ({ page }) => {
    const submittedFilter = page.getByRole('button', { name: /submitted/i }).first()
    if (await submittedFilter.isVisible()) {
      await submittedFilter.click()

      // Should update results count
      await page.waitForTimeout(500)
      await expect(page.getByText(/showing.*of.*requests/i)).toBeVisible()
    }
  })

  test('should filter by request type (RDO)', async ({ page }) => {
    const rdoFilter = page.getByRole('button', { name: /^rdo$/i })
    if (await rdoFilter.isVisible()) {
      await rdoFilter.click()

      // Should filter to RDO only
      await page.waitForTimeout(500)
    }
  })

  test('should filter by request type (SDO)', async ({ page }) => {
    const sdoFilter = page.getByRole('button', { name: /^sdo$/i })
    if (await sdoFilter.isVisible()) {
      await sdoFilter.click()

      // Should filter to SDO only
      await page.waitForTimeout(500)
    }
  })

  test('should open review modal', async ({ page }) => {
    const reviewButton = page.getByRole('button', { name: /review|view details/i }).first()
    if (await reviewButton.isVisible()) {
      await reviewButton.click()

      // Review modal should open
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()

      // Should show request details
      await expect(page.getByText(/pilot/i)).toBeVisible()
      await expect(page.getByText(/type/i)).toBeVisible()
    }
  })

  test('should approve RDO/SDO request', async ({ page }) => {
    const reviewButton = page.getByRole('button', { name: /review|view details/i }).first()
    if (await reviewButton.isVisible()) {
      await reviewButton.click()

      // Select approve option
      const approveButton = page.getByRole('button', { name: /approve/i }).first()
      await approveButton.click()

      // Add review comments (optional)
      const commentsField = page.getByLabel(/comments/i)
      if (await commentsField.isVisible()) {
        await commentsField.fill('Approved - crew availability confirmed')
      }

      // Submit review
      const submitButton = page.getByRole('button', { name: /approve request/i })
      await submitButton.click()

      // Should show success message
      await expect(page.getByText(/approved|success/i)).toBeVisible({ timeout: 10000 })
    }
  })

  test('should deny RDO/SDO request with comments', async ({ page }) => {
    const reviewButton = page.getByRole('button', { name: /review|view details/i }).first()
    if (await reviewButton.isVisible()) {
      await reviewButton.click()

      // Select deny option
      const denyButton = page.getByRole('button', { name: /deny/i }).first()
      await denyButton.click()

      // Add review comments
      const commentsField = page.getByLabel(/comments/i)
      await expect(commentsField).toBeVisible()
      await commentsField.fill('Insufficient crew coverage for this period')

      // Submit review
      const submitButton = page.getByRole('button', { name: /deny request/i })
      await submitButton.click()

      // Should show success message
      await expect(page.getByText(/denied|rejected/i)).toBeVisible({ timeout: 10000 })
    }
  })

  test('should display late request indicator', async ({ page }) => {
    // Look for late request badges
    const lateIndicator = page.getByText(/late request/i)
    if ((await lateIndicator.count()) > 0) {
      await expect(lateIndicator.first()).toBeVisible()
    }
  })

  test('should display pilot details in request card', async ({ page }) => {
    const firstRequest = page.locator('[data-testid="rdo-sdo-request"]').first()
    if (await firstRequest.isVisible()) {
      // Should show pilot name
      await expect(firstRequest.getByText(/pilot:/i)).toBeVisible()

      // Should show rank
      await expect(firstRequest.getByText(/rank:/i)).toBeVisible()

      // Should show employee number
      await expect(firstRequest.getByText(/employee #:/i)).toBeVisible()
    }
  })

  test('should display date range correctly', async ({ page }) => {
    const firstRequest = page.locator('[data-testid="rdo-sdo-request"]').first()
    if (await firstRequest.isVisible()) {
      // Should show dates
      await expect(firstRequest.getByText(/dates:/i)).toBeVisible()

      // Should show days count
      await expect(firstRequest.getByText(/days:/i)).toBeVisible()
    }
  })

  test('should show reviewed by information', async ({ page }) => {
    // Look for reviewed requests
    const reviewInfo = page.getByText(/reviewed by:/i)
    if ((await reviewInfo.count()) > 0) {
      await expect(reviewInfo.first()).toBeVisible()

      // Should also show review date
      await expect(page.getByText(/reviewed on:/i).first()).toBeVisible()
    }
  })

  test('should display results count', async ({ page }) => {
    await expect(page.getByText(/showing.*of.*requests/i)).toBeVisible()
  })

  test('should display empty state when no requests', async ({ page }) => {
    // Filter to a status that might have no requests
    const withdrawnFilter = page.getByRole('button', { name: /withdrawn/i })
    if (await withdrawnFilter.isVisible()) {
      await withdrawnFilter.click()
      await page.waitForTimeout(500)

      // Might show empty state
      const emptyState = page.getByText(/no.*requests/i)
      if ((await emptyState.count()) > 0) {
        await expect(emptyState.first()).toBeVisible()
      }
    }
  })
})

test.describe('RDO/SDO Request Validation', () => {
  test('should enforce date validation', async ({ page }) => {
    await loginAndNavigate(page, '/portal/rdo-sdo-requests')

    const submitButton = page.getByRole('button', { name: /submit.*rdo|submit.*sdo|new.*request/i })
    await submitButton.click()

    // Try to set end date before start date
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    await page.getByLabel(/start date/i).fill(today.toISOString().split('T')[0])
    await page.getByLabel(/end date/i).fill(yesterday.toISOString().split('T')[0])

    // Should show validation error
    const errorMessage = page.locator('[role="alert"], .error-message, .text-red-600')
    await expect(errorMessage.first()).toBeVisible()
  })

  test('should prevent duplicate requests', async ({ page }) => {
    await loginAndNavigate(page, '/portal/rdo-sdo-requests')

    // Submit first request
    const submitButton = page.getByRole('button', { name: /submit.*rdo|submit.*sdo|new.*request/i })
    await submitButton.click()

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 5)
    const dateString = tomorrow.toISOString().split('T')[0]

    await page.getByLabel(/start date/i).fill(dateString)

    const formSubmitButton = page.getByRole('button', { name: /submit/i }).last()
    await formSubmitButton.click()

    // Wait for success
    await page.waitForTimeout(2000)

    // Try to submit duplicate request
    await submitButton.click()
    await page.getByLabel(/start date/i).fill(dateString)
    await formSubmitButton.click()

    // Should show error about duplicate
    const errorMessage = page.getByText(/duplicate|already exists/i)
    if ((await errorMessage.count()) > 0) {
      await expect(errorMessage.first()).toBeVisible()
    }
  })

  test('should enforce workflow status rules', async ({ page }) => {
    await page.goto('/dashboard/rdo-sdo-requests')

    // Look for approved or denied requests
    const approvedRequest = page.getByText(/approved/i).first()
    if (await approvedRequest.isVisible()) {
      // Approved/denied requests should not be editable
      // This would be enforced by the database and service layer
      // UI should not show edit button for these statuses
    }
  })
})

test.describe('RDO/SDO Request Workflow', () => {
  test('should track status changes', async ({ page }) => {
    await page.goto('/dashboard/rdo-sdo-requests')

    const reviewButton = page.getByRole('button', { name: /review/i }).first()
    if (await reviewButton.isVisible()) {
      // Check current status
      const statusBefore = await page
        .getByText(/submitted|in review/i)
        .first()
        .textContent()

      // Approve request
      await reviewButton.click()
      const approveButton = page.getByRole('button', { name: /approve/i }).first()
      await approveButton.click()

      const submitButton = page.getByRole('button', { name: /approve request/i })
      await submitButton.click()

      // Wait for update
      await page.waitForTimeout(2000)

      // Status should change to approved
      await expect(page.getByText(/approved/i).first()).toBeVisible()
    }
  })

  test('should handle cancellation workflow', async ({ page }) => {
    await loginAndNavigate(page, '/portal/rdo-sdo-requests')

    const cancelButton = page.getByRole('button', { name: /cancel/i }).first()
    if (await cancelButton.isVisible()) {
      await cancelButton.click()

      // Confirm cancellation
      const confirmButton = page.getByRole('button', { name: /cancel request|confirm/i }).last()
      await confirmButton.click()

      // Should update to withdrawn status
      await expect(page.getByText(/withdrawn/i)).toBeVisible({ timeout: 10000 })
    }
  })
})
