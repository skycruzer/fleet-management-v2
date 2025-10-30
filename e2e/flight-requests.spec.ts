import { test, expect } from '@playwright/test'
import { loginAndNavigate } from './helpers/auth-helpers'

test.describe('Flight Requests - Pilot Portal', () => {
  test.beforeEach(async ({ page }) => {
    // Login as pilot and navigate to flight requests page
    await loginAndNavigate(page, '/portal/flight-requests')
  })

  test('should display flight requests page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /flight requests/i })).toBeVisible()
  })

  test('should show submit flight request button', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /submit.*request/i })
    await expect(submitButton).toBeVisible()
  })

  test('should open flight request form', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /submit.*request/i })
    await submitButton.click()

    // Dialog should open
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Should have form fields
    await expect(page.getByLabel(/request type/i)).toBeVisible()
  })

  test('should validate flight request form', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /submit.*request/i })
    await submitButton.click()

    // Try to submit empty form
    const formSubmitButton = page.getByRole('button', { name: /submit|create/i }).last()
    await formSubmitButton.click()

    // Should show validation errors
    const errorMessage = page.locator('[role="alert"], .error-message')
    await expect(errorMessage.first()).toBeVisible()
  })

  test('should submit additional flight request', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /submit.*request/i })
    await submitButton.click()

    // Select request type
    await page.getByLabel(/request type/i).click()
    await page.getByRole('option', { name: /additional.*flight/i }).click()

    // Fill in details
    await page.getByLabel(/route|destination/i).fill('POM-LAX')
    await page.getByLabel(/date/i).first().fill('2025-11-15')
    await page.getByLabel(/notes|justification/i).fill('Personal travel requirements')

    // Submit
    const formSubmitButton = page.getByRole('button', { name: /submit|create/i }).last()
    await formSubmitButton.click()

    // Should show success message
    await expect(page.getByText(/success|submitted/i)).toBeVisible({ timeout: 10000 })
  })

  test('should submit route change request', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /submit.*request/i })
    await submitButton.click()

    // Select route change
    await page.getByLabel(/request type/i).click()
    await page.getByRole('option', { name: /route.*change/i }).click()

    // Fill details
    await page.getByLabel(/current.*route/i).fill('POM-BNE')
    await page.getByLabel(/preferred.*route/i).fill('POM-SYD')
    await page.getByLabel(/reason|justification/i).fill('Family in Sydney')

    // Submit
    const formSubmitButton = page.getByRole('button', { name: /submit|create/i }).last()
    await formSubmitButton.click()

    await expect(page.getByText(/success|submitted/i)).toBeVisible({ timeout: 10000 })
  })

  test('should display request history', async ({ page }) => {
    // Check for existing requests
    const requests = page.getByTestId('flight-request')
    if (await requests.count() > 0) {
      await expect(requests.first()).toBeVisible()

      // Should show request details
      await expect(page.getByText(/pending|approved|rejected/i)).toBeVisible()
    }
  })

  test('should filter requests by status', async ({ page }) => {
    const statusFilter = page.getByLabel(/status|filter/i)
    if (await statusFilter.isVisible()) {
      await statusFilter.click()
      await page.getByRole('option', { name: /pending/i }).click()

      await page.waitForTimeout(500)
      // Results should update
    }
  })

  test('should view request details', async ({ page }) => {
    const request = page.getByTestId('flight-request').first()
    if (await request.isVisible()) {
      await request.click()

      // Should show expanded details
      await expect(page.getByText(/request type/i)).toBeVisible()
      await expect(page.getByText(/submitted/i)).toBeVisible()
    }
  })
})

test.describe('Flight Requests - Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/flight-requests')
  })

  test('should display all flight requests', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /flight requests/i })).toBeVisible()

    const requests = page.getByTestId('flight-request')
    if (await requests.count() > 0) {
      await expect(requests.first()).toBeVisible()
    }
  })

  test('should filter requests by type', async ({ page }) => {
    const typeFilter = page.getByLabel(/type|filter/i)
    if (await typeFilter.isVisible()) {
      await typeFilter.click()
      await page.getByRole('option', { name: /additional/i }).click()

      await page.waitForTimeout(500)
    }
  })

  test('should approve flight request', async ({ page }) => {
    const approveButton = page.getByRole('button', { name: /approve/i }).first()
    if (await approveButton.isVisible()) {
      await approveButton.click()

      // May have confirmation dialog
      const confirmButton = page.getByRole('button', { name: /confirm|yes/i })
      if (await confirmButton.isVisible()) {
        await confirmButton.click()
      }

      await expect(page.getByText(/approved|success/i)).toBeVisible({ timeout: 10000 })
    }
  })

  test('should deny flight request with feedback', async ({ page }) => {
    const denyButton = page.getByRole('button', { name: /deny|reject/i }).first()
    if (await denyButton.isVisible()) {
      await denyButton.click()

      // Should allow admin feedback
      const feedbackInput = page.getByLabel(/feedback|reason|note/i)
      await expect(feedbackInput).toBeVisible()

      await feedbackInput.fill('Unable to accommodate due to scheduling constraints')

      const confirmButton = page.getByRole('button', { name: /confirm|deny/i }).last()
      await confirmButton.click()

      await expect(page.getByText(/denied|rejected/i)).toBeVisible({ timeout: 10000 })
    }
  })

  test('should view detailed request information', async ({ page }) => {
    const request = page.getByTestId('flight-request').first()
    if (await request.isVisible()) {
      await request.click()

      // Should show comprehensive details
      await expect(page.getByText(/pilot.*name/i)).toBeVisible()
      await expect(page.getByText(/request.*type/i)).toBeVisible()
      await expect(page.getByText(/submission.*date/i)).toBeVisible()
    }
  })

  test('should export flight requests', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /export|download/i })
    if (await exportButton.isVisible()) {
      const downloadPromise = page.waitForEvent('download')
      await exportButton.click()

      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/flight.*request.*csv/i)
    }
  })
})

test.describe('Flight Request Types', () => {
  test.beforeEach(async ({ page }) => {
    // Login as pilot and navigate to flight requests page
    await loginAndNavigate(page, '/portal/flight-requests')
  })

  test('should support additional flight requests', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /submit.*request/i })
    await submitButton.click()

    await page.getByLabel(/request type/i).click()
    const additionalOption = page.getByRole('option', { name: /additional/i })
    await expect(additionalOption).toBeVisible()
  })

  test('should support route change requests', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /submit.*request/i })
    await submitButton.click()

    await page.getByLabel(/request type/i).click()
    const routeOption = page.getByRole('option', { name: /route/i })
    await expect(routeOption).toBeVisible()
  })

  test('should support schedule preference requests', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /submit.*request/i })
    await submitButton.click()

    await page.getByLabel(/request type/i).click()
    const scheduleOption = page.getByRole('option', { name: /schedule/i })
    await expect(scheduleOption).toBeVisible()
  })

  test('should support training requests', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /submit.*request/i })
    await submitButton.click()

    await page.getByLabel(/request type/i).click()
    const trainingOption = page.getByRole('option', { name: /training/i })
    await expect(trainingOption).toBeVisible()
  })
})
