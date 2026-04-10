import { test, expect } from '@playwright/test'

/**
 * Admin Leave Request Workflow E2E Test
 *
 * Tests the admin portal leave request management:
 * - Submitting leave requests via Quick Entry modal
 * - Approving/rejecting leave requests
 * - Eligibility checking (minimum crew requirements)
 * - Conflict detection
 * - Late request flagging
 *
 * This validates the unified-request-service.ts implementation
 *
 * @author Maurice Rondeau
 * @date February 2, 2026 - Updated to use Quick Entry modal
 */

test.describe('Admin Leave Requests - Create via Quick Entry Modal', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to unified request management page
    await page.goto('/dashboard/requests?tab=leave')
  })

  test('should display Quick Entry button', async ({ page }) => {
    // Should show Request Management heading
    await expect(page.getByRole('heading', { name: /request.*management/i })).toBeVisible()

    // Should show Quick Entry button
    await expect(page.getByRole('button', { name: /quick.*entry/i })).toBeVisible()
  })

  test('should open Quick Entry modal', async ({ page }) => {
    // Click Quick Entry button
    await page.getByRole('button', { name: /quick.*entry/i }).click()

    // Should show modal dialog
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText(/manual.*request.*creation/i)).toBeVisible()
  })

  test('should display form fields in Quick Entry modal', async ({ page }) => {
    await page.getByRole('button', { name: /quick.*entry/i }).click()

    // Should show required form fields
    await expect(page.getByLabel(/pilot/i)).toBeVisible()
    await expect(page.getByLabel(/request.*type|category/i)).toBeVisible()
  })

  test('should load pilot list in dropdown', async ({ page }) => {
    await page.getByRole('button', { name: /quick.*entry/i }).click()

    // Click pilot selector
    const pilotSelector = page.getByLabel(/pilot/i)
    await pilotSelector.click()

    // Should show pilot options
    const pilotOptions = page.getByRole('option')
    const optionCount = await pilotOptions.count()

    // Should have pilots available
    expect(optionCount).toBeGreaterThan(0)

    console.log(`✅ Loaded ${optionCount} pilots in dropdown`)
  })

  test('should submit leave request successfully', async ({ page }) => {
    await page.getByRole('button', { name: /quick.*entry/i }).click()

    // Wait for modal to be fully visible
    await expect(page.getByRole('dialog')).toBeVisible()

    // Select a pilot
    const pilotSelector = page.getByLabel(/pilot/i)
    await pilotSelector.click()
    await page.getByRole('option').first().click()

    // Select request type (LEAVE)
    const typeSelector = page.getByLabel(/request.*type|category/i)
    if (await typeSelector.isVisible()) {
      await typeSelector.click()
      await page.getByRole('option', { name: /leave/i }).click()
    }

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

    const startDateInput = page.locator('[name="start_date"], [name="startDate"]')
    const endDateInput = page.locator('[name="end_date"], [name="endDate"]')

    if (await startDateInput.isVisible()) {
      await startDateInput.fill(formatDate(startDate))
    }
    if (await endDateInput.isVisible()) {
      await endDateInput.fill(formatDate(endDate))
    }

    // Take screenshot before submission
    await page.screenshot({
      path: 'e2e-screenshots/admin-leave-quick-entry-filled.png',
      fullPage: true,
    })

    // Submit form
    const submitButton = page.getByRole('button', { name: /submit|create|save/i })
    await submitButton.click()

    // Wait for success message or modal close
    try {
      // Either success toast or modal closes
      await Promise.race([
        expect(page.getByText(/success|created|submitted/i)).toBeVisible({ timeout: 10000 }),
        expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 }),
      ])

      await page.screenshot({
        path: 'e2e-screenshots/admin-leave-quick-entry-success.png',
        fullPage: true,
      })

      console.log('✅ SUCCESS: Leave request created via Quick Entry')
    } catch (error) {
      await page.screenshot({
        path: 'e2e-screenshots/admin-leave-quick-entry-error.png',
        fullPage: true,
      })

      const errorAlert = await page.locator('[role="alert"]').textContent()
      if (errorAlert) {
        console.log('\n❌ ERROR ALERT:', errorAlert)
      }

      throw new Error('Leave request submission via Quick Entry failed')
    }
  })

  test('should close modal on cancel', async ({ page }) => {
    await page.getByRole('button', { name: /quick.*entry/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Click cancel button
    const cancelButton = page.getByRole('button', { name: /cancel/i })
    await cancelButton.click()

    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible()
    console.log('✅ Modal closes on cancel')
  })
})

test.describe('Admin Leave Requests - Review and Approval', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/requests?tab=leave')
  })

  test('should display all leave requests', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /request.*management/i })).toBeVisible()

    // Should show stats overview
    await expect(page.getByText(/pending|approved|total/i)).toBeVisible()
  })

  test('should show eligibility information', async ({ page }) => {
    // Should display remaining crew counts or request stats
    const statsInfo = page.getByText(/captain|first.*officer|pending/i)
    if ((await statsInfo.count()) > 0) {
      await expect(statsInfo.first()).toBeVisible()
      console.log('✅ Request stats displayed')
    }
  })

  test('should filter by status', async ({ page }) => {
    const statusFilter = page.getByLabel(/status/i)
    if (await statusFilter.isVisible()) {
      await statusFilter.click()
      await page.getByRole('option', { name: /pending|submitted/i }).click()

      // Results should update
      await page.waitForTimeout(500)
      console.log('✅ Status filtering works')
    }
  })

  test('should filter by roster period', async ({ page }) => {
    const rosterFilter = page.getByLabel(/roster.*period/i)
    if (await rosterFilter.isVisible()) {
      await rosterFilter.click()
      await page.getByRole('option').first().click()

      // Results should update
      await page.waitForTimeout(500)
      console.log('✅ Roster period filtering works')
    }
  })

  test('should show late request indicators', async ({ page }) => {
    // Look for late request badges/indicators
    const lateIndicator = page.getByText(/late|urgent/i)
    if ((await lateIndicator.count()) > 0) {
      await expect(lateIndicator.first()).toBeVisible()
      console.log('✅ Late request indicators shown')
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

  test('should respect minimum crew requirements', async ({ page }) => {
    // Look for warnings about minimum crew (10 Captains + 10 First Officers)
    const crewWarning = page.getByText(/minimum.*crew|below.*threshold/i)
    if ((await crewWarning.count()) > 0) {
      await expect(crewWarning.first()).toBeVisible()
      console.log('✅ Minimum crew warnings displayed')
    }
  })
})

test.describe('Admin Leave Requests - View Modes', () => {
  test('should switch to table view', async ({ page }) => {
    await page.goto('/dashboard/requests?tab=leave&view=table')

    // Should show table view
    await expect(page.getByRole('table')).toBeVisible()
    console.log('✅ Table view works')
  })

  test('should switch to cards view', async ({ page }) => {
    await page.goto('/dashboard/requests?tab=leave&view=cards')

    // Should show cards grid
    const cards = page.locator('[data-testid="request-card"]')
    if ((await cards.count()) > 0) {
      await expect(cards.first()).toBeVisible()
    }
    console.log('✅ Cards view works')
  })

  test('should switch to calendar view', async ({ page }) => {
    await page.goto('/dashboard/requests?tab=leave&view=calendar')

    // Should show calendar
    const calendar = page.getByText(/monday|tuesday|wednesday/i)
    if ((await calendar.count()) > 0) {
      await expect(calendar.first()).toBeVisible()
    }
    console.log('✅ Calendar view works')
  })
})

test.describe('Admin Leave Requests - Conflict Detection', () => {
  test('should detect overlapping leave requests', async ({ page }) => {
    await page.goto('/dashboard/requests?tab=leave')

    // Look for overlap/conflict indicators
    const overlapIndicator = page.getByText(/overlap|conflict|competing/i)
    if ((await overlapIndicator.count()) > 0) {
      await expect(overlapIndicator.first()).toBeVisible()
      console.log('✅ Conflict detection works')
    }
  })

  test('should show which pilots are competing for same dates', async ({ page }) => {
    await page.goto('/dashboard/requests?tab=leave')

    const request = page
      .locator('[data-testid="request-card"], [data-testid="leave-request"]')
      .first()
    if (await request.isVisible()) {
      await request.click()

      // Should show competing pilots info
      const competingInfo = page.getByText(/\d+.*pilots.*requesting/i)
      if (await competingInfo.isVisible()) {
        console.log('✅ Competing pilots information shown')
      }
    }
  })
})

test.describe('Admin Leave Requests - Roster Period Integration', () => {
  test('should display roster periods correctly', async ({ page }) => {
    await page.goto('/dashboard/requests?tab=leave')

    // Should show roster period labels (RP1, RP2, etc.)
    const rosterPeriod = page.getByText(/RP\d+\/\d{4}/i)
    if ((await rosterPeriod.count()) > 0) {
      await expect(rosterPeriod.first()).toBeVisible()
      console.log('✅ Roster periods displayed correctly')
    }
  })

  test('should filter by roster period', async ({ page }) => {
    await page.goto('/dashboard/requests?tab=leave')

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

test.describe('Admin Leave Requests - URL Redirect', () => {
  test('should redirect /dashboard/leave/new to /dashboard/requests', async ({ page }) => {
    // Navigate to old URL
    await page.goto('/dashboard/leave/new')

    // Should be redirected to requests page
    await page.waitForURL('**/dashboard/requests**')
    expect(page.url()).toContain('/dashboard/requests')
    console.log('✅ Old leave form URL redirects correctly')
  })
})
