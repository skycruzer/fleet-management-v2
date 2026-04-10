import { Page } from '@playwright/test'

/**
 * Authentication Helpers for E2E Tests
 *
 * Provides reusable authentication flows for pilot portal tests
 */

export interface PilotCredentials {
  email: string
  password: string
}

/**
 * Test Pilot Credentials
 *
 * Maurice Rondeau - Captain, Employee #1
 * Used across E2E tests for pilot portal authentication
 */
export const TEST_PILOT: PilotCredentials = {
  email: process.env.TEST_PILOT_EMAIL || 'pilot@example.com',
  password: process.env.TEST_PILOT_PASSWORD || 'test-password',
}

/**
 * Login as Pilot
 *
 * Performs complete pilot portal login flow:
 * 1. Navigate to /portal/login
 * 2. Fill email and password
 * 3. Submit form
 * 4. Wait for redirect to dashboard
 *
 * @param page - Playwright page object
 * @param credentials - Pilot email and password (defaults to TEST_PILOT)
 * @returns Promise that resolves when login is complete
 *
 * @example
 * ```typescript
 * test.beforeEach(async ({ page }) => {
 *   await loginAsPilot(page)
 *   await page.goto('/portal/flight-requests')
 * })
 * ```
 */
export async function loginAsPilot(
  page: Page,
  credentials: PilotCredentials = TEST_PILOT
): Promise<void> {
  // Navigate to login page
  await page.goto('/portal/login')

  // Fill login form
  await page.fill('#email', credentials.email)
  await page.fill('#password', credentials.password)

  // Submit form
  await page.click('button[type="submit"]')

  // Wait for successful redirect to dashboard
  await page.waitForURL('**/portal/dashboard', { timeout: 10000 })
}

/**
 * Login as Pilot and Navigate
 *
 * Convenience function that combines login + navigation
 *
 * @param page - Playwright page object
 * @param path - Path to navigate to after login (e.g., '/portal/flight-requests')
 * @param credentials - Pilot email and password (defaults to TEST_PILOT)
 *
 * @example
 * ```typescript
 * test.beforeEach(async ({ page }) => {
 *   await loginAndNavigate(page, '/portal/flight-requests')
 * })
 * ```
 */
export async function loginAndNavigate(
  page: Page,
  path: string,
  credentials: PilotCredentials = TEST_PILOT
): Promise<void> {
  await loginAsPilot(page, credentials)
  await page.goto(path)
}

/**
 * Logout Pilot
 *
 * Performs pilot portal logout:
 * 1. Click profile/user menu
 * 2. Click logout button
 * 3. Wait for redirect to login page
 *
 * @param page - Playwright page object
 */
export async function logoutPilot(page: Page): Promise<void> {
  // Click user menu (if exists)
  const userMenu = page.getByRole('button', { name: /profile|account|user/i })
  if (await userMenu.isVisible({ timeout: 1000 })) {
    await userMenu.click()
  }

  // Click logout button
  const logoutButton = page.getByRole('button', { name: /logout|sign out/i })
  await logoutButton.click()

  // Wait for redirect to login
  await page.waitForURL('**/portal/login', { timeout: 5000 })
}

/**
 * Check if Pilot is Logged In
 *
 * Verifies authentication state by checking for pilot-specific UI elements
 *
 * @param page - Playwright page object
 * @returns True if pilot is logged in, false otherwise
 */
export async function isPilotLoggedIn(page: Page): Promise<boolean> {
  try {
    // Check for pilot portal sidebar (visible when authenticated)
    const sidebar = page.locator('[data-testid="pilot-sidebar"]')
    return await sidebar.isVisible({ timeout: 2000 })
  } catch {
    return false
  }
}

/**
 * Clear Authentication State
 *
 * Clears all cookies and storage to ensure fresh authentication
 * Useful in beforeEach/beforeAll hooks
 *
 * @param page - Playwright page object
 */
export async function clearAuth(page: Page): Promise<void> {
  await page.context().clearCookies()
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}
