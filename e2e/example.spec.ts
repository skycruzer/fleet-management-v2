import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load the homepage successfully', async ({ page }) => {
    await page.goto('/')

    // Check if the title is correct
    await expect(page).toHaveTitle(/Fleet Management/)

    // Check if the main heading is visible
    await expect(page.getByRole('heading', { name: /Fleet Management/ })).toBeVisible()
  })

  test('should have navigation buttons', async ({ page }) => {
    await page.goto('/')

    // Check for "Get Started" button
    const getStartedButton = page.getByRole('link', { name: /Get Started/ })
    await expect(getStartedButton).toBeVisible()
    await expect(getStartedButton).toHaveAttribute('href', '/dashboard')

    // Check for "Documentation" button
    const docsButton = page.getByRole('link', { name: /Documentation/ })
    await expect(docsButton).toBeVisible()
    await expect(docsButton).toHaveAttribute('href', '/docs')
  })

  test('should display feature cards', async ({ page }) => {
    await page.goto('/')

    // Check if feature cards are visible
    await expect(page.getByText('Pilot Management')).toBeVisible()
    await expect(page.getByText('Certification Tracking')).toBeVisible()
    await expect(page.getByText('Analytics Dashboard')).toBeVisible()
    await expect(page.getByText('Security First')).toBeVisible()
  })

  test('should display tech stack badges', async ({ page }) => {
    await page.goto('/')

    // Check for technology badges
    await expect(page.getByText('Next.js 15')).toBeVisible()
    await expect(page.getByText('TypeScript')).toBeVisible()
    await expect(page.getByText('Supabase')).toBeVisible()
    await expect(page.getByText('Tailwind CSS v4')).toBeVisible()
  })
})

test.describe('Responsive Design', () => {
  test('should be mobile-friendly', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Check if content is still visible on mobile
    await expect(page.getByRole('heading', { name: /Fleet Management/ })).toBeVisible()
  })
})
