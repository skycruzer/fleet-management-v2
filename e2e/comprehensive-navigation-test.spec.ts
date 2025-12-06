/**
 * Comprehensive Navigation Test
 * Tests all critical navigation flows and button functionality
 *
 * @author Maurice Rondeau
 * @date November 23, 2025
 */

import { test, expect } from '@playwright/test'

test.describe('Comprehensive Navigation Tests', () => {
  test.describe('Landing Page Navigation', () => {
    test('should load landing page successfully', async ({ page }) => {
      await page.goto('/')

      // Check page loads
      await expect(page).toHaveTitle(/Fleet Management/i)

      // Check main heading
      await expect(page.getByRole('heading', { name: /fleet management/i })).toBeVisible()
    })

    test('should navigate to admin login from landing page', async ({ page }) => {
      await page.goto('/')

      // Click Admin Dashboard button
      await page.getByRole('link', { name: /admin dashboard/i }).click()

      // Wait for navigation
      await page.waitForURL('/auth/login')

      // Verify we're on admin login page (no 404!)
      await expect(page.getByRole('heading', { name: /administration|sign in/i })).toBeVisible({ timeout: 10000 })

      // Should NOT see 404 text
      await expect(page.getByText('404')).not.toBeVisible()
    })

    test('should navigate to pilot portal login from landing page', async ({ page }) => {
      await page.goto('/')

      // Click Pilot Portal button
      await page.getByRole('link', { name: /pilot portal/i }).click()

      // Wait for navigation
      await page.waitForURL('/portal/login')

      // Verify we're on pilot login page (no 404!)
      await expect(page.getByRole('heading', { name: /pilot portal|crew login/i })).toBeVisible({ timeout: 10000 })

      // Should NOT see 404 text
      await expect(page.getByText('404')).not.toBeVisible()
    })

    test('should navigate to documentation from landing page', async ({ page }) => {
      await page.goto('/')

      // Click Documentation button
      await page.getByRole('link', { name: /documentation/i }).click()

      // Wait for navigation
      await page.waitForURL('/docs')

      // Verify we're on docs page (no 404!)
      await expect(page.getByRole('heading')).toBeVisible()

      // Should NOT see 404 text
      await expect(page.getByText('404')).not.toBeVisible()
    })
  })

  test.describe('Admin Login Page', () => {
    test('should load admin login page directly', async ({ page }) => {
      await page.goto('/auth/login')

      // Should show login form, not 404
      await expect(page.getByRole('heading', { name: /administration|sign in/i })).toBeVisible({ timeout: 10000 })
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByLabel(/password/i)).toBeVisible()

      // Should NOT see 404 or loading stuck
      await expect(page.getByText('404')).not.toBeVisible()
      await expect(page.getByText(/this page could not be found/i)).not.toBeVisible()
    })

    test('should have back to home link on admin login', async ({ page }) => {
      await page.goto('/auth/login')

      // Wait for page to load
      await expect(page.getByRole('heading', { name: /administration|sign in/i })).toBeVisible({ timeout: 10000 })

      // Should have back to home link
      const backLink = page.getByRole('link', { name: /back to home/i })
      await expect(backLink).toBeVisible()

      // Click back link
      await backLink.click()

      // Should return to landing page
      await page.waitForURL('/')
      await expect(page.getByRole('heading', { name: /fleet management/i })).toBeVisible()
    })
  })

  test.describe('Pilot Portal Login Page', () => {
    test('should load pilot portal login page directly', async ({ page }) => {
      await page.goto('/portal/login')

      // Should show login form, not 404
      await expect(page.getByRole('heading', { name: /pilot portal|crew login/i })).toBeVisible({ timeout: 10000 })
      await expect(page.getByLabel(/employee number|username/i)).toBeVisible()
      await expect(page.getByLabel(/password/i)).toBeVisible()

      // Should NOT see 404 or loading stuck
      await expect(page.getByText('404')).not.toBeVisible()
      await expect(page.getByText(/this page could not be found/i)).not.toBeVisible()
    })

    test('should have back to home link on pilot login', async ({ page }) => {
      await page.goto('/portal/login')

      // Wait for page to load
      await expect(page.getByRole('heading', { name: /pilot portal|crew login/i })).toBeVisible({ timeout: 10000 })

      // Should have back to home link
      const backLink = page.getByRole('link', { name: /back to home/i })
      await expect(backLink).toBeVisible()

      // Click back link
      await backLink.click()

      // Should return to landing page
      await page.waitForURL('/')
      await expect(page.getByRole('heading', { name: /fleet management/i })).toBeVisible()
    })
  })

  test.describe('404 Page', () => {
    test('should show 404 page for invalid routes', async ({ page }) => {
      await page.goto('/this-route-does-not-exist-12345')

      // Should see 404 page
      await expect(page.getByText('404')).toBeVisible()
      await expect(page.getByRole('heading', { name: /page not found|not found/i })).toBeVisible()
    })

    test('should have working home link on 404 page', async ({ page }) => {
      await page.goto('/this-route-does-not-exist-12345')

      // Click home button
      await page.getByRole('link', { name: /go home/i }).click()

      // Should return to landing page
      await page.waitForURL('/')
      await expect(page.getByRole('heading', { name: /fleet management/i })).toBeVisible()
    })
  })

  test.describe('Protected Routes (Without Auth)', () => {
    test('should redirect to login when accessing protected dashboard', async ({ page }) => {
      await page.goto('/dashboard')

      // Should redirect to login (either /auth/login or show access denied)
      // Wait for redirect or error page
      await page.waitForTimeout(2000)

      const url = page.url()
      const hasLoginOrError = url.includes('/auth/login') || url.includes('/login') || await page.getByText(/unauthorized|access denied|sign in/i).isVisible()

      expect(hasLoginOrError).toBeTruthy()
    })

    test('should redirect to login when accessing protected portal dashboard', async ({ page }) => {
      await page.goto('/portal/dashboard')

      // Should redirect to portal login or show access denied
      await page.waitForTimeout(2000)

      const url = page.url()
      const hasLoginOrError = url.includes('/portal/login') || await page.getByText(/unauthorized|access denied|sign in/i).isVisible()

      expect(hasLoginOrError).toBeTruthy()
    })
  })

  test.describe('Common Page Routes', () => {
    const publicRoutes = [
      { path: '/', name: 'Landing Page', expectedHeading: /fleet management/i },
      { path: '/auth/login', name: 'Admin Login', expectedHeading: /administration|sign in/i },
      { path: '/portal/login', name: 'Pilot Login', expectedHeading: /pilot portal|crew login/i },
    ]

    for (const route of publicRoutes) {
      test(`should load ${route.name} without 404`, async ({ page }) => {
        await page.goto(route.path)

        // Should NOT show 404
        await expect(page.getByText(/this page could not be found/i)).not.toBeVisible()
        await expect(page.getByText('404')).not.toBeVisible()

        // Should show expected content
        await expect(page.getByRole('heading', { name: route.expectedHeading })).toBeVisible({ timeout: 10000 })
      })
    }
  })
})
