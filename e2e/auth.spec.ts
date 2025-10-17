import { test, expect } from '@playwright/test'

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
  // Test user credentials (should be set in environment variables)
  const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com'
  const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123'
  const LOGIN_URL = '/auth/login'
  const DASHBOARD_URL = '/dashboard'

  test.beforeEach(async ({ page }) => {
    // Clear cookies and storage before each test
    await page.context().clearCookies()
  })

  test('should display login page with all required elements', async ({ page }) => {
    await page.goto(LOGIN_URL)

    // Check for login form elements
    await expect(page.getByRole('heading', { name: /sign in|login/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible()
  })

  test('should show validation errors for empty form submission', async ({ page }) => {
    await page.goto(LOGIN_URL)

    // Try to submit empty form
    await page.getByRole('button', { name: /sign in|login/i }).click()

    // Check for validation messages
    await expect(page.getByText(/email is required|required/i)).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto(LOGIN_URL)

    // Fill in invalid credentials
    await page.getByLabel(/email/i).fill('invalid@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /sign in|login/i }).click()

    // Check for error message
    await expect(page.getByText(/invalid|incorrect|wrong/i)).toBeVisible({ timeout: 10000 })
  })

  test('should successfully login with valid credentials', async ({ page }) => {
    await page.goto(LOGIN_URL)

    // Fill in valid credentials
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in|login/i }).click()

    // Wait for redirect to dashboard
    await page.waitForURL(DASHBOARD_URL, { timeout: 10000 })

    // Verify user is on dashboard
    await expect(page).toHaveURL(new RegExp(DASHBOARD_URL))
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
  })

  test('should redirect to dashboard if already authenticated', async ({ page }) => {
    // First, login
    await page.goto(LOGIN_URL)
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in|login/i }).click()
    await page.waitForURL(DASHBOARD_URL, { timeout: 10000 })

    // Try to visit login page again
    await page.goto(LOGIN_URL)

    // Should redirect to dashboard
    await expect(page).toHaveURL(new RegExp(DASHBOARD_URL))
  })

  test('should maintain session after page reload', async ({ page }) => {
    // Login
    await page.goto(LOGIN_URL)
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in|login/i }).click()
    await page.waitForURL(DASHBOARD_URL, { timeout: 10000 })

    // Reload page
    await page.reload()

    // Should still be on dashboard (session persisted)
    await expect(page).toHaveURL(new RegExp(DASHBOARD_URL))
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto(LOGIN_URL)
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in|login/i }).click()
    await page.waitForURL(DASHBOARD_URL, { timeout: 10000 })

    // Find and click logout button (could be in menu/dropdown)
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i })
    await logoutButton.click()

    // Should redirect to login or home page
    await page.waitForURL(/\/(auth\/login|$)/, { timeout: 10000 })

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

    const passwordInput = page.getByLabel(/password/i)
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
  const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com'
  const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123'
  const LOGIN_URL = '/auth/login'

  test('should persist email when "Remember Me" is checked', async ({ page }) => {
    await page.goto(LOGIN_URL)

    // Check if "Remember Me" checkbox exists
    const rememberMeCheckbox = page.getByLabel(/remember me/i)
    if (await rememberMeCheckbox.isVisible()) {
      // Fill in credentials and check "Remember Me"
      await page.getByLabel(/email/i).fill(TEST_EMAIL)
      await rememberMeCheckbox.check()
      await page.getByLabel(/password/i).fill(TEST_PASSWORD)
      await page.getByRole('button', { name: /sign in|login/i }).click()

      // Wait for successful login
      await page.waitForURL(/dashboard/, { timeout: 10000 })

      // Logout
      await page.getByRole('button', { name: /logout|sign out/i }).click()
      await page.waitForURL(/\/(auth\/login|$)/, { timeout: 10000 })

      // Navigate back to login page
      await page.goto(LOGIN_URL)

      // Email should be pre-filled
      const emailInput = page.getByLabel(/email/i)
      await expect(emailInput).toHaveValue(TEST_EMAIL)
    }
  })
})
