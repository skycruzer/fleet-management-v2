/**
 * In-process rate limiter used when Upstash Redis is not configured.
 *
 * ========================================
 * WHY THIS EXISTS
 * ========================================
 *
 * Both limiter modules used to fall back to a mock whose `limit()` always returned
 * `{ success: true }`. That is fine in development and dangerous in production: when the Upstash
 * environment variables are absent, every documented limit — login throttling, the route factory's
 * per-IP and per-user limits, request/feedback spam limits — silently becomes "allow everything",
 * while the application looks perfectly healthy. A security control that degrades to a no-op
 * without failing anything is worse than one that was never claimed.
 *
 * This provides a real sliding-window limiter that needs no external service. It is deliberately
 * NOT a replacement for Redis:
 *
 *   - Counters live in one process, so each serverless instance keeps its own window. An attacker
 *     spread across N warm instances effectively gets N times the budget.
 *   - Counters reset when an instance is recycled.
 *
 * On Vercel Fluid Compute, instances are reused across many requests, so this still turns a
 * completely open endpoint into a meaningfully throttled one. Treat it as a floor that keeps the
 * system safe-by-default, not as the target configuration — set `UPSTASH_REDIS_REST_URL` and
 * `UPSTASH_REDIS_REST_TOKEN` to get correct distributed limits.
 */

/** Shape returned by `@upstash/ratelimit`'s `limit()`, so callers cannot tell the two apart. */
export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  pending: Promise<unknown>
}

export interface FallbackRateLimiter {
  limit: (identifier?: string) => Promise<RateLimitResult>
}

/**
 * Cap on tracked identifiers, so a flood of unique keys (spoofed IPs, random staff IDs) cannot
 * grow the map without bound. On overflow the least-recently-USED entries are dropped first.
 *
 * This relies on `touch()` below re-inserting each key it updates: `Map.set()` on an existing
 * key does NOT move it, so without that the map stays in insertion order and eviction drops the
 * oldest-CREATED keys — which could be an active attacker who simply started early, while a key
 * that just arrived survives. The comment here used to claim LRU behaviour the code did not have.
 */
const MAX_TRACKED_KEYS = 10_000

/** How often to sweep expired windows, in ms. Sweeping is amortized onto calls. */
const SWEEP_INTERVAL_MS = 60_000

export function createInMemoryRateLimiter(options: {
  /** Requests permitted per window. */
  limit: number
  /** Window length in milliseconds. */
  windowMs: number
}): FallbackRateLimiter {
  const { limit: maxRequests, windowMs } = options

  /** identifier -> ascending timestamps of hits still inside the window */
  const hits = new Map<string, number[]>()
  let lastSweep = Date.now()

  function sweep(now: number) {
    for (const [key, timestamps] of hits) {
      const live = timestamps.filter((t) => now - t < windowMs)
      if (live.length === 0) hits.delete(key)
      else hits.set(key, live)
    }
    lastSweep = now
  }

  return {
    async limit(identifier = 'global'): Promise<RateLimitResult> {
      const now = Date.now()

      if (now - lastSweep > SWEEP_INTERVAL_MS) sweep(now)

      // Map iteration order is insertion order, and touch() re-inserts on every update,
      // so the first keys here are the least recently USED.
      if (hits.size > MAX_TRACKED_KEYS) {
        const overflow = hits.size - MAX_TRACKED_KEYS
        let dropped = 0
        for (const key of hits.keys()) {
          hits.delete(key)
          if (++dropped >= overflow) break
        }
      }

      /** Write back and move the key to the most-recently-used end of the Map. */
      const touch = (key: string, timestamps: number[]) => {
        hits.delete(key)
        hits.set(key, timestamps)
      }

      const windowStart = now - windowMs
      const previous = hits.get(identifier) ?? []
      const live = previous.filter((t) => t > windowStart)

      // Oldest hit in the window decides when capacity frees up again.
      const reset = live.length > 0 ? live[0] + windowMs : now + windowMs

      if (live.length >= maxRequests) {
        touch(identifier, live)
        return {
          success: false,
          limit: maxRequests,
          remaining: 0,
          reset,
          pending: Promise.resolve(),
        }
      }

      live.push(now)
      touch(identifier, live)

      return {
        success: true,
        limit: maxRequests,
        remaining: Math.max(0, maxRequests - live.length),
        reset,
        pending: Promise.resolve(),
      }
    },
  }
}

/**
 * Permissive limiter for local development, where throttling a developer's own retry loop is
 * noise rather than protection. Never selected in production — see `selectFallbackLimiter`.
 */
export function createPermissiveRateLimiter(): FallbackRateLimiter {
  return {
    limit: async () => ({
      success: true,
      limit: 999,
      remaining: 999,
      reset: Date.now() + 60_000,
      pending: Promise.resolve(),
    }),
  }
}

/**
 * Choose the no-Redis fallback: enforce in production, stay permissive elsewhere.
 *
 * The environment is read per call rather than captured at module load so tests can exercise both
 * branches without re-importing the module graph.
 */
export function selectFallbackLimiter(options: {
  limit: number
  windowMs: number
}): FallbackRateLimiter {
  return process.env.NODE_ENV === 'production'
    ? createInMemoryRateLimiter(options)
    : createPermissiveRateLimiter()
}
