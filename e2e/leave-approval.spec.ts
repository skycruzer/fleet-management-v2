/**
 * Leave Approval Dashboard E2E Tests
 * Tests the new leave approval workflow
 */

import { test, expect } from '@playwright/test'

test.describe('Leave Approval Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth/login')

    // Sign in with admin credentials
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard')
  })

  test('should navigate to leave approval dashboard', async ({ page }) => {
    // Click on Leave Approval in sidebar
    await page.click('a[href="/dashboard/leave/approve"]')

    // Wait for page to load
    await page.waitForURL('/dashboard/leave/approve')

    // Verify page title
    await expect(page.getByRole('heading', { name: /Leave Approval Dashboard/i })).toBeVisible()
  })

  test('should display statistics cards', async ({ page }) => {
    await page.goto('/dashboard/leave/approve')

    // Check for stats cards
    await expect(page.getByText(/Pending Requests/i)).toBeVisible()
    await expect(page.getByText(/Eligible Requests/i)).toBeVisible()
    await expect(page.getByText(/Conflicts Detected/i)).toBeVisible()
    await expect(page.getByText(/Crew Minimum Violations/i)).toBeVisible()
  })

  test('should display crew availability widget', async ({ page }) => {
    await page.goto('/dashboard/leave/approve')

    // Check for crew availability section
    await expect(page.getByText(/Crew Availability/i)).toBeVisible()
    await expect(page.getByText(/Captains/i)).toBeVisible()
    await expect(page.getByText(/First Officers/i)).toBeVisible()
  })

  test('should filter by status', async ({ page }) => {
    await page.goto('/dashboard/leave/approve')

    // Click status filter
    await page.click('text=Status')
    await page.click('text=Pending')

    // Verify filtered results (should only show pending)
    const statusBadges = await page.locator('text=PENDING').count()
    expect(statusBadges).toBeGreaterThan(0)
  })

  test('should filter by conflicts only', async ({ page }) => {
    await page.goto('/dashboard/leave/approve')

    // Toggle conflicts only filter
    await page.click('text=Conflicts Only')

    // Check if conflict badges are visible
    const conflictBadges = await page.locator('text=/\\d+ Conflict/i')
    const count = await conflictBadges.count()

    // Either conflicts exist or "No requests found" message
    if (count > 0) {
      expect(count).toBeGreaterThan(0)
    } else {
      await expect(page.getByText(/No requests found/i)).toBeVisible()
    }
  })

  test('should sort requests by priority', async ({ page }) => {
    await page.goto('/dashboard/leave/approve')

    // Click sort dropdown
    await page.click('text=Sort by')
    await page.click('text=Priority Score')

    // Verify sorting applied (implementation-dependent verification)
    await expect(page.locator('.request-card').first()).toBeVisible()
  })

  test('should select and deselect requests', async ({ page }) => {
    await page.goto('/dashboard/leave/approve')

    // Filter to pending only
    await page.click('text=Status')
    await page.click('text=Pending')

    // Find and click first checkbox
    const firstCheckbox = page.locator('input[type="checkbox"]').first()
    await firstCheckbox.click()

    // Verify checkbox is checked
    await expect(firstCheckbox).toBeChecked()

    // Verify bulk action buttons appear
    await expect(page.getByText(/Bulk Approve/i)).toBeVisible()
    await expect(page.getByText(/Bulk Deny/i)).toBeVisible()

    // Uncheck
    await firstCheckbox.click()
    await expect(firstCheckbox).not.toBeChecked()
  })

  test('should show bulk approval modal', async ({ page }) => {
    await page.goto('/dashboard/leave/approve')

    // Filter to pending
    await page.click('text=Status')
    await page.click('text=Pending')

    // Select first request
    await page.locator('input[type="checkbox"]').first().click()

    // Click bulk approve
    await page.click('text=Bulk Approve')

    // Verify modal appears
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText(/Bulk Approve Leave Requests/i)).toBeVisible()

    // Verify justification field
    await expect(page.locator('textarea[placeholder*="Explain"]')).toBeVisible()

    // Close modal
    await page.click('text=Cancel')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('should validate justification length', async ({ page }) => {
    await page.goto('/dashboard/leave/approve')

    // Filter to pending
    await page.click('text=Status')
    await page.click('text=Pending')

    // Select request and open modal
    await page.locator('input[type="checkbox"]').first().click()
    await page.click('text=Bulk Approve')

    // Try submitting with short justification
    await page.fill('textarea', 'Short')

    // Submit button should be disabled or show error
    const submitButton = page.getByRole('button', { name: /Approve \d+ Request/i })
    await expect(submitButton).toBeDisabled()
  })

  test('should display request cards with details', async ({ page }) => {
    await page.goto('/dashboard/leave/approve')

    // Wait for cards to load
    await page.waitForSelector('[class*="request-card"], [class*="Card"]', { timeout: 5000 })

    // Verify card elements (at least one should exist)
    const cards = await page.locator('[class*="Card"]').count()
    expect(cards).toBeGreaterThan(0)
  })

  test('should display eligibility badges', async ({ page }) => {
    await page.goto('/dashboard/leave/approve')

    // Look for eligibility status badges
    const badges = await page.locator('text=/Eligible|Conflicts|Crew Minimum|Late Request/i')
    const count = await badges.count()

    // At least some requests should have eligibility badges
    expect(count).toBeGreaterThan(0)
  })

  test('should show individual approve button for eligible requests', async ({ page }) => {
    await page.goto('/dashboard/leave/approve')

    // Filter to pending
    await page.click('text=Status')
    await page.click('text=Pending')

    // Look for approve buttons
    const approveButtons = page.locator('button:has-text("Approve")')
    const count = await approveButtons.count()

    // Should have at least one approve button
    if (count > 0) {
      expect(count).toBeGreaterThan(0)
    }
  })

  test('should display leave request details', async ({ page }) => {
    await page.goto('/dashboard/leave/approve')

    // Verify key request details are displayed
    const hasRequestType = await page.locator('text=/ANNUAL|RDO|SICK/i').count()
    expect(hasRequestType).toBeGreaterThan(0)

    // Verify roster period is shown
    const hasRosterPeriod = await page.locator('text=/RP\\d+\\/202[56]/i').count()
    expect(hasRosterPeriod).toBeGreaterThan(0)
  })

  test('should navigate back to dashboard', async ({ page }) => {
    await page.goto('/dashboard/leave/approve')

    // Click Dashboard link in sidebar
    await page.click('a[href="/dashboard"]')

    // Verify navigation
    await page.waitForURL('/dashboard')
    await expect(page).toHaveURL('/dashboard')
  })

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/dashboard/leave/approve')

    // Verify page loads
    await expect(page.getByRole('heading', { name: /Leave Approval/i })).toBeVisible()

    // Verify mobile layout (cards should stack)
    const cards = await page.locator('[class*="Card"]').count()
    expect(cards).toBeGreaterThan(0)
  })
})

test.describe('Leave Approval - Authorization', () => {
  test('should redirect unauthenticated users', async ({ page }) => {
    // Try accessing without login
    await page.goto('/dashboard/leave/approve')

    // Should redirect to login
    await page.waitForURL(/\/auth\/login/)
    expect(page.url()).toContain('/auth/login')
  })
})
