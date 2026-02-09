import { chromium } from 'playwright'

async function testAnalytics() {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  try {
    // Go to login page
    console.log('Navigating to login...')
    await page.goto('http://localhost:3000/auth/login', { timeout: 60000 })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Take screenshot of login page
    await page.screenshot({ path: '/tmp/01-login.png' })
    console.log('Screenshot: /tmp/01-login.png')

    // Fill in credentials - try different selectors
    console.log('Logging in...')

    // Try to find and fill email field
    const emailInput = page
      .locator('input[name="email"], input[type="email"], input[placeholder*="email" i]')
      .first()
    await emailInput.fill('skycruser@icloud.com')

    // Try to find and fill password field
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first()
    await passwordInput.fill('mron2393')

    await page.screenshot({ path: '/tmp/02-filled-form.png' })
    console.log('Screenshot: /tmp/02-filled-form.png')

    // Click submit
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign In")').first()
    await submitButton.click()

    // Wait for navigation or error
    await page.waitForTimeout(5000)
    await page.screenshot({ path: '/tmp/03-after-login.png' })
    console.log('Screenshot: /tmp/03-after-login.png')

    // Check current URL
    const currentUrl = page.url()
    console.log('Current URL:', currentUrl)

    if (currentUrl.includes('/dashboard')) {
      console.log('Login successful!')

      // Navigate to Analytics page
      console.log('Navigating to Analytics...')
      await page.goto('http://localhost:3000/dashboard/analytics', { timeout: 60000 })
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(3000)

      // Take screenshot
      await page.screenshot({ path: '/tmp/04-analytics.png', fullPage: true })
      console.log('Screenshot: /tmp/04-analytics.png')

      // Click on Reports tab
      console.log('Clicking Reports tab...')
      const reportsTab = page.locator(
        'button:has-text("Reports"), [role="tab"]:has-text("Reports")'
      )
      if (
        await reportsTab
          .first()
          .isVisible({ timeout: 5000 })
          .catch(() => false)
      ) {
        await reportsTab.first().click()
        await page.waitForTimeout(3000)
        await page.screenshot({ path: '/tmp/05-reports.png', fullPage: true })
        console.log('Screenshot: /tmp/05-reports.png')
      } else {
        console.log('Reports tab not found, trying direct navigation...')
        await page.goto('http://localhost:3000/dashboard/analytics?tab=reports', { timeout: 60000 })
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(3000)
        await page.screenshot({ path: '/tmp/05-reports.png', fullPage: true })
        console.log('Screenshot: /tmp/05-reports.png')
      }

      console.log('Test completed successfully!')
    } else {
      console.log('Login may have failed - still on login page or error occurred')
    }
  } catch (error) {
    console.error('Error:', error)
    await page.screenshot({ path: '/tmp/error.png' })
    console.log('Error screenshot saved to /tmp/error.png')
  } finally {
    await browser.close()
  }
}

testAnalytics()
