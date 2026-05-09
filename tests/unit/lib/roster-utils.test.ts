/**
 * Unit tests for roster period date math.
 *
 * The 28-day RP1-RP13 cycle is anchored on RP13/2025 = 2025-11-08 (per
 * `KNOWN_ROSTER` in roster-utils.ts and CLAUDE.md). These tests pin:
 *   - The anchor itself maps to RP13/2025.
 *   - Start/end dates are 28 days apart, end inclusive.
 *   - Cross-year rollover RP13/YYYY → RP01/(YYYY+1) works in both directions.
 *   - The "current period" function tracks the anchor under fake clock control.
 *
 * If any of these break, the calendar UI, leave validation, planning UI,
 * and roster reports all silently produce wrong period codes.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getCurrentRosterPeriodObject,
  getRosterPeriodFromDate,
  getNextRosterPeriodObject,
  getPreviousRosterPeriodObject,
} from '@/lib/utils/roster-utils'

// Local-time anchor (matches KNOWN_ROSTER which uses `new Date(2025, 10, 8)`)
function anchor(): Date {
  return new Date(2025, 10, 8)
}

function plusDays(base: Date, days: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

describe('getRosterPeriodFromDate — anchor invariants', () => {
  it('maps the anchor date 2025-11-08 itself to RP13/2025 (day 0 of the period)', () => {
    const rp = getRosterPeriodFromDate(anchor())
    expect(rp.code).toBe('RP13/2025')
    expect(rp.number).toBe(13)
    expect(rp.year).toBe(2025)
    // start day inclusive
    expect(rp.startDate.getFullYear()).toBe(2025)
    expect(rp.startDate.getMonth()).toBe(10) // November (0-indexed)
    expect(rp.startDate.getDate()).toBe(8)
  })

  it('day 27 of the period (Dec 5, 2025) is still RP13/2025', () => {
    const rp = getRosterPeriodFromDate(plusDays(anchor(), 27))
    expect(rp.code).toBe('RP13/2025')
  })

  it('day 28 (Dec 6, 2025) crosses into RP01/2026', () => {
    const rp = getRosterPeriodFromDate(plusDays(anchor(), 28))
    expect(rp.code).toBe('RP01/2026')
    expect(rp.number).toBe(1)
    expect(rp.year).toBe(2026)
  })

  it('day 56 (28*2) is RP02/2026', () => {
    const rp = getRosterPeriodFromDate(plusDays(anchor(), 56))
    expect(rp.code).toBe('RP02/2026')
  })

  it('end date is exactly 27 days after start (28-day inclusive period)', () => {
    const rp = getRosterPeriodFromDate(anchor())
    const diffMs = rp.endDate.getTime() - rp.startDate.getTime()
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
    expect(diffDays).toBe(27)
  })
})

describe('getRosterPeriodFromDate — past dates resolve symmetrically', () => {
  it('day -1 (Nov 7, 2025) is RP12/2025', () => {
    const rp = getRosterPeriodFromDate(plusDays(anchor(), -1))
    expect(rp.code).toBe('RP12/2025')
  })
  it('day -28 (Oct 11, 2025) is RP12/2025 day 0', () => {
    const rp = getRosterPeriodFromDate(plusDays(anchor(), -28))
    expect(rp.code).toBe('RP12/2025')
  })
  it('day -29 (Oct 10, 2025) is RP11/2025', () => {
    const rp = getRosterPeriodFromDate(plusDays(anchor(), -29))
    expect(rp.code).toBe('RP11/2025')
  })
})

describe('getNextRosterPeriodObject / getPreviousRosterPeriodObject — rollover', () => {
  it('next after RP13/2025 is RP01/2026', () => {
    const rp13 = getRosterPeriodFromDate(anchor())
    const next = getNextRosterPeriodObject(rp13)
    expect(next.code).toBe('RP01/2026')
  })

  it('previous before RP01/2026 is RP13/2025', () => {
    const rp01_2026 = getRosterPeriodFromDate(plusDays(anchor(), 28))
    const prev = getPreviousRosterPeriodObject(rp01_2026)
    expect(prev.code).toBe('RP13/2025')
  })

  it('next after RP12/2025 is RP13/2025', () => {
    const rp12 = getRosterPeriodFromDate(plusDays(anchor(), -1))
    const next = getNextRosterPeriodObject(rp12)
    expect(next.code).toBe('RP13/2025')
  })
})

describe('getCurrentRosterPeriodObject — tracks system clock', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('on the anchor date itself returns RP13/2025', () => {
    vi.setSystemTime(anchor())
    expect(getCurrentRosterPeriodObject().code).toBe('RP13/2025')
  })

  it('14 days into RP13 (mid-period) still returns RP13/2025', () => {
    vi.setSystemTime(plusDays(anchor(), 14))
    expect(getCurrentRosterPeriodObject().code).toBe('RP13/2025')
  })

  it('28 days after the anchor returns RP01/2026 (year rollover)', () => {
    vi.setSystemTime(plusDays(anchor(), 28))
    expect(getCurrentRosterPeriodObject().code).toBe('RP01/2026')
  })

  it('1 year after anchor (~RP13 of next year cycle) is on the same period number RP13', () => {
    // 13 periods × 28 days = 364 days, so day 364 should be RP13/2026
    vi.setSystemTime(plusDays(anchor(), 364))
    expect(getCurrentRosterPeriodObject().code).toBe('RP13/2026')
  })

  it('reports a non-negative daysRemaining within range [0, 27]', () => {
    vi.setSystemTime(plusDays(anchor(), 5))
    const rp = getCurrentRosterPeriodObject()
    expect(rp.daysRemaining).toBeGreaterThanOrEqual(0)
    expect(rp.daysRemaining).toBeLessThanOrEqual(27)
  })
})
