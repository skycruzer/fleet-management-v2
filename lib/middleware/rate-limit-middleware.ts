/**
 * Rate Limiting Middleware for API Routes
 *
 * Developer: Maurice Rondeau
 *
 * Protects mutation endpoints from abuse using Upstash Redis
 *
 * Usage:
 * import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'
 *
 * export const POST = withRateLimit(async (request) => {
 *   // Your handler logic
 * })
 *
 * @version 2.0.0
 * @updated 2025-10-27 - Added developer attribution, fixed env variable names
 */

import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ============================================================================
// REDIS CLIENT CONFIGURATION
// ============================================================================

/**
 * Check if Redis credentials are configured
 */
const isRedisConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN

/**
 * Initialize Redis client with environment variables
 * Returns null if credentials are not configured (development mode)
 */
const redis = isRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

// ============================================================================
// MOCK RATE LIMITER (Development Mode)
// ============================================================================

/**
 * Type for rate limiter (real or mock)
 */
type RateLimiter = Ratelimit | ReturnType<typeof createMockRateLimiter>

/**
 * Mock rate limiter that always returns success
 * Used when Redis is not configured (development mode)
 */
const createMockRateLimiter = () => ({
  limit: async () => ({
    success: true,
    limit: 999,
    remaining: 999,
    reset: Date.now() + 60000,
    pending: Promise.resolve(),
  }),
})

// Rate limiters for different endpoint types
export const readRateLimit: RateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
      analytics: true,
    })
  : createMockRateLimiter()

export const mutationRateLimit: RateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1 m'), // 20 requests per minute
      analytics: true,
    })
  : createMockRateLimiter()

export const authRateLimit: RateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 attempts per minute
      analytics: true,
    })
  : createMockRateLimiter()

/**
 * Rate limit configuration for different HTTP methods
 */
const rateLimitByMethod: Record<string, RateLimiter> = {
  GET: readRateLimit,
  POST: mutationRateLimit,
  PUT: mutationRateLimit,
  PATCH: mutationRateLimit,
  DELETE: mutationRateLimit,
}

/**
 * Extract identifier from request (IP address or user ID)
 */
function getIdentifier(request: NextRequest): string {
  // Try to get IP from headers
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip')

  return ip || 'anonymous'
}

/**
 * Higher-order function to wrap API route handlers with rate limiting
 *
 * @param handler - The API route handler function
 * @param customLimit - Optional custom rate limiter
 * @returns Rate-limited handler
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  customLimit?: RateLimiter
) {
  return async (request: NextRequest) => {
    try {
      // Get rate limiter based on HTTP method or use custom
      const limiter = customLimit || rateLimitByMethod[request.method] || readRateLimit

      // Get identifier (IP or user)
      const identifier = getIdentifier(request)

      // Check rate limit
      const { success, limit, reset, remaining } = await limiter.limit(identifier)

      // Add rate limit headers to response
      const headers = {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': new Date(reset).toISOString(),
      }

      // If rate limit exceeded, return 429
      if (!success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Too many requests',
            message: 'Too many requests. Please try again later.',
            code: 429,
          },
          {
            status: 429,
            headers: {
              ...headers,
              'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
            },
          }
        )
      }

      // Rate limit OK, proceed with handler
      const response = await handler(request)

      // Add rate limit headers to successful response
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value)
      })

      return response
    } catch (error) {
      // If rate limiting fails (e.g., Redis down), log error but allow request
      console.error('Rate limiting error:', error)

      // Proceed with handler (fail open)
      return handler(request)
    }
  }
}

/**
 * Rate limit specifically for authentication endpoints
 */
export function withAuthRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return withRateLimit(handler, authRateLimit)
}

/**
 * Rate limit for high-sensitivity mutation endpoints
 */
export function withStrictRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  const strictLimit = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
        analytics: true,
      })
    : createMockRateLimiter()

  return withRateLimit(handler, strictLimit)
}
