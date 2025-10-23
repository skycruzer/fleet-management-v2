import { test, expect, devices } from '@playwright/test'

test.describe('Mobile Navigation', () => {
  test.use({ ...devices['iPhone 12'] })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should show mobile menu button on small screens', async ({ page }) => {
    const menuButton = page.getByRole('button', { name: /menu/i })
    await expect(menuButton).toBeVisible()
  })

  test('should open mobile menu when button clicked', async ({ page }) => {
    const menuButton = page.getByRole('button', { name: /menu/i })
    await menuButton.click()

    // Mobile menu should be visible
    const nav = page.getByRole('navigation')
    await expect(nav).toBeVisible()
  })

  test('should close mobile menu when close button clicked', async ({ page }) => {
    // Open menu
    const menuButton = page.getByRole('button', { name: /menu/i })
    await menuButton.click()

    // Close menu
    const closeButton = page.getByRole('button', { name: /close/i })
    await closeButton.click()

    // Menu should be hidden
    await expect(page.getByRole('navigation')).toBeHidden()
  })

  test('should support swipe gestures to open menu', async ({ page }) => {
    // Get viewport size
    const viewportSize = page.viewportSize()
    if (!viewportSize) return

    // Swipe from left edge to right using mouse drag
    await page.mouse.move(5, viewportSize.height / 2)
    await page.mouse.down()
    await page.mouse.move(200, viewportSize.height / 2)
    await page.mouse.up()

    // Menu should open
    const nav = page.getByRole('navigation')
    await expect(nav).toBeVisible()
  })

  test('should close menu when tapping outside', async ({ page }) => {
    // Open menu
    const menuButton = page.getByRole('button', { name: /menu/i })
    await menuButton.click()

    // Tap outside menu
    const viewportSize = page.viewportSize()
    if (!viewportSize) return
    await page.touchscreen.tap(viewportSize.width - 10, viewportSize.height / 2)

    // Menu should close
    await expect(page.getByRole('navigation')).toBeHidden()
  })

  test('should have touch-optimized button sizes (min 44x44px)', async ({ page }) => {
    const menuButton = page.getByRole('button', { name: /menu/i })
    const boundingBox = await menuButton.boundingBox()

    expect(boundingBox).not.toBeNull()
    if (boundingBox) {
      expect(boundingBox.width).toBeGreaterThanOrEqual(44)
      expect(boundingBox.height).toBeGreaterThanOrEqual(44)
    }
  })

  test('should navigate to dashboard from mobile menu', async ({ page }) => {
    // Open menu
    const menuButton = page.getByRole('button', { name: /menu/i })
    await menuButton.click()

    // Click dashboard link
    const dashboardLink = page.getByRole('link', { name: /dashboard/i })
    await dashboardLink.click()

    // Should navigate to dashboard
    await expect(page).toHaveURL(/\/dashboard/)
  })
})

test.describe('Mobile Forms', () => {
  test.use({ ...devices['Pixel 5'] })

  test.beforeEach(async ({ page }) => {
    // Navigate to a form page (e.g., pilot creation)
    await page.goto('/dashboard/pilots/new')
  })

  test('should use appropriate input modes on mobile', async ({ page }) => {
    // Email input should have inputMode="email"
    const emailInput = page.getByLabel(/email/i)
    await expect(emailInput).toHaveAttribute('inputmode', 'email')

    // Phone input should have inputMode="tel"
    const phoneInput = page.getByLabel(/phone/i)
    await expect(phoneInput).toHaveAttribute('inputmode', 'tel')
  })

  test('should have autocomplete attributes', async ({ page }) => {
    const emailInput = page.getByLabel(/email/i)
    await expect(emailInput).toHaveAttribute('autocomplete')
  })

  test('should prevent zoom on focus for input fields', async ({ page }) => {
    const metaViewport = await page.locator('meta[name="viewport"]')
    const content = await metaViewport.getAttribute('content')

    // Should have user-scalable=no or maximum-scale=1
    expect(content).toMatch(/(user-scalable=no|maximum-scale=1)/)
  })
})

test.describe('Tablet Layout', () => {
  test.use({ ...devices['iPad Pro'] })

  test('should show desktop layout on tablet', async ({ page }) => {
    await page.goto('/dashboard')

    // Desktop navigation should be visible (not mobile menu)
    const desktopNav = page.getByRole('navigation').first()
    await expect(desktopNav).toBeVisible()

    // Mobile menu button should not be visible
    const mobileMenuButton = page.getByRole('button', { name: /menu/i })
    await expect(mobileMenuButton).toBeHidden()
  })

  test('should display content in optimal tablet layout', async ({ page }) => {
    await page.goto('/dashboard/pilots')

    // Should show grid layout for pilot cards
    const pilotCards = page.getByTestId('pilot-card')
    await expect(pilotCards.first()).toBeVisible()
  })
})
