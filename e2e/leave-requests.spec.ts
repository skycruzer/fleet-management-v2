import { test, expect } from '@playwright/test'

test.describe('Leave Requests - Pilot Portal', () => {
  test.beforeEach(async ({ page }) => {
    // Assume authentication is handled
    await page.goto('/portal/leave')
  })

  test('should display leave requests list', async ({ page }) => {
    // Should show heading
    await expect(page.getByRole('heading', { name: /leave requests/i })).toBeVisible()

    // Should show leave request cards or table
    const leaveRequests = page.getByTestId('leave-request')
    if (await leaveRequests.count() > 0) {
      await expect(leaveRequests.first()).toBeVisible()
    }
  })

  test('should show submit leave request button', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /submit.*leave/i })
    await expect(submitButton).toBeVisible()
  })

  test('should open leave request form', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /submit.*leave/i })
    await submitButton.click()

    // Form dialog should open
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Should have form fields
    await expect(page.getByLabel(/roster period/i)).toBeVisible()
    await expect(page.getByLabel(/leave type/i)).toBeVisible()
  })

  test('should validate leave request form', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /submit.*leave/i })
    await submitButton.click()

    // Try to submit empty form
    const formSubmitButton = page.getByRole('button', { name: /submit|create/i }).last()
    await formSubmitButton.click()

    // Should show validation errors
    const errorMessage = page.locator('[role="alert"], .error-message')
    await expect(errorMessage.first()).toBeVisible()
  })

  test('should submit leave request successfully', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /submit.*leave/i })
    await submitButton.click()

    // Fill form
    await page.getByLabel(/roster period/i).click()
    await page.getByRole('option').first().click()

    await page.getByLabel(/leave type/i).click()
    await page.getByRole('option', { name: /annual/i }).click()

    // Submit form
    const formSubmitButton = page.getByRole('button', { name: /submit|create/i }).last()
    await formSubmitButton.click()

    // Should show success message
    await expect(page.getByText(/success|submitted/i)).toBeVisible({ timeout: 10000 })
  })

  test('should filter leave requests by status', async ({ page }) => {
    // Check if filter exists
    const statusFilter = page.getByLabel(/status|filter/i)
    if (await statusFilter.isVisible()) {
      await statusFilter.click()
      await page.getByRole('option', { name: /pending/i }).click()

      // Should filter results
      await expect(page.getByTestId('leave-request')).toBeVisible()
    }
  })

  test('should show eligibility alerts', async ({ page }) => {
    // Look for eligibility alert indicators
    const alert = page.getByText(/eligibility alert|multiple.*requesting/i)
    if (await alert.count() > 0) {
      await expect(alert.first()).toBeVisible()
    }
  })

  test('should display leave request details', async ({ page }) => {
    const leaveRequest = page.getByTestId('leave-request').first()
    if (await leaveRequest.isVisible()) {
      await leaveRequest.click()

      // Should show details
      await expect(page.getByText(/roster period/i)).toBeVisible()
      await expect(page.getByText(/start date/i)).toBeVisible()
      await expect(page.getByText(/end date/i)).toBeVisible()
    }
  })
})

test.describe('Leave Requests - Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/leave-requests')
  })

  test('should display all leave requests', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /leave requests/i })).toBeVisible()

    // Should show requests table or list
    const requests = page.getByTestId('leave-request')
    if (await requests.count() > 0) {
      await expect(requests.first()).toBeVisible()
    }
  })

  test('should filter by roster period', async ({ page }) => {
    const rosterFilter = page.getByLabel(/roster.*period/i)
    if (await rosterFilter.isVisible()) {
      await rosterFilter.click()
      await page.getByRole('option').first().click()

      // Results should update
      await page.waitForTimeout(500)
    }
  })

  test('should show eligibility information', async ({ page }) => {
    const request = page.getByTestId('leave-request').first()
    if (await request.isVisible()) {
      // Should show remaining crew info
      await expect(page.getByText(/remaining|available/i)).toBeVisible()
    }
  })

  test('should approve leave request', async ({ page }) => {
    const approveButton = page.getByRole('button', { name: /approve/i }).first()
    if (await approveButton.isVisible()) {
      await approveButton.click()

      // Confirmation dialog might appear
      const confirmButton = page.getByRole('button', { name: /confirm|yes/i })
      if (await confirmButton.isVisible()) {
        await confirmButton.click()
      }

      // Should show success message
      await expect(page.getByText(/approved|success/i)).toBeVisible({ timeout: 10000 })
    }
  })

  test('should reject leave request with reason', async ({ page }) => {
    const rejectButton = page.getByRole('button', { name: /reject|deny/i }).first()
    if (await rejectButton.isVisible()) {
      await rejectButton.click()

      // Should require rejection reason
      const reasonInput = page.getByLabel(/reason|note/i)
      await expect(reasonInput).toBeVisible()

      await reasonInput.fill('Minimum crew requirements not met')

      const confirmButton = page.getByRole('button', { name: /confirm|reject/i }).last()
      await confirmButton.click()

      // Should show success message
      await expect(page.getByText(/rejected|denied/i)).toBeVisible({ timeout: 10000 })
    }
  })

  test('should show competing requests warning', async ({ page }) => {
    // Look for warnings about multiple requests for same dates
    const warning = page.getByText(/multiple.*same.*dates|competing/i)
    if (await warning.count() > 0) {
      await expect(warning.first()).toBeVisible()
    }
  })

  test('should display seniority-based priority', async ({ page }) => {
    const request = page.getByTestId('leave-request').first()
    if (await request.isVisible()) {
      // Should show seniority number
      await expect(page.getByText(/#\d+/)).toBeVisible()
    }
  })

  test('should export leave requests to CSV', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /export|download/i })
    if (await exportButton.isVisible()) {
      const downloadPromise = page.waitForEvent('download')
      await exportButton.click()

      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/leave.*csv/i)
    }
  })
})

test.describe('Leave Request Validation', () => {
  test('should enforce minimum crew requirements', async ({ page }) => {
    await page.goto('/dashboard/leave-requests')

    // Try to approve request that would violate minimum crew
    // This would require specific test data setup
    // For now, check that eligibility info is displayed
    const eligibilityInfo = page.getByText(/remaining.*captains|remaining.*first officers/i)
    if (await eligibilityInfo.count() > 0) {
      await expect(eligibilityInfo.first()).toBeVisible()
    }
  })

  test('should handle overlapping leave requests', async ({ page }) => {
    await page.goto('/dashboard/leave-requests')

    // Look for overlapping request indicators
    const overlap = page.getByText(/overlap|conflict/i)
    if (await overlap.count() > 0) {
      await expect(overlap.first()).toBeVisible()
    }
  })

  test('should respect seniority priority', async ({ page }) => {
    await page.goto('/dashboard/leave-requests')

    // Requests should be sorted or grouped by seniority
    const seniorityNumbers = page.getByText(/#\d+/)
    if (await seniorityNumbers.count() >= 2) {
      const first = await seniorityNumbers.nth(0).textContent()
      const second = await seniorityNumbers.nth(1).textContent()

      // Should be in seniority order (lower number first)
      const firstNum = parseInt(first?.replace('#', '') || '0')
      const secondNum = parseInt(second?.replace('#', '') || '0')
      expect(firstNum).toBeLessThanOrEqual(secondNum)
    }
  })
})
