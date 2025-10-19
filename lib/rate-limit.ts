/**
 * Rate Limiting Module using Upstash Redis
 *
 * Provides distributed rate limiting for Server Actions to prevent spam and DoS attacks.
 *
 * Rate Limits:
 * - Feedback Submissions: 5 per minute
 * - Leave Requests: 3 per minute
 * - Flight Requests: 3 per minute
 * - Feedback Votes: 30 per minute
 * - Login Attempts: 5 per minute
 * - Authentication: 10 per minute
 * - Password Reset: 3 per hour
 *
 * @see https://upstash.com/docs/redis/features/ratelimit
 */

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

// ============================================================================
// RATE LIMITERS FOR SERVER ACTIONS
// ============================================================================

/**
 * Feedback submissions: 5 per minute
 * Prevents spam feedback posts
 */
export const feedbackRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '60 s'),
      analytics: true,
      prefix: 'ratelimit:feedback',
    })
  : createMockRateLimiter()

/**
 * Leave requests: 3 per minute
 * Prevents abuse of leave request system
 */
export const leaveRequestRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '60 s'),
      analytics: true,
      prefix: 'ratelimit:leave',
    })
  : createMockRateLimiter()

/**
 * Flight requests: 3 per minute
 * Prevents spam flight requests
 */
export const flightRequestRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '60 s'),
      analytics: true,
      prefix: 'ratelimit:flight',
    })
  : createMockRateLimiter()

/**
 * Votes: 30 per minute
 * Allows higher frequency for reading/voting actions
 */
export const voteRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '60 s'),
      analytics: true,
      prefix: 'ratelimit:vote',
    })
  : createMockRateLimiter()

// ============================================================================
// RATE LIMITERS FOR AUTHENTICATION
// ============================================================================

/**
 * Login Rate Limiter
 * Limit: 5 attempts per minute per IP
 * Prevents: Brute force password attacks
 */
export const loginRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '60 s'),
      analytics: true,
      prefix: 'ratelimit:login',
    })
  : createMockRateLimiter()

/**
 * Authentication Rate Limiter (General)
 * Limit: 10 attempts per minute per IP
 * Prevents: Account enumeration, signup abuse
 */
export const authRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '60 s'),
      analytics: true,
      prefix: 'ratelimit:auth',
    })
  : createMockRateLimiter()

/**
 * Password Reset Rate Limiter
 * Limit: 3 attempts per hour per IP
 * Prevents: Email flooding, abuse of password reset
 */
export const passwordResetRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '3600 s'),
      analytics: true,
      prefix: 'ratelimit:password-reset',
    })
  : createMockRateLimiter()

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  error?: string
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format rate limit error message with reset time
 */
export function formatRateLimitError(resetTimestamp: number): string {
  const resetDate = new Date(resetTimestamp)
  const now = new Date()
  const secondsUntilReset = Math.ceil((resetDate.getTime() - now.getTime()) / 1000)

  if (secondsUntilReset <= 60) {
    return `Too many requests. Please wait ${secondsUntilReset} seconds before trying again.`
  }

  const minutesUntilReset = Math.ceil(secondsUntilReset / 60)
  return `Too many requests. Please wait ${minutesUntilReset} minute${minutesUntilReset > 1 ? 's' : ''} before trying again.`
}

/**
 * Extract IP address from Next.js request
 * Handles proxies and load balancers (x-forwarded-for, x-real-ip)
 *
 * @param request - Next.js request object
 * @returns IP address string or 'unknown' if not found
 */
export function getClientIp(request: Request | { headers: Headers }): string {
  const headers = request.headers

  // Check common proxy headers
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }

  // Fallback to other headers
  const cfConnectingIp = headers.get('cf-connecting-ip') // Cloudflare
  if (cfConnectingIp) {
    return cfConnectingIp.trim()
  }

  // If no IP found, return 'unknown' (should not happen in production)
  return 'unknown'
}

/**
 * Create standardized rate limit exceeded response
 * Returns 429 with Retry-After header
 *
 * @param retryAfter - Seconds until rate limit resets
 * @param limit - Maximum number of requests allowed
 * @param reset - Unix timestamp when limit resets
 * @returns Response object with 429 status
 */
export function createRateLimitResponse(
  retryAfter: number,
  limit: number,
  reset: number
): Response {
  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      limit,
      reset,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': reset.toString(),
      },
    }
  )
}
