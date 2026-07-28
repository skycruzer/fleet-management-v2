/**
 * Rate Limiting Module using Upstash Redis
 *
 * Developer: Maurice Rondeau
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
 * @version 2.0.0
 * @updated 2025-10-27 - Added developer attribution
 * @see https://upstash.com/docs/redis/features/ratelimit
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { selectFallbackLimiter } from '@/lib/rate-limit-fallback'

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

// Without Redis the limiters below fall back to an in-process sliding window, which is enforced
// but per-instance rather than distributed — so the effective budget scales with the number of
// warm serverless instances. Degraded, not disabled. Loud enough to be visible in log triage.
if (!isRedisConfigured && process.env.NODE_ENV === 'production') {
  console.error(
    '[rate-limit] DEGRADED: UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN are not set in ' +
      'production. Falling back to per-instance in-memory rate limiting: limits are enforced, ' +
      'but each serverless instance keeps its own counters, so a distributed attacker gets ' +
      'roughly N times the budget. Provision Upstash and set both variables.'
  )
}

// ============================================================================
// FALLBACK RATE LIMITER (no Redis configured)
// ============================================================================

/**
 * Fallback used when Redis is not configured.
 *
 * This used to be a mock that always returned success, which meant a missing pair of environment
 * variables silently disabled every limit below in production. `selectFallbackLimiter` enforces a
 * real in-process sliding window in production and stays permissive in development.
 * See lib/rate-limit-fallback.ts for the trade-offs (per-instance, not distributed).
 */
const fallback = (limit: number, windowMs: number) => selectFallbackLimiter({ limit, windowMs })

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
  : fallback(5, 60_000)

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
  : fallback(3, 60_000)

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
  : fallback(3, 60_000)

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
  : fallback(30, 60_000)

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
  : fallback(5, 60_000)

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
  : fallback(10, 60_000)

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
  : fallback(3, 3_600_000)

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

  // Prefer platform-trusted headers that clients cannot forge.
  // On Vercel these are set by the edge network and overwrite any client-sent value,
  // unlike `x-forwarded-for`, whose LEFTMOST entry is attacker-controlled (spoofable
  // for rate-limit evasion — a rotated XFF header yields a fresh bucket per request).
  const vercelForwardedFor = headers.get('x-vercel-forwarded-for')
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0].trim()
  }

  const realIp = headers.get('x-real-ip') // Vercel/most proxies set this to the true client IP
  if (realIp) {
    return realIp.trim()
  }

  const cfConnectingIp = headers.get('cf-connecting-ip') // Cloudflare (platform-set)
  if (cfConnectingIp) {
    return cfConnectingIp.trim()
  }

  // Last resort: `x-forwarded-for`. Take the RIGHTMOST entry — the hop appended by the
  // nearest trusted proxy — not the spoofable leftmost client-supplied value.
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    const parts = forwardedFor
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
    if (parts.length > 0) {
      return parts[parts.length - 1]
    }
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
