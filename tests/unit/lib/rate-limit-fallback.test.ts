/**
 * The no-Redis fallback must actually enforce limits.
 *
 * Regression cover for the production defect where both limiter modules fell back to a mock whose
 * `limit()` always returned `{ success: true }`. With Upstash unset in Vercel, that silently
 * switched off login throttling and every other limit while the app looked healthy.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createInMemoryRateLimiter,
  createPermissiveRateLimiter,
  selectFallbackLimiter,
} from '@/lib/rate-limit-fallback'

describe('createInMemoryRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows up to the limit then refuses', async () => {
    const limiter = createInMemoryRateLimiter({ limit: 5, windowMs: 60_000 })

    for (let i = 0; i < 5; i++) {
      const result = await limiter.limit('1.2.3.4')
      expect(result.success).toBe(true)
    }

    const blocked = await limiter.limit('1.2.3.4')
    expect(blocked.success).toBe(false)
    expect(blocked.remaining).toBe(0)
  })

  it('counts each identifier separately', async () => {
    const limiter = createInMemoryRateLimiter({ limit: 2, windowMs: 60_000 })

    await limiter.limit('attacker')
    await limiter.limit('attacker')
    expect((await limiter.limit('attacker')).success).toBe(false)

    // A different caller must be unaffected by the attacker's exhausted budget.
    expect((await limiter.limit('innocent-bystander')).success).toBe(true)
  })

  it('frees capacity once the window slides past the oldest hit', async () => {
    const limiter = createInMemoryRateLimiter({ limit: 2, windowMs: 60_000 })

    await limiter.limit('user')
    await limiter.limit('user')
    expect((await limiter.limit('user')).success).toBe(false)

    vi.advanceTimersByTime(60_001)

    expect((await limiter.limit('user')).success).toBe(true)
  })

  it('does not free capacity early', async () => {
    const limiter = createInMemoryRateLimiter({ limit: 1, windowMs: 60_000 })

    await limiter.limit('user')
    vi.advanceTimersByTime(59_000)

    expect((await limiter.limit('user')).success).toBe(false)
  })

  it('reports a reset time in the future when blocking', async () => {
    const limiter = createInMemoryRateLimiter({ limit: 1, windowMs: 60_000 })

    await limiter.limit('user')
    const blocked = await limiter.limit('user')

    expect(blocked.success).toBe(false)
    expect(blocked.reset).toBeGreaterThan(Date.now())
    expect(blocked.limit).toBe(1)
  })

  it('bounds memory when flooded with unique identifiers', async () => {
    const limiter = createInMemoryRateLimiter({ limit: 1, windowMs: 60_000 })

    // Simulates spoofed IPs / random staff IDs trying to grow the map without bound.
    for (let i = 0; i < 12_000; i++) {
      await limiter.limit(`spoofed-${i}`)
    }

    // Still enforcing for a fresh key rather than degrading or throwing.
    const fresh = await limiter.limit('real-user')
    expect(fresh.success).toBe(true)
    expect((await limiter.limit('real-user')).success).toBe(false)
  })
})

describe('selectFallbackLimiter', () => {
  afterEach(() => {
    // vi.stubEnv tracks and restores the original value; NODE_ENV is read-only to TS, so this is
    // the only way to flip it in a typed test.
    vi.unstubAllEnvs()
  })

  it('enforces in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const limiter = selectFallbackLimiter({ limit: 1, windowMs: 60_000 })

    expect((await limiter.limit('ip')).success).toBe(true)
    expect((await limiter.limit('ip')).success).toBe(false)
  })

  it('stays permissive outside production so local development is not throttled', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const limiter = selectFallbackLimiter({ limit: 1, windowMs: 60_000 })

    expect((await limiter.limit('ip')).success).toBe(true)
    expect((await limiter.limit('ip')).success).toBe(true)
  })
})

describe('createPermissiveRateLimiter', () => {
  it('always succeeds — this is the development-only behaviour', async () => {
    const limiter = createPermissiveRateLimiter()
    for (let i = 0; i < 50; i++) {
      expect((await limiter.limit('anything')).success).toBe(true)
    }
  })
})
