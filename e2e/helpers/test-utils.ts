import { Page, expect } from '@playwright/test'

/**
 * Test Utilities and Helper Functions
 *
 * Reusable functions for E2E tests including:
 * - Authentication helpers
 * - Navigation helpers
 * - Date utilities
 * - Wait utilities
 * - Data cleanup
 */

// Environment variables - SECURITY: All test credentials MUST be set via environment variables
// DO NOT hardcode production credentials in this file
export const TEST_CONFIG = {
  // Admin portal credentials (Supabase Auth)
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || throwMissingEnvError('TEST_ADMIN_EMAIL'),
    password: process.env.TEST_ADMIN_PASSWORD || throwMissingEnvError('TEST_ADMIN_PASSWORD'),
  },
  // Pilot portal credentials (Custom Auth via an_users table)
  pilot: {
    email: process.env.TEST_PILOT_EMAIL || throwMissingEnvError('TEST_PILOT_EMAIL'),
    password: process.env.TEST_PILOT_PASSWORD || throwMissingEnvError('TEST_PILOT_PASSWORD'),
  },
  // Legacy config for backward compatibility
  email: process.env.TEST_USER_EMAIL || throwMissingEnvError('TEST_USER_EMAIL'),
  password: process.env.TEST_USER_PASSWORD || throwMissingEnvError('TEST_USER_PASSWORD'),
  baseUrl: process.env.PLAYWRIGHT_TEST_BASE_URL || '',
  timeout: 10000,
}

/**
 * Throws error if required environment variable is missing
 * Prevents tests from running with hardcoded credentials
 */
function throwMissingEnvError(varName: string): never {
  throw new Error(
    `SECURITY: ${varName} environment variable is required. ` +
    `Set it in .env.test.local or CI environment. ` +
    `Never hardcode production credentials in test files.`
  )
}

/**
 * Login helper function
 * Authenticates a user and waits for dashboard redirect
 * @deprecated Use loginAsAdmin() or loginAsPilot() instead for clearer intent
 */
export async function login(page: Page, email?: string, password?: string) {
  const loginEmail = email || TEST_CONFIG.email
  const loginPassword = password || TEST_CONFIG.password

  await page.goto('/auth/login')
  await page.getByLabel(/email/i).fill(loginEmail)
  await page.getByLabel(/password/i).fill(loginPassword)
  await page.getByRole('button', { name: /sign in|login/i }).click()
  await page.waitForURL(/dashboard/, { timeout: TEST_CONFIG.timeout })
}

/**
 * Login as admin (Supabase Auth)
 * Authenticates admin user and waits for dashboard redirect
 */
export async function loginAsAdmin(page: Page) {
  await page.goto('/auth/login')
  await page.getByLabel(/email/i).fill(TEST_CONFIG.admin.email)
  await page.getByLabel(/password/i).fill(TEST_CONFIG.admin.password)
  await page.getByRole('button', { name: /sign in|login/i }).click()

  // Wait for URL change
  await page.waitForURL(/dashboard/, { timeout: 60000 })

  // Wait for page to fully load (critical for Next.js 16)
  await page.waitForLoadState('networkidle', { timeout: 60000 })

  // Additional wait for hydration
  await page.waitForTimeout(500)
}

/**
 * Login as pilot (Custom Auth)
 * Authenticates pilot user via pilot portal and waits for dashboard redirect
 */
export async function loginAsPilot(page: Page) {
  await page.goto('/portal/login')
  await page.fill('#email', TEST_CONFIG.pilot.email)
  await page.fill('#password', TEST_CONFIG.pilot.password)
  await page.click('button[type="submit"]')

  // Wait for URL change
  await page.waitForURL(/portal.*dashboard/, { timeout: 60000 })

  // Wait for page to fully load (critical for Next.js 16)
  await page.waitForLoadState('networkidle', { timeout: 60000 })

  // Additional wait for hydration
  await page.waitForTimeout(500)
}

/**
 * Logout helper function
 * Logs out the current user and verifies redirect
 */
export async function logout(page: Page) {
  const logoutButton = page.getByRole('button', { name: /logout|sign out/i })
  await logoutButton.click()
  await page.waitForURL(/\/(auth\/login|portal\/login|$)/, { timeout: TEST_CONFIG.timeout })
}

/**
 * Clear all authentication cookies and storage
 */
export async function clearAuth(page: Page) {
  await page.context().clearCookies()
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}

/**
 * Wait for table to load with data
 */
export async function waitForTableLoad(page: Page, minRows = 1) {
  await expect(page.getByRole('table')).toBeVisible({ timeout: TEST_CONFIG.timeout })
  const rows = page.getByRole('row')
  await expect(rows).toHaveCount(minRows + 1, { timeout: TEST_CONFIG.timeout }) // +1 for header
}

/**
 * Wait for loading spinner to disappear
 */
export async function waitForLoadingComplete(page: Page) {
  const spinner = page.locator('[data-testid="loading-spinner"], .spinner, [aria-label="Loading"]')
  await spinner.waitFor({ state: 'hidden', timeout: TEST_CONFIG.timeout }).catch(() => {
    // Spinner might not exist, which is fine
  })
}

/**
 * Date utilities
 */
export const dateUtils = {
  /**
   * Get date N days from now
   */
  getFutureDate(daysFromNow: number): string {
    const date = new Date()
    date.setDate(date.getDate() + daysFromNow)
    return date.toISOString().split('T')[0]
  },

  /**
   * Get date N days ago
   */
  getPastDate(daysAgo: number): string {
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    return date.toISOString().split('T')[0]
  },

  /**
   * Get today's date in YYYY-MM-DD format
   */
  getToday(): string {
    return new Date().toISOString().split('T')[0]
  },

  /**
   * Format date for display (matches app format)
   */
  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  },
}

/**
 * Dialog utilities
 */
export const dialogUtils = {
  /**
   * Open a dialog by clicking a button
   */
  async openDialog(page: Page, buttonName: string | RegExp) {
    await page.getByRole('button', { name: buttonName }).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: TEST_CONFIG.timeout })
  },

  /**
   * Close a dialog
   */
  async closeDialog(page: Page, method: 'cancel' | 'close' | 'escape' = 'cancel') {
    if (method === 'escape') {
      await page.keyboard.press('Escape')
    } else {
      const buttonName = method === 'cancel' ? /cancel/i : /close/i
      await page.getByRole('button', { name: buttonName }).click()
    }
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: TEST_CONFIG.timeout })
  },

  /**
   * Wait for dialog to close
   */
  async waitForClose(page: Page) {
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: TEST_CONFIG.timeout })
  },
}

/**
 * Form utilities
 */
export const formUtils = {
  /**
   * Fill a form field by label
   */
  async fillField(page: Page, label: string | RegExp, value: string) {
    await page.getByLabel(label).fill(value)
  },

  /**
   * Select an option from a dropdown
   */
  async selectOption(page: Page, label: string | RegExp, option: string | RegExp) {
    await page.getByLabel(label).click()
    await page.getByRole('option', { name: option }).click()
  },

  /**
   * Check a checkbox
   */
  async checkCheckbox(page: Page, label: string | RegExp) {
    await page.getByLabel(label).check()
  },

  /**
   * Uncheck a checkbox
   */
  async uncheckCheckbox(page: Page, label: string | RegExp) {
    await page.getByLabel(label).uncheck()
  },

  /**
   * Submit a form
   */
  async submitForm(page: Page, buttonName: string | RegExp = /save|submit|create/i) {
    await page.getByRole('button', { name: buttonName }).click()
  },
}

/**
 * Table utilities
 */
export const tableUtils = {
  /**
   * Get row count (excluding header)
   */
  async getRowCount(page: Page): Promise<number> {
    const rows = page.getByRole('row')
    const count = await rows.count()
    return count - 1 // Subtract header row
  },

  /**
   * Find row by text content
   */
  getRowByText(page: Page, text: string | RegExp) {
    return page.getByRole('row').filter({ hasText: text })
  },

  /**
   * Click edit button in a row
   */
  async editRow(page: Page, rowNumber: number) {
    const row = page.getByRole('row').nth(rowNumber)
    await row.getByRole('button', { name: /edit/i }).click()
  },

  /**
   * Click delete button in a row
   */
  async deleteRow(page: Page, rowNumber: number) {
    const row = page.getByRole('row').nth(rowNumber)
    await row.getByRole('button', { name: /delete/i }).click()
  },
}

/**
 * Toast/Notification utilities
 */
export const toastUtils = {
  /**
   * Wait for success toast
   */
  async waitForSuccess(page: Page) {
    await expect(page.getByText(/success|created|updated|deleted/i)).toBeVisible({
      timeout: TEST_CONFIG.timeout,
    })
  },

  /**
   * Wait for error toast
   */
  async waitForError(page: Page) {
    await expect(page.getByText(/error|failed/i)).toBeVisible({
      timeout: TEST_CONFIG.timeout,
    })
  },

  /**
   * Wait for any toast to disappear
   */
  async waitForToastClose(page: Page) {
    const toast = page.locator('[data-testid="toast"], .toast, [role="alert"]')
    await toast.waitFor({ state: 'hidden', timeout: TEST_CONFIG.timeout * 2 }).catch(() => {
      // Toast might already be gone
    })
  },
}

/**
 * Search and filter utilities
 */
export const searchUtils = {
  /**
   * Search using search input
   */
  async search(page: Page, query: string) {
    const searchInput = page.getByPlaceholder(/search/i)
    await searchInput.fill(query)
    await page.waitForTimeout(1000) // Wait for debounce
  },

  /**
   * Clear search
   */
  async clearSearch(page: Page) {
    const searchInput = page.getByPlaceholder(/search/i)
    await searchInput.clear()
    await page.waitForTimeout(1000)
  },

  /**
   * Filter by selecting a tab
   */
  async filterByTab(page: Page, tabName: string | RegExp) {
    await page.getByRole('tab', { name: tabName }).click()
    await page.waitForTimeout(1000)
  },

  /**
   * Filter using a dropdown
   */
  async filterByDropdown(page: Page, filterLabel: string | RegExp, optionName: string | RegExp) {
    await page.getByLabel(filterLabel).click()
    await page.getByRole('option', { name: optionName }).click()
    await page.waitForTimeout(1000)
  },
}

/**
 * Navigation utilities
 */
export const navUtils = {
  /**
   * Navigate to a dashboard section
   */
  async goToDashboard(page: Page) {
    await page.goto('/dashboard')
    await waitForLoadingComplete(page)
  },

  async goToPilots(page: Page) {
    await page.goto('/dashboard/pilots')
    await waitForLoadingComplete(page)
  },

  async goToCertifications(page: Page) {
    await page.goto('/dashboard/certifications')
    await waitForLoadingComplete(page)
  },

  async goToLeaveRequests(page: Page) {
    await page.goto('/dashboard/leave-requests')
    await waitForLoadingComplete(page)
  },

  async goToAnalytics(page: Page) {
    await page.goto('/dashboard/analytics')
    await waitForLoadingComplete(page)
  },
}

/**
 * Generate unique test data
 */
export const testDataUtils = {
  /**
   * Generate unique identifier
   */
  uniqueId(): string {
    return Date.now().toString()
  },

  /**
   * Generate test pilot data
   */
  generatePilot() {
    const id = this.uniqueId()
    return {
      firstName: `Test${id}`,
      lastName: 'Pilot',
      employeeId: `TP${id}`,
      email: `test${id}@example.com`,
      rank: 'Captain',
      commencementDate: dateUtils.getPastDate(365),
    }
  },

  /**
   * Generate test certification data
   */
  generateCertification() {
    return {
      checkDate: dateUtils.getToday(),
      expiryDate: dateUtils.getFutureDate(365),
    }
  },
}

/**
 * Cleanup utilities
 */
export const cleanupUtils = {
  /**
   * Delete a test pilot by name
   */
  async deleteTestPilot(page: Page, pilotName: string) {
    await navUtils.goToPilots(page)
    const pilotRow = tableUtils.getRowByText(page, pilotName)

    if (await pilotRow.isVisible()) {
      await pilotRow.getByRole('button', { name: /delete/i }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.getByRole('button', { name: /confirm|delete/i }).click()
      await toastUtils.waitForSuccess(page)
    }
  },

  /**
   * Delete all test data created during tests
   */
  async cleanupTestData(_page: Page, testPrefix: string = 'Test') {
    // This is a placeholder - implement based on your cleanup needs
    console.log(`Cleaning up test data with prefix: ${testPrefix}`)
  },
}

/**
 * Viewport utilities for responsive testing
 */
export const viewportUtils = {
  /**
   * Set mobile viewport
   */
  async setMobile(page: Page) {
    await page.setViewportSize({ width: 375, height: 667 })
  },

  /**
   * Set tablet viewport
   */
  async setTablet(page: Page) {
    await page.setViewportSize({ width: 768, height: 1024 })
  },

  /**
   * Set desktop viewport
   */
  async setDesktop(page: Page) {
    await page.setViewportSize({ width: 1920, height: 1080 })
  },
}

/**
 * Accessibility utilities
 */
export const a11yUtils = {
  /**
   * Check if element has proper ARIA label
   */
  async hasAriaLabel(page: Page, selector: string): Promise<boolean> {
    const element = page.locator(selector)
    const ariaLabel = await element.getAttribute('aria-label')
    return ariaLabel !== null && ariaLabel.length > 0
  },

  /**
   * Check if page has proper heading hierarchy
   */
  async checkHeadingHierarchy(page: Page): Promise<boolean> {
    const h1Count = await page.locator('h1').count()
    return h1Count === 1
  },
}
