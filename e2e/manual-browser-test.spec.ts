/**
 * Manual Browser Test
 * Simple test to open pages and verify they load
 */

import { test, expect } from '@playwright/test'

test.describe('Manual Browser Testing', () => {
  test('should open home page', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Take screenshot
    await page.screenshot({ path: 'test-results/home-page.png', fullPage: true })

    console.log('Home page loaded at:', page.url())
  })

  test('should open admin login page', async ({ page }) => {
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')

    // Take screenshot
    await page.screenshot({ path: 'test-results/admin-login.png', fullPage: true })

    console.log('Admin login page loaded at:', page.url())

    // Check page title
    const title = await page.title()
    console.log('Page title:', title)
  })

  test('should open pilot portal login page', async ({ page }) => {
    await page.goto('/portal/login')
    await page.waitForLoadState('networkidle')

    // Take screenshot
    await page.screenshot({ path: 'test-results/pilot-login.png', fullPage: true })

    console.log('Pilot portal login page loaded at:', page.url())

    // Check page title
    const title = await page.title()
    console.log('Page title:', title)
  })

  test('should navigate through public pages', async ({ page }) => {
    const publicPages = [
      '/',
      '/auth/login',
      '/portal/login',
      '/portal/register',
    ]

    for (const pagePath of publicPages) {
      console.log(`\nNavigating to: ${pagePath}`)
      await page.goto(pagePath)
      await page.waitForLoadState('networkidle')

      const url = page.url()
      const title = await page.title()

      console.log(`  URL: ${url}`)
      console.log(`  Title: ${title}`)

      // Take screenshot
      const safeName = pagePath.replace(/\//g, '-') || 'root'
      await page.screenshot({
        path: `test-results/page${safeName}.png`,
        fullPage: true
      })

      // Wait a bit before next navigation
      await page.waitForTimeout(1000)
    }
  })
})
