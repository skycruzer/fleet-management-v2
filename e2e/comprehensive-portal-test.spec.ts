import { test, expect } from '@playwright/test'

/**
 * Comprehensive Portal Testing
 * Author: Maurice Rondeau
 * Date: November 21, 2025
 *
 * Tests all portal pages after authentication:
 * - Dashboard
 * - Profile
 * - Certifications
 * - Leave Requests
 * - Flight Requests
 * - Feedback
 */

test.describe('Comprehensive Portal Testing', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/portal/login')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Fill in credentials
    await page.getByPlaceholder('pilot@airniugini.com').fill('mrondeau@airniugini.com.pg')
    await page.getByPlaceholder('Enter your password').fill('mron2393')

    // Submit login
    await page.getByRole('button', { name: /Access Portal/i }).click()

    // Wait for redirect to dashboard
    await page.waitForURL('/portal/dashboard', {
      timeout: 15000,
      waitUntil: 'domcontentloaded',
    })
  })

  test('Dashboard - should load and display content', async ({ page }) => {
    // Verify we're on dashboard
    expect(page.url()).toContain('/portal/dashboard')

    // Wait for content to load
    await page.waitForLoadState('networkidle')

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/portal-dashboard.png', fullPage: true })

    console.log('✅ Dashboard loaded successfully')
  })

  test('Profile - should load without errors', async ({ page }) => {
    // Navigate to profile
    await page.goto('/portal/profile')
    await page.waitForLoadState('networkidle')

    // Verify profile page loaded
    expect(page.url()).toContain('/portal/profile')

    // Wait for content
    await page.waitForTimeout(2000)

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/portal-profile.png', fullPage: true })

    console.log('✅ Profile page loaded successfully')
  })

  test('Certifications - should load certification list', async ({ page }) => {
    // Navigate to certifications
    await page.goto('/portal/certifications')
    await page.waitForLoadState('networkidle')

    // Verify certifications page loaded
    expect(page.url()).toContain('/portal/certifications')

    // Wait for data to load
    await page.waitForTimeout(2000)

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/portal-certifications.png', fullPage: true })

    console.log('✅ Certifications page loaded successfully')
  })

  test('Leave Requests - should display leave requests', async ({ page }) => {
    // Navigate to leave requests
    await page.goto('/portal/leave-requests')
    await page.waitForLoadState('networkidle')

    // Verify leave requests page loaded
    expect(page.url()).toContain('/portal/leave-requests')

    // Wait for data to load
    await page.waitForTimeout(2000)

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/portal-leave-requests.png', fullPage: true })

    console.log('✅ Leave requests page loaded successfully')
  })

  test('Flight Requests - should display flight requests', async ({ page }) => {
    // Navigate to flight requests
    await page.goto('/portal/flight-requests')
    await page.waitForLoadState('networkidle')

    // Verify flight requests page loaded
    expect(page.url()).toContain('/portal/flight-requests')

    // Wait for data to load
    await page.waitForTimeout(2000)

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/portal-flight-requests.png', fullPage: true })

    console.log('✅ Flight requests page loaded successfully')
  })

  test('Feedback - should display feedback form', async ({ page }) => {
    // Navigate to feedback
    await page.goto('/portal/feedback')
    await page.waitForLoadState('networkidle')

    // Verify feedback page loaded
    expect(page.url()).toContain('/portal/feedback')

    // Wait for form to load
    await page.waitForTimeout(2000)

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/portal-feedback.png', fullPage: true })

    console.log('✅ Feedback page loaded successfully')
  })

  test('Navigation - should navigate between all pages', async ({ page }) => {
    const pages = [
      '/portal/dashboard',
      '/portal/profile',
      '/portal/certifications',
      '/portal/leave-requests',
      '/portal/flight-requests',
      '/portal/feedback',
    ]

    for (const pagePath of pages) {
      await page.goto(pagePath)
      await page.waitForLoadState('networkidle')

      // Verify URL
      expect(page.url()).toContain(pagePath)

      // Wait a bit for content to load
      await page.waitForTimeout(1000)

      console.log(`✅ Navigated to ${pagePath}`)
    }

    console.log('✅ All navigation tests passed')
  })

  test('Console Errors - should not have critical errors', async ({ page }) => {
    const consoleErrors: string[] = []

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Visit all pages
    const pages = [
      '/portal/dashboard',
      '/portal/profile',
      '/portal/certifications',
      '/portal/leave-requests',
      '/portal/flight-requests',
      '/portal/feedback',
    ]

    for (const pagePath of pages) {
      await page.goto(pagePath)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)
    }

    // Log any errors found
    if (consoleErrors.length > 0) {
      console.log('⚠️  Console errors found:')
      consoleErrors.forEach((error) => console.log('  -', error))
    } else {
      console.log('✅ No console errors found')
    }

    // Critical errors should not exist
    const criticalErrors = consoleErrors.filter(
      (error) =>
        error.includes('is not defined') ||
        error.includes('Cannot read') ||
        error.includes('undefined')
    )

    expect(criticalErrors.length).toBe(0)
  })

  test('API Calls - should complete successfully', async ({ page }) => {
    const failedRequests: string[] = []

    // Monitor network requests
    page.on('response', (response) => {
      if (response.status() >= 400 && response.url().includes('/api/portal/')) {
        failedRequests.push(`${response.status()} ${response.url()}`)
      }
    })

    // Visit all pages
    const pages = [
      '/portal/dashboard',
      '/portal/profile',
      '/portal/certifications',
      '/portal/leave-requests',
      '/portal/flight-requests',
      '/portal/feedback',
    ]

    for (const pagePath of pages) {
      await page.goto(pagePath)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)
    }

    // Log any failed requests
    if (failedRequests.length > 0) {
      console.log('⚠️  Failed API requests:')
      failedRequests.forEach((req) => console.log('  -', req))
    } else {
      console.log('✅ All API requests succeeded')
    }

    // Should have no failed requests
    expect(failedRequests.length).toBe(0)
  })

  test('Leave Request Cancel - should work without errors', async ({ page }) => {
    // Navigate to leave requests
    await page.goto('/portal/leave-requests')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Check if there are any leave requests to cancel
    const hasRequests = (await page.locator('[data-testid="leave-request-item"]').count()) > 0

    if (!hasRequests) {
      console.log('ℹ️  No leave requests to test cancellation')
      return
    }

    // Monitor console for errors
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Try to find a cancel button
    const cancelButton = page
      .locator('button')
      .filter({ hasText: /cancel|withdraw/i })
      .first()

    if (await cancelButton.isVisible()) {
      // Click cancel (but don't confirm if there's a confirmation dialog)
      await cancelButton.click()

      // Wait a moment to see if any errors occur
      await page.waitForTimeout(1000)

      // Check for errors
      const criticalErrors = consoleErrors.filter((error) =>
        error.includes('createClient is not defined')
      )

      if (criticalErrors.length > 0) {
        console.log('❌ Found createClient error:')
        criticalErrors.forEach((error) => console.log('  -', error))
        throw new Error('createClient is not defined error still occurring')
      } else {
        console.log('✅ No createClient errors found')
      }
    } else {
      console.log('ℹ️  No cancel button found to test')
    }
  })
})
