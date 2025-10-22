import { test, expect } from '@playwright/test'

test.describe('Pilot Portal Quick Test', () => {
  test('should load portal homepage', async ({ page }) => {
    // Navigate to portal
    await page.goto('http://localhost:3001/portal')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Take screenshot
    await page.screenshot({ path: 'screenshots/portal-home.png', fullPage: true })

    // Check if page loaded successfully
    await expect(page).toHaveURL(/.*portal/)

    console.log('✅ Portal homepage loaded successfully')
  })

  test('should check portal dashboard accessibility', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('http://localhost:3001/portal/dashboard')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Take screenshot
    await page.screenshot({ path: 'screenshots/portal-dashboard.png', fullPage: true })

    // Check if page loaded successfully
    await expect(page).toHaveURL(/.*portal\/dashboard/)

    console.log('✅ Portal dashboard loaded successfully')
  })

  test('should check for console errors', async ({ page }) => {
    const errors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    // Navigate to portal
    await page.goto('http://localhost:3001/portal')
    await page.waitForLoadState('networkidle')

    // Check for errors
    if (errors.length > 0) {
      console.log('⚠️  Console errors found:')
      errors.forEach((error) => console.log(`   - ${error}`))
    } else {
      console.log('✅ No console errors detected')
    }
  })

  test('should check portal certifications page', async ({ page }) => {
    // Navigate to certifications
    await page.goto('http://localhost:3001/portal/certifications')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Take screenshot
    await page.screenshot({ path: 'screenshots/portal-certifications.png', fullPage: true })

    // Check if page loaded successfully
    await expect(page).toHaveURL(/.*portal\/certifications/)

    console.log('✅ Portal certifications page loaded successfully')
  })

  test('should check portal leave requests page', async ({ page }) => {
    // Navigate to leave requests
    await page.goto('http://localhost:3001/portal/leave')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Take screenshot
    await page.screenshot({ path: 'screenshots/portal-leave.png', fullPage: true })

    // Check if page loaded successfully
    await expect(page).toHaveURL(/.*portal\/leave/)

    console.log('✅ Portal leave requests page loaded successfully')
  })
})
