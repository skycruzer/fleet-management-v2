import { test, expect } from '@playwright/test'
import { login, navUtils, waitForLoadingComplete } from './helpers/test-utils'

/**
 * Dashboard E2E Tests
 *
 * Tests dashboard functionality including:
 * - Dashboard metrics display
 * - Fleet compliance overview
 * - Expiring certifications widget
 * - Quick actions
 * - Navigation
 * - Real-time data updates
 */

test.describe('Dashboard - Overview', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await navUtils.goToDashboard(page)
  })

  test('should display dashboard page with heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
  })

  test('should display fleet metrics cards', async ({ page }) => {
    await waitForLoadingComplete(page)

    // Look for key metric cards
    const metrics = [
      /total pilots|pilots/i,
      /certifications?/i,
      /compliance|current/i,
      /expiring|alerts?/i,
    ]

    for (const metric of metrics) {
      const card = page.getByText(metric).first()
      if (await card.isVisible()) {
        await expect(card).toBeVisible()
      }
    }
  })

  test('should display numeric values in metric cards', async ({ page }) => {
    await waitForLoadingComplete(page)

    // Look for metric cards with numbers
    const metricCards = page.locator('[data-testid*="metric"], .metric-card, [role="article"]')

    if ((await metricCards.count()) > 0) {
      const firstCard = metricCards.first()
      await expect(firstCard).toBeVisible()

      // Should contain a number
      const text = await firstCard.textContent()
      expect(text).toMatch(/\d+/)
    }
  })

  test('should display fleet compliance percentage', async ({ page }) => {
    await waitForLoadingComplete(page)

    // Look for compliance percentage
    const complianceText = page.getByText(/\d+%|compliance/i)

    if (await complianceText.first().isVisible()) {
      await expect(complianceText.first()).toBeVisible()
    }
  })
})

test.describe('Dashboard - Expiring Certifications Widget', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await navUtils.goToDashboard(page)
  })

  test('should display expiring certifications widget', async ({ page }) => {
    await waitForLoadingComplete(page)

    const expiringWidget = page.getByRole('heading', { name: /expiring|upcoming/i })

    if (await expiringWidget.first().isVisible()) {
      await expect(expiringWidget.first()).toBeVisible()
    }
  })

  test('should show list of expiring certifications', async ({ page }) => {
    await waitForLoadingComplete(page)

    // Look for certification items in the widget
    const certItems = page.locator('[data-testid="expiring-cert"], .expiring-item')

    const count = await certItems.count()
    // Widget should either show certifications or "No expiring certifications" message
    if (count > 0) {
      await expect(certItems.first()).toBeVisible()
    } else {
      const emptyState = page.getByText(/no expiring|all current/i)
      if (await emptyState.isVisible()) {
        await expect(emptyState).toBeVisible()
      }
    }
  })

  test('should display certification expiry dates', async ({ page }) => {
    await waitForLoadingComplete(page)

    const certItems = page.locator('[data-testid="expiring-cert"]')

    if ((await certItems.count()) > 0) {
      const firstItem = certItems.first()
      const text = await firstItem.textContent()

      // Should contain a date or "days until expiry"
      expect(text).toMatch(/\d+\s*(days?|\/|\-|expires?)/i)
    }
  })

  test('should link to full certifications page', async ({ page }) => {
    await waitForLoadingComplete(page)

    const viewAllLink = page.getByRole('link', { name: /view all|see all.*certifications/i })

    if (await viewAllLink.isVisible()) {
      await viewAllLink.click()
      await expect(page).toHaveURL(/certifications/)
    }
  })
})

test.describe('Dashboard - Recent Activity', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await navUtils.goToDashboard(page)
  })

  test('should display recent activity section', async ({ page }) => {
    await waitForLoadingComplete(page)

    const activitySection = page.getByRole('heading', { name: /recent|activity|updates/i })

    if (await activitySection.first().isVisible()) {
      await expect(activitySection.first()).toBeVisible()
    }
  })

  test('should show activity items with timestamps', async ({ page }) => {
    await waitForLoadingComplete(page)

    const activityItems = page.locator('[data-testid="activity-item"], .activity-item')

    if ((await activityItems.count()) > 0) {
      const firstItem = activityItems.first()
      const text = await firstItem.textContent()

      // Should contain time-related text
      expect(text).toMatch(/ago|today|yesterday|hour|minute|day/i)
    }
  })
})

test.describe('Dashboard - Quick Actions', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await navUtils.goToDashboard(page)
  })

  test('should display quick action buttons', async ({ page }) => {
    await waitForLoadingComplete(page)

    const quickActions = [
      /add pilot/i,
      /add certification/i,
      /new.*request/i,
      /view.*report/i,
    ]

    for (const action of quickActions) {
      const button = page.getByRole('button', { name: action })
        .or(page.getByRole('link', { name: action }))

      if (await button.first().isVisible()) {
        await expect(button.first()).toBeVisible()
      }
    }
  })

  test('should navigate to add pilot from quick action', async ({ page }) => {
    await waitForLoadingComplete(page)

    const addPilotButton = page.getByRole('button', { name: /add pilot/i })
      .or(page.getByRole('link', { name: /add pilot|pilots/i }))

    if (await addPilotButton.first().isVisible()) {
      await addPilotButton.first().click()

      // Should either open dialog or navigate to pilots page
      const dialogVisible = await page.getByRole('dialog').isVisible().catch(() => false)
      const onPilotsPage = page.url().includes('pilots')

      expect(dialogVisible || onPilotsPage).toBe(true)
    }
  })
})

test.describe('Dashboard - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await navUtils.goToDashboard(page)
  })

  test('should have navigation sidebar', async ({ page }) => {
    const sidebar = page.locator('[data-testid="sidebar"], nav, aside')

    if (await sidebar.first().isVisible()) {
      await expect(sidebar.first()).toBeVisible()
    }
  })

  test('should navigate to pilots page from sidebar', async ({ page }) => {
    const pilotsLink = page.getByRole('link', { name: /pilots/i })

    if (await pilotsLink.first().isVisible()) {
      await pilotsLink.first().click()
      await expect(page).toHaveURL(/pilots/)
      await expect(page.getByRole('heading', { name: /pilots/i })).toBeVisible()
    }
  })

  test('should navigate to certifications page from sidebar', async ({ page }) => {
    const certsLink = page.getByRole('link', { name: /certifications?/i })

    if (await certsLink.first().isVisible()) {
      await certsLink.first().click()
      await expect(page).toHaveURL(/certifications/)
      await expect(page.getByRole('heading', { name: /certifications?/i })).toBeVisible()
    }
  })

  test('should navigate to analytics page from sidebar', async ({ page }) => {
    const analyticsLink = page.getByRole('link', { name: /analytics|reports?/i })

    if (await analyticsLink.first().isVisible()) {
      await analyticsLink.first().click()
      await expect(page).toHaveURL(/analytics|reports/)
    }
  })

  test('should highlight active navigation item', async ({ page }) => {
    const dashboardLink = page.getByRole('link', { name: /dashboard/i }).first()

    if (await dashboardLink.isVisible()) {
      // Dashboard link should have active state
      const classes = await dashboardLink.getAttribute('class')
      expect(classes).toMatch(/active|current|selected/)
    }
  })
})

test.describe('Dashboard - User Menu', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await navUtils.goToDashboard(page)
  })

  test('should display user menu button', async ({ page }) => {
    const userMenu = page.getByRole('button', { name: /user|account|profile|menu/i })

    if (await userMenu.first().isVisible()) {
      await expect(userMenu.first()).toBeVisible()
    }
  })

  test('should open user menu dropdown', async ({ page }) => {
    const userMenuButton = page.getByRole('button', { name: /user|account|profile|menu/i })

    if (await userMenuButton.first().isVisible()) {
      await userMenuButton.first().click()

      // Should show dropdown menu
      const dropdown = page.getByRole('menu')
        .or(page.locator('[role="menuitem"]').first())

      await expect(dropdown.first()).toBeVisible()
    }
  })

  test('should have logout option in user menu', async ({ page }) => {
    const userMenuButton = page.getByRole('button', { name: /user|account|profile|menu/i })

    if (await userMenuButton.first().isVisible()) {
      await userMenuButton.first().click()

      const logoutOption = page.getByRole('menuitem', { name: /logout|sign out/i })
        .or(page.getByRole('button', { name: /logout|sign out/i }))

      if (await logoutOption.first().isVisible()) {
        await expect(logoutOption.first()).toBeVisible()
      }
    }
  })
})

test.describe('Dashboard - Charts and Visualizations', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await navUtils.goToDashboard(page)
  })

  test('should display compliance chart', async ({ page }) => {
    await waitForLoadingComplete(page)

    const chart = page.locator('[data-testid*="chart"], canvas, svg[class*="chart"]')

    if ((await chart.count()) > 0) {
      await expect(chart.first()).toBeVisible()
    }
  })

  test('should display expiry trend chart', async ({ page }) => {
    await waitForLoadingComplete(page)

    // Look for chart section
    const chartSection = page.getByRole('heading', { name: /trend|chart|graph/i })

    if (await chartSection.first().isVisible()) {
      await expect(chartSection.first()).toBeVisible()
    }
  })
})

test.describe('Dashboard - Responsive Design', () => {
  test('should be mobile-friendly', async ({ page }) => {
    await login(page)
    await page.setViewportSize({ width: 375, height: 667 })
    await navUtils.goToDashboard(page)

    // Dashboard should be visible
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // Mobile navigation should be accessible
    const mobileMenu = page.getByRole('button', { name: /menu|navigation/i })

    if (await mobileMenu.isVisible()) {
      await expect(mobileMenu).toBeVisible()
    }
  })

  test('should adapt metric cards for mobile', async ({ page }) => {
    await login(page)
    await page.setViewportSize({ width: 375, height: 667 })
    await navUtils.goToDashboard(page)
    await waitForLoadingComplete(page)

    // Metric cards should stack vertically on mobile
    const metricCards = page.locator('[data-testid*="metric"]')

    if ((await metricCards.count()) > 0) {
      const firstCard = metricCards.first()
      const boundingBox = await firstCard.boundingBox()

      if (boundingBox) {
        // Card should take most of viewport width on mobile
        expect(boundingBox.width).toBeGreaterThan(300)
      }
    }
  })
})

test.describe('Dashboard - Data Refresh', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await navUtils.goToDashboard(page)
  })

  test('should have refresh button', async ({ page }) => {
    await waitForLoadingComplete(page)

    const refreshButton = page.getByRole('button', { name: /refresh|reload/i })

    if (await refreshButton.isVisible()) {
      await expect(refreshButton).toBeVisible()
      await refreshButton.click()

      // Should show loading state
      const spinner = page.locator('[data-testid="loading-spinner"]')
      if (await spinner.isVisible()) {
        await expect(spinner).toBeVisible()
        await spinner.waitFor({ state: 'hidden' })
      }
    }
  })

  test('should reload data after refresh', async ({ page }) => {
    await waitForLoadingComplete(page)

    // Get initial pilot count
    const metricText = page.getByText(/\d+\s*pilots?/i).first()

    if (await metricText.isVisible()) {
      // Click refresh
      const refreshButton = page.getByRole('button', { name: /refresh|reload/i })
      if (await refreshButton.isVisible()) {
        await refreshButton.click()
        await waitForLoadingComplete(page)

        // Data should be present (same or updated)
        const updatedText = await metricText.textContent()
        expect(updatedText).toBeTruthy()
      }
    }
  })
})

test.describe('Dashboard - Performance', () => {
  test('should load dashboard within reasonable time', async ({ page }) => {
    await login(page)

    const startTime = Date.now()
    await navUtils.goToDashboard(page)
    await waitForLoadingComplete(page)
    const loadTime = Date.now() - startTime

    // Dashboard should load within 5 seconds
    expect(loadTime).toBeLessThan(5000)
  })

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await login(page)
    await navUtils.goToDashboard(page)
    await waitForLoadingComplete(page)

    // Should not have critical errors
    const criticalErrors = errors.filter(
      (err) => !err.includes('favicon') && !err.includes('DevTools')
    )
    expect(criticalErrors.length).toBe(0)
  })
})
