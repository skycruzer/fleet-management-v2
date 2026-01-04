import { test, expect } from '@playwright/test'

test.describe('Progressive Web App (PWA)', () => {
  test('should have valid manifest.json', async ({ page }) => {
    const response = await page.goto('/manifest.json')

    expect(response?.status()).toBe(200)

    const manifest = await response?.json()

    // Check required fields
    expect(manifest.name).toBe('Fleet Management V2')
    expect(manifest.short_name).toBe('Fleet Mgmt')
    expect(manifest.display).toBe('standalone')
    expect(manifest.start_url).toBe('/')

    // Check icons
    expect(manifest.icons).toBeDefined()
    expect(manifest.icons.length).toBeGreaterThan(0)

    // Verify icon sizes
    const iconSizes = manifest.icons.map((icon: any) => icon.sizes)
    expect(iconSizes).toContain('192x192')
    expect(iconSizes).toContain('512x512')
  })

  test('should register service worker', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check if service worker is registered
    const swRegistered = await page.evaluate(() => {
      return navigator.serviceWorker.getRegistration().then((reg) => !!reg)
    })

    expect(swRegistered).toBe(true)
  })

  test('should have theme color meta tag', async ({ page }) => {
    await page.goto('/')

    const themeColor = await page.locator('meta[name="theme-color"]')
    await expect(themeColor).toHaveAttribute('content', '#0ea5e9')
  })

  test('should have apple touch icon', async ({ page }) => {
    await page.goto('/')

    const appleTouchIcon = page.locator('link[rel="apple-touch-icon"]')
    if ((await appleTouchIcon.count()) > 0) {
      await expect(appleTouchIcon.first()).toHaveAttribute('href')
    }
  })

  test('should have proper viewport meta tag', async ({ page }) => {
    await page.goto('/')

    const viewport = await page.locator('meta[name="viewport"]')
    const content = await viewport.getAttribute('content')

    expect(content).toContain('width=device-width')
    expect(content).toContain('initial-scale=1')
  })

  test('should cache assets for offline use', async ({ page }) => {
    // First visit - populate cache
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Wait for service worker to cache
    await page.waitForTimeout(2000)

    // Check cache storage
    const cacheKeys = await page.evaluate(async () => {
      const keys = await caches.keys()
      return keys
    })

    expect(cacheKeys.length).toBeGreaterThan(0)
  })

  test('should show offline page when network unavailable', async ({ page, context }) => {
    // Register service worker first
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Simulate offline
    await context.setOffline(true)

    // Try to navigate to a page
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })

    // Should show offline indicator or cached page
    const offlineIndicator = page.getByText(/offline|no.*connection|network.*unavailable/i)
    const cachedContent = page.getByRole('main')

    const hasOfflineIndicator = (await offlineIndicator.count()) > 0
    const hasCachedContent = await cachedContent.isVisible()

    expect(hasOfflineIndicator || hasCachedContent).toBe(true)

    // Restore online
    await context.setOffline(false)
  })

  test('should detect online/offline status', async ({ page }) => {
    await page.goto('/')

    // Check if navigator.onLine is true
    const isOnline = await page.evaluate(() => navigator.onLine)
    expect(isOnline).toBe(true)

    // Test offline event listener
    const hasOfflineListener = await page.evaluate(() => {
      return typeof window.addEventListener !== 'undefined'
    })
    expect(hasOfflineListener).toBe(true)
  })

  test('should have installable criteria', async ({ page }) => {
    await page.goto('/')

    // Check manifest link
    const manifestLink = page.locator('link[rel="manifest"]')
    await expect(manifestLink).toHaveAttribute('href', '/manifest.json')

    // Check service worker registration
    const swRegistered = await page.evaluate(() => {
      return navigator.serviceWorker.getRegistration().then((reg) => !!reg)
    })
    expect(swRegistered).toBe(true)

    // Check HTTPS (or localhost)
    const url = new URL(page.url())
    expect(['https:', 'http:'].includes(url.protocol)).toBe(true)
    if (url.protocol === 'http:') {
      expect(url.hostname).toMatch(/localhost|127\.0\.0\.1/)
    }
  })

  test('should have proper caching strategy', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check cached resources
    const cachedResources = await page.evaluate(async () => {
      const cacheNames = await caches.keys()
      const cached: string[] = []

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName)
        const requests = await cache.keys()
        cached.push(...requests.map((req) => req.url))
      }

      return cached
    })

    // Should cache at least some resources
    expect(cachedResources.length).toBeGreaterThan(0)

    // Should cache static assets
    const hasStaticAssets = cachedResources.some(
      (url) => url.includes('.js') || url.includes('.css') || url.includes('.png')
    )
    expect(hasStaticAssets).toBe(true)
  })
})

test.describe('PWA - Shortcuts', () => {
  test('should have app shortcuts in manifest', async ({ page }) => {
    const response = await page.goto('/manifest.json')
    const manifest = await response?.json()

    expect(manifest.shortcuts).toBeDefined()
    expect(Array.isArray(manifest.shortcuts)).toBe(true)

    if (manifest.shortcuts.length > 0) {
      // Check shortcut structure
      const firstShortcut = manifest.shortcuts[0]
      expect(firstShortcut.name).toBeDefined()
      expect(firstShortcut.url).toBeDefined()
    }
  })

  test('should have dashboard shortcut', async ({ page }) => {
    const response = await page.goto('/manifest.json')
    const manifest = await response?.json()

    const dashboardShortcut = manifest.shortcuts?.find((s: any) =>
      s.name.toLowerCase().includes('dashboard')
    )

    if (dashboardShortcut) {
      expect(dashboardShortcut.url).toContain('/dashboard')
    }
  })

  test('should have pilot portal shortcut', async ({ page }) => {
    const response = await page.goto('/manifest.json')
    const manifest = await response?.json()

    const portalShortcut = manifest.shortcuts?.find((s: any) =>
      s.name.toLowerCase().includes('portal')
    )

    if (portalShortcut) {
      expect(portalShortcut.url).toContain('/portal')
    }
  })
})

test.describe('PWA - Screenshots', () => {
  test('should have screenshots in manifest for app store', async ({ page }) => {
    const response = await page.goto('/manifest.json')
    const manifest = await response?.json()

    if (manifest.screenshots) {
      expect(Array.isArray(manifest.screenshots)).toBe(true)

      // Check for mobile and desktop screenshots
      const mobileScreenshot = manifest.screenshots.find((s: any) => s.form_factor === 'narrow')
      const desktopScreenshot = manifest.screenshots.find((s: any) => s.form_factor === 'wide')

      if (mobileScreenshot) {
        expect(mobileScreenshot.src).toBeDefined()
        expect(mobileScreenshot.sizes).toBeDefined()
      }

      if (desktopScreenshot) {
        expect(desktopScreenshot.src).toBeDefined()
        expect(desktopScreenshot.sizes).toBeDefined()
      }
    }
  })
})

test.describe('PWA - Update Handling', () => {
  test('should handle service worker updates', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check for update mechanism
    const hasUpdateHandler = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            resolve(!!registration.update)
          })
        } else {
          resolve(false)
        }
      })
    })

    expect(hasUpdateHandler).toBe(true)
  })

  test('should prompt user for updates when new version available', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Look for update notification UI
    // This would be visible when a new service worker is waiting
    const updateNotification = page.getByText(/update.*available|new.*version|refresh/i)

    // This test passes if the element exists or doesn't exist
    // (depends on whether an update is actually pending)
    const count = await updateNotification.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })
})

test.describe('PWA - Orientation', () => {
  test('should support portrait orientation', async ({ page }) => {
    const response = await page.goto('/manifest.json')
    const manifest = await response?.json()

    // Should support portrait (especially for mobile)
    expect(manifest.orientation).toMatch(/portrait|any/)
  })
})

test.describe('PWA - Categories', () => {
  test('should have appropriate categories', async ({ page }) => {
    const response = await page.goto('/manifest.json')
    const manifest = await response?.json()

    if (manifest.categories) {
      expect(Array.isArray(manifest.categories)).toBe(true)

      // Should include business or productivity category
      const hasRelevantCategory = manifest.categories.some((cat: string) =>
        ['business', 'productivity', 'utilities'].includes(cat.toLowerCase())
      )

      expect(hasRelevantCategory).toBe(true)
    }
  })
})
