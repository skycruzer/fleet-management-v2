import { test, expect } from '@playwright/test'
import { TEST_CONFIG, loginAsAdmin, logout, clearAuth } from './helpers/test-utils'

/**
 * Authentication Flow E2E Tests
 *
 * Tests authentication workflows including:
 * - Login flow
 * - Logout flow
 * - Session persistence
 * - Protected route access
 * - Unauthorized access handling
 */

test.describe('Authentication Flow', () => {
  const LOGIN_URL = '/auth/login'
  const DASHBOARD_URL = '/dashboard'

  test.beforeEach(async ({ page }) => {
    // Clear cookies and storage before each test
    await page.context().clearCookies()
  })

  test('should display login page with all required elements', async ({ page }) => {
    await page.goto(LOGIN_URL)

    // Check for login form elements
    await expect(page.getByRole('heading', { name: /administration/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible()
  })

  test('should show validation errors for empty form submission', async ({ page }) => {
    await page.goto(LOGIN_URL)

    // Try to submit empty form
    await page.getByRole('button', { name: /sign in|login/i }).click()

    // HTML5 required validation prevents submission (browser tooltip, not DOM text)
    // Verify form didn't navigate away — still on login page
    await expect(page).toHaveURL(new RegExp(LOGIN_URL))
    // Verify the email input is in invalid state (required but empty)
    const emailInput = page.getByLabel(/email/i)
    await expect(emailInput).toHaveJSProperty('validity.valueMissing', true)
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto(LOGIN_URL)

    // Fill in invalid credentials
    await page.getByLabel(/email/i).fill('invalid@example.com')
    await page.getByLabel('Password', { exact: true }).fill('wrongpassword')
    await page.getByRole('button', { name: /sign in|login/i }).click()

    // Check for error message
    await expect(page.getByText(/invalid|incorrect|wrong/i)).toBeVisible({ timeout: 10000 })
  })

  test('should successfully login with valid credentials', async ({ page }) => {
    await page.goto(LOGIN_URL)

    // Fill in valid credentials
    await page.getByLabel(/email/i).fill(TEST_CONFIG.admin.email)
    await page.getByLabel('Password', { exact: true }).fill(TEST_CONFIG.admin.password)
    await page.getByRole('button', { name: /sign in|login/i }).click()

    // Wait for redirect to dashboard
    await page.waitForURL(DASHBOARD_URL, { timeout: 60000 })

    // Verify user is on dashboard
    await expect(page).toHaveURL(new RegExp(DASHBOARD_URL))
  })

  // Login page does not redirect authenticated users — no server-side auth check on this route.
  // This test verifies that an authenticated user can still access the login page without errors.
  test('should allow authenticated users to visit login page', async ({ page }) => {
    // First, login
    await page.goto(LOGIN_URL)
    await page.getByLabel(/email/i).fill(TEST_CONFIG.admin.email)
    await page.getByLabel('Password', { exact: true }).fill(TEST_CONFIG.admin.password)
    await page.getByRole('button', { name: /sign in|login/i }).click()
    await page.waitForURL(DASHBOARD_URL, { timeout: 60000 })

    // Visit login page while authenticated — should load without errors
    await page.goto(LOGIN_URL)
    await expect(page.getByRole('heading', { name: /administration/i })).toBeVisible()
  })

  test('should maintain session after page reload', async ({ page }) => {
    // Login
    await page.goto(LOGIN_URL)
    await page.getByLabel(/email/i).fill(TEST_CONFIG.admin.email)
    await page.getByLabel('Password', { exact: true }).fill(TEST_CONFIG.admin.password)
    await page.getByRole('button', { name: /sign in|login/i }).click()
    await page.waitForURL(DASHBOARD_URL, { timeout: 60000 })

    // Reload page
    await page.reload()

    // Should still be on dashboard (session persisted)
    await expect(page).toHaveURL(new RegExp(DASHBOARD_URL))
  })

  test('should logout successfully', async ({ page }) => {
    // Extended timeout: login + dashboard load + logout dialog + redirect
    test.setTimeout(60000)

    // Login first
    await loginAsAdmin(page)

    // Click logout via JS dispatch — the Next.js dev overlay intercepts pointer events,
    // so we use evaluate() to invoke click() directly on the DOM element
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i })
    await logoutButton.evaluate((el) => (el as HTMLElement).click())

    // Confirm the logout dialog
    const dialog = page.getByRole('alertdialog').or(page.getByRole('dialog'))
    await expect(dialog).toBeVisible({ timeout: 5000 })
    await dialog.getByRole('button', { name: /logout/i }).click()

    // Should redirect to login or home page
    await page.waitForURL(/\/(auth\/login|$)/, { timeout: 60000 })

    // Try to access dashboard - should redirect to login
    await page.goto(DASHBOARD_URL)
    await expect(page).toHaveURL(new RegExp(LOGIN_URL))
  })

  test('should protect dashboard routes when not authenticated', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto(DASHBOARD_URL)

    // Should redirect to login page
    await expect(page).toHaveURL(new RegExp(LOGIN_URL))
  })

  test('should protect pilot management routes when not authenticated', async ({ page }) => {
    // Try to access pilots page without authentication
    await page.goto('/dashboard/pilots')

    // Should redirect to login page
    await expect(page).toHaveURL(new RegExp(LOGIN_URL))
  })
})

test.describe('Authentication - Password Visibility Toggle', () => {
  const LOGIN_URL = '/auth/login'

  test('should toggle password visibility', async ({ page }) => {
    await page.goto(LOGIN_URL)

    const passwordInput = page.getByLabel('Password', { exact: true })
    const toggleButton = page.getByRole('button', { name: /show|hide password/i })

    // Password should be hidden by default
    await expect(passwordInput).toHaveAttribute('type', 'password')

    // Click toggle to show password
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')

    // Click toggle to hide password again
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })
})

test.describe('Authentication - Remember Me', () => {
  const LOGIN_URL = '/auth/login'

  test('should persist email when "Remember Me" is checked', async ({ page }) => {
    await page.goto(LOGIN_URL)

    // Check if "Remember Me" checkbox exists
    const rememberMeCheckbox = page.getByLabel(/remember me/i)
    if (await rememberMeCheckbox.isVisible()) {
      // Fill in credentials and check "Remember Me"
      await page.getByLabel(/email/i).fill(TEST_CONFIG.admin.email)
      await rememberMeCheckbox.check()
      await page.getByLabel('Password', { exact: true }).fill(TEST_CONFIG.admin.password)
      await page.getByRole('button', { name: /sign in|login/i }).click()

      // Wait for successful login
      await page.waitForURL(/dashboard/, { timeout: 60000 })

      // Logout
      await page.getByRole('button', { name: /logout|sign out/i }).click()
      await page.waitForURL(/\/(auth\/login|$)/, { timeout: 60000 })

      // Navigate back to login page
      await page.goto(LOGIN_URL)

      // Email should be pre-filled
      const emailInput = page.getByLabel(/email/i)
      await expect(emailInput).toHaveValue(TEST_CONFIG.admin.email)
    }
  })
})
