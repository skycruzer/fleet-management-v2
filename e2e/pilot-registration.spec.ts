import { test, expect } from '@playwright/test'

/**
 * Pilot Registration E2E Test
 *
 * Tests the complete pilot registration workflow for Maurice Rondeau
 * This test verifies that the date_of_birth validation fix works correctly
 */

test.describe('Pilot Registration', () => {
  test('should successfully register Maurice Rondeau with date of birth', async ({
    page,
    context,
  }) => {
    // Clear cache to ensure fresh validation code loads
    await context.clearCookies()

    // Navigate to registration page
    await page.goto('/portal/register')

    // Wait for page to load
    await expect(page.getByRole('heading', { name: 'Pilot Registration' })).toBeVisible()

    // Fill in Maurice Rondeau's information
    await page.fill('#first_name', 'Maurice')
    await page.fill('#last_name', 'Rondeau')

    // Select rank - Captain
    await page.click('button[role="combobox"]')
    await page.click('text=Captain')

    // Fill optional fields
    await page.fill('#employee_id', '2393')
    await page.fill('#date_of_birth', '1972-10-06') // CRITICAL: YYYY-MM-DD format, age 53
    await page.fill('#phone_number', '+675814334414')
    await page.fill('#address', 'Dakota')

    // Fill account information
    await page.fill('#email', 'mrondeau@airniugini.com.pg')
    await page.fill('#password', 'Lemakot@1972')
    await page.fill('#confirmPassword', 'Lemakot@1972')

    // Take screenshot before submission
    await page.screenshot({
      path: 'e2e-screenshots/registration-filled.png',
      fullPage: true,
    })

    // Listen for console errors
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Listen for page errors (Zod validation errors appear here)
    const pageErrors: string[] = []
    page.on('pageerror', (error) => {
      pageErrors.push(error.message)
    })

    // Submit the form
    await page.click('button[type="submit"]')

    // Wait for either success or error
    try {
      // Wait for success message (should appear)
      await expect(page.getByText('Registration Submitted!')).toBeVisible({
        timeout: 10000,
      })

      // Take success screenshot
      await page.screenshot({
        path: 'e2e-screenshots/registration-success.png',
        fullPage: true,
      })

      console.log('✅ SUCCESS: Registration submitted successfully!')
      console.log('Validation fix WORKS - date_of_birth accepted')
    } catch (error) {
      // If success message doesn't appear, check for errors
      await page.screenshot({
        path: 'e2e-screenshots/registration-error.png',
        fullPage: true,
      })

      // Log any errors
      if (consoleErrors.length > 0) {
        console.log('\n❌ CONSOLE ERRORS:')
        consoleErrors.forEach((err) => console.log(err))
      }

      if (pageErrors.length > 0) {
        console.log('\n❌ PAGE ERRORS (Zod validation):')
        pageErrors.forEach((err) => console.log(err))
      }

      // Check for error alert
      const errorAlert = await page.locator('[role="alert"]').textContent()
      if (errorAlert) {
        console.log('\n❌ ERROR ALERT:', errorAlert)
      }

      throw new Error(
        'Registration failed - check screenshots in e2e-screenshots/ directory'
      )
    }
  })
})
