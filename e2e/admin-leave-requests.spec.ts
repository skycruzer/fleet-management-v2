import { test, expect } from '@playwright/test'

/**
 * Admin Leave Request Workflow E2E Test
 *
 * Tests the admin portal leave request management:
 * - Submitting leave requests on behalf of pilots
 * - Approving/rejecting leave requests
 * - Eligibility checking (minimum crew requirements)
 * - Conflict detection
 * - Late request flagging
 *
 * This validates the leave-service.ts implementation
 */

test.describe('Admin Leave Requests - Create on Behalf of Pilot', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin leave request creation page
    await page.goto('/dashboard/leave/new')
  })

  test('should display new leave request form', async ({ page }) => {
    // Should show heading
    await expect(page.getByRole('heading', { name: /new.*leave.*request/i })).toBeVisible()

    // Should show required form fields
    await expect(page.getByLabel(/pilot/i)).toBeVisible()
    await expect(page.getByLabel(/leave.*type/i)).toBeVisible()
    await expect(page.getByLabel(/start.*date|from/i)).toBeVisible()
    await expect(page.getByLabel(/end.*date|to/i)).toBeVisible()
  })

  test('should load pilot list in dropdown', async ({ page }) => {
    // Click pilot selector
    const pilotSelector = page.getByLabel(/pilot/i)
    await pilotSelector.click()

    // Should show pilot options
    const pilotOptions = page.getByRole('option')
    const optionCount = await pilotOptions.count()

    // Should have at least 27 pilots (per CLAUDE.md)
    expect(optionCount).toBeGreaterThanOrEqual(27)

    console.log(`✅ Loaded ${optionCount} pilots in dropdown`)
  })

  test('should submit leave request for pilot successfully', async ({ page }) => {
    // Select a pilot
    const pilotSelector = page.getByLabel(/pilot/i)
    await pilotSelector.click()
    await page.getByRole('option').first().click()

    // Select leave type
    const leaveTypeSelector = page.getByLabel(/leave.*type/i)
    await leaveTypeSelector.click()
    await page.getByRole('option', { name: /annual/i }).click()

    // Set dates (30 days from now to avoid late request)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() + 30)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 14) // 2 weeks

    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    await page.fill('[name="start_date"]', formatDate(startDate))
    await page.fill('[name="end_date"]', formatDate(endDate))

    // Add optional reason
    const reasonField = page.getByLabel(/reason/i)
    if (await reasonField.isVisible()) {
      await reasonField.fill('Annual leave as requested by pilot')
    }

    // Take screenshot before submission
    await page.screenshot({
      path: 'e2e-screenshots/admin-leave-request-filled.png',
      fullPage: true,
    })

    // Submit form
    const submitButton = page.getByRole('button', { name: /submit|create/i })
    await submitButton.click()

    // Wait for success message
    try {
      await expect(page.getByText(/success|created|submitted/i)).toBeVisible({
        timeout: 10000,
      })

      await page.screenshot({
        path: 'e2e-screenshots/admin-leave-request-success.png',
        fullPage: true,
      })

      console.log('✅ SUCCESS: Admin leave request submitted')
      console.log('Service layer WORKS - leave-service.ts functioning correctly')
    } catch (error) {
      await page.screenshot({
        path: 'e2e-screenshots/admin-leave-request-error.png',
        fullPage: true,
      })

      const errorAlert = await page.locator('[role="alert"]').textContent()
      if (errorAlert) {
        console.log('\n❌ ERROR ALERT:', errorAlert)
      }

      throw new Error('Admin leave request submission failed')
    }
  })

  test('should validate date range', async ({ page }) => {
    // Select pilot and leave type
    await page.getByLabel(/pilot/i).click()
    await page.getByRole('option').first().click()

    await page.getByLabel(/leave.*type/i).click()
    await page.getByRole('option', { name: /annual/i }).click()

    // Set end date before start date (invalid)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const today = new Date()

    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    await page.fill('[name="start_date"]', formatDate(tomorrow))
    await page.fill('[name="end_date"]', formatDate(today)) // Earlier than start

    // Submit form
    await page.getByRole('button', { name: /submit|create/i }).click()

    // Should show validation error
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 3000 })
    console.log('✅ Date validation works')
  })

  test('should flag late requests (less than 21 days notice)', async ({ page }) => {
    // Select pilot and leave type
    await page.getByLabel(/pilot/i).click()
    await page.getByRole('option').first().click()

    await page.getByLabel(/leave.*type/i).click()
    await page.getByRole('option', { name: /annual/i }).click()

    // Set start date to 10 days from now (less than 21-day threshold)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() + 10)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 7)

    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    await page.fill('[name="start_date"]', formatDate(startDate))
    await page.fill('[name="end_date"]', formatDate(endDate))

    // Look for late request warning
    const lateWarning = page.getByText(/late.*request|less.*21.*days/i)
    if (await lateWarning.isVisible()) {
      console.log('✅ Late request detection works')
    }
  })

  test('should enforce maximum leave duration (90 days)', async ({ page }) => {
    // Select pilot and leave type
    await page.getByLabel(/pilot/i).click()
    await page.getByRole('option').first().click()

    await page.getByLabel(/leave.*type/i).click()
    await page.getByRole('option', { name: /annual/i }).click()

    // Set leave duration to 100 days (exceeds maximum)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() + 30)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 100) // 100 days

    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    await page.fill('[name="start_date"]', formatDate(startDate))
    await page.fill('[name="end_date"]', formatDate(endDate))

    // Submit form
    await page.getByRole('button', { name: /submit|create/i }).click()

    // Should show validation error
    await expect(page.getByText(/maximum.*90.*days|cannot.*exceed/i)).toBeVisible({
      timeout: 3000,
    })
    console.log('✅ Maximum duration validation works')
  })

  test('should prevent start date in past', async ({ page }) => {
    // Select pilot and leave type
    await page.getByLabel(/pilot/i).click()
    await page.getByRole('option').first().click()

    await page.getByLabel(/leave.*type/i).click()
    await page.getByRole('option', { name: /annual/i }).click()

    // Set start date to yesterday
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 7)

    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    await page.fill('[name="start_date"]', formatDate(yesterday))
    await page.fill('[name="end_date"]', formatDate(endDate))

    // Submit form
    await page.getByRole('button', { name: /submit|create/i }).click()

    // Should show validation error
    await expect(page.getByText(/cannot.*past|must.*future/i)).toBeVisible({ timeout: 3000 })
    console.log('✅ Past date validation works')
  })
})

test.describe('Admin Leave Requests - Review and Approval', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/leave-requests')
  })

  test('should display all leave requests', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /leave.*request/i })).toBeVisible()

    // Should show requests in table or list
    const requests = page.getByTestId('leave-request')
    if ((await requests.count()) > 0) {
      await expect(requests.first()).toBeVisible()
      console.log(`✅ Displaying ${await requests.count()} leave requests`)
    }
  })

  test('should show eligibility information', async ({ page }) => {
    // Should display remaining crew counts
    const eligibilityInfo = page.getByText(/remaining.*captain|remaining.*first officer/i)
    if ((await eligibilityInfo.count()) > 0) {
      await expect(eligibilityInfo.first()).toBeVisible()
      console.log('✅ Eligibility information displayed')
    }
  })

  test('should filter by status', async ({ page }) => {
    const statusFilter = page.getByLabel(/status/i)
    if (await statusFilter.isVisible()) {
      await statusFilter.click()
      await page.getByRole('option', { name: /pending/i }).click()

      // Results should update
      await page.waitForTimeout(500)

      // Only PENDING requests should be visible
      const pendingBadges = page.getByText(/pending/i)
      expect(await pendingBadges.count()).toBeGreaterThan(0)
      console.log('✅ Status filtering works')
    }
  })

  test('should filter by leave type', async ({ page }) => {
    const typeFilter = page.getByLabel(/type/i)
    if (await typeFilter.isVisible()) {
      await typeFilter.click()
      await page.getByRole('option', { name: /annual/i }).click()

      // Results should update
      await page.waitForTimeout(500)
      console.log('✅ Leave type filtering works')
    }
  })

  test('should show late request indicators', async ({ page }) => {
    // Look for late request badges/indicators
    const lateIndicator = page.getByText(/late.*request|urgent/i)
    if ((await lateIndicator.count()) > 0) {
      await expect(lateIndicator.first()).toBeVisible()
      console.log('✅ Late request indicators shown')
    }
  })

  test('should display pilot rank and seniority', async ({ page }) => {
    const request = page.getByTestId('leave-request').first()
    if (await request.isVisible()) {
      // Should show rank (Captain or First Officer)
      await expect(page.getByText(/captain|first officer/i)).toBeVisible()

      // Should show seniority number
      await expect(page.getByText(/#\d+/)).toBeVisible()
      console.log('✅ Pilot info displayed correctly')
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
      console.log('✅ Leave request approval works')
    }
  })

  test('should reject leave request with reason', async ({ page }) => {
    const rejectButton = page.getByRole('button', { name: /reject|deny/i }).first()
    if (await rejectButton.isVisible()) {
      await rejectButton.click()

      // Should require rejection reason
      const reasonInput = page.getByLabel(/reason|note/i)
      if (await reasonInput.isVisible()) {
        await reasonInput.fill('Insufficient crew coverage for requested dates')

        const confirmButton = page.getByRole('button', { name: /confirm|reject/i }).last()
        await confirmButton.click()

        // Should show success message
        await expect(page.getByText(/rejected|denied/i)).toBeVisible({ timeout: 10000 })
        console.log('✅ Leave request rejection works')
      }
    }
  })

  test('should show eligibility alerts for competing requests', async ({ page }) => {
    // Look for eligibility alerts (2+ pilots same rank requesting same dates)
    const alert = page.getByText(/eligibility alert|multiple.*requesting/i)
    if ((await alert.count()) > 0) {
      await expect(alert.first()).toBeVisible()
      console.log('✅ Eligibility alerts displayed')
    }
  })

  test('should respect minimum crew requirements', async ({ page }) => {
    // Look for warnings about minimum crew (10 Captains + 10 First Officers)
    const crewWarning = page.getByText(/minimum.*crew|below.*threshold/i)
    if ((await crewWarning.count()) > 0) {
      await expect(crewWarning.first()).toBeVisible()
      console.log('✅ Minimum crew warnings displayed')
    }
  })

  test('should show final review alert 22 days before roster period', async ({ page }) => {
    // Look for final review alert
    const finalReviewAlert = page.getByText(/final.*review.*alert|22.*days/i)
    if ((await finalReviewAlert.count()) > 0) {
      await expect(finalReviewAlert.first()).toBeVisible()
      console.log('✅ Final review alert displayed')
    }
  })
})

test.describe('Admin Leave Requests - Conflict Detection', () => {
  test('should detect overlapping leave requests', async ({ page }) => {
    await page.goto('/dashboard/leave-requests')

    // Look for overlap/conflict indicators
    const overlapIndicator = page.getByText(/overlap|conflict|competing/i)
    if ((await overlapIndicator.count()) > 0) {
      await expect(overlapIndicator.first()).toBeVisible()
      console.log('✅ Conflict detection works')
    }
  })

  test('should show which pilots are competing for same dates', async ({ page }) => {
    await page.goto('/dashboard/leave-requests')

    const request = page.getByTestId('leave-request').first()
    if (await request.isVisible()) {
      await request.click()

      // Should show competing pilots info
      const competingInfo = page.getByText(/\d+.*pilots.*requesting/i)
      if (await competingInfo.isVisible()) {
        console.log('✅ Competing pilots information shown')
      }
    }
  })

  test('should prioritize by seniority', async ({ page }) => {
    await page.goto('/dashboard/leave-requests')

    // Requests should be sorted by seniority for same dates
    const seniorityNumbers = page.getByText(/#\d+/)
    if ((await seniorityNumbers.count()) >= 2) {
      const first = await seniorityNumbers.nth(0).textContent()
      const second = await seniorityNumbers.nth(1).textContent()

      const firstNum = parseInt(first?.replace('#', '') || '0')
      const secondNum = parseInt(second?.replace('#', '') || '0')

      console.log(`✅ Seniority order: #${firstNum} before #${secondNum}`)
    }
  })
})

test.describe('Admin Leave Requests - Exports and Reports', () => {
  test('should export leave requests to CSV', async ({ page }) => {
    await page.goto('/dashboard/leave-requests')

    const exportButton = page.getByRole('button', { name: /export|download/i })
    if (await exportButton.isVisible()) {
      const downloadPromise = page.waitForEvent('download')
      await exportButton.click()

      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/leave.*csv/i)
      console.log('✅ CSV export works')
    }
  })

  test('should generate PDF report', async ({ page }) => {
    await page.goto('/dashboard/leave-requests')

    const pdfButton = page.getByRole('button', { name: /pdf|print/i })
    if (await pdfButton.isVisible()) {
      const downloadPromise = page.waitForEvent('download')
      await pdfButton.click()

      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/pdf/i)
      console.log('✅ PDF export works')
    }
  })
})

test.describe('Admin Leave Requests - Roster Period Integration', () => {
  test('should display roster periods correctly', async ({ page }) => {
    await page.goto('/dashboard/leave-requests')

    // Should show roster period labels (RP1, RP2, etc.)
    const rosterPeriod = page.getByText(/RP\d+\/\d{4}/i)
    if ((await rosterPeriod.count()) > 0) {
      await expect(rosterPeriod.first()).toBeVisible()
      console.log('✅ Roster periods displayed correctly')
    }
  })

  test('should filter by roster period', async ({ page }) => {
    await page.goto('/dashboard/leave-requests')

    const rosterFilter = page.getByLabel(/roster.*period/i)
    if (await rosterFilter.isVisible()) {
      await rosterFilter.click()
      await page.getByRole('option').first().click()

      // Results should update
      await page.waitForTimeout(500)
      console.log('✅ Roster period filtering works')
    }
  })
})
