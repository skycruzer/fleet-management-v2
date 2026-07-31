/**
 * Fleet calendar date regression tests.
 *
 * These pin down the defect found in the 2026-07-25 deep review: certification
 * compliance was computed against the *runtime's* local midnight, so the same
 * certification resolved differently on the Vercel server (UTC) and in a pilot's
 * browser (Port Moresby, UTC+10).
 *
 * The critical window is 00:00-10:00 PNG, which is 14:00-24:00 UTC the previous
 * day — during those ten hours the server's calendar date trails the fleet's.
 * The pre-existing certification-status test froze the clock at noon UTC, which
 * sits outside that window, so it passed while the bug was live.
 */

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import {
  daysUntilFleetDate,
  differenceInCalendarDays,
  fleetToday,
  formatCalendarDate,
  toFleetCalendarDate,
} from '@/lib/utils/fleet-date'
import { getCertificationStatus, getDaysUntilExpiry } from '@/lib/utils/certification-status'

/**
 * 2026-07-24T20:50:00Z is 2026-07-25 06:50 in Port Moresby.
 * Server calendar date: 24 July. Fleet calendar date: 25 July.
 * Every assertion below must follow the FLEET date.
 */
const INSIDE_SKEW_WINDOW = new Date('2026-07-24T20:50:00Z')

/** 2026-07-25T02:00:00Z is 2026-07-25 12:00 in Port Moresby — both agree. */
const OUTSIDE_SKEW_WINDOW = new Date('2026-07-25T02:00:00Z')

afterEach(() => {
  vi.useRealTimers()
})

describe('toFleetCalendarDate', () => {
  it('treats a date-only string as a calendar date, with no timezone shift', () => {
    // The historic bug: new Date('2026-07-24') is UTC midnight, which is the
    // 23rd in any timezone behind UTC. A date column has no instant to shift.
    expect(toFleetCalendarDate('2026-07-24')).toEqual({ year: 2026, month: 7, day: 24 })
  })

  it('projects a timestamp onto the fleet calendar date', () => {
    // 20:50Z on the 24th is already the 25th in Port Moresby.
    expect(toFleetCalendarDate('2026-07-24T20:50:00Z')).toEqual({
      year: 2026,
      month: 7,
      day: 25,
    })
  })

  it('returns null for absent or unparseable input', () => {
    expect(toFleetCalendarDate(null)).toBeNull()
    expect(toFleetCalendarDate(undefined)).toBeNull()
    expect(toFleetCalendarDate('')).toBeNull()
    expect(toFleetCalendarDate('not-a-date')).toBeNull()
    expect(toFleetCalendarDate(new Date('nope'))).toBeNull()
  })

  it('rejects impossible calendar dates instead of silently rolling them over', () => {
    // Date.UTC(2026, 1, 31) would quietly become 3 March.
    expect(toFleetCalendarDate('2026-02-31')).toBeNull()
    expect(toFleetCalendarDate('2026-13-01')).toBeNull()
  })

  it('accepts a real leap day', () => {
    expect(toFleetCalendarDate('2028-02-29')).toEqual({ year: 2028, month: 2, day: 29 })
  })
})

describe('differenceInCalendarDays', () => {
  it('counts whole days across a month boundary', () => {
    expect(
      differenceInCalendarDays({ year: 2026, month: 7, day: 30 }, { year: 2026, month: 8, day: 2 })
    ).toBe(3)
  })

  it('is negative when the target is in the past', () => {
    expect(
      differenceInCalendarDays({ year: 2026, month: 8, day: 2 }, { year: 2026, month: 7, day: 30 })
    ).toBe(-3)
  })

  it('handles a leap year February correctly', () => {
    expect(
      differenceInCalendarDays({ year: 2028, month: 2, day: 28 }, { year: 2028, month: 3, day: 1 })
    ).toBe(2)
  })
})

describe('fleet date is independent of the runtime timezone', () => {
  // Node honours a TZ change only via the environment, but Date's local-time
  // methods are what the old code depended on. These assertions prove the new
  // implementation never consults them.
  it('resolves the same fleet date from any equivalent instant', () => {
    const fromString = toFleetCalendarDate('2026-07-24T20:50:00Z')
    const fromDate = toFleetCalendarDate(new Date(Date.UTC(2026, 6, 24, 20, 50)))
    expect(fromString).toEqual(fromDate)
    expect(formatCalendarDate(fromString!)).toBe('2026-07-25')
  })
})

describe('daysUntilFleetDate during the server/fleet skew window', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(INSIDE_SKEW_WINDOW)
  })

  it('anchors "today" to the fleet calendar, not the server calendar', () => {
    // Server-local date here is 24 July; the fleet is already on the 25th.
    expect(fleetToday()).toEqual({ year: 2026, month: 7, day: 25 })
  })

  it('reports a certification expiring on the fleet-current day as 0 days', () => {
    expect(daysUntilFleetDate('2026-07-25')).toBe(0)
  })

  it('reports yesterday as expired even though the server is still on that date', () => {
    // THE REGRESSION: old code returned 0 here on a UTC server ("Expiring Soon")
    // while the pilot's browser returned -1 ("Expired") for the same instant.
    expect(daysUntilFleetDate('2026-07-24')).toBe(-1)
  })

  it('does not drift with time-of-day', () => {
    const atStart = daysUntilFleetDate('2026-08-24')
    vi.setSystemTime(new Date('2026-07-24T23:59:00Z')) // still 25 July in PNG
    expect(daysUntilFleetDate('2026-08-24')).toBe(atStart)
  })
})

describe('certification status agrees across the skew window', () => {
  const EXPIRES_YESTERDAY = '2026-07-24'
  const EXPIRES_TODAY = '2026-07-25'
  const GREEN_YELLOW_BOUNDARY = '2026-08-24' // exactly 30 days after 25 July

  it('marks a cert that expired on the fleet-previous day as Expired', () => {
    vi.useFakeTimers()
    vi.setSystemTime(INSIDE_SKEW_WINDOW)

    const status = getCertificationStatus(EXPIRES_YESTERDAY)
    expect(status.color).toBe('red')
    expect(status.label).toBe('Expired')
    expect(status.daysUntilExpiry).toBe(-1)
  })

  it('produces an identical verdict inside and outside the skew window', () => {
    vi.useFakeTimers()

    vi.setSystemTime(INSIDE_SKEW_WINDOW)
    const during = getCertificationStatus(EXPIRES_TODAY)

    vi.setSystemTime(OUTSIDE_SKEW_WINDOW)
    const after = getCertificationStatus(EXPIRES_TODAY)

    // Same fleet day, ~5 hours apart: the compliance answer must not move.
    expect(during).toEqual(after)
    expect(during.color).toBe('yellow')
    expect(during.daysUntilExpiry).toBe(0)
  })

  it('keeps the green/yellow boundary at exactly 30 fleet days', () => {
    vi.useFakeTimers()
    vi.setSystemTime(INSIDE_SKEW_WINDOW)

    // Old code: 31 days on a UTC server (green) vs 30 in the browser (yellow).
    expect(getDaysUntilExpiry(GREEN_YELLOW_BOUNDARY)).toBe(30)
    expect(getCertificationStatus(GREEN_YELLOW_BOUNDARY).color).toBe('yellow')

    const dayAfter = getCertificationStatus('2026-08-25')
    expect(dayAfter.daysUntilExpiry).toBe(31)
    expect(dayAfter.color).toBe('green')
  })

  it('still reports missing dates as gray', () => {
    expect(getCertificationStatus(null).color).toBe('gray')
    expect(getCertificationStatus('not-a-date').color).toBe('gray')
  })
})
