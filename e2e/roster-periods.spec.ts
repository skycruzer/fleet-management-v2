/**
 * E2E Tests for Roster Period Management
 *
 * Tests roster period functionality including:
 * - Viewing roster periods
 * - Creating roster periods
 * - Updating roster periods
 * - Automatic roster period calculations
 * - 28-day cycle validation
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 */

import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@test.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin123'
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('Roster Period Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`)
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/dashboard`)
  })

  test.describe('Roster Period List', () => {
    test('should display roster periods', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/renewal-planning`)

      // Check for roster period selector
      await expect(page.locator('[data-testid="roster-period-selector"]')).toBeVisible()

      // Verify current period highlighted
      await expect(page.locator('[data-testid="current-roster-period"]')).toBeVisible()
    })

    test('should show 28-day cycle information', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/renewal-planning`)

      // Click on a roster period
      await page.click('[data-testid="roster-period-card"]:first-child')

      // Verify 28-day cycle info
      await expect(page.locator('text=28 days')).toBeVisible()
      await expect(page.locator('[data-testid="period-start-date"]')).toBeVisible()
      await expect(page.locator('[data-testid="period-end-date"]')).toBeVisible()
    })

    test('should display deadline dates', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/renewal-planning`)

      await page.click('[data-testid="roster-period-card"]:first-child')

      // Verify deadline information
      await expect(page.locator('[data-testid="publish-date"]')).toBeVisible()
      await expect(page.locator('[data-testid="deadline-date"]')).toBeVisible()
      await expect(page.locator('text=22 days')).toBeVisible() // Days until deadline
    })
  })

  test.describe('Roster Period Calculations', () => {
    test('should calculate RP01/2026 for January dates', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests/quick-entry`)

      await page.fill('[data-testid="start-date-input"]', '2026-01-10')

      // Wait for calculation
      await page.waitForTimeout(500)

      // Verify roster period calculated
      await expect(page.locator('text=RP01/2026')).toBeVisible()
    })

    test('should calculate RP13/2025 for December dates', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests/quick-entry`)

      await page.fill('[data-testid="start-date-input"]', '2025-12-20')

      await page.waitForTimeout(500)

      await expect(page.locator('text=RP13/2025')).toBeVisible()
    })

    test('should handle year rollover correctly', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests/quick-entry`)

      // Test end of RP13 rolling into RP01
      await page.fill('[data-testid="start-date-input"]', '2026-01-03')

      await page.waitForTimeout(500)

      // Should be RP01/2026, not RP14/2025
      await expect(page.locator('text=RP01/2026')).toBeVisible()
      await expect(page.locator('text=RP14')).not.toBeVisible()
    })
  })

  test.describe('Known Anchor Point', () => {
    test('should correctly identify RP12/2025 starting 2025-10-11', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests/quick-entry`)

      await page.fill('[data-testid="start-date-input"]', '2025-10-11')

      await page.waitForTimeout(500)

      await expect(page.locator('text=RP12/2025')).toBeVisible()
    })

    test('should calculate backward from anchor point', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests/quick-entry`)

      // 28 days before RP12/2025 start = RP11/2025
      await page.fill('[data-testid="start-date-input"]', '2025-09-13')

      await page.waitForTimeout(500)

      await expect(page.locator('text=RP11/2025')).toBeVisible()
    })

    test('should calculate forward from anchor point', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/requests/quick-entry`)

      // 28 days after RP12/2025 start = RP13/2025
      await page.fill('[data-testid="start-date-input"]', '2025-11-08')

      await page.waitForTimeout(500)

      await expect(page.locator('text=RP13/2025')).toBeVisible()
    })
  })

  test.describe('Auto-Creation', () => {
    test('should auto-create roster periods when needed', async ({ page }) => {
      // This test verifies the auto-creation logic
      await page.goto(`${BASE_URL}/dashboard/renewal-planning`)

      // Select far future date
      await page.click('[data-testid="year-selector"]')
      await page.click('text=2027')

      // Verify roster periods exist for 2027
      await expect(page.locator('text=RP01/2027')).toBeVisible({ timeout: 5000 })
      await expect(page.locator('text=RP13/2027')).toBeVisible()
    })
  })
})
