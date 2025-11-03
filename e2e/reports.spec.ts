/**
 * Reports System E2E Tests
 * Author: Maurice Rondeau
 * Date: November 3, 2025
 *
 * Comprehensive end-to-end tests for all 19 reports across 5 categories
 */

import { test, expect } from '@playwright/test'

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'skycruzer@icloud.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'mron2393'

// Helper function to login as admin
async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/auth/login`)
  await page.fill('input[name="email"]', ADMIN_EMAIL)
  await page.fill('input[name="password"]', ADMIN_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard')
}

// Helper function to wait for download
async function waitForDownload(page: import('@playwright/test').Page, action: () => Promise<void>) {
  const downloadPromise = page.waitForEvent('download')
  await action()
  const download = await downloadPromise
  return download
}

test.describe('Reports System', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test.describe('Reports Dashboard', () => {
    test('should display reports dashboard page', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      // Verify page loaded
      await expect(page.getByRole('heading', { name: /reports/i })).toBeVisible()

      // Verify all 5 categories are present
      await expect(page.getByText(/certification reports/i)).toBeVisible()
      await expect(page.getByText(/fleet reports/i)).toBeVisible()
      await expect(page.getByText(/leave reports/i)).toBeVisible()
      await expect(page.getByText(/operational reports/i)).toBeVisible()
      await expect(page.getByText(/system reports/i)).toBeVisible()
    })

    test('should display report cards with generate buttons', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      // Check for generate buttons
      const generateButtons = await page.locator('button:has-text("Generate")').count()
      expect(generateButtons).toBeGreaterThan(0)
    })
  })

  test.describe('Certification Reports', () => {
    test('should generate all certifications export (CSV)', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      // Find and click All Certifications report
      await page.click('[data-report="all-certifications"]')

      // Select CSV format
      await page.selectOption('[name="format"]', 'csv')

      // Generate report
      const download = await waitForDownload(page, async () => {
        await page.click('button:has-text("Generate")')
      })

      // Verify download
      expect(download.suggestedFilename()).toMatch(/certifications-all.*\.csv$/)
    })

    test('should generate all certifications export (Excel)', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      await page.click('[data-report="all-certifications"]')
      await page.selectOption('[name="format"]', 'excel')

      const download = await waitForDownload(page, async () => {
        await page.click('button:has-text("Generate")')
      })

      expect(download.suggestedFilename()).toMatch(/certifications-all.*\.xlsx$/)
    })

    test('should generate compliance summary report', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      await page.click('[data-report="compliance-summary"]')
      await page.selectOption('[name="format"]', 'excel')

      const download = await waitForDownload(page, async () => {
        await page.click('button:has-text("Generate")')
      })

      expect(download.suggestedFilename()).toMatch(/compliance-summary.*\.xlsx$/)
    })

    test('should generate expiring certifications report', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      await page.click('[data-report="expiring-certifications"]')

      // Set date range (next 90 days)
      const today = new Date()
      const futureDate = new Date(today.setDate(today.getDate() + 90))
      await page.fill('[name="startDate"]', new Date().toISOString().split('T')[0])
      await page.fill('[name="endDate"]', futureDate.toISOString().split('T')[0])

      await page.selectOption('[name="format"]', 'csv')

      const download = await waitForDownload(page, async () => {
        await page.click('button:has-text("Generate")')
      })

      expect(download.suggestedFilename()).toMatch(/expiring-certifications.*\.csv$/)
    })

    test('should generate renewal schedule (iCal)', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      await page.click('[data-report="renewal-schedule"]')

      const download = await waitForDownload(page, async () => {
        await page.click('button:has-text("Generate")')
      })

      expect(download.suggestedFilename()).toMatch(/renewal-schedule.*\.ics$/)
    })
  })

  test.describe('Fleet Reports', () => {
    test('should generate active roster report (CSV)', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      await page.click('[data-report="active-roster"]')
      await page.selectOption('[name="format"]', 'csv')

      const download = await waitForDownload(page, async () => {
        await page.click('button:has-text("Generate")')
      })

      expect(download.suggestedFilename()).toMatch(/active-roster.*\.csv$/)
    })

    test('should filter active roster by rank', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      await page.click('[data-report="active-roster"]')

      // Select Captain filter
      await page.check('input[value="Captain"]')

      await page.selectOption('[name="format"]', 'csv')

      const download = await waitForDownload(page, async () => {
        await page.click('button:has-text("Generate")')
      })

      expect(download.suggestedFilename()).toMatch(/active-roster.*\.csv$/)
    })

    test('should generate demographics analysis', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      await page.click('[data-report="fleet-demographics"]')
      await page.selectOption('[name="format"]', 'excel')

      const download = await waitForDownload(page, async () => {
        await page.click('button:has-text("Generate")')
      })

      expect(download.suggestedFilename()).toMatch(/demographics-analysis.*\.xlsx$/)
    })

    test('should generate retirement forecast', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      await page.click('[data-report="retirement-forecast"]')
      await page.selectOption('[name="format"]', 'excel')

      const download = await waitForDownload(page, async () => {
        await page.click('button:has-text("Generate")')
      })

      expect(download.suggestedFilename()).toMatch(/retirement-forecast.*\.xlsx$/)
    })

    test('should generate succession pipeline', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      await page.click('[data-report="succession-pipeline"]')
      await page.selectOption('[name="format"]', 'excel')

      const download = await waitForDownload(page, async () => {
        await page.click('button:has-text("Generate")')
      })

      expect(download.suggestedFilename()).toMatch(/succession-pipeline.*\.xlsx$/)
    })
  })

  test.describe('Leave Reports', () => {
    test('should generate annual allocation report', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      await page.click('[data-report="annual-leave-allocation"]')

      // Select year
      await page.selectOption('[name="year"]', '2025')

      const download = await waitForDownload(page, async () => {
        await page.click('button:has-text("Generate")')
      })

      expect(download.suggestedFilename()).toMatch(/annual-allocation-2025.*\.xlsx$/)
    })

    test('should generate leave bid summary', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      await page.click('[data-report="leave-bid-summary"]')
      await page.selectOption('[name="year"]', '2025')

      const download = await waitForDownload(page, async () => {
        await page.click('button:has-text("Generate")')
      })

      expect(download.suggestedFilename()).toMatch(/leave-bid-summary-2025.*\.xlsx$/)
    })

    test('should generate leave calendar export (iCal)', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      await page.click('[data-report="leave-calendar-export"]')

      const download = await waitForDownload(page, async () => {
        await page.click('button:has-text("Generate")')
      })

      expect(download.suggestedFilename()).toMatch(/leave-calendar.*\.ics$/)
    })

    test('should generate leave request summary with filters', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      await page.click('[data-report="leave-request-summary"]')

      // Filter by status
      await page.check('input[value="approved"]')

      // Set date range
      const startDate = '2025-01-01'
      const endDate = '2025-12-31'
      await page.fill('[name="startDate"]', startDate)
      await page.fill('[name="endDate"]', endDate)

      await page.selectOption('[name="format"]', 'csv')

      const download = await waitForDownload(page, async () => {
        await page.click('button:has-text("Generate")')
      })

      expect(download.suggestedFilename()).toMatch(/leave-request-summary.*\.csv$/)
    })
  })

  test.describe('Operational Reports', () => {
    test('should generate disciplinary summary (CSV)', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      await page.click('[data-report="disciplinary-summary"]')
      await page.selectOption('[name="format"]', 'csv')

      const download = await waitForDownload(page, async () => {
        await page.click('button:has-text("Generate")')
      })

      expect(download.suggestedFilename()).toMatch(/disciplinary-summary.*\.csv$/)
    })

    test('should generate flight requests report', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      await page.click('[data-report="flight-requests-summary"]')
      await page.selectOption('[name="format"]', 'excel')

      const download = await waitForDownload(page, async () => {
        await page.click('button:has-text("Generate")')
      })

      expect(download.suggestedFilename()).toMatch(/flight-requests.*\.xlsx$/)
    })

    test('should generate task completion report', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      await page.click('[data-report="task-completion"]')
      await page.selectOption('[name="format"]', 'csv')

      const download = await waitForDownload(page, async () => {
        await page.click('button:has-text("Generate")')
      })

      expect(download.suggestedFilename()).toMatch(/task-completion.*\.csv$/)
    })
  })

  test.describe('System Reports', () => {
    test('should generate audit log export', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      await page.click('[data-report="audit-log"]')

      // Set date range
      const today = new Date()
      const pastDate = new Date(today.setDate(today.getDate() - 30))
      await page.fill('[name="startDate"]', pastDate.toISOString().split('T')[0])
      await page.fill('[name="endDate"]', new Date().toISOString().split('T')[0])

      const download = await waitForDownload(page, async () => {
        await page.click('button:has-text("Generate")')
      })

      expect(download.suggestedFilename()).toMatch(/audit-log.*\.csv$/)
    })

    test('should generate feedback summary', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      await page.click('[data-report="feedback-summary"]')
      await page.selectOption('[name="format"]', 'excel')

      const download = await waitForDownload(page, async () => {
        await page.click('button:has-text("Generate")')
      })

      expect(download.suggestedFilename()).toMatch(/feedback-summary.*\.xlsx$/)
    })

    test('should generate system health report (JSON)', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      await page.click('[data-report="system-health"]')

      const download = await waitForDownload(page, async () => {
        await page.click('button:has-text("Generate")')
      })

      expect(download.suggestedFilename()).toMatch(/system-health.*\.json$/)
    })

    test('should generate user activity report', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      await page.click('[data-report="user-activity"]')
      await page.selectOption('[name="format"]', 'csv')

      const download = await waitForDownload(page, async () => {
        await page.click('button:has-text("Generate")')
      })

      expect(download.suggestedFilename()).toMatch(/user-activity.*\.csv$/)
    })
  })

  test.describe('Error Handling', () => {
    test('should return 401 for unauthenticated requests', async ({ page }) => {
      await page.context().clearCookies()

      const response = await page.request.post(`${BASE_URL}/api/reports/certifications/all`, {
        data: { format: 'csv' }
      })

      expect(response.status()).toBe(401)
    })

    test('should return 404 when no data found', async ({ page }) => {
      await loginAsAdmin(page)

      // Request leave bids for a year with no data
      const response = await page.request.post(`${BASE_URL}/api/reports/leave/bid-summary`, {
        data: {
          format: 'excel',
          parameters: { year: '1900' }  // Year with no data
        }
      })

      expect(response.status()).toBe(404)
      const body = await response.json()
      expect(body.error).toContain('No leave bids found')
    })

    test('should return 400 for invalid format', async ({ page }) => {
      await loginAsAdmin(page)

      const response = await page.request.post(`${BASE_URL}/api/reports/certifications/all`, {
        data: { format: 'invalid-format' }
      })

      expect(response.status()).toBe(400)
    })

    test('should return 501 for unimplemented PDF format', async ({ page }) => {
      await loginAsAdmin(page)

      const response = await page.request.post(`${BASE_URL}/api/reports/certifications/compliance`, {
        data: { format: 'pdf' }
      })

      expect(response.status()).toBe(501)
      const body = await response.json()
      expect(body.error).toContain('PDF format not yet implemented')
    })
  })

  test.describe('Performance', () => {
    test('should generate reports within 10 seconds', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      const startTime = Date.now()

      await page.click('[data-report="all-certifications"]')
      await page.selectOption('[name="format"]', 'csv')

      await waitForDownload(page, async () => {
        await page.click('button:has-text("Generate")')
      })

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(10000)  // 10 seconds
    })
  })

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels on report buttons', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      const generateButtons = await page.locator('button:has-text("Generate")')
      const firstButton = generateButtons.first()

      // Check for aria-label or accessible name
      const accessibleName = await firstButton.getAttribute('aria-label')
      expect(accessibleName).toBeTruthy()
    })

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/reports`)

      // Tab to first generate button
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // Should be able to activate with Enter or Space
      await page.keyboard.press('Enter')

      // Verify dialog or action occurred
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 })
    })
  })
})

test.describe('Reports API Integration', () => {
  test('should have correct Content-Type headers', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/reports/certifications/all`, {
      data: { format: 'csv' },
      headers: {
        'Authorization': `Bearer ${process.env.TEST_AUTH_TOKEN}`
      }
    })

    expect(response.headers()['content-type']).toContain('text/csv')
  })

  test('should include Content-Disposition header with filename', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/reports/certifications/all`, {
      data: { format: 'csv' },
      headers: {
        'Authorization': `Bearer ${process.env.TEST_AUTH_TOKEN}`
      }
    })

    const contentDisposition = response.headers()['content-disposition']
    expect(contentDisposition).toContain('attachment')
    expect(contentDisposition).toContain('filename=')
  })
})
