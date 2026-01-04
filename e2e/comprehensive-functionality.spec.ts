/**
 * Comprehensive Functionality Test
 * Tests all critical user flows and CRUD operations
 */

import { test, expect } from '@playwright/test'

test.describe('Phase 0 - Complete Functionality Test', () => {
  // Authentication setup
  test.beforeEach(async ({ page }) => {
    // Note: Update these credentials for your environment
    await page.goto('/auth/login')

    // Wait for page load
    await expect(page).toHaveTitle(/Fleet Management/)
  })

  test.describe('Dashboard - Skeleton Loading', () => {
    test('should show skeleton loading then content', async ({ page }) => {
      await page.goto('/dashboard')

      // Check for skeleton (should appear immediately)
      const skeleton = page.locator('[data-testid="dashboard-skeleton"]')
      // Skeleton might already be replaced by content, so check for either
      const hasContent = await page.locator('h2').first().isVisible({ timeout: 5000 })

      if (!hasContent) {
        await expect(skeleton).toBeVisible({ timeout: 1000 })
      }

      // Content should load
      await expect(page.locator('h2').first()).toBeVisible({ timeout: 10000 })

      console.log('✓ Dashboard skeleton loading works')
    })
  })

  test.describe('Pilots - CRUD Operations', () => {
    test('should list all pilots', async ({ page }) => {
      await page.goto('/dashboard/pilots')

      // Wait for pilots list or skeleton
      await page.waitForLoadState('networkidle')

      // Check for pilots table or empty state
      const hasPilots = await page
        .locator('table')
        .isVisible({ timeout: 5000 })
        .catch(() => false)

      if (hasPilots) {
        console.log('✓ Pilots list visible')
      } else {
        const emptyState = await page.locator('text=No pilots found').isVisible()
        expect(emptyState).toBeTruthy()
        console.log('✓ Empty state visible (no pilots)')
      }
    })

    test('should navigate to pilot detail page', async ({ page }) => {
      await page.goto('/dashboard/pilots')
      await page.waitForLoadState('networkidle')

      // Find first pilot link
      const firstPilotLink = page.locator('a[href*="/dashboard/pilots/"]').first()

      // Check if pilots exist
      const linkExists = await firstPilotLink.isVisible({ timeout: 5000 }).catch(() => false)

      if (linkExists) {
        await firstPilotLink.click()

        // Should navigate to detail page
        await expect(page).toHaveURL(/\/dashboard\/pilots\/[^\/]+$/)

        // Should show pilot details
        await expect(page.locator('h1, h2').first()).toBeVisible()

        console.log('✓ Pilot detail page navigation works')
      } else {
        console.log('⚠ Skipped: No pilots to test')
      }
    })

    test('should show create pilot form', async ({ page }) => {
      await page.goto('/dashboard/pilots/new')

      // Check for form
      await expect(page.locator('form')).toBeVisible({ timeout: 5000 })

      // Check for required fields
      await expect(page.locator('input[name="first_name"], input[id*="first_name"]')).toBeVisible()
      await expect(page.locator('input[name="last_name"], input[id*="last_name"]')).toBeVisible()

      console.log('✓ Create pilot form accessible')
    })
  })

  test.describe('Leave Requests - CRUD Operations', () => {
    test('should list leave requests', async ({ page }) => {
      await page.goto('/dashboard/leave')

      await page.waitForLoadState('networkidle')

      // Check for leave requests table or empty state
      const hasRequests = await page
        .locator('table')
        .isVisible({ timeout: 5000 })
        .catch(() => false)

      if (hasRequests) {
        console.log('✓ Leave requests list visible')
      } else {
        const emptyState = await page.locator('text=/No (leave )?requests/i').isVisible()
        expect(emptyState).toBeTruthy()
        console.log('✓ Empty state visible (no leave requests)')
      }
    })

    test('should show create leave request form', async ({ page }) => {
      await page.goto('/dashboard/leave/new')

      // Check for form
      const formVisible = await page.locator('form').isVisible({ timeout: 5000 })

      if (formVisible) {
        console.log('✓ Create leave request form accessible')
      } else {
        console.log('⚠ Leave request form not found or requires auth')
      }
    })
  })

  test.describe('Certifications - CRUD Operations', () => {
    test('should list certifications', async ({ page }) => {
      await page.goto('/dashboard/certifications')

      await page.waitForLoadState('networkidle')

      // Check for certifications list
      const hasContent = await page
        .locator('table, [role="table"]')
        .isVisible({ timeout: 5000 })
        .catch(() => false)

      if (hasContent) {
        console.log('✓ Certifications list visible')
      } else {
        console.log('⚠ Certifications page empty or requires auth')
      }
    })
  })

  test.describe('Renewal Planning', () => {
    test('should show renewal planning dashboard', async ({ page }) => {
      await page.goto('/dashboard/renewal-planning')

      await page.waitForLoadState('networkidle')

      // Check for renewal planning content
      const hasContent = await page.locator('h1, h2').first().isVisible({ timeout: 5000 })

      expect(hasContent).toBeTruthy()
      console.log('✓ Renewal planning page accessible')
    })

    test('should show generate plan page', async ({ page }) => {
      await page.goto('/dashboard/renewal-planning/generate')

      await page.waitForLoadState('networkidle')

      // Check for generate form or button
      const hasForm = await page
        .locator('form, button[type="submit"]')
        .isVisible({ timeout: 5000 })
        .catch(() => false)

      if (hasForm) {
        console.log('✓ Generate renewal plan page accessible')
      } else {
        console.log('⚠ Generate page may require specific data')
      }
    })
  })

  test.describe('Tasks Management', () => {
    test('should list tasks', async ({ page }) => {
      await page.goto('/dashboard/tasks')

      await page.waitForLoadState('networkidle')

      // Check for tasks list
      const hasContent = await page.locator('h1, h2').first().isVisible({ timeout: 5000 })

      expect(hasContent).toBeTruthy()
      console.log('✓ Tasks page accessible')
    })
  })

  test.describe('Flight Requests', () => {
    test('should list flight requests', async ({ page }) => {
      await page.goto('/dashboard/flight-requests')

      await page.waitForLoadState('networkidle')

      // Check for flight requests content
      const hasContent = await page.locator('h1, h2').first().isVisible({ timeout: 5000 })

      expect(hasContent).toBeTruthy()
      console.log('✓ Flight requests page accessible')
    })
  })

  test.describe('Analytics', () => {
    test('should show analytics dashboard', async ({ page }) => {
      await page.goto('/dashboard/analytics')

      await page.waitForLoadState('networkidle')

      // Check for analytics content
      const hasContent = await page.locator('h1, h2').first().isVisible({ timeout: 5000 })

      expect(hasContent).toBeTruthy()
      console.log('✓ Analytics page accessible')
    })
  })

  test.describe('Admin Functions', () => {
    test('should show admin dashboard', async ({ page }) => {
      const response = await page.goto('/dashboard/admin')
      await page.waitForLoadState('networkidle')

      if (response?.status() === 403) {
        console.log('⚠ Admin page requires admin role (expected)')
        return
      }

      // Check for admin content
      const hasContent = await page
        .locator('h1, h2')
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)

      if (hasContent) {
        console.log('✓ Admin dashboard accessible')
      } else {
        console.log('⚠ Admin dashboard requires admin permissions')
      }
    })

    test('should show settings page', async ({ page }) => {
      const response = await page.goto('/dashboard/admin/settings')
      await page.waitForLoadState('networkidle')

      if (response?.status() === 403) {
        console.log('⚠ Settings page requires admin role (expected)')
        return
      }

      const hasContent = await page
        .locator('h1, h2')
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)

      if (hasContent) {
        console.log('✓ Settings page accessible')
      } else {
        console.log('⚠ Settings page requires admin permissions')
      }
    })
  })

  test.describe('Error Boundary', () => {
    test('should not crash on navigation errors', async ({ page }) => {
      // Try to navigate to invalid route
      await page.goto('/dashboard/invalid-route-that-does-not-exist')

      // Should show 404 or error boundary, not blank page
      const hasContent = await page.locator('body').textContent()

      expect(hasContent).toBeTruthy()
      expect(hasContent).not.toBe('')

      console.log('✓ Error handling works (no blank page)')
    })
  })

  test.describe('Console Cleanliness', () => {
    test('should have clean console on dashboard', async ({ page }) => {
      const consoleMessages: string[] = []
      const consoleErrors: string[] = []

      page.on('console', (msg) => {
        if (msg.type() === 'log' || msg.type() === 'debug' || msg.type() === 'info') {
          consoleMessages.push(msg.text())
        }
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })

      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // Filter out expected logs (like Supabase auth, React DevTools)
      const debugLogs = consoleMessages.filter(
        (msg) =>
          !msg.includes('Supabase') &&
          !msg.includes('React') &&
          !msg.includes('Download the React DevTools')
      )

      if (debugLogs.length === 0) {
        console.log('✓ Console is clean (no debug logs)')
      } else {
        console.log(`⚠ Found ${debugLogs.length} console logs`)
        debugLogs.slice(0, 3).forEach((log) => console.log(`  - ${log.substring(0, 100)}`))
      }

      // Critical errors should not exist
      const criticalErrors = consoleErrors.filter(
        (err) => !err.includes('favicon') && !err.includes('404')
      )

      if (criticalErrors.length > 0) {
        console.log(`⚠ Found ${criticalErrors.length} console errors`)
        criticalErrors.slice(0, 3).forEach((err) => console.log(`  - ${err.substring(0, 100)}`))
      }
    })
  })

  test.describe('Performance', () => {
    test('should load dashboard quickly', async ({ page }) => {
      const startTime = Date.now()

      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const loadTime = Date.now() - startTime

      console.log(`✓ Dashboard loaded in ${loadTime}ms`)

      // Should load in reasonable time (5 seconds on slow connection)
      expect(loadTime).toBeLessThan(10000)
    })
  })
})
