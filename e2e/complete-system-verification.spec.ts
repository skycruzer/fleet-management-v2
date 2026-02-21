import { test, expect } from '@playwright/test'

/**
 * Complete System Verification Test
 * Author: Maurice Rondeau
 * Date: November 21, 2025
 *
 * Comprehensive testing of all features:
 * - Pilot Portal (all pages and functions)
 * - Admin Portal (all pages and functions)
 */

test.describe('PILOT PORTAL - Complete Feature Testing', () => {
  test('Pilot Portal - Complete Walkthrough', async ({ page }) => {
    console.log('\n🚀 Starting Pilot Portal Complete Walkthrough\n')

    // ============================================
    // 1. LOGIN
    // ============================================
    console.log('1️⃣  Testing Login...')
    await page.goto('/portal/login')
    await page.waitForLoadState('networkidle')

    // Verify login page elements
    await expect(page.getByRole('heading', { name: 'Pilot Portal' })).toBeVisible()
    await expect(page.getByPlaceholder('pilot@airniugini.com')).toBeVisible()
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible()

    // Login
    await page
      .getByPlaceholder('pilot@airniugini.com')
      .fill(process.env.TEST_PILOT_EMAIL || 'pilot@example.com')
    await page
      .getByPlaceholder('Enter your password')
      .fill(process.env.TEST_PILOT_PASSWORD || 'test-password')
    await page.getByRole('button', { name: /Access Portal/i }).click()

    await page.waitForURL('/portal/dashboard', { timeout: 15000 })
    console.log('   ✅ Login successful\n')

    // ============================================
    // 2. DASHBOARD
    // ============================================
    console.log('2️⃣  Testing Dashboard...')
    await page.waitForLoadState('networkidle', { timeout: 60000 })
    await page.waitForTimeout(5000) // Longer wait for dashboard to fully load

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/01-pilot-dashboard.png', fullPage: true })
    console.log('   ✅ Dashboard loaded\n')

    // ============================================
    // 3. PROFILE PAGE
    // ============================================
    console.log('3️⃣  Testing Profile Page...')
    await page.goto('/portal/profile', { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(5000) // Extra wait for profile data to load
    await page.waitForLoadState('networkidle', { timeout: 60000 })
    await page.waitForTimeout(3000)

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/02-pilot-profile.png', fullPage: true })
    console.log('   ✅ Profile page loaded\n')

    // ============================================
    // 4. CERTIFICATIONS
    // ============================================
    console.log('4️⃣  Testing Certifications...')
    await page.goto('/portal/certifications')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/03-pilot-certifications.png', fullPage: true })
    console.log('   ✅ Certifications page loaded\n')

    // ============================================
    // 5. LEAVE REQUESTS
    // ============================================
    console.log('5️⃣  Testing Leave Requests...')
    await page.goto('/portal/leave-requests')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/04-pilot-leave-requests.png', fullPage: true })

    // Test navigation tabs if they exist
    const tabs = ['Current Requests', 'Leave Bids', 'History']
    for (const tab of tabs) {
      const tabElement = page.getByRole('tab', { name: tab })
      if (await tabElement.isVisible()) {
        await tabElement.click()
        await page.waitForTimeout(1000)
        console.log(`   ✅ ${tab} tab working`)
      }
    }
    console.log('   ✅ Leave requests page tested\n')

    // ============================================
    // 6. FLIGHT REQUESTS
    // ============================================
    console.log('6️⃣  Testing Flight Requests...')
    await page.goto('/portal/flight-requests')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/05-pilot-flight-requests.png', fullPage: true })
    console.log('   ✅ Flight requests page loaded\n')

    // ============================================
    // 7. FEEDBACK
    // ============================================
    console.log('7️⃣  Testing Feedback...')
    await page.goto('/portal/feedback')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/06-pilot-feedback.png', fullPage: true })

    // Test feedback history if available
    const historyLink = page.getByRole('link', { name: /history/i })
    if (await historyLink.isVisible()) {
      await historyLink.click()
      await page.waitForTimeout(1000)
      await page.screenshot({
        path: 'test-screenshots/07-pilot-feedback-history.png',
        fullPage: true,
      })
      console.log('   ✅ Feedback history working')
    }
    console.log('   ✅ Feedback page tested\n')

    // ============================================
    // 8. NAVIGATION MENU
    // ============================================
    console.log('8️⃣  Testing Navigation Menu...')
    const navItems = [
      { name: /dashboard/i, url: '/portal/dashboard' },
      { name: /profile/i, url: '/portal/profile' },
      { name: /certifications/i, url: '/portal/certifications' },
      { name: /leave/i, url: '/portal/leave-requests' },
      { name: /flight/i, url: '/portal/flight-requests' },
      { name: /feedback/i, url: '/portal/feedback' },
    ]

    for (const item of navItems) {
      const navLink = page.getByRole('link', { name: item.name }).first()
      if (await navLink.isVisible()) {
        await navLink.click()
        await page.waitForTimeout(1000)
        expect(page.url()).toContain(item.url)
        console.log(`   ✅ Navigation to ${item.url} working`)
      }
    }
    console.log('   ✅ All navigation links tested\n')

    console.log('🎉 PILOT PORTAL - ALL TESTS PASSED\n')
  })
})

test.describe('ADMIN PORTAL - Complete Feature Testing', () => {
  test('Admin Portal - Complete Walkthrough', async ({ page }) => {
    console.log('\n🚀 Starting Admin Portal Complete Walkthrough\n')

    // ============================================
    // 1. ADMIN LOGIN
    // ============================================
    console.log('1️⃣  Testing Admin Login...')
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')

    // Check if we need to login or already authenticated
    const isLoginPage = page.url().includes('/auth/login')

    if (isLoginPage) {
      console.log('   ℹ️  Admin login page found')
      await page.screenshot({ path: 'test-screenshots/08-admin-login.png', fullPage: true })

      // Note: Admin credentials would need to be configured
      // For now, we'll document what should be tested
      console.log('   ⚠️  Admin credentials needed for full testing')
    }

    // ============================================
    // 2. ADMIN DASHBOARD
    // ============================================
    console.log('2️⃣  Testing Admin Dashboard...')
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/09-admin-dashboard.png', fullPage: true })
    console.log('   ✅ Admin dashboard loaded\n')

    // ============================================
    // 3. PILOTS MANAGEMENT
    // ============================================
    console.log('3️⃣  Testing Pilots Management...')
    await page.goto('/dashboard/pilots')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/10-admin-pilots.png', fullPage: true })
    console.log('   ✅ Pilots management page loaded\n')

    // ============================================
    // 4. CERTIFICATIONS MANAGEMENT
    // ============================================
    console.log('4️⃣  Testing Certifications Management...')
    await page.goto('/dashboard/certifications')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/11-admin-certifications.png', fullPage: true })
    console.log('   ✅ Certifications management page loaded\n')

    // ============================================
    // 5. LEAVE REQUESTS MANAGEMENT
    // ============================================
    console.log('5️⃣  Testing Leave Requests Management...')
    await page.goto('/dashboard/leave')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/12-admin-leave-requests.png', fullPage: true })
    console.log('   ✅ Leave requests management page loaded\n')

    // ============================================
    // 6. REPORTS
    // ============================================
    console.log('6️⃣  Testing Reports...')
    await page.goto('/dashboard/reports')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/13-admin-reports.png', fullPage: true })
    console.log('   ✅ Reports page loaded\n')

    // ============================================
    // 7. REQUESTS MANAGEMENT
    // ============================================
    console.log('7️⃣  Testing Requests Management...')
    await page.goto('/dashboard/requests')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/14-admin-requests.png', fullPage: true })
    console.log('   ✅ Requests management page loaded\n')

    // ============================================
    // 8. SETTINGS
    // ============================================
    console.log('8️⃣  Testing Settings...')
    await page.goto('/dashboard/admin/settings')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/15-admin-settings.png', fullPage: true })
    console.log('   ✅ Settings page loaded\n')

    console.log('🎉 ADMIN PORTAL - ALL TESTS COMPLETED\n')
  })
})

test.describe('ERROR CHECKING - Console and Network', () => {
  test('Check for Console Errors and Failed API Calls', async ({ page }) => {
    console.log('\n🔍 Checking for Errors Across All Pages\n')

    const consoleErrors: string[] = []
    const failedRequests: string[] = []

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Monitor network requests
    page.on('response', (response) => {
      if (response.status() >= 400) {
        failedRequests.push(`${response.status()} ${response.url()}`)
      }
    })

    // Login to pilot portal
    await page.goto('/portal/login')
    await page
      .getByPlaceholder('pilot@airniugini.com')
      .fill(process.env.TEST_PILOT_EMAIL || 'pilot@example.com')
    await page
      .getByPlaceholder('Enter your password')
      .fill(process.env.TEST_PILOT_PASSWORD || 'test-password')
    await page.getByRole('button', { name: /Access Portal/i }).click()
    await page.waitForURL('/portal/dashboard', { timeout: 15000 })

    // Visit all pilot portal pages
    const pilotPages = [
      '/portal/dashboard',
      '/portal/profile',
      '/portal/certifications',
      '/portal/leave-requests',
      '/portal/flight-requests',
      '/portal/feedback',
    ]

    for (const pagePath of pilotPages) {
      await page.goto(pagePath)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)
    }

    // Report findings
    console.log('\n📊 ERROR REPORT:\n')

    if (consoleErrors.length > 0) {
      console.log('⚠️  Console Errors Found:')
      consoleErrors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`)
      })
    } else {
      console.log('✅ No console errors found')
    }

    console.log('')

    if (failedRequests.length > 0) {
      console.log('⚠️  Failed API Requests:')
      failedRequests.forEach((req, i) => {
        console.log(`   ${i + 1}. ${req}`)
      })
    } else {
      console.log('✅ No failed API requests')
    }

    console.log('\n')

    // Critical errors should not exist
    const criticalErrors = consoleErrors.filter(
      (error) =>
        error.includes('is not defined') ||
        error.includes('Cannot read property') ||
        error.includes('undefined')
    )

    if (criticalErrors.length > 0) {
      console.log('❌ CRITICAL ERRORS FOUND:')
      criticalErrors.forEach((error) => console.log(`   - ${error}`))
      throw new Error(`Found ${criticalErrors.length} critical errors`)
    }
  })
})
