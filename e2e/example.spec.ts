import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load the homepage successfully', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/Fleet Office/)
    await expect(page.getByRole('heading', { name: 'Fleet Office' })).toBeVisible()
  })

  test('should have navigation buttons', async ({ page }) => {
    await page.goto('/')

    const adminButton = page.getByRole('button', { name: /Admin Dashboard/ }).first()
    await expect(adminButton).toBeVisible()
    await adminButton.click()
    await expect(page).toHaveURL(/\/auth\/login$/)

    await page.goto('/')
    const pilotButton = page.getByRole('button', { name: /Pilot Portal/ }).first()
    await expect(pilotButton).toBeVisible()
    await pilotButton.click()
    await expect(page).toHaveURL(/\/portal\/login$/)
  })

  test('should display feature cards', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Pilot Management' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Certification Tracking' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Analytics & Reporting' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Security & Compliance' })).toBeVisible()
  })

  test('should display operational trust indicators', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('FAA Compliant')).toBeVisible()
    await expect(page.getByText('Real-time Monitoring')).toBeVisible()
    await expect(page.getByText('24/7 Operations')).toBeVisible()
  })
})

test.describe('Responsive Design', () => {
  test('should be mobile-friendly', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Fleet Office' })).toBeVisible()
  })
})
