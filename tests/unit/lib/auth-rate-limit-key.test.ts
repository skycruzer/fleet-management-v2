/**
 * Regression coverage for the auth rate limiter being escapable by rotating a header.
 *
 * This exercises `withAuthRateLimit` end to end rather than the IP helper in isolation,
 * because the defect was NOT in the helper — `getClientIp` was already correct. The defect
 * was that `getIdentifier()` in rate-limit-middleware.ts did not use it, and instead read the
 * LEFTMOST `x-forwarded-for` entry, which the client supplies:
 *
 *     const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip')
 *
 * Vercel appends the true client IP to the RIGHT of whatever the caller sent, so an attacker
 * rotating `X-Forwarded-For: 203.0.113.<n>` landed in a fresh 5-per-minute bucket on every
 * request. Effect: unbounded password-reset emails to any pilot address (mail-bombing the
 * victim and burning the Resend quota), unbounded registration submissions, and unbounded
 * `oldPassword` guessing against /api/portal/change-password.
 *
 * NOTE ON SETUP: `selectFallbackLimiter` deliberately returns a permissive no-op limiter unless
 * NODE_ENV === 'production', so that local development is not rate limited. The limiter is also
 * constructed at module scope. Both facts mean these tests must stub the environment and then
 * import the module dynamically — otherwise every request is allowed and the suite passes
 * vacuously. Redis is left unconfigured, so the in-memory sliding window is used; that is the
 * same path production takes when Redis is absent (it no longer fails open).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextResponse } from 'next/server'

const AUTH_LIMIT = 5
const VICTIM_PROXY_IP = '198.51.100.7'

/** Import rate-limit-middleware with production semantics and no Redis. */
async function loadMiddleware() {
  vi.resetModules()
  vi.stubEnv('NODE_ENV', 'production')
  vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
  return import('@/lib/middleware/rate-limit-middleware')
}

function post(headers: Record<string, string>) {
  return new Request('http://localhost:3000/api/portal/forgot-password', {
    method: 'POST',
    headers,
  }) as never
}

async function countAllowed(
  wrapped: (req: never) => Promise<Response>,
  headersFor: (i: number) => Record<string, string>,
  n: number
) {
  let allowed = 0
  for (let i = 0; i < n; i++) {
    const res = await wrapped(post(headersFor(i)))
    if (res.status !== 429) allowed++
  }
  return allowed
}

beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('withAuthRateLimit — the limiter actually enforces under production semantics', () => {
  it('rate limits a plain repeated caller (guards against a vacuous suite)', async () => {
    const { withAuthRateLimit } = await loadMiddleware()
    const wrapped = withAuthRateLimit(async () => NextResponse.json({ ok: true }))

    const allowed = await countAllowed(
      wrapped,
      () => ({ 'x-real-ip': '198.51.100.99' }),
      AUTH_LIMIT + 5
    )

    expect(allowed).toBe(AUTH_LIMIT)
  })
})

describe('withAuthRateLimit — the bucket key cannot be chosen by the caller', () => {
  it('does not grant a fresh bucket when the forged XFF prefix is rotated', async () => {
    const { withAuthRateLimit } = await loadMiddleware()
    const handler = vi.fn(async () => NextResponse.json({ ok: true }))
    const wrapped = withAuthRateLimit(handler)

    // Attacker rotates the leftmost (client-supplied) entry on every request; the trusted
    // proxy appends the same real IP on the right each time.
    const allowed = await countAllowed(
      wrapped,
      (i) => ({ 'x-forwarded-for': `203.0.113.${i}, ${VICTIM_PROXY_IP}` }),
      AUTH_LIMIT + 10
    )

    // Before the fix each request keyed on its own forged prefix, so all 15 were allowed.
    expect(allowed).toBe(AUTH_LIMIT)
    expect(handler.mock.calls.length).toBe(AUTH_LIMIT)
  })

  it('ignores a rotated XFF when a platform header is present', async () => {
    const { withAuthRateLimit } = await loadMiddleware()
    const wrapped = withAuthRateLimit(async () => NextResponse.json({ ok: true }))

    const allowed = await countAllowed(
      wrapped,
      (i) => ({
        'x-forwarded-for': `203.0.113.${i}`,
        'x-real-ip': '198.51.100.42', // platform-set, unforgeable
      }),
      AUTH_LIMIT + 10
    )

    expect(allowed).toBe(AUTH_LIMIT)
  })

  it('does NOT over-block: a genuinely different client still gets its own bucket', async () => {
    const { withAuthRateLimit } = await loadMiddleware()
    const wrapped = withAuthRateLimit(async () => NextResponse.json({ ok: true }))

    // Exhaust one client...
    await countAllowed(wrapped, () => ({ 'x-real-ip': '198.51.100.150' }), AUTH_LIMIT + 3)

    // ...a different real IP must still be served.
    const res = await wrapped(post({ 'x-real-ip': '198.51.100.151' }))
    expect(res.status).not.toBe(429)
  })
})
