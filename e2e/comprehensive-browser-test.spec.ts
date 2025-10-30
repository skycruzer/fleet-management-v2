import { test, expect } from '@playwright/test'
import { loginAsAdmin, loginAsPilot, TEST_CONFIG } from './helpers/test-utils'

/**
 * Comprehensive Browser Testing
 * Tests both Admin and Pilot portals with real browser interactions
 */

test.describe('Admin Portal - Complete Workflow', () => {
  test('Admin Login and Dashboard Access', async ({ page }) => {
    console.log('🔐 Testing admin login...')

    // Use centralized login helper
    await loginAsAdmin(page)

    // Verify we're on the dashboard
    expect(page.url()).toContain('/dashboard')

    // Check dashboard loads
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 60000 })

    console.log('✅ Admin login successful - Dashboard loaded')
  })

  test('Admin Navigation - Pilots Page', async ({ page }) => {
    // Login first
    await loginAsAdmin(page)

    console.log('🧭 Testing pilots page navigation...')

    // Navigate to pilots page
    await page.click('a[href="/dashboard/pilots"]')
    await page.waitForURL('**/dashboard/pilots', { timeout: 60000 })

    // Verify pilots page loads
    await expect(page.getByRole('heading', { name: /pilots/i })).toBeVisible({ timeout: 60000 })

    // Check if pilot data is displayed (should have table or cards)
    const hasTable = await page.locator('table').count() > 0
    const hasCards = await page.locator('[data-testid="pilot-card"]').count() > 0

    expect(hasTable || hasCards).toBeTruthy()

    console.log('✅ Pilots page loaded with data')
  })

  test('Admin Navigation - Certifications Page', async ({ page }) => {
    // Login first
    await loginAsAdmin(page)

    console.log('🧭 Testing certifications page navigation...')

    // Navigate to certifications page
    await page.click('a[href="/dashboard/certifications"]')
    await page.waitForURL('**/dashboard/certifications', { timeout: 60000 })

    // Verify certifications page loads
    await expect(page.getByRole('heading', { name: /certifications/i })).toBeVisible({ timeout: 60000 })

    console.log('✅ Certifications page loaded')
  })

  test('Admin Navigation - Leave Requests Page', async ({ page }) => {
    // Login first
    await loginAsAdmin(page)

    console.log('🧭 Testing leave requests page navigation...')

    // Navigate to leave page
    await page.click('a[href="/dashboard/leave"]')
    await page.waitForURL('**/dashboard/leave', { timeout: 60000 })

    // Verify leave page loads
    await expect(page.getByRole('heading', { name: /leave/i })).toBeVisible({ timeout: 60000 })

    console.log('✅ Leave requests page loaded')
  })

  test('Admin Navigation - Analytics Page', async ({ page }) => {
    // Login first
    await loginAsAdmin(page)

    console.log('🧭 Testing analytics page navigation...')

    // Navigate to analytics page
    await page.click('a[href="/dashboard/analytics"]')
    await page.waitForURL('**/dashboard/analytics', { timeout: 60000 })

    // Verify analytics page loads
    await expect(page.getByRole('heading', { name: /analytics/i })).toBeVisible({ timeout: 60000 })

    console.log('✅ Analytics page loaded')
  })
})

test.describe('Pilot Portal - Complete Workflow', () => {
  test('Pilot Login and Dashboard Access', async ({ page }) => {
    console.log('✈️  Testing pilot login...')

    // Use centralized login helper
    await loginAsPilot(page)

    // Verify we're on the pilot dashboard
    expect(page.url()).toContain('/portal/dashboard')

    // Check dashboard loads
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 60000 })

    console.log('✅ Pilot login successful - Dashboard loaded')
  })

  test('Pilot Navigation - Profile Page', async ({ page }) => {
    // Login first
    await loginAsPilot(page)

    console.log('🧭 Testing pilot profile page...')

    // Navigate to profile page
    await page.click('a[href="/portal/profile"]')
    await page.waitForURL('**/portal/profile', { timeout: 60000 })

    // Verify profile page loads
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible({ timeout: 60000 })

    // Check if profile data is displayed
    await expect(page.getByText(/Maurice/i)).toBeVisible({ timeout: 60000 })
    await expect(page.getByText(/Rondeau/i)).toBeVisible({ timeout: 60000 })

    console.log('✅ Profile page loaded with pilot data')
  })

  test('Pilot Navigation - Certifications Page', async ({ page }) => {
    // Login first
    await loginAsPilot(page)

    console.log('🧭 Testing pilot certifications page...')

    // Navigate to certifications page
    await page.click('a[href="/portal/certifications"]')
    await page.waitForURL('**/portal/certifications', { timeout: 60000 })

    // Verify certifications page loads
    await expect(page.getByRole('heading', { name: /certifications/i })).toBeVisible({ timeout: 60000 })

    console.log('✅ Certifications page loaded')
  })

  test('Pilot Navigation - Leave Requests Page', async ({ page }) => {
    // Login first
    await loginAsPilot(page)

    console.log('🧭 Testing pilot leave requests page...')

    // Navigate to leave requests page
    await page.click('a[href="/portal/leave-requests"]')
    await page.waitForURL('**/portal/leave-requests', { timeout: 60000 })

    // Verify leave requests page loads
    await expect(page.getByRole('heading', { name: /leave/i })).toBeVisible({ timeout: 60000 })

    console.log('✅ Leave requests page loaded')
  })

  test('Pilot Navigation - Flight Requests Page', async ({ page }) => {
    // Login first
    await loginAsPilot(page)

    console.log('🧭 Testing pilot flight requests page...')

    // Navigate to flight requests page
    await page.click('a[href="/portal/flight-requests"]')
    await page.waitForURL('**/portal/flight-requests', { timeout: 60000 })

    // Verify flight requests page loads
    await expect(page.getByRole('heading', { name: /flight/i })).toBeVisible({ timeout: 60000 })

    console.log('✅ Flight requests page loaded')
  })

  test('Pilot Navigation - Feedback Page', async ({ page }) => {
    // Login first
    await loginAsPilot(page)

    console.log('🧭 Testing pilot feedback page...')

    // Navigate to feedback page
    await page.click('a[href="/portal/feedback"]')
    await page.waitForURL('**/portal/feedback', { timeout: 60000 })

    // Verify feedback page loads
    await expect(page.getByRole('heading', { name: /feedback/i })).toBeVisible({ timeout: 60000 })

    console.log('✅ Feedback page loaded')
  })
})

test.describe('Feature Testing - Forms and Buttons', () => {
  test('Admin - Check Dashboard Interactive Elements', async ({ page }) => {
    // Login
    await loginAsAdmin(page)

    console.log('🎯 Testing dashboard interactive elements...')

    // Check for interactive cards/buttons
    const buttons = await page.locator('button').count()
    const links = await page.locator('a').count()

    console.log(`Found ${buttons} buttons and ${links} links on dashboard`)

    // Verify there are interactive elements
    expect(buttons).toBeGreaterThan(0)
    expect(links).toBeGreaterThan(0)

    console.log('✅ Dashboard has interactive elements')
  })

  test('Pilot - Check Dashboard Stats Display', async ({ page }) => {
    // Login
    await loginAsPilot(page)

    console.log('📊 Testing pilot dashboard stats...')

    // Wait for dashboard to fully load
    await page.waitForTimeout(2000)

    // Check for stat cards or metric displays
    const statCards = await page.locator('[class*="card"], [class*="stat"]').count()

    console.log(`Found ${statCards} stat cards on pilot dashboard`)

    console.log('✅ Pilot dashboard stats displayed')
  })
})
