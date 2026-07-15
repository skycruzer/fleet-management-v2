import { test, expect } from '@playwright/test'

/**
 * E2E Test: Pilot Portal Login and Dashboard Redirect
 *
 * Tests the complete login flow including:
 * 1. Navigate to login page
 * 2. Fill in credentials
 * 3. Submit form
 * 4. Verify redirect to dashboard
 * 5. Verify dashboard content loads
 */

test.describe('Pilot Portal Login Redirect', () => {
  test('should redirect to dashboard after successful login', async ({ page }) => {
    const staffId = process.env.TEST_PILOT_STAFF_ID
    const password = process.env.TEST_PILOT_PASSWORD
    test.skip(!staffId || !password, 'Requires TEST_PILOT_STAFF_ID and TEST_PILOT_PASSWORD')

    // Enable console logging to see debug messages
    page.on('console', (msg) => {
      if (msg.text().includes('[LOGIN]')) {
        console.log('Browser console:', msg.text())
      }
    })

    // Navigate to login page
    await page.goto('/portal/login')

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    // Verify we're on the login page
    await expect(page.getByRole('heading', { name: 'B767 Pilot Portal' })).toBeVisible()

    // Fill in credentials
    await page.getByLabel('Staff ID').fill(staffId!)
    await page.getByLabel('Password', { exact: true }).fill(password!)

    // Submit the form
    await page.getByRole('button', { name: /Sign in/i }).click()

    // Wait for redirect to dashboard
    // Using waitForURL with domcontentloaded instead of networkidle
    // because dashboard makes ongoing API calls
    await page.waitForURL('/portal/dashboard', {
      timeout: 15000,
      waitUntil: 'domcontentloaded',
    })

    // Verify we're on the dashboard
    expect(page.url()).toContain('/portal/dashboard')

    // Verify dashboard content loads (wait for any dashboard-specific content)
    // The dashboard might show "Dashboard", "Pilot Dashboard", "My Dashboard", etc.
    await expect(
      page
        .locator('h1, h2')
        .filter({ hasText: /dashboard|welcome/i })
        .first()
    ).toBeVisible({ timeout: 10000 })
  })

  test('should show error for invalid credentials', async ({ page }) => {
    const hydrationWarnings: string[] = []
    page.on('console', (message) => {
      if (message.text().includes('hydrated but some attributes')) {
        hydrationWarnings.push(message.text())
      }
    })

    await page.goto('/portal/login')

    // Fill in invalid credentials
    await page.getByLabel('Staff ID').fill(`invalid-${Date.now()}`)
    await page.getByLabel('Password', { exact: true }).fill('wrongpassword')

    // Submit the form
    await page.getByRole('button', { name: /Sign in/i }).click()

    // Should see error message
    await expect(
      page.getByText(/Login failed\. Please check your staff ID and password\./i)
    ).toBeVisible()

    // Should still be on login page
    expect(page.url()).toContain('/portal/login')
    expect(hydrationWarnings).toEqual([])
  })
})
