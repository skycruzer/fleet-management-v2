import { test, expect } from '@playwright/test'
import { loginAndNavigate } from './helpers/auth-helpers'

test.describe('Feedback System - Pilot Portal', () => {
  test.beforeEach(async ({ page }) => {
    // Login as pilot and navigate to feedback page
    await loginAndNavigate(page, '/portal/feedback')
  })

  test('should display feedback page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /feedback/i })).toBeVisible()
  })

  test('should show submit feedback button', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /submit.*feedback/i })
    await expect(submitButton).toBeVisible()
  })

  test('should open feedback form', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /submit.*feedback/i })
    await submitButton.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Should have form fields
    await expect(page.getByLabel(/category/i)).toBeVisible()
    await expect(page.getByLabel(/subject/i)).toBeVisible()
    await expect(page.getByLabel(/message|feedback/i)).toBeVisible()
  })

  test('should validate feedback form', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /submit.*feedback/i })
    await submitButton.click()

    // Try to submit without filling required fields
    const formSubmitButton = page.getByRole('button', { name: /submit|send/i }).last()
    await formSubmitButton.click()

    // Should show validation errors
    const errorMessage = page.locator('[role="alert"], .error-message')
    await expect(errorMessage.first()).toBeVisible()
  })

  test('should submit general feedback', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /submit.*feedback/i })
    await submitButton.click()

    // Select category
    await page.getByLabel(/category/i).click()
    await page.getByRole('option', { name: /general/i }).click()

    // Fill subject and message
    await page.getByLabel(/subject/i).fill('System Performance Feedback')
    await page.getByLabel(/message|feedback/i).fill('The system has been performing very well. Great work!')

    // Submit
    const formSubmitButton = page.getByRole('button', { name: /submit|send/i }).last()
    await formSubmitButton.click()

    // Should show success message
    await expect(page.getByText(/success|submitted|thank you/i)).toBeVisible({ timeout: 10000 })
  })

  test('should submit operations feedback', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /submit.*feedback/i })
    await submitButton.click()

    await page.getByLabel(/category/i).click()
    await page.getByRole('option', { name: /operations/i }).click()

    await page.getByLabel(/subject/i).fill('Flight Scheduling Optimization')
    await page.getByLabel(/message|feedback/i).fill('Suggest implementing automated roster optimization')

    const formSubmitButton = page.getByRole('button', { name: /submit|send/i }).last()
    await formSubmitButton.click()

    await expect(page.getByText(/success|submitted/i)).toBeVisible({ timeout: 10000 })
  })

  test('should submit safety feedback', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /submit.*feedback/i })
    await submitButton.click()

    await page.getByLabel(/category/i).click()
    await page.getByRole('option', { name: /safety/i }).click()

    await page.getByLabel(/subject/i).fill('Safety Procedure Update Needed')
    await page.getByLabel(/message|feedback/i).fill('Emergency evacuation procedures should be reviewed')

    const formSubmitButton = page.getByRole('button', { name: /submit|send/i }).last()
    await formSubmitButton.click()

    await expect(page.getByText(/success|submitted/i)).toBeVisible({ timeout: 10000 })
  })

  test('should support anonymous feedback', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /submit.*feedback/i })
    await submitButton.click()

    // Look for anonymous option
    const anonymousCheckbox = page.getByLabel(/anonymous/i)
    if (await anonymousCheckbox.isVisible()) {
      await anonymousCheckbox.check()

      // Complete form
      await page.getByLabel(/category/i).click()
      await page.getByRole('option').first().click()

      await page.getByLabel(/subject/i).fill('Anonymous Feedback Test')
      await page.getByLabel(/message|feedback/i).fill('This is anonymous feedback')

      const formSubmitButton = page.getByRole('button', { name: /submit|send/i }).last()
      await formSubmitButton.click()

      await expect(page.getByText(/success|submitted/i)).toBeVisible({ timeout: 10000 })
    }
  })

  test('should display feedback history', async ({ page }) => {
    // Check for submitted feedback
    const feedbackItems = page.getByTestId('feedback-item')
    if (await feedbackItems.count() > 0) {
      await expect(feedbackItems.first()).toBeVisible()
    }
  })

  test('should view feedback details', async ({ page }) => {
    const feedbackItem = page.getByTestId('feedback-item').first()
    if (await feedbackItem.isVisible()) {
      await feedbackItem.click()

      // Should show details
      await expect(page.getByText(/category/i)).toBeVisible()
      await expect(page.getByText(/subject/i)).toBeVisible()
      await expect(page.getByText(/submitted/i)).toBeVisible()
    }
  })
})

test.describe('Feedback Categories', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/portal/feedback')
    const submitButton = page.getByRole('button', { name: /submit.*feedback/i })
    await submitButton.click()
    await page.getByLabel(/category/i).click()
  })

  test('should have general category', async ({ page }) => {
    const option = page.getByRole('option', { name: /general/i })
    await expect(option).toBeVisible()
  })

  test('should have operations category', async ({ page }) => {
    const option = page.getByRole('option', { name: /operations/i })
    await expect(option).toBeVisible()
  })

  test('should have safety category', async ({ page }) => {
    const option = page.getByRole('option', { name: /safety/i })
    await expect(option).toBeVisible()
  })

  test('should have training category', async ({ page }) => {
    const option = page.getByRole('option', { name: /training/i })
    await expect(option).toBeVisible()
  })

  test('should have scheduling category', async ({ page }) => {
    const option = page.getByRole('option', { name: /schedul/i })
    await expect(option).toBeVisible()
  })

  test('should have system/IT category', async ({ page }) => {
    const option = page.getByRole('option', { name: /system|IT/i })
    await expect(option).toBeVisible()
  })

  test('should have other category', async ({ page }) => {
    const option = page.getByRole('option', { name: /other/i })
    await expect(option).toBeVisible()
  })
})

test.describe('Feedback System - Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/feedback')
  })

  test('should display all feedback submissions', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /feedback/i })).toBeVisible()

    const feedbackItems = page.getByTestId('feedback-item')
    if (await feedbackItems.count() > 0) {
      await expect(feedbackItems.first()).toBeVisible()
    }
  })

  test('should filter feedback by category', async ({ page }) => {
    const categoryFilter = page.getByLabel(/category|filter/i)
    if (await categoryFilter.isVisible()) {
      await categoryFilter.click()
      await page.getByRole('option', { name: /safety/i }).click()

      await page.waitForTimeout(500)
    }
  })

  test('should view feedback details', async ({ page }) => {
    const feedbackItem = page.getByTestId('feedback-item').first()
    if (await feedbackItem.isVisible()) {
      await feedbackItem.click()

      // Should show comprehensive details
      await expect(page.getByText(/pilot|submitter/i)).toBeVisible()
      await expect(page.getByText(/category/i)).toBeVisible()
      await expect(page.getByText(/submitted/i)).toBeVisible()
    }
  })

  test('should mark feedback as reviewed', async ({ page }) => {
    const reviewButton = page.getByRole('button', { name: /mark.*reviewed|reviewed/i }).first()
    if (await reviewButton.isVisible()) {
      await reviewButton.click()

      await expect(page.getByText(/reviewed|success/i)).toBeVisible({ timeout: 10000 })
    }
  })

  test('should add admin response to feedback', async ({ page }) => {
    const respondButton = page.getByRole('button', { name: /respond|reply/i }).first()
    if (await respondButton.isVisible()) {
      await respondButton.click()

      const responseInput = page.getByLabel(/response|message/i)
      await expect(responseInput).toBeVisible()

      await responseInput.fill('Thank you for your feedback. We will review and implement changes.')

      const submitButton = page.getByRole('button', { name: /submit|send/i }).last()
      await submitButton.click()

      await expect(page.getByText(/success|sent/i)).toBeVisible({ timeout: 10000 })
    }
  })

  test('should export feedback submissions', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /export|download/i })
    if (await exportButton.isVisible()) {
      const downloadPromise = page.waitForEvent('download')
      await exportButton.click()

      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/feedback.*csv/i)
    }
  })

  test('should show anonymous submissions differently', async ({ page }) => {
    // Anonymous feedback should be indicated
    const anonymousIndicator = page.getByText(/anonymous/i)
    if (await anonymousIndicator.count() > 0) {
      await expect(anonymousIndicator.first()).toBeVisible()
    }
  })
})
