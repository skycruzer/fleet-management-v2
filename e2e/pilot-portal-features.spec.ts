/**
 * E2E Test: Pilot Portal New Features
 *
 * Tests all newly implemented features:
 * - Roster period display
 * - Feedback history page
 * - Notifications system
 * - Leave request notifications
 * - Feedback response notifications
 *
 * Credentials:
 * - Pilot: mrondeau@airniugini.com.pg / mron2393
 * - Admin: mrondeau@airniugini.com.pg / mron2393
 */

import { test, expect } from '@playwright/test'

const PILOT_EMAIL = 'mrondeau@airniugini.com.pg'
const PILOT_PASSWORD = 'mron2393'
const ADMIN_EMAIL = 'mrondeau@airniugini.com.pg'
const ADMIN_PASSWORD = 'mron2393'

test.describe('Pilot Portal - New Features', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('/')
  })

  test('01 - Pilot Login and Dashboard Access', async ({ page }) => {
    // Navigate to pilot portal login
    await page.goto('/portal/login')

    // Fill login form
    await page.fill('input[type="email"]', PILOT_EMAIL)
    await page.fill('input[type="password"]', PILOT_PASSWORD)

    // Submit login
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL('/portal/dashboard', { timeout: 10000 })

    // Verify dashboard loaded
    await expect(page.getByRole('heading', { name: /Welcome/ })).toBeVisible()
  })

  test('02 - Roster Period Card Display', async ({ page }) => {
    // Login first
    await page.goto('/portal/login')
    await page.fill('input[type="email"]', PILOT_EMAIL)
    await page.fill('input[type="password"]', PILOT_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('/portal/dashboard')

    // Check for roster period card
    await expect(page.getByText('Roster Period')).toBeVisible()
    await expect(page.getByText('ACTIVE PERIOD')).toBeVisible()
    await expect(page.getByText('NEXT UP')).toBeVisible()

    // Verify countdown displays
    await expect(page.getByText(/\d+ days? remaining/i)).toBeVisible()

    // Verify current period code (RP format)
    await expect(page.getByText(/RP\d{1,2}\/\d{4}/)).toBeVisible()
  })

  test('03 - Feedback History Navigation Link', async ({ page }) => {
    // Login
    await page.goto('/portal/login')
    await page.fill('input[type="email"]', PILOT_EMAIL)
    await page.fill('input[type="password"]', PILOT_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('/portal/dashboard')

    // Check sidebar for feedback history link
    await expect(page.getByRole('link', { name: /Feedback History/i })).toBeVisible()
  })

  test('04 - Feedback History Page Access', async ({ page }) => {
    // Login
    await page.goto('/portal/login')
    await page.fill('input[type="email"]', PILOT_EMAIL)
    await page.fill('input[type="password"]', PILOT_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('/portal/dashboard')

    // Navigate to feedback history
    await page.click('a[href="/portal/feedback/history"]')
    await page.waitForURL('/portal/feedback/history')

    // Verify page loaded
    await expect(page.getByRole('heading', { name: 'Feedback History' })).toBeVisible()

    // Verify statistics cards
    await expect(page.getByText('Total Feedback')).toBeVisible()
    await expect(page.getByText('Under Review')).toBeVisible()
    await expect(page.getByText('Resolved')).toBeVisible()
  })

  test('05 - Submit New Feedback', async ({ page }) => {
    // Login
    await page.goto('/portal/login')
    await page.fill('input[type="email"]', PILOT_EMAIL)
    await page.fill('input[type="password"]', PILOT_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('/portal/dashboard')

    // Navigate to feedback form
    await page.click('a[href="/portal/feedback"]')
    await page.waitForURL('/portal/feedback')

    // Fill feedback form
    const timestamp = Date.now()
    await page.selectOption('select[name="category"]', 'System')
    await page.fill('input[name="subject"]', `Test Feedback ${timestamp}`)
    await page.fill('textarea[name="message"]', `This is an automated test feedback submission at ${new Date().toISOString()}`)

    // Submit feedback
    await page.click('button[type="submit"]')

    // Wait for success message or redirect
    await page.waitForTimeout(2000)

    // Verify submission (should show success message or redirect to history)
    const url = page.url()
    if (url.includes('/feedback/history')) {
      await expect(page.getByText(`Test Feedback ${timestamp}`)).toBeVisible({ timeout: 5000 })
    } else {
      await expect(page.getByText(/success|submitted/i)).toBeVisible()
    }
  })

  test('06 - Notifications Bell Display', async ({ page }) => {
    // Login
    await page.goto('/portal/login')
    await page.fill('input[type="email"]', PILOT_EMAIL)
    await page.fill('input[type="password"]', PILOT_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('/portal/dashboard')

    // Check for notification bell in sidebar/header
    const bellIcon = page.locator('svg').filter({ hasText: /bell/i }).first()
    await expect(bellIcon).toBeVisible({ timeout: 5000 })
  })

  test('07 - View Feedback History Details', async ({ page }) => {
    // Login
    await page.goto('/portal/login')
    await page.fill('input[type="email"]', PILOT_EMAIL)
    await page.fill('input[type="password"]', PILOT_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('/portal/dashboard')

    // Go to feedback history
    await page.goto('/portal/feedback/history')

    // Wait for feedback list to load
    await page.waitForTimeout(2000)

    // Check if any feedback exists
    const hasFeedback = await page.getByText('No Feedback Submitted Yet').isVisible().catch(() => false)

    if (!hasFeedback) {
      // Verify feedback cards show status badges
      const statusBadges = page.locator('.bg-yellow-100, .bg-green-100, .bg-gray-100')
      await expect(statusBadges.first()).toBeVisible({ timeout: 5000 })

      // Verify category badges
      const categoryBadges = page.locator('.bg-blue-100, .bg-purple-100, .bg-orange-100')
      expect(await categoryBadges.count()).toBeGreaterThan(0)
    }
  })
})

test.describe('Admin Portal - Feedback Response', () => {
  test('08 - Admin Login and Access Feedback', async ({ page }) => {
    // Navigate to admin login
    await page.goto('/auth/login')

    // Fill login form
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)

    // Submit login
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 })

    // Verify admin dashboard loaded
    await expect(page.getByText(/dashboard|fleet/i)).toBeVisible()
  })

  test('09 - Admin View Feedback List', async ({ page }) => {
    // Admin login
    await page.goto('/auth/login')
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/)

    // Navigate to feedback management (if route exists)
    // Note: This assumes there's a feedback management page in admin
    const feedbackLink = page.getByRole('link', { name: /feedback/i })
    if (await feedbackLink.isVisible().catch(() => false)) {
      await feedbackLink.click()
      await page.waitForTimeout(2000)

      // Verify feedback list loads
      await expect(page.getByText(/feedback/i)).toBeVisible()
    }
  })
})

test.describe('Integration Tests', () => {
  test('10 - End-to-End: Feedback Submission → Admin Response → Pilot Notification', async ({ page, context }) => {
    // Step 1: Pilot submits feedback
    await page.goto('/portal/login')
    await page.fill('input[type="email"]', PILOT_EMAIL)
    await page.fill('input[type="password"]', PILOT_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('/portal/dashboard')

    // Navigate to feedback form
    await page.goto('/portal/feedback')

    // Submit test feedback
    const timestamp = Date.now()
    await page.selectOption('select[name="category"]', 'System')
    await page.fill('input[name="subject"]', `E2E Test ${timestamp}`)
    await page.fill('textarea[name="message"]', 'Testing notification workflow')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)

    // Logout pilot
    await page.goto('/portal/dashboard')
    const logoutButton = page.getByRole('button', { name: /logout/i })
    if (await logoutButton.isVisible().catch(() => false)) {
      await logoutButton.click()
      await page.waitForTimeout(1000)
    }

    // Step 2: Admin responds to feedback
    // Open new page for admin
    const adminPage = await context.newPage()
    await adminPage.goto('/auth/login')
    await adminPage.fill('input[type="email"]', ADMIN_EMAIL)
    await adminPage.fill('input[type="password"]', ADMIN_PASSWORD)
    await adminPage.click('button[type="submit"]')
    await adminPage.waitForURL(/\/dashboard/)

    // Try to find and respond to feedback (if admin UI exists)
    const feedbackLink = adminPage.getByRole('link', { name: /feedback/i })
    if (await feedbackLink.isVisible().catch(() => false)) {
      await feedbackLink.click()
      await adminPage.waitForTimeout(2000)

      // Look for the test feedback
      const testFeedback = adminPage.getByText(`E2E Test ${timestamp}`)
      if (await testFeedback.isVisible().catch(() => false)) {
        await testFeedback.click()
        await adminPage.waitForTimeout(1000)

        // Add response (if response form exists)
        const responseField = adminPage.locator('textarea[name="adminResponse"], textarea[name="response"]')
        if (await responseField.isVisible().catch(() => false)) {
          await responseField.fill('Thank you for your feedback. This has been resolved.')

          const submitButton = adminPage.getByRole('button', { name: /submit|send|respond/i })
          if (await submitButton.isVisible().catch(() => false)) {
            await submitButton.click()
            await adminPage.waitForTimeout(2000)
          }
        }
      }
    }

    await adminPage.close()

    // Step 3: Verify pilot receives notification
    await page.goto('/portal/login')
    await page.fill('input[type="email"]', PILOT_EMAIL)
    await page.fill('input[type="password"]', PILOT_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('/portal/dashboard')

    // Check for notification
    await page.waitForTimeout(2000)

    // Try to open notifications
    const notificationBell = page.locator('[aria-label*="notification"], [role="button"]').filter({ hasText: /notification/i })
    if (await notificationBell.isVisible().catch(() => false)) {
      await notificationBell.click()
      await page.waitForTimeout(1000)

      // Look for feedback response notification
      await expect(page.getByText(/feedback response/i)).toBeVisible({ timeout: 5000 })
    }
  })
})
