/**
 * Complete Login Flow Test with Real Credentials
 * Tests both admin and pilot portal login flows
 *
 * @author Maurice Rondeau
 * @date November 23, 2025
 */

import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@example.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'test-password'
const PILOT_EMAIL = process.env.TEST_PILOT_EMAIL || 'pilot@example.com'
const PILOT_PASSWORD = process.env.TEST_PILOT_PASSWORD || 'test-password'

test.describe('Complete Login Flow Tests', () => {
  test('should navigate from landing page to admin login and login successfully', async ({
    page,
  }) => {
    // Step 1: Go to landing page
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Fleet Management', exact: true })).toBeVisible()
    console.log('✓ Landing page loaded')

    // Step 2: Click Admin Dashboard button
    await page.getByRole('link', { name: /admin dashboard/i }).click()
    await page.waitForURL('/auth/login')
    console.log('✓ Navigated to /auth/login')

    // Step 3: Wait for login form to appear (NOT stuck on loading)
    await expect(page.getByRole('heading', { name: /administration|sign in/i })).toBeVisible({
      timeout: 15000,
    })
    console.log('✓ Login form displayed (no stuck loading)')

    // Step 4: Verify no 404 page
    await expect(page.getByText(/404.*page could not be found/i)).not.toBeVisible()
    console.log('✓ No 404 page')

    // Step 5: Fill in login form
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL)
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD)
    console.log('✓ Credentials entered')

    // Step 6: Click Sign In button
    await page.getByRole('button', { name: /sign in/i }).click()
    console.log('✓ Sign In button clicked')

    // Step 7: Wait for dashboard to load
    await page.waitForURL('/dashboard', { timeout: 15000 })
    console.log('✓ Redirected to dashboard')

    // Step 8: Verify dashboard loaded successfully
    await expect(page.getByRole('heading', { name: /dashboard|overview/i })).toBeVisible({
      timeout: 10000,
    })
    console.log('✓ Dashboard loaded successfully')
  })

  test('should navigate from landing page to pilot portal and login successfully', async ({
    page,
  }) => {
    // Step 1: Go to landing page
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Fleet Management', exact: true })).toBeVisible()
    console.log('✓ Landing page loaded')

    // Step 2: Click Pilot Portal button
    await page.getByRole('link', { name: /pilot portal/i }).click()
    await page.waitForURL('/portal/login')
    console.log('✓ Navigated to /portal/login')

    // Step 3: Wait for login form to appear (NOT stuck on loading)
    await expect(
      page.getByRole('heading', { name: /pilot portal|crew login|welcome/i })
    ).toBeVisible({ timeout: 15000 })
    console.log('✓ Login form displayed (no stuck loading)')

    // Step 4: Verify no 404 page
    await expect(page.getByText(/404.*page could not be found/i)).not.toBeVisible()
    console.log('✓ No 404 page')

    // Step 5: Fill in login form
    // Note: Pilot portal might use "Employee Number" or "Username" instead of "Email"
    const emailField = page.getByLabel(/email|employee number|username/i)
    await emailField.fill(PILOT_EMAIL)
    await page.getByLabel(/password/i).fill(PILOT_PASSWORD)
    console.log('✓ Credentials entered')

    // Step 6: Click Sign In button
    await page.getByRole('button', { name: /sign in|login/i }).click()
    console.log('✓ Sign In button clicked')

    // Step 7: Wait for portal dashboard to load
    await page.waitForURL(/\/portal\/dashboard/, { timeout: 15000 })
    console.log('✓ Redirected to portal dashboard')

    // Step 8: Verify dashboard loaded successfully
    await expect(page.getByRole('heading')).toBeVisible({ timeout: 10000 })
    console.log('✓ Portal dashboard loaded successfully')
  })

  test('should show login page directly without navigation', async ({ page }) => {
    // Test admin login page loads directly
    await page.goto('/auth/login')

    // Should show form, not 404, not stuck on loading
    await expect(page.getByRole('heading', { name: /administration|sign in/i })).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByText(/404/i)).not.toBeVisible()

    console.log('✓ Admin login page loads correctly when accessed directly')
  })

  test('should show pilot portal login page directly without navigation', async ({ page }) => {
    // Test pilot portal login page loads directly
    await page.goto('/portal/login')

    // Should show form, not 404, not stuck on loading
    await expect(
      page.getByRole('heading', { name: /pilot portal|crew login|welcome/i })
    ).toBeVisible({ timeout: 15000 })
    await expect(page.getByLabel(/email|employee number|username/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByText(/404/i)).not.toBeVisible()

    console.log('✓ Pilot portal login page loads correctly when accessed directly')
  })
})
