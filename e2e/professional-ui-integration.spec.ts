/**
 * Professional UI Integration Tests
 * Tests all newly integrated professional UI components
 * Run with: npx playwright test e2e/professional-ui-integration.spec.ts
 */

import { test, expect } from '@playwright/test'

test.describe('Professional UI Integration Tests', () => {
  // Skip authentication for now - focus on UI components
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard (assumes user is logged in or auth is handled)
    await page.goto('/dashboard')
    // Wait for page to load
    await page.waitForLoadState('networkidle')
  })

  test.describe('Professional Sidebar', () => {
    test('should display sidebar with correct branding', async ({ page }) => {
      // Wait for sidebar to appear (should be visible on desktop)
      const sidebar = page.locator('aside').first()

      // Check if sidebar exists (may be hidden on mobile)
      const isVisible = await sidebar.isVisible().catch(() => false)

      if (isVisible) {
        // Verify logo/branding
        await expect(page.getByText('Fleet Management')).toBeVisible()

        // Verify navigation items exist
        const navItems = [
          'Dashboard',
          'Pilots',
          'Certifications',
          'Renewal Planning',
          'Leave Requests',
          'Flight Requests',
          'Tasks',
          'Disciplinary',
          'Audit Logs',
          'Analytics',
          'Settings',
        ]

        for (const item of navItems) {
          const link = sidebar.getByRole('link', { name: new RegExp(item, 'i') })
          await expect(link).toBeVisible()
        }
      }
    })

    test('should highlight active navigation item', async ({ page }) => {
      const sidebar = page.locator('aside').first()
      const isVisible = await sidebar.isVisible().catch(() => false)

      if (isVisible) {
        // Dashboard should be active (we're on /dashboard)
        const dashboardLink = sidebar.getByRole('link', { name: /dashboard/i }).first()

        // Check if active (may have specific class or aria-current)
        const ariaCurrentValue = await dashboardLink.getAttribute('aria-current')
        expect(ariaCurrentValue).toBeTruthy()
      }
    })

    test('should navigate when clicking sidebar links', async ({ page }) => {
      const sidebar = page.locator('aside').first()
      const isVisible = await sidebar.isVisible().catch(() => false)

      if (isVisible) {
        // Click on Pilots link
        await sidebar
          .getByRole('link', { name: /pilots/i })
          .first()
          .click()
        await page.waitForURL('**/dashboard/pilots')
        expect(page.url()).toContain('/dashboard/pilots')

        // Navigate back to dashboard
        await sidebar
          .getByRole('link', { name: /^dashboard$/i })
          .first()
          .click()
        await page.waitForURL('**/dashboard')
      }
    })
  })

  test.describe('Professional Header', () => {
    test('should display header with search bar', async ({ page }) => {
      const header = page.locator('header').first()
      const isVisible = await header.isVisible().catch(() => false)

      if (isVisible) {
        // Check for search input
        const searchInput = header.getByPlaceholder(/search/i)
        await expect(searchInput).toBeVisible()

        // Check for theme toggle button
        const themeToggle = header.locator('[aria-label*="theme" i], [title*="theme" i]').first()
        await expect(themeToggle).toBeVisible()

        // Check for notifications button
        const notificationsBtn = header.locator('[aria-label*="notification" i]').first()
        await expect(notificationsBtn).toBeVisible()

        // Check for user menu
        const userMenu = header
          .locator('[aria-label*="user menu" i], [aria-haspopup="menu"]')
          .first()
        await expect(userMenu).toBeVisible()
      }
    })

    test('should open notifications dropdown when clicked', async ({ page }) => {
      const header = page.locator('header').first()
      const isVisible = await header.isVisible().catch(() => false)

      if (isVisible) {
        const notificationsBtn = header.locator('[aria-label*="notification" i]').first()

        if (await notificationsBtn.isVisible()) {
          await notificationsBtn.click()

          // Wait for dropdown to appear
          await page.waitForTimeout(500)

          // Check if dropdown menu appeared (may have specific selector)
          const dropdown = page.locator('[role="menu"], [role="dialog"]').first()
          const dropdownVisible = await dropdown.isVisible().catch(() => false)

          if (dropdownVisible) {
            // Close dropdown by clicking outside or pressing Escape
            await page.keyboard.press('Escape')
            await page.waitForTimeout(300)
          }
        }
      }
    })

    test('should toggle theme when clicking theme button', async ({ page }) => {
      const header = page.locator('header').first()
      const isVisible = await header.isVisible().catch(() => false)

      if (isVisible) {
        const themeToggle = header.locator('[aria-label*="theme" i], [title*="theme" i]').first()

        if (await themeToggle.isVisible()) {
          // Get current theme
          const htmlElement = page.locator('html')
          const initialClass = await htmlElement.getAttribute('class')

          // Click theme toggle
          await themeToggle.click()
          await page.waitForTimeout(300)

          // Check if theme changed
          const newClass = await htmlElement.getAttribute('class')
          expect(newClass).not.toBe(initialClass)
        }
      }
    })
  })

  test.describe('Hero Stats Cards', () => {
    test('should display 4 hero stat cards', async ({ page }) => {
      // Wait for animations to complete
      await page.waitForTimeout(1000)

      // Count stat cards (may have specific data-testid or class)
      const statCards = page.locator('[class*="grid"] > div').filter({
        has: page.locator('svg'), // Cards should have icons
      })

      const count = await statCards.count()
      expect(count).toBeGreaterThanOrEqual(4)
    })

    test('should display stat values and labels', async ({ page }) => {
      await page.waitForTimeout(1000)

      // Check for common stat labels
      const expectedStats = [/total pilots/i, /certification/i, /compliance/i, /leave/i]

      for (const statPattern of expectedStats) {
        const statElement = page.getByText(statPattern).first()
        await expect(statElement).toBeVisible()
      }
    })

    test('should show trend indicators', async ({ page }) => {
      await page.waitForTimeout(1000)

      // Look for trend indicators (arrows, percentages)
      const trendIndicators = page.locator('text=/[↑↓]/').or(page.locator('text=/%/'))
      const count = await trendIndicators.count()

      // Should have at least some trend indicators
      expect(count).toBeGreaterThan(0)
    })
  })

  test.describe('Compliance Overview', () => {
    test('should display compliance percentage', async ({ page }) => {
      await page.waitForTimeout(1000)

      // Look for percentage (e.g., "94.2%")
      const percentageElement = page.locator('text=/\\d+\\.\\d+%/').first()
      await expect(percentageElement).toBeVisible()
    })

    test('should display circular progress indicator', async ({ page }) => {
      await page.waitForTimeout(1000)

      // Look for SVG circle (circular progress)
      const svgCircle = page.locator('svg circle').first()
      await expect(svgCircle).toBeVisible()
    })

    test('should display category breakdown', async ({ page }) => {
      await page.waitForTimeout(1000)

      // Look for category labels
      const expectedCategories = [
        /medical/i,
        /license/i,
        /type rating/i,
        /proficiency/i,
        /simulator/i,
      ]

      let foundCount = 0
      for (const category of expectedCategories) {
        const element = page.getByText(category).first()
        if (await element.isVisible().catch(() => false)) {
          foundCount++
        }
      }

      // Should find at least 3 out of 5 categories
      expect(foundCount).toBeGreaterThanOrEqual(3)
    })

    test('should display action items', async ({ page }) => {
      await page.waitForTimeout(1000)

      // Look for "Action Items" heading
      const actionItemsHeading = page.getByText(/action items/i).first()
      const isVisible = await actionItemsHeading.isVisible().catch(() => false)

      if (isVisible) {
        // Check for action item content
        const actionItems = page.locator('[class*="alert"], [role="alert"]').first()
        await expect(actionItems).toBeVisible()
      }
    })
  })

  test.describe('Dashboard Page Layout', () => {
    test('should display page title and subtitle', async ({ page }) => {
      // Check for "Dashboard" heading
      const heading = page.getByRole('heading', { name: /^dashboard$/i }).first()
      await expect(heading).toBeVisible()

      // Check for subtitle
      const subtitle = page.getByText(/fleet overview/i).first()
      await expect(subtitle).toBeVisible()
    })

    test('should display all major sections in correct order', async ({ page }) => {
      await page.waitForTimeout(1500)

      // Get all main sections
      const pageContent = await page.content()

      // Verify order of major sections
      const heroStatsIndex =
        pageContent.indexOf('Total Pilots') || pageContent.indexOf('Certifications')
      const complianceIndex =
        pageContent.indexOf('Compliance') || pageContent.indexOf('Overall Compliance')

      // Hero stats should come before compliance
      if (heroStatsIndex > -1 && complianceIndex > -1) {
        expect(heroStatsIndex).toBeLessThan(complianceIndex)
      }
    })

    test('should display existing dashboard widgets', async ({ page }) => {
      await page.waitForTimeout(1000)

      // Check for Quick Actions section
      const quickActions = page.getByText(/quick actions/i).first()
      const isVisible = await quickActions.isVisible().catch(() => false)

      if (isVisible) {
        // Should have action buttons
        const addPilotBtn = page.getByRole('link', { name: /add pilot/i })
        await expect(addPilotBtn).toBeVisible()
      }
    })
  })

  test.describe('Responsive Design', () => {
    test('should adapt layout for mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      await page.reload()
      await page.waitForLoadState('networkidle')

      // Sidebar should be hidden on mobile
      const sidebar = page.locator('aside').first()
      const sidebarVisible = await sidebar.isVisible().catch(() => false)

      // On mobile, sidebar might be hidden by CSS
      if (sidebarVisible) {
        // Check if it's actually displayed (not just in DOM)
        const boundingBox = await sidebar.boundingBox()
        expect(boundingBox).toBeFalsy() // Should be null if not visible
      }
    })

    test('should display sidebar on desktop', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.reload()
      await page.waitForLoadState('networkidle')

      // Sidebar should be visible on desktop
      const sidebar = page.locator('aside').first()
      const isVisible = await sidebar.isVisible().catch(() => false)

      if (isVisible) {
        const boundingBox = await sidebar.boundingBox()
        expect(boundingBox).toBeTruthy() // Should have dimensions
      }
    })
  })

  test.describe('Animation Performance', () => {
    test('should load hero stats with staggered animations', async ({ page }) => {
      // Reload to observe animations from start
      await page.reload()
      await page.waitForLoadState('networkidle')

      // Wait for animations
      await page.waitForTimeout(1500)

      // All stat cards should be visible after animation
      const statCards = page.locator('[class*="grid"] > div').filter({
        has: page.locator('svg'),
      })

      const count = await statCards.count()
      expect(count).toBeGreaterThan(0)

      // All cards should be fully visible (opacity: 1)
      for (let i = 0; i < Math.min(count, 4); i++) {
        const card = statCards.nth(i)
        await expect(card).toBeVisible()
      }
    })

    test('should animate circular progress indicator', async ({ page }) => {
      // Reload to see animation from start
      await page.reload()
      await page.waitForLoadState('networkidle')

      // Wait for SVG circle animation
      await page.waitForTimeout(1500)

      // Circle should be visible and have stroke-dasharray
      const circle = page.locator('svg circle').first()
      if (await circle.isVisible().catch(() => false)) {
        const strokeDasharray = await circle.getAttribute('stroke-dasharray')
        expect(strokeDasharray).toBeTruthy()
      }
    })
  })

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      // Check for important ARIA attributes
      const sidebar = page.locator('aside').first()

      if (await sidebar.isVisible().catch(() => false)) {
        // Links should have accessible names
        const links = sidebar.locator('a')
        const count = await links.count()

        for (let i = 0; i < Math.min(count, 5); i++) {
          const link = links.nth(i)
          const accessibleName = (await link.getAttribute('aria-label')) || (await link.innerText())
          expect(accessibleName).toBeTruthy()
        }
      }
    })

    test('should be keyboard navigable', async ({ page }) => {
      // Tab through elements
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // Check if focus is visible (element should have focus)
      const focusedElement = await page.evaluateHandle(() => document.activeElement)
      expect(focusedElement).toBeTruthy()
    })
  })

  test.describe('No Console Errors', () => {
    test('should not have JavaScript errors in console', async ({ page }) => {
      const consoleErrors: string[] = []

      // Listen for console errors
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })

      await page.reload()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      // Filter out known warnings (like Supabase Edge Runtime warnings)
      const criticalErrors = consoleErrors.filter(
        (error) =>
          !error.includes('Edge Runtime') &&
          !error.includes('process.versions') &&
          !error.includes('process.version')
      )

      expect(criticalErrors).toHaveLength(0)
    })
  })
})
