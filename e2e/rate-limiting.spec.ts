/**
 * Rate Limiting E2E Tests
 *
 * Tests for rate limiting functionality on authentication endpoints.
 * Verifies that brute force attacks and account enumeration are prevented.
 */

import { test, expect } from '@playwright/test'

test.describe('Rate Limiting', () => {
  test.describe('Login Endpoint', () => {
    test('should allow up to 5 login attempts per minute', async ({
      request,
    }) => {
      const loginEndpoint = '/api/auth/login'

      // Make 5 login attempts (should all be allowed, though may fail authentication)
      for (let i = 0; i < 5; i++) {
        const response = await request.post(loginEndpoint, {
          data: {
            email: 'test@example.com',
            password: 'wrong-password',
          },
        })

        // Should not be rate limited (200, 401, or other auth error)
        expect(response.status()).not.toBe(429)

        // Should have rate limit headers
        const limit = response.headers()['x-ratelimit-limit']
        const remaining = response.headers()['x-ratelimit-remaining']

        if (limit && remaining) {
          expect(parseInt(limit)).toBe(5)
          expect(parseInt(remaining)).toBe(4 - i)
        }
      }
    })

    test('should block 6th login attempt within a minute', async ({
      request,
    }) => {
      const loginEndpoint = '/api/auth/login'

      // Make 5 allowed attempts
      for (let i = 0; i < 5; i++) {
        await request.post(loginEndpoint, {
          data: {
            email: 'test@example.com',
            password: 'wrong-password',
          },
        })
      }

      // 6th attempt should be rate limited
      const response = await request.post(loginEndpoint, {
        data: {
          email: 'test@example.com',
          password: 'wrong-password',
        },
      })

      // Should return 429 Too Many Requests
      expect(response.status()).toBe(429)

      // Should include Retry-After header
      const retryAfter = response.headers()['retry-after']
      expect(retryAfter).toBeDefined()
      expect(parseInt(retryAfter)).toBeGreaterThan(0)

      // Should include rate limit headers
      expect(response.headers()['x-ratelimit-limit']).toBe('5')
      expect(response.headers()['x-ratelimit-remaining']).toBe('0')

      // Should include error message in body
      const body = await response.json()
      expect(body).toHaveProperty('error')
      expect(body.error).toBe('Too Many Requests')
      expect(body).toHaveProperty('message')
      expect(body.message).toContain('Rate limit exceeded')
    })
  })

  test.describe('General Auth Endpoints', () => {
    test('should allow up to 10 auth requests per minute', async ({
      request,
    }) => {
      const signupEndpoint = '/api/auth/signup'

      // Make 10 signup attempts (should all be allowed)
      for (let i = 0; i < 10; i++) {
        const response = await request.post(signupEndpoint, {
          data: {
            email: `test${i}@example.com`,
            password: 'Password123!',
          },
        })

        // Should not be rate limited
        expect(response.status()).not.toBe(429)
      }
    })

    test('should block 11th auth request within a minute', async ({
      request,
    }) => {
      const signupEndpoint = '/api/auth/signup'

      // Make 10 allowed attempts
      for (let i = 0; i < 10; i++) {
        await request.post(signupEndpoint, {
          data: {
            email: `test${i}@example.com`,
            password: 'Password123!',
          },
        })
      }

      // 11th attempt should be rate limited
      const response = await request.post(signupEndpoint, {
        data: {
          email: 'test11@example.com',
          password: 'Password123!',
        },
      })

      expect(response.status()).toBe(429)
    })
  })

  test.describe('Password Reset Endpoint', () => {
    test('should allow up to 3 password reset requests per hour', async ({
      request,
    }) => {
      const resetEndpoint = '/api/auth/password-reset'

      // Make 3 password reset attempts (should all be allowed)
      for (let i = 0; i < 3; i++) {
        const response = await request.post(resetEndpoint, {
          data: {
            email: 'test@example.com',
          },
        })

        // Should not be rate limited
        expect(response.status()).not.toBe(429)
      }
    })

    test('should block 4th password reset request within an hour', async ({
      request,
    }) => {
      const resetEndpoint = '/api/auth/password-reset'

      // Make 3 allowed attempts
      for (let i = 0; i < 3; i++) {
        await request.post(resetEndpoint, {
          data: {
            email: 'test@example.com',
          },
        })
      }

      // 4th attempt should be rate limited
      const response = await request.post(resetEndpoint, {
        data: {
          email: 'test@example.com',
        },
      })

      expect(response.status()).toBe(429)

      // Should include longer retry-after (since window is 1 hour)
      const retryAfter = response.headers()['retry-after']
      expect(retryAfter).toBeDefined()
      // Should be close to 3600 seconds (1 hour)
      expect(parseInt(retryAfter)).toBeGreaterThan(3500)
    })
  })

  test.describe('Rate Limit Headers', () => {
    test('should include rate limit information in response headers', async ({
      request,
    }) => {
      const loginEndpoint = '/api/auth/login'

      const response = await request.post(loginEndpoint, {
        data: {
          email: 'test@example.com',
          password: 'test-password',
        },
      })

      // Check for rate limit headers
      const headers = response.headers()

      // These headers should be present on auth endpoints
      if (response.status() !== 429) {
        expect(headers['x-ratelimit-limit']).toBeDefined()
        expect(headers['x-ratelimit-remaining']).toBeDefined()
        expect(headers['x-ratelimit-reset']).toBeDefined()
      }
    })

    test('should show decreasing remaining count', async ({ request }) => {
      const loginEndpoint = '/api/auth/login'

      // First request
      const response1 = await request.post(loginEndpoint, {
        data: {
          email: 'test@example.com',
          password: 'test-password',
        },
      })

      const remaining1 = parseInt(
        response1.headers()['x-ratelimit-remaining'] || '0'
      )

      // Second request
      const response2 = await request.post(loginEndpoint, {
        data: {
          email: 'test@example.com',
          password: 'test-password',
        },
      })

      const remaining2 = parseInt(
        response2.headers()['x-ratelimit-remaining'] || '0'
      )

      // Remaining count should decrease
      if (remaining1 > 0 && remaining2 >= 0) {
        expect(remaining2).toBeLessThan(remaining1)
      }
    })
  })

  test.describe('IP-based Tracking', () => {
    test('should track rate limits per IP address', async ({
      request,
      context,
    }) => {
      // Note: This test demonstrates the concept, but may not work
      // perfectly in all Playwright configurations since changing
      // IP addresses programmatically is complex

      const loginEndpoint = '/api/auth/login'

      // Make requests from first "IP" (default)
      for (let i = 0; i < 5; i++) {
        await request.post(loginEndpoint, {
          data: {
            email: 'test1@example.com',
            password: 'test-password',
          },
        })
      }

      // Create new context with different headers (simulating different IP)
      const newContext = await context.browser()?.newContext({
        extraHTTPHeaders: {
          'X-Forwarded-For': '203.0.113.1',
        },
      })

      if (newContext) {
        // Requests from new "IP" should not be rate limited
        const response = await newContext.request.post(loginEndpoint, {
          data: {
            email: 'test2@example.com',
            password: 'test-password',
          },
        })

        // Should not be rate limited (different IP)
        expect(response.status()).not.toBe(429)

        await newContext.close()
      }
    })
  })
})
