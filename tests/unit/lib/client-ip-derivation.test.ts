/**
 * Regression coverage for rate-limit identifiers being derived from a forgeable header.
 *
 * `getIdentifier()` in lib/middleware/rate-limit-middleware.ts used to read the LEFTMOST
 * `x-forwarded-for` entry:
 *
 *     const forwarded = request.headers.get('x-forwarded-for')
 *     const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip')
 *
 * That value is whatever the client sent. Vercel appends the true client IP to the RIGHT of it,
 * so rotating the header handed every request a brand-new bucket and the 5/min auth limiter
 * did nothing on /api/portal/{login,register,forgot-password,reset-password,change-password}:
 * unbounded password-reset mail-bombing at any pilot address, and unbounded `oldPassword`
 * guessing against a hijacked session.
 *
 * These tests pin the property that matters — a caller cannot choose its own bucket — on
 * `getClientIp`, the shared helper both the route factory and (now) the auth middleware use.
 */

import { describe, expect, it } from 'vitest'
import { getClientIp } from '@/lib/rate-limit'

/** Minimal stand-in for the { headers: Headers } shape getClientIp accepts. */
function req(headers: Record<string, string>) {
  return { headers: new Headers(headers) }
}

const SPOOFED = '203.0.113.9'
const REAL = '198.51.100.7'

describe('getClientIp — platform-set headers win over client-supplied ones', () => {
  it('prefers x-vercel-forwarded-for over a forged x-forwarded-for', () => {
    expect(getClientIp(req({ 'x-forwarded-for': SPOOFED, 'x-vercel-forwarded-for': REAL }))).toBe(
      REAL
    )
  })

  it('prefers x-real-ip over a forged x-forwarded-for', () => {
    expect(getClientIp(req({ 'x-forwarded-for': SPOOFED, 'x-real-ip': REAL }))).toBe(REAL)
  })

  it('prefers cf-connecting-ip over a forged x-forwarded-for', () => {
    expect(getClientIp(req({ 'x-forwarded-for': SPOOFED, 'cf-connecting-ip': REAL }))).toBe(REAL)
  })
})

describe('getClientIp — x-forwarded-for fallback takes the RIGHTMOST hop', () => {
  it('ignores the client-supplied leftmost entry', () => {
    // The attacker sends SPOOFED; the trusted proxy appends REAL on the right.
    const ip = getClientIp(req({ 'x-forwarded-for': `${SPOOFED}, ${REAL}` }))
    expect(ip).toBe(REAL)
    expect(ip).not.toBe(SPOOFED)
  })

  it('still resolves to the same bucket when the attacker rotates the forged prefix', () => {
    // The whole point: rotating the spoofable part must NOT yield a fresh bucket.
    const buckets = new Set(
      ['203.0.113.1', '203.0.113.2', '203.0.113.3', '203.0.113.4'].map((forged) =>
        getClientIp(req({ 'x-forwarded-for': `${forged}, ${REAL}` }))
      )
    )
    expect(buckets.size).toBe(1)
    expect([...buckets][0]).toBe(REAL)
  })

  it('handles a single-entry header and trims whitespace', () => {
    expect(getClientIp(req({ 'x-forwarded-for': `  ${REAL}  ` }))).toBe(REAL)
  })

  it('skips empty segments produced by a trailing comma', () => {
    expect(getClientIp(req({ 'x-forwarded-for': `${SPOOFED}, ${REAL}, ` }))).toBe(REAL)
  })
})

describe('getClientIp — no usable header', () => {
  it("returns 'unknown' rather than throwing", () => {
    expect(getClientIp(req({}))).toBe('unknown')
  })

  it("returns 'unknown' for an all-empty x-forwarded-for", () => {
    expect(getClientIp(req({ 'x-forwarded-for': ' , , ' }))).toBe('unknown')
  })
})
