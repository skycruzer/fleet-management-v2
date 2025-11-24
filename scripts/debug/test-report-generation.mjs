/**
 * Test Report Generation with Playwright
 * Simulates real browser authentication flow
 */

import { chromium } from '@playwright/test'

const BASE_URL = 'http://localhost:3001'
const ADMIN_EMAIL = 'skycruzer@icloud.com'
const ADMIN_PASSWORD = 'mron2393'

async function testReportGeneration() {
  console.log('🧪 Testing Report Generation with Real Browser Session\n')

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // 1. Login
    console.log('🔐 Step 1: Logging in...')
    await page.goto(`${BASE_URL}/auth/login`)
    await page.fill('input[name="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard**', { timeout: 10000 })
    console.log('✅ Login successful\n')

    // 2. Navigate to Reports
    console.log('📊 Step 2: Navigating to Reports...')
    await page.goto(`${BASE_URL}/dashboard/reports`)
    await page.waitForLoadState('networkidle')
    console.log('✅ Reports page loaded\n')

    // 3. Find report card
    console.log('🔍 Step 3: Looking for report cards...')
    const reportCards = await page.locator('[data-report]').count()
    console.log(`   Found ${reportCards} report cards\n`)

    if (reportCards === 0) {
      console.log('❌ No report cards found with data-report attribute')
      await page.screenshot({ path: 'test-screenshots/reports-page.png', fullPage: true })
      console.log('   Screenshot saved to: test-screenshots/reports-page.png')
      return
    }

    // 4. Get first report ID
    const firstReportId = await page.locator('[data-report]').first().getAttribute('data-report')
    console.log(`✅ First report ID: ${firstReportId}\n`)

    // 5. Test API call directly
    console.log('🚀 Step 4: Testing API call...')

    const response = await page.evaluate(async (reportId) => {
      try {
        const report = {
          id: reportId,
          apiEndpoint: '/api/reports/certifications/all'
        }

        const res = await fetch(report.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            format: 'csv',
            parameters: {}
          })
        })

        const contentType = res.headers.get('content-type')

        return {
          ok: res.ok,
          status: res.status,
          statusText: res.statusText,
          contentType,
          body: contentType?.includes('application/json')
            ? await res.json()
            : await res.text().then(t => t.substring(0, 200))
        }
      } catch (error) {
        return {
          ok: false,
          error: error.message
        }
      }
    }, firstReportId)

    console.log('📋 API Response:')
    console.log('   Status:', response.status)
    console.log('   OK:', response.ok)
    console.log('   Content-Type:', response.contentType)

    if (response.ok) {
      console.log('✅ SUCCESS - Report generated')
      console.log('   First 200 chars:', response.body)
    } else {
      console.log('❌ FAILED - Report generation failed')
      console.log('   Error:', response.body)
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    await page.screenshot({ path: 'test-screenshots/error.png', fullPage: true })
    console.log('   Error screenshot saved to: test-screenshots/error.png')
  } finally {
    await browser.close()
  }
}

testReportGeneration()
