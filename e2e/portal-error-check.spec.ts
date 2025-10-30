import { test, expect } from '@playwright/test'

test.describe('Portal Error Detection', () => {
  test('capture console errors on portal page', async ({ page }) => {
    const consoleErrors: string[] = []
    const consoleWarnings: string[] = []
    const pageErrors: Error[] = []

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
      if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text())
      }
    })

    // Capture page errors
    page.on('pageerror', (error) => {
      pageErrors.push(error)
    })

    console.log('🌐 Navigating to portal...')
    await page.goto('http://localhost:3000/portal', {
      waitUntil: 'networkidle',
      timeout: 30000
    })

    console.log('📸 Taking screenshot...')
    await page.screenshot({
      path: 'screenshots/portal-error-check.png',
      fullPage: true
    })

    // Wait a bit for any async errors
    await page.waitForTimeout(2000)

    console.log('\n' + '='.repeat(60))
    console.log('📊 PORTAL ERROR REPORT')
    console.log('='.repeat(60))

    if (consoleErrors.length > 0) {
      console.log('\n🔴 CONSOLE ERRORS FOUND:')
      consoleErrors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`)
      })
    } else {
      console.log('\n✅ No console errors detected')
    }

    if (consoleWarnings.length > 0) {
      console.log('\n⚠️  CONSOLE WARNINGS:')
      consoleWarnings.forEach((warning, i) => {
        console.log(`  ${i + 1}. ${warning}`)
      })
    }

    if (pageErrors.length > 0) {
      console.log('\n❌ PAGE ERRORS:')
      pageErrors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error.message}`)
        console.log(`     Stack: ${error.stack}`)
      })
    } else {
      console.log('\n✅ No page errors detected')
    }

    console.log('\n' + '='.repeat(60))

    // Take screenshots of specific elements
    const title = await page.textContent('h2')
    console.log(`\n📄 Page title found: "${title}"`)

    // Check if page loaded successfully
    await expect(page).toHaveURL(/.*portal/)

    // Fail the test if there are console errors
    expect(consoleErrors.length).toBe(0)
    expect(pageErrors.length).toBe(0)
  })
})
