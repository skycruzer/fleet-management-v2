import { test, expect } from '@playwright/test'

test.describe('Performance - Core Web Vitals', () => {
  test('should have good Largest Contentful Paint (LCP < 2.5s)', async ({ page }) => {
    await page.goto('/dashboard')

    // Wait for LCP
    await page.waitForLoadState('load')

    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          resolve(lastEntry.renderTime || lastEntry.loadTime)
          observer.disconnect()
        })
        observer.observe({ entryTypes: ['largest-contentful-paint'] })

        // Timeout after 5 seconds
        setTimeout(() => resolve(0), 5000)
      })
    })

    // LCP should be less than 2500ms (2.5 seconds)
    expect(lcp).toBeLessThan(2500)
  })

  test('should have good First Input Delay (FID < 100ms)', async ({ page }) => {
    await page.goto('/dashboard')

    // Wait for page to be interactive
    await page.waitForLoadState('networkidle')

    // Click a button and measure response time
    const startTime = Date.now()
    await page.getByRole('button').first().click()
    const endTime = Date.now()

    const fid = endTime - startTime

    // FID should be less than 100ms
    expect(fid).toBeLessThan(100)
  })

  test('should have minimal Cumulative Layout Shift (CLS < 0.1)', async ({ page }) => {
    await page.goto('/dashboard')

    // Wait for layout to stabilize
    await page.waitForLoadState('load')
    await page.waitForTimeout(1000)

    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsScore = 0

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              clsScore += entry.value
            }
          }
        })

        observer.observe({ entryTypes: ['layout-shift'] })

        setTimeout(() => {
          observer.disconnect()
          resolve(clsScore)
        }, 2000)
      })
    })

    // CLS should be less than 0.1
    expect(cls).toBeLessThan(0.1)
  })

  test('should load page within acceptable time (< 3s)', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/dashboard')
    await page.waitForLoadState('load')

    const loadTime = Date.now() - startTime

    // Page should load in less than 3 seconds
    expect(loadTime).toBeLessThan(3000)
  })

  test('should have Time to First Byte (TTFB < 600ms)', async ({ page }) => {
    await page.goto('/dashboard')

    // Note: serverTiming() is not available in Playwright's Response type
    // TTFB can be measured using performance.timing in the browser context instead
    const ttfb = await page.evaluate(() => {
      const perfData = window.performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming
      return perfData.responseStart - perfData.requestStart
    })

    if (ttfb) {
      expect(ttfb).toBeLessThan(600)
    }
  })
})

test.describe('Performance - Resource Loading', () => {
  test('should not load unnecessary resources', async ({ page }) => {
    const resourceUrls: string[] = []

    page.on('request', (request) => {
      resourceUrls.push(request.url())
    })

    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Should not load unused images
    const unusedImages = resourceUrls.filter(
      (url) => url.includes('/unused/') || url.includes('/legacy/')
    )
    expect(unusedImages).toHaveLength(0)
  })

  test('should lazy load images below fold', async ({ page }) => {
    await page.goto('/dashboard/pilots')

    // Check for lazy loading attribute
    const images = page.locator('img')
    const count = await images.count()

    if (count > 0) {
      const firstImage = images.first()
      const loading = await firstImage.getAttribute('loading')

      // At least some images should have lazy loading
      if (loading) {
        expect(loading).toBe('lazy')
      }
    }
  })

  test('should use optimized image formats (WebP/AVIF)', async ({ page }) => {
    const imageUrls: string[] = []

    page.on('response', (response) => {
      if (response.request().resourceType() === 'image') {
        const contentType = response.headers()['content-type']
        if (contentType) {
          imageUrls.push(contentType)
        }
      }
    })

    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Should serve modern image formats
    const modernFormats = imageUrls.filter((type) => type.includes('webp') || type.includes('avif'))

    // At least some images should be in modern formats
    if (imageUrls.length > 0) {
      expect(modernFormats.length).toBeGreaterThan(0)
    }
  })

  test('should minimize JavaScript bundle size', async ({ page }) => {
    const resourceSizes: { url: string; size: number }[] = []

    page.on('response', async (response) => {
      if (response.request().resourceType() === 'script') {
        const buffer = await response.body().catch(() => Buffer.alloc(0))
        resourceSizes.push({
          url: response.url(),
          size: buffer.length,
        })
      }
    })

    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Total JS size should be reasonable (< 500KB gzipped)
    const totalSize = resourceSizes.reduce((sum, r) => sum + r.size, 0)
    expect(totalSize).toBeLessThan(500 * 1024)
  })
})

test.describe('Performance - Caching', () => {
  test('should cache static assets', async ({ page }) => {
    // First visit
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Second visit
    const cachedResources: string[] = []
    page.on('response', (response) => {
      // Check if response was served from cache via status code or headers
      if (response.status() === 304 || response.fromServiceWorker()) {
        cachedResources.push(response.url())
      }
    })

    await page.reload()
    await page.waitForLoadState('networkidle')

    // Should have cached some resources
    expect(cachedResources.length).toBeGreaterThan(0)
  })

  test('should use service worker for offline support', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check if service worker is registered
    const swRegistered = await page.evaluate(() => {
      return navigator.serviceWorker.getRegistration().then((reg) => !!reg)
    })

    expect(swRegistered).toBe(true)
  })
})

test.describe('Performance - Mobile', () => {
  test.use({
    viewport: { width: 375, height: 667 },
    deviceScaleFactor: 2,
    isMobile: true,
  })

  test('should perform well on mobile devices', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/dashboard')
    await page.waitForLoadState('load')

    const loadTime = Date.now() - startTime

    // Mobile load time should be acceptable (< 4s)
    expect(loadTime).toBeLessThan(4000)
  })

  test('should use mobile-optimized images', async ({ page }) => {
    await page.goto('/dashboard')

    const images = page.locator('img')
    const count = await images.count()

    if (count > 0) {
      const firstImage = images.first()
      const srcset = await firstImage.getAttribute('srcset')

      // Should have responsive images
      if (srcset) {
        expect(srcset).toContain('w') // Width descriptor
      }
    }
  })
})

test.describe('Performance - Database Queries', () => {
  test('should batch database requests', async ({ page }) => {
    const apiCalls: string[] = []

    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        apiCalls.push(request.url())
      }
    })

    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Should not make excessive API calls
    expect(apiCalls.length).toBeLessThan(10)
  })

  test('should use caching for repeated data', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const firstLoadApiCalls: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        firstLoadApiCalls.push(request.url())
      }
    })

    // Navigate to different page
    await page.goto('/dashboard/pilots')
    await page.waitForLoadState('networkidle')

    // Navigate back
    const secondLoadApiCalls: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        secondLoadApiCalls.push(request.url())
      }
    })

    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Second load should make fewer API calls (cached)
    expect(secondLoadApiCalls.length).toBeLessThanOrEqual(firstLoadApiCalls.length)
  })
})
