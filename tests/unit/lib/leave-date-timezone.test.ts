/**
 * Regression coverage for same-day leave/RDO submissions being rejected in
 * negative UTC offsets, and for the 90-day maximum being off by one.
 *
 * The "not in the past" refinement compared `new Date('YYYY-MM-DD')` — which
 * parses as UTC midnight — against `new Date().setHours(0,0,0,0)`, which is
 * LOCAL midnight. West of Greenwich, local midnight today is LATER than UTC
 * midnight today, so today's date was judged to be in the past.
 *
 * The practical effect: a pilot on a US layover, unfit to fly, opens the leave
 * form. The date input offers today (its `min` is computed from local time), but
 * the zod resolver rejects the submission with "Start date cannot be in the
 * past" and there is no way to proceed. Same-day SICK leave is exactly the case
 * where this matters most. It passes at the airline's UTC+10 base, which is why
 * it went unnoticed.
 *
 * Separately, the maximum-duration check used an exclusive `end - start` diff
 * and then tested `<= 90`, so a 91-day inclusive span was accepted while the
 * error message promised 90.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { PilotLeaveRequestSchema } from '@/lib/validations/pilot-leave-schema'
import { FlightRequestSchema } from '@/lib/validations/flight-request-schema'
import { todayLocalIso, inclusiveDaySpan } from '@/lib/utils/date-utils'

/**
 * Pin wall-clock time to an instant that falls on DIFFERENT calendar dates
 * depending on the offset. 2026-07-31T04:00Z is still 2026-07-30 in New York
 * (UTC-4) and Los Angeles (UTC-7) — the exact window where the old comparison
 * misfired — and already 2026-07-31 at the UTC+10 base.
 */
function atUtc(iso: string) {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(iso))
}

afterEach(() => {
  vi.useRealTimers()
})

describe('todayLocalIso', () => {
  it('returns the LOCAL calendar date, not the UTC one', () => {
    atUtc('2026-07-31T04:00:00Z')
    // The test process runs in a fixed TZ (see below), so assert the invariant
    // that matters: it agrees with the local Date fields, whatever they are.
    const now = new Date()
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`
    expect(todayLocalIso()).toBe(expected)
  })
})

describe('leave request — same-day submission is accepted', () => {
  it('accepts a leave request starting today', () => {
    atUtc('2026-07-31T04:00:00Z')
    const today = todayLocalIso()

    const result = PilotLeaveRequestSchema.safeParse({
      request_type: 'SICK',
      start_date: today,
      end_date: today,
    })

    expect(result.success).toBe(true)
  })

  it('still rejects a start date genuinely in the past', () => {
    atUtc('2026-07-31T04:00:00Z')

    const result = PilotLeaveRequestSchema.safeParse({
      request_type: 'SICK',
      start_date: '2026-07-01',
      end_date: '2026-07-02',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(JSON.stringify(result.error.issues)).toContain('cannot be in the past')
    }
  })
})

describe('RDO/SDO request — same-day submission is accepted', () => {
  it('accepts a single-day RDO starting today', () => {
    atUtc('2026-07-31T04:00:00Z')

    const result = FlightRequestSchema.safeParse({
      request_type: 'RDO',
      start_date: todayLocalIso(),
      end_date: '',
    })

    expect(result.success).toBe(true)
  })
})

describe('inclusiveDaySpan', () => {
  it('counts a single day as 1, not 0', () => {
    expect(inclusiveDaySpan('2026-07-31', '2026-07-31')).toBe(1)
  })

  it('counts an inclusive range correctly', () => {
    expect(inclusiveDaySpan('2026-07-01', '2026-07-31')).toBe(31)
  })

  it('is stable across a DST boundary', () => {
    // US DST ends 2026-11-01; a naive local-midnight diff would yield 30.958 days.
    expect(inclusiveDaySpan('2026-10-25', '2026-11-08')).toBe(15)
  })
})

describe('90-day maximum is inclusive', () => {
  it('accepts a span of exactly 90 days', () => {
    atUtc('2026-07-31T04:00:00Z')
    const start = todayLocalIso()
    const end = new Date(`${start}T00:00:00Z`)
    end.setUTCDate(end.getUTCDate() + 89) // 89 days after start => 90 inclusive

    const result = PilotLeaveRequestSchema.safeParse({
      request_type: 'ANNUAL',
      start_date: start,
      end_date: end.toISOString().slice(0, 10),
    })

    expect(result.success).toBe(true)
  })

  it('rejects a span of 91 days', () => {
    atUtc('2026-07-31T04:00:00Z')
    const start = todayLocalIso()
    const end = new Date(`${start}T00:00:00Z`)
    end.setUTCDate(end.getUTCDate() + 90) // 90 days after start => 91 inclusive

    const result = PilotLeaveRequestSchema.safeParse({
      request_type: 'ANNUAL',
      start_date: start,
      end_date: end.toISOString().slice(0, 10),
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(JSON.stringify(result.error.issues)).toContain('cannot exceed 90 days')
    }
  })
})

describe('inclusiveDaySpan — calendar-invalid input', () => {
  it('rejects a date that does not exist rather than normalising it', () => {
    // new Date('2026-02-30T00:00:00Z') silently becomes 2026-03-02, which would
    // otherwise yield a plausible span computed against the wrong end date.
    expect(inclusiveDaySpan('2026-02-01', '2026-02-30')).toBeNull()
    expect(inclusiveDaySpan('2026-13-01', '2026-13-05')).toBeNull()
    expect(inclusiveDaySpan('2026-02-29', '2026-03-01')).toBeNull() // 2026 is not a leap year
  })

  it('still accepts a real leap day', () => {
    expect(inclusiveDaySpan('2028-02-28', '2028-02-29')).toBe(2)
  })

  it('rejects malformed input', () => {
    expect(inclusiveDaySpan('not-a-date', '2026-02-01')).toBeNull()
  })
})
