/**
 * Rate Limiting Utility
 *
 * Implements sliding window rate limiting to prevent brute force attacks
 * and account enumeration on authentication endpoints.
 *
 * Current Implementation: In-memory (development/small-scale)
 * Production Upgrade: Replace with @upstash/ratelimit for distributed rate limiting
 *
 * @see https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
 */

interface RateLimitEntry {
  count: number
  resetAt: number
  requests: number[]
}

/**
 * Simple in-memory rate limiter using sliding window algorithm
 *
 * WARNING: This implementation uses in-memory storage and will not work
 * across multiple server instances. For production deployments with multiple
 * instances, use @upstash/ratelimit or a similar distributed solution.
 */
class InMemoryRateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private readonly windowMs: number
  private readonly maxRequests: number
  private readonly cleanupInterval: NodeJS.Timeout

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs

    // Cleanup expired entries every 60 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  /**
   * Check if a request should be rate limited
   * @param identifier - Unique identifier (IP address, user ID, etc.)
   * @returns Object with success status and rate limit info
   */
  async limit(identifier: string): Promise<{
    success: boolean
    limit: number
    remaining: number
    reset: number
    retryAfter?: number
  }> {
    const now = Date.now()
    const entry = this.store.get(identifier) || {
      count: 0,
      resetAt: now + this.windowMs,
      requests: [],
    }

    // Remove requests outside the sliding window
    entry.requests = entry.requests.filter(
      (timestamp) => timestamp > now - this.windowMs
    )

    // Check if limit exceeded
    const isAllowed = entry.requests.length < this.maxRequests

    if (isAllowed) {
      entry.requests.push(now)
      entry.count = entry.requests.length
      this.store.set(identifier, entry)
    }

    const reset = Math.ceil((now + this.windowMs) / 1000)
    const remaining = Math.max(0, this.maxRequests - entry.requests.length)

    return {
      success: isAllowed,
      limit: this.maxRequests,
      remaining,
      reset,
      retryAfter: isAllowed ? undefined : Math.ceil(this.windowMs / 1000),
    }
  }

  /**
   * Reset rate limit for a specific identifier
   * @param identifier - Unique identifier to reset
   */
  reset(identifier: string): void {
    this.store.delete(identifier)
  }

  /**
   * Clean up expired entries from memory
   */
  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    this.store.forEach((entry, key) => {
      if (entry.resetAt < now && entry.requests.length === 0) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach((key) => this.store.delete(key))
  }

  /**
   * Destroy the rate limiter and cleanup interval
   */
  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.store.clear()
  }
}

// ============================================================================
// Rate Limiter Instances
// ============================================================================

/**
 * Login Rate Limiter
 * Limit: 5 attempts per minute per IP
 * Prevents: Brute force password attacks
 */
export const loginRateLimit = new InMemoryRateLimiter(
  5, // Max 5 requests
  60 * 1000 // Per 1 minute (60 seconds)
)

/**
 * Authentication Rate Limiter (General)
 * Limit: 10 attempts per minute per IP
 * Prevents: Account enumeration, signup abuse
 */
export const authRateLimit = new InMemoryRateLimiter(
  10, // Max 10 requests
  60 * 1000 // Per 1 minute (60 seconds)
)

/**
 * Password Reset Rate Limiter
 * Limit: 3 attempts per hour per IP
 * Prevents: Email flooding, abuse of password reset
 */
export const passwordResetRateLimit = new InMemoryRateLimiter(
  3, // Max 3 requests
  60 * 60 * 1000 // Per 1 hour (3600 seconds)
)

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract IP address from Next.js request
 * Handles proxies and load balancers (x-forwarded-for, x-real-ip)
 *
 * @param request - Next.js request object
 * @returns IP address string or 'unknown' if not found
 */
export function getClientIp(
  request: Request | { headers: Headers }
): string {
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

// ============================================================================
// Production Upgrade Path (commented for future use)
// ============================================================================

/*
// To upgrade to distributed rate limiting using Upstash Redis:
//
// 1. Install dependencies:
//    npm install @upstash/ratelimit @upstash/redis
//
// 2. Add environment variables to .env.local:
//    UPSTASH_REDIS_REST_URL=your-redis-url
//    UPSTASH_REDIS_REST_TOKEN=your-redis-token
//
// 3. Replace the implementation:

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const loginRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: 'ratelimit:login',
})

export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'ratelimit:auth',
})

export const passwordResetRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  analytics: true,
  prefix: 'ratelimit:password-reset',
})

// Note: Upstash Ratelimit returns { success, limit, remaining, reset }
// which matches our interface, making the upgrade seamless.
*/
