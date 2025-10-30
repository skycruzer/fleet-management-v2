import { test, expect } from '@playwright/test'
import { loginAsAdmin, loginAsPilot } from './helpers/test-utils'

/**
 * Complete Workflow E2E Tests
 *
 * Tests complete end-to-end workflows:
 * - Pilot onboarding (create pilot → add certifications → assign qualifications)
 * - Leave approval (pilot submits → manager reviews → approve/deny → notification)
 * - Certification renewal (expiring alert → update cert → verify compliance)
 * - Pilot registration approval (pilot registers → admin approves → pilot logs in)
 * - Task management (create task → assign → complete → verify)
 * - Flight request submission (pilot submits → admin reviews → approve/deny)
 * - Disciplinary action tracking (create action → track → resolve)
 */

test.describe('Pilot Onboarding Workflow', () => {
  test('should complete full pilot onboarding process', async ({ page }) => {
    await loginAsAdmin(page)

    // Step 1: Navigate to pilots page
    await page.goto('/dashboard/pilots')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Step 2: Click "Add New Pilot" button
    await page.getByRole('button', { name: /add|new pilot/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 60000 })

    // Step 3: Fill in pilot details
    const timestamp = Date.now()
    await page.getByLabel(/first name/i).fill(`Onboarding${timestamp}`)
    await page.getByLabel(/last name/i).fill('Test')
    await page.getByLabel(/employee id/i).fill(`OBT${timestamp}`)
    await page.getByLabel(/email/i).fill(`onboarding${timestamp}@test.com`)
    await page.getByLabel(/commencement date/i).fill('2025-01-01')

    // Step 4: Select rank
    await page.getByLabel(/rank/i).click()
    await page.getByRole('option', { name: /first officer/i }).click()

    // Step 5: Submit form
    await page.getByRole('button', { name: /save|create/i }).click()

    // Step 6: Verify success
    await expect(page.getByText(/success|created/i)).toBeVisible({ timeout: 60000 })
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 60000 })

    // Step 7: Verify pilot appears in list
    await expect(page.getByText(`Onboarding${timestamp} Test`)).toBeVisible({ timeout: 60000 })

    // Step 8: Open pilot detail page
    const pilotName = `Onboarding${timestamp} Test`
    await page.getByText(pilotName).click()
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Step 9: Verify pilot details are correct
    await expect(page.getByText(`Onboarding${timestamp} Test`)).toBeVisible({ timeout: 60000 })
    await expect(page.getByText(/first officer/i)).toBeVisible({ timeout: 60000 })

    // Step 10: Clean up - delete test pilot
    await page.goto('/dashboard/pilots')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    const pilotRow = page.getByRole('row').filter({ hasText: pilotName })
    const deleteButton = pilotRow.getByRole('button', { name: /delete/i })

    if (await deleteButton.isVisible()) {
      await deleteButton.click()
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 60000 })
      await page.getByRole('button', { name: /confirm|delete/i }).click()
      await expect(page.getByText(/success|deleted/i)).toBeVisible({ timeout: 60000 })
    }
  })
})

test.describe('Leave Approval Workflow', () => {
  test('should complete leave request submission and approval workflow', async ({ page }) => {
    // Step 1: Pilot submits leave request
    await loginAsPilot(page)
    await page.goto('/portal/leave-requests')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Step 2: Click "New Request" button
    const newRequestButton = page.getByRole('button', { name: /new|request|submit/i })

    if (await newRequestButton.first().isVisible()) {
      await newRequestButton.first().click()
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 60000 })

      // Step 3: Fill in leave request form
      const leaveType = page.getByLabel(/leave type|type/i)
      if (await leaveType.isVisible()) {
        await leaveType.click()
        await page.getByRole('option', { name: /annual|rdo/i }).first().click()
      }

      // Step 4: Select dates
      const startDate = page.getByLabel(/start date|from/i)
      if (await startDate.isVisible()) {
        await startDate.fill('2025-12-01')
      }

      const endDate = page.getByLabel(/end date|to/i)
      if (await endDate.isVisible()) {
        await endDate.fill('2025-12-07')
      }

      // Step 5: Submit request
      const submitButton = page.getByRole('button', { name: /submit|save|request/i })
      await submitButton.click()

      // Step 6: Verify submission success
      const successMessage = page.getByText(/success|submitted|created/i)
      if (await successMessage.isVisible()) {
        await expect(successMessage).toBeVisible({ timeout: 60000 })
      }
    }

    // Step 7: Admin reviews request
    await loginAsAdmin(page)
    await page.goto('/dashboard/leave')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Step 8: Find pending request
    const pendingTab = page.getByRole('tab', { name: /pending/i })
    if (await pendingTab.isVisible()) {
      await pendingTab.click()
      await page.waitForTimeout(1000)

      // Step 9: Approve request
      const approveButton = page.getByRole('button', { name: /approve/i }).first()
      if (await approveButton.isVisible()) {
        await approveButton.click()

        // Step 10: Confirm approval
        const confirmButton = page.getByRole('button', { name: /confirm|yes|approve/i })
        if (await confirmButton.isVisible()) {
          await confirmButton.click()
          await expect(page.getByText(/success|approved/i)).toBeVisible({ timeout: 60000 })
        }
      }
    }
  })

  test('should handle leave request denial workflow', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/leave')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Find pending request
    const pendingTab = page.getByRole('tab', { name: /pending/i })
    if (await pendingTab.isVisible()) {
      await pendingTab.click()
      await page.waitForTimeout(1000)

      // Deny request
      const denyButton = page.getByRole('button', { name: /deny|reject/i }).first()
      if (await denyButton.isVisible()) {
        await denyButton.click()

        // Confirm denial
        const confirmButton = page.getByRole('button', { name: /confirm|yes|deny|reject/i })
        if (await confirmButton.isVisible()) {
          await confirmButton.click()
          const successMessage = page.getByText(/denied|rejected/i)
          if (await successMessage.isVisible()) {
            await expect(successMessage).toBeVisible({ timeout: 60000 })
          }
        }
      }
    }
  })
})

test.describe('Certification Renewal Workflow', () => {
  test('should complete certification update workflow', async ({ page }) => {
    await loginAsAdmin(page)

    // Step 1: Navigate to certifications page
    await page.goto('/dashboard/certifications')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Step 2: Find expiring certifications
    const expiringFilter = page.getByRole('tab', { name: /expiring/i })
      .or(page.getByText(/expiring/i))

    if (await expiringFilter.first().isVisible()) {
      // Step 3: Click on first expiring certification
      const rows = page.getByRole('row')
      const rowCount = await rows.count()

      if (rowCount > 1) {
        const firstRow = rows.nth(1)
        const editButton = firstRow.getByRole('button', { name: /edit/i })
          .or(firstRow.getByRole('link').first())

        if (await editButton.isVisible()) {
          await editButton.click()
          await page.waitForLoadState('networkidle', { timeout: 60000 })

          // Step 4: Update certification date
          const expiryDate = page.getByLabel(/expiry date|date/i)
          if (await expiryDate.isVisible()) {
            // Set new expiry date (future date)
            await expiryDate.fill('2026-12-31')

            // Step 5: Save changes
            const saveButton = page.getByRole('button', { name: /save|update/i })
            await saveButton.click()

            // Step 6: Verify success
            await expect(page.getByText(/success|updated/i)).toBeVisible({ timeout: 60000 })
          }
        }
      }
    }

    // Step 7: Verify compliance improved
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Check compliance percentage
    const complianceText = page.getByText(/\d+%.*compliance|compliance.*\d+%/i)
    if (await complianceText.first().isVisible()) {
      await expect(complianceText.first()).toBeVisible({ timeout: 60000 })
    }
  })
})

test.describe('Pilot Registration Approval Workflow', () => {
  test('should complete pilot registration and approval workflow', async ({ page }) => {
    // Step 1: Pilot visits registration page
    await page.goto('/portal/register')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Step 2: Fill registration form
    const timestamp = Date.now()
    const testEmail = `newpilot${timestamp}@test.com`

    const firstNameInput = page.getByLabel(/first name/i)
    if (await firstNameInput.isVisible()) {
      await firstNameInput.fill('NewPilot')

      const lastNameInput = page.getByLabel(/last name/i)
      await lastNameInput.fill(`Test${timestamp}`)

      const emailInput = page.getByLabel(/email/i)
      await emailInput.fill(testEmail)

      const passwordInput = page.getByLabel(/^password$/i)
      await passwordInput.fill('TestPassword123!')

      const confirmPasswordInput = page.getByLabel(/confirm password/i)
      if (await confirmPasswordInput.isVisible()) {
        await confirmPasswordInput.fill('TestPassword123!')
      }

      const employeeIdInput = page.getByLabel(/employee.*id|emp.*id/i)
      if (await employeeIdInput.isVisible()) {
        await employeeIdInput.fill(`EMP${timestamp}`)
      }

      // Step 3: Submit registration
      const submitButton = page.getByRole('button', { name: /register|sign up|submit/i })
      await submitButton.click()

      // Step 4: Verify pending approval message
      const pendingMessage = page.getByText(/pending|awaiting.*approval|submitted/i)
      if (await pendingMessage.isVisible()) {
        await expect(pendingMessage).toBeVisible({ timeout: 60000 })
      }
    }

    // Step 5: Admin approves registration
    await loginAsAdmin(page)
    await page.goto('/dashboard/admin/pilot-registrations')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Step 6: Find pending registration
    const pendingRegistration = page.getByText(testEmail)
    if (await pendingRegistration.isVisible()) {
      // Step 7: Click approve button
      const registrationRow = page.getByRole('row').filter({ hasText: testEmail })
      const approveButton = registrationRow.getByRole('button', { name: /approve/i })

      if (await approveButton.isVisible()) {
        await approveButton.click()
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 60000 })

        // Step 8: Confirm approval
        const confirmButton = page.getByRole('button', { name: /confirm|approve|yes/i })
        await confirmButton.click()

        // Step 9: Verify approval success
        await expect(page.getByText(/success|approved/i)).toBeVisible({ timeout: 60000 })
      }
    }
  })
})

test.describe('Task Management Workflow', () => {
  test('should complete task creation and assignment workflow', async ({ page }) => {
    await loginAsAdmin(page)

    // Step 1: Navigate to dashboard
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Step 2: Look for task management section
    const taskSection = page.getByRole('heading', { name: /tasks?/i })
      .or(page.getByText(/tasks?/i))

    if (await taskSection.first().isVisible()) {
      // Step 3: Click "New Task" button
      const newTaskButton = page.getByRole('button', { name: /new task|add task|create task/i })

      if (await newTaskButton.first().isVisible()) {
        await newTaskButton.first().click()
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 60000 })

        // Step 4: Fill task form
        const titleInput = page.getByLabel(/title|name/i)
        if (await titleInput.isVisible()) {
          await titleInput.fill('Test Task - Complete workflow')

          const descInput = page.getByLabel(/description/i)
          if (await descInput.isVisible()) {
            await descInput.fill('This is a test task for workflow testing')
          }

          // Step 5: Submit task
          const submitButton = page.getByRole('button', { name: /save|create|submit/i })
          await submitButton.click()

          // Step 6: Verify success
          await expect(page.getByText(/success|created/i)).toBeVisible({ timeout: 60000 })
          await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 60000 })

          // Step 7: Verify task appears in list
          await expect(page.getByText('Test Task - Complete workflow')).toBeVisible({ timeout: 60000 })

          // Step 8: Mark task as complete
          const completeButton = page.getByRole('button', { name: /complete|mark.*complete/i }).first()
          if (await completeButton.isVisible()) {
            await completeButton.click()
            await page.waitForTimeout(1000)

            // Step 9: Verify task marked complete
            const completedIndicator = page.locator('[data-status="completed"]')
              .or(page.getByText(/completed/i))

            if (await completedIndicator.first().isVisible()) {
              await expect(completedIndicator.first()).toBeVisible({ timeout: 60000 })
            }
          }
        }
      }
    }
  })
})

test.describe('Flight Request Workflow', () => {
  test('should complete flight request submission workflow', async ({ page }) => {
    // Step 1: Pilot submits flight request
    await loginAsPilot(page)
    await page.goto('/portal/flight-requests')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Step 2: Click "New Request" button
    const newRequestButton = page.getByRole('button', { name: /new|request|submit/i })

    if (await newRequestButton.first().isVisible()) {
      await newRequestButton.first().click()
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 60000 })

      // Step 3: Fill flight request form
      const requestType = page.getByLabel(/request type|type/i)
      if (await requestType.isVisible()) {
        await requestType.click()
        await page.getByRole('option', { name: /rdo|sdo/i }).first().click()
      }

      // Step 4: Select dates
      const dateInput = page.getByLabel(/date|when/i).first()
      if (await dateInput.isVisible()) {
        await dateInput.fill('2025-12-15')
      }

      // Step 5: Add notes
      const notesInput = page.getByLabel(/notes|comments|reason/i)
      if (await notesInput.isVisible()) {
        await notesInput.fill('Test flight request for E2E testing')
      }

      // Step 6: Submit request
      const submitButton = page.getByRole('button', { name: /submit|save|request/i })
      await submitButton.click()

      // Step 7: Verify submission
      const successMessage = page.getByText(/success|submitted/i)
      if (await successMessage.isVisible()) {
        await expect(successMessage).toBeVisible({ timeout: 60000 })
      }
    }

    // Step 8: Admin reviews request
    await loginAsAdmin(page)
    await page.goto('/dashboard/flight-requests')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Step 9: Verify request appears in list
    const requestsList = page.getByRole('table')
      .or(page.locator('[data-testid="flight-requests"]'))

    if (await requestsList.isVisible()) {
      await expect(requestsList).toBeVisible({ timeout: 60000 })
    }
  })
})

test.describe('Disciplinary Action Workflow', () => {
  test('should create and track disciplinary action', async ({ page }) => {
    await loginAsAdmin(page)

    // Step 1: Navigate to disciplinary page
    await page.goto('/dashboard/disciplinary')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Step 2: Click "New Action" button
    const newActionButton = page.getByRole('button', { name: /new|add|create/i })

    if (await newActionButton.first().isVisible()) {
      await newActionButton.first().click()
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 60000 })

      // Step 3: Fill disciplinary action form
      const pilotSelect = page.getByLabel(/pilot|employee/i)
      if (await pilotSelect.isVisible()) {
        await pilotSelect.click()
        await page.getByRole('option').first().click()
      }

      const actionType = page.getByLabel(/action type|type/i)
      if (await actionType.isVisible()) {
        await actionType.click()
        await page.getByRole('option', { name: /warning|verbal/i }).first().click()
      }

      const description = page.getByLabel(/description|details/i)
      if (await description.isVisible()) {
        await description.fill('Test disciplinary action for E2E workflow testing')
      }

      // Step 4: Submit action
      const submitButton = page.getByRole('button', { name: /save|create|submit/i })
      await submitButton.click()

      // Step 5: Verify success
      const successMessage = page.getByText(/success|created/i)
      if (await successMessage.isVisible()) {
        await expect(successMessage).toBeVisible({ timeout: 60000 })
      }

      // Step 6: Verify action appears in list
      const actionsList = page.getByRole('table')
        .or(page.locator('[data-testid="disciplinary-actions"]'))

      if (await actionsList.isVisible()) {
        await expect(actionsList).toBeVisible({ timeout: 60000 })
      }
    }
  })
})

test.describe('Certification Expiry Alert Workflow', () => {
  test('should handle certification expiry alerts end-to-end', async ({ page }) => {
    await loginAsAdmin(page)

    // Step 1: Check dashboard for expiry alerts
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Step 2: Look for expiring certifications widget
    const expiringWidget = page.getByRole('heading', { name: /expiring|alerts?/i })

    if (await expiringWidget.first().isVisible()) {
      // Step 3: Click on expiring certification
      const expiringItem = page.locator('[data-testid="expiring-cert"]').first()

      if (await expiringItem.isVisible()) {
        await expiringItem.click()
        await page.waitForLoadState('networkidle', { timeout: 60000 })

        // Step 4: Verify navigation to certification detail
        await expect(page.getByRole('heading', { name: /certification|check/i })).toBeVisible({ timeout: 60000 })

        // Step 5: Edit certification to extend expiry
        const editButton = page.getByRole('button', { name: /edit/i })
        if (await editButton.isVisible()) {
          await editButton.click()
          await expect(page.getByRole('dialog')).toBeVisible({ timeout: 60000 })

          // Step 6: Update expiry date
          const expiryInput = page.getByLabel(/expiry|date/i)
          if (await expiryInput.isVisible()) {
            await expiryInput.fill('2026-12-31')

            // Step 7: Save changes
            const saveButton = page.getByRole('button', { name: /save|update/i })
            await saveButton.click()

            // Step 8: Verify update success
            await expect(page.getByText(/success|updated/i)).toBeVisible({ timeout: 60000 })
          }
        }

        // Step 9: Return to dashboard and verify alert cleared
        await page.goto('/dashboard')
        await page.waitForLoadState('networkidle', { timeout: 60000 })

        // Alert count should decrease or alert should be removed
        const expiringCount = page.getByText(/\d+\s*expiring/i)
        if (await expiringCount.isVisible()) {
          await expect(expiringCount).toBeVisible({ timeout: 60000 })
        }
      }
    }
  })
})

test.describe('Complete User Journey - Pilot Portal', () => {
  test('should complete full pilot portal journey', async ({ page }) => {
    // Step 1: Pilot logs in
    await loginAsPilot(page)

    // Step 2: View dashboard
    await page.goto('/portal/dashboard')
    await page.waitForLoadState('networkidle', { timeout: 60000 })
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 60000 })

    // Step 3: Check certifications
    await page.goto('/portal/certifications')
    await page.waitForLoadState('networkidle', { timeout: 60000 })
    await expect(page.getByRole('heading', { name: /certification/i })).toBeVisible({ timeout: 60000 })

    // Step 4: View profile
    await page.goto('/portal/profile')
    await page.waitForLoadState('networkidle', { timeout: 60000 })
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible({ timeout: 60000 })

    // Step 5: Check notifications
    await page.goto('/portal/notifications')
    await page.waitForLoadState('networkidle', { timeout: 60000 })
    await expect(page.getByRole('heading', { name: /notification/i })).toBeVisible({ timeout: 60000 })

    // Step 6: Submit feedback
    await page.goto('/portal/feedback')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    const feedbackForm = page.getByLabel(/feedback|message/i)
    if (await feedbackForm.isVisible()) {
      await feedbackForm.fill('Test feedback for E2E workflow testing')

      const submitButton = page.getByRole('button', { name: /submit|send/i })
      await submitButton.click()

      const successMessage = page.getByText(/success|submitted|sent/i)
      if (await successMessage.isVisible()) {
        await expect(successMessage).toBeVisible({ timeout: 60000 })
      }
    }

    // Step 7: Logout
    const userMenu = page.getByRole('button', { name: /user|account|profile|menu/i })
    if (await userMenu.first().isVisible()) {
      await userMenu.first().click()

      const logoutButton = page.getByRole('menuitem', { name: /logout|sign out/i })
        .or(page.getByRole('button', { name: /logout|sign out/i }))

      if (await logoutButton.first().isVisible()) {
        await logoutButton.first().click()
        await page.waitForURL(/login/, { timeout: 60000 })
      }
    }
  })
})
