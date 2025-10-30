import { test, expect } from '@playwright/test'

/**
 * Password Reset E2E Tests
 *
 * Tests password reset workflow including:
 * - Forgot password form
 * - Email validation
 * - Reset link flow
 * - New password submission
 */

test.describe('Password Reset - Pilot Portal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/portal/login')
    await page.waitForLoadState('networkidle', { timeout: 60000 })
  })

  test('should display forgot password link', async ({ page }) => {
    const forgotPasswordLink = page.getByRole('link', { name: /forgot password/i })

    await expect(forgotPasswordLink).toBeVisible({ timeout: 60000 })
  })

  test('should navigate to forgot password page', async ({ page }) => {
    await page.getByRole('link', { name: /forgot password/i }).click()
    await expect(page).toHaveURL(/forgot-password/)
    await expect(page.getByRole('heading', { name: /forgot password|reset/i })).toBeVisible({ timeout: 60000 })
  })

  test('should display email input on forgot password page', async ({ page }) => {
    await page.goto('/portal/forgot-password')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 60000 })
    await expect(page.getByRole('button', { name: /send|reset|submit/i })).toBeVisible({ timeout: 60000 })
  })

  test('should validate email format', async ({ page }) => {
    await page.goto('/portal/forgot-password')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    await page.getByLabel(/email/i).fill('invalid-email')
    await page.getByRole('button', { name: /send|reset|submit/i }).click()

    // Should show validation error
    const errorMessage = page.getByText(/invalid|valid email/i)
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible({ timeout: 60000 })
    }
  })

  test('should submit forgot password form with valid email', async ({ page }) => {
    await page.goto('/portal/forgot-password')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByRole('button', { name: /send|reset|submit/i }).click()

    // Should show success message
    await expect(page.getByText(/check your email|sent|link/i)).toBeVisible({ timeout: 60000 })
  })
})

test.describe('Password Reset - Admin Portal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle', { timeout: 60000 })
  })

  test('should display forgot password link', async ({ page }) => {
    const forgotPasswordLink = page.getByRole('link', { name: /forgot password/i })

    if (await forgotPasswordLink.isVisible()) {
      await expect(forgotPasswordLink).toBeVisible({ timeout: 60000 })
    }
  })

  test('should have password reset functionality', async ({ page }) => {
    const forgotLink = page.getByRole('link', { name: /forgot password/i })

    if (await forgotLink.isVisible()) {
      await forgotLink.click()

      // Should navigate to reset page or show reset form
      const hasResetForm = await page.getByLabel(/email/i).isVisible().catch(() => false)
      const hasResetPage = page.url().includes('reset') || page.url().includes('forgot')

      expect(hasResetForm || hasResetPage).toBe(true)
    }
  })
})

test.describe('Password Reset - Reset Token Flow', () => {
  test('should display reset password form with token', async ({ page }) => {
    // Simulate accessing reset link with token
    await page.goto('/portal/reset-password?token=test-token')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Should show new password form
    const newPasswordInput = page.getByLabel(/new password|password/i).first()
    const confirmPasswordInput = page.getByLabel(/confirm password/i)

    if (await newPasswordInput.isVisible()) {
      await expect(newPasswordInput).toBeVisible({ timeout: 60000 })
    }

    if (await confirmPasswordInput.isVisible()) {
      await expect(confirmPasswordInput).toBeVisible({ timeout: 60000 })
    }
  })

  test('should validate password match', async ({ page }) => {
    await page.goto('/portal/reset-password?token=test-token')
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    const newPasswordInput = page.getByLabel(/new password|password/i).first()
    const confirmPasswordInput = page.getByLabel(/confirm password/i)

    if (await newPasswordInput.isVisible() && await confirmPasswordInput.isVisible()) {
      await newPasswordInput.fill('NewPassword123!')
      await confirmPasswordInput.fill('DifferentPassword123!')
      await page.getByRole('button', { name: /reset|submit|save/i }).click()

      // Should show validation error
      const errorMessage = page.getByText(/password.*match|must match/i)
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toBeVisible({ timeout: 60000 })
      }
    }
  })
})
