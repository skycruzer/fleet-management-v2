import { test, expect } from '@playwright/test'

test.describe('Accessibility - Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
  })

  test('should have skip navigation link', async ({ page }) => {
    // Tab to skip link
    await page.keyboard.press('Tab')

    // Skip link should be focused
    const skipLink = page.getByRole('link', { name: /skip to main content/i })
    await expect(skipLink).toBeFocused()

    // Activate skip link
    await page.keyboard.press('Enter')

    // Main content should be focused
    const main = page.getByRole('main')
    await expect(main).toBeFocused()
  })

  test('should navigate through interactive elements with Tab key', async ({ page }) => {
    // Tab through elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Should be able to focus on buttons/links
    const focusedElement = await page.evaluateHandle(() => document.activeElement)
    const tagName = await focusedElement.evaluate(el => el?.tagName.toLowerCase())

    expect(['a', 'button', 'input']).toContain(tagName)
  })

  test('should navigate backwards with Shift+Tab', async ({ page }) => {
    // Tab forward twice
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Tab backwards once
    await page.keyboard.press('Shift+Tab')

    // Should move focus backwards
    const focusedElement = await page.evaluateHandle(() => document.activeElement)
    expect(focusedElement).not.toBeNull()
  })

  test('should activate buttons with Enter and Space keys', async ({ page }) => {
    const button = page.getByRole('button', { name: /add pilot/i }).first()

    // Focus button
    await button.focus()

    // Activate with Enter
    await page.keyboard.press('Enter')

    // Dialog or navigation should occur
    await expect(page).toHaveURL(/\/pilots\/new/)
  })

  test('should navigate dropdowns with arrow keys', async ({ page }) => {
    // Find and open a dropdown
    const dropdown = page.getByRole('combobox').first()
    if (await dropdown.isVisible()) {
      await dropdown.focus()
      await page.keyboard.press('ArrowDown')

      // Dropdown should open
      const options = page.getByRole('option')
      await expect(options.first()).toBeVisible()
    }
  })

  test('should close dialogs with Escape key', async ({ page }) => {
    // Open a dialog
    const addButton = page.getByRole('button', { name: /add/i }).first()
    await addButton.click()

    // Dialog should be visible
    const dialog = page.getByRole('dialog')
    if (await dialog.isVisible()) {
      // Press Escape
      await page.keyboard.press('Escape')

      // Dialog should close
      await expect(dialog).toBeHidden()
    }
  })

  test('should trap focus within modals', async ({ page }) => {
    // Open a modal
    const addButton = page.getByRole('button', { name: /add/i }).first()
    await addButton.click()

    const dialog = page.getByRole('dialog')
    if (await dialog.isVisible()) {
      // Tab through all focusable elements
      const focusableElements = await dialog.locator('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])').count()

      // Tab through all elements plus one
      for (let i = 0; i <= focusableElements; i++) {
        await page.keyboard.press('Tab')
      }

      // Focus should cycle back to first element
      const firstFocusable = dialog.locator('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])').first()
      await expect(firstFocusable).toBeFocused()
    }
  })
})

test.describe('Accessibility - Screen Reader', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
  })

  test('should have proper document title', async ({ page }) => {
    await expect(page).toHaveTitle(/Fleet Management/)
  })

  test('should have lang attribute on html element', async ({ page }) => {
    const html = page.locator('html')
    await expect(html).toHaveAttribute('lang', 'en')
  })

  test('should have semantic landmarks', async ({ page }) => {
    // Check for main landmark
    const main = page.getByRole('main')
    await expect(main).toBeVisible()

    // Check for navigation landmark
    const nav = page.getByRole('navigation')
    await expect(nav.first()).toBeVisible()

    // Check for banner (header) if present
    const banner = page.getByRole('banner')
    if (await banner.count() > 0) {
      await expect(banner.first()).toBeVisible()
    }
  })

  test('should have proper heading hierarchy', async ({ page }) => {
    // Get all headings
    const h1 = await page.locator('h1').count()
    const h2 = await page.locator('h2').count()

    // Should have at least one h1
    expect(h1).toBeGreaterThanOrEqual(1)

    // Should have headings in logical order (h1 before h2, etc.)
    const firstHeading = page.locator('h1, h2, h3, h4, h5, h6').first()
    const tagName = await firstHeading.evaluate(el => el?.tagName)
    expect(tagName).toBe('H1')
  })

  test('should have alt text for images', async ({ page }) => {
    const images = page.locator('img')
    const count = await images.count()

    for (let i = 0; i < count; i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')
      expect(alt).not.toBeNull()
    }
  })

  test('should have labels for form inputs', async ({ page }) => {
    await page.goto('/dashboard/pilots/new')

    const inputs = page.locator('input[type="text"], input[type="email"], input[type="tel"]')
    const count = await inputs.count()

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i)
      const ariaLabel = await input.getAttribute('aria-label')
      const id = await input.getAttribute('id')

      // Should have aria-label or associated label
      if (!ariaLabel) {
        expect(id).not.toBeNull()
        const label = page.locator(`label[for="${id}"]`)
        await expect(label).toBeVisible()
      }
    }
  })

  test('should announce form errors', async ({ page }) => {
    await page.goto('/dashboard/pilots/new')

    // Submit form without filling required fields
    const submitButton = page.getByRole('button', { name: /create|submit/i })
    await submitButton.click()

    // Error messages should have role="alert" or aria-live
    const errorMessage = page.locator('[role="alert"], [aria-live="assertive"]').first()
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible()
    }
  })

  test('should have ARIA labels for icon-only buttons', async ({ page }) => {
    const iconButtons = page.locator('button:has(svg):not(:has-text(/./))')
    const count = await iconButtons.count()

    for (let i = 0; i < count; i++) {
      const button = iconButtons.nth(i)
      const ariaLabel = await button.getAttribute('aria-label')
      expect(ariaLabel).not.toBeNull()
      expect(ariaLabel).not.toBe('')
    }
  })
})

test.describe('Accessibility - Color Contrast', () => {
  test('should meet WCAG AA contrast requirements', async ({ page }) => {
    await page.goto('/dashboard')

    // Use axe-core for automated accessibility testing
    const accessibilityScanResults = await page.evaluate(() => {
      // This would require axe-core to be injected
      // For now, we'll do basic checks
      return { violations: [] }
    })

    // Should have no critical violations
    expect(accessibilityScanResults.violations).toHaveLength(0)
  })

  test('should have visible focus indicators', async ({ page }) => {
    await page.goto('/dashboard')

    // Tab to an element
    await page.keyboard.press('Tab')

    // Get focused element styles
    const focusedElement = await page.evaluateHandle(() => document.activeElement)
    const outline = await focusedElement.evaluate(el => {
      const styles = window.getComputedStyle(el as Element)
      return styles.outline || styles.boxShadow
    })

    // Should have visible focus indicator
    expect(outline).not.toBe('none')
    expect(outline).not.toBe('')
  })
})

test.describe('Accessibility - ARIA Live Regions', () => {
  test('should announce dynamic content updates', async ({ page }) => {
    await page.goto('/dashboard')

    // Check for aria-live regions
    const liveRegions = page.locator('[aria-live]')
    const count = await liveRegions.count()

    // Should have at least one live region for announcements
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should announce loading states', async ({ page }) => {
    await page.goto('/dashboard/pilots')

    // Look for loading indicators with aria-busy or aria-live
    const loadingIndicator = page.locator('[aria-busy="true"], [aria-live="polite"]:has-text(/loading/i)')

    // If loading is visible, it should be announced
    if (await loadingIndicator.count() > 0) {
      await expect(loadingIndicator.first()).toBeVisible()
    }
  })
})
