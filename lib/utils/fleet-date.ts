/**
 * Fleet Calendar Date Utilities
 *
 * ========================================
 * WHY THIS EXISTS
 * ========================================
 *
 * Certification compliance (expired / expiring / current) is a CALENDAR question,
 * not an instant-in-time question. "This check expires on 2026-07-24" means the
 * whole of 24 July in the operating base's local calendar — Port Moresby.
 *
 * The previous implementation compared `new Date('2026-07-24')` (parsed by JS as
 * UTC midnight) against a `new Date()` normalized to the *runtime's local*
 * midnight. That produced three different answers for the same certification:
 *
 *   - Vercel server (UTC):      2026-07-24 -> 0 days  -> "Expiring Soon" (yellow)
 *   - Pilot browser (UTC+10):   2026-07-24 -> -1 days -> "Expired"       (red)
 *   - Admin browser (UTC-7):    2026-07-24 -> -1 days -> "Expired"       (red, by accident)
 *
 * Because Papua New Guinea is UTC+10, the server's calendar date trails the
 * fleet's for the first 10 hours of every PNG day. During that window the admin
 * dashboard, compliance reports, PDF exports and the expiry-alert cron all
 * disagreed with what the pilot saw in the portal. For an FAA compliance surface
 * the expired/expiring distinction is operationally and legally material.
 *
 * ========================================
 * THE FIX
 * ========================================
 *
 * Every compliance calculation resolves to a fleet-local CALENDAR DATE first,
 * then does integer day arithmetic. Both server and client pin the timezone
 * explicitly via `Intl`, so they cannot disagree:
 *
 *   - Date-only strings ("2026-07-24") are taken at face value as calendar
 *     dates. No timezone conversion is applied — there is no instant to convert.
 *   - Timestamps and Date objects are projected into the fleet timezone and
 *     the resulting calendar date is used.
 *   - "Today" is the calendar date in the fleet timezone, never the runtime's.
 *
 * Papua New Guinea observes UTC+10 year-round with no daylight saving, so the
 * fleet calendar date is stable. The implementation does not rely on that — it
 * asks `Intl` — but it is worth knowing there are no DST discontinuities.
 *
 * Developer: Maurice Rondeau
 */

/**
 * Operating base timezone for the B767 fleet (Port Moresby, UTC+10, no DST).
 * All compliance date arithmetic is anchored here so that server-rendered and
 * client-rendered views agree.
 */
export const FLEET_TIME_ZONE = 'Pacific/Port_Moresby'

/** A timezone-free calendar date: exactly what a DB `date` column represents. */
export interface CalendarDate {
  year: number
  /** 1-12 (not zero-indexed — this is a calendar month, not a JS month) */
  month: number
  /** 1-31 */
  day: number
}

/** Matches a bare `YYYY-MM-DD` date-only value (what Postgres `date` columns return). */
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * Formatter that projects an instant onto the fleet's calendar date.
 * Constructed once — `Intl.DateTimeFormat` is comparatively expensive and these
 * helpers run per-certification across large tables.
 */
const fleetDateParts = new Intl.DateTimeFormat('en-US', {
  timeZone: FLEET_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Project an instant onto the fleet timezone's calendar date. */
function instantToFleetCalendarDate(instant: Date): CalendarDate {
  const parts = fleetDateParts.formatToParts(instant)
  const lookup = (type: 'year' | 'month' | 'day'): number => {
    const value = parts.find((part) => part.type === type)?.value
    return value ? Number(value) : NaN
  }

  return { year: lookup('year'), month: lookup('month'), day: lookup('day') }
}

/**
 * Resolve any supported date input to a fleet calendar date.
 *
 * Date-only strings are treated as calendar dates verbatim; timestamps and Date
 * objects are projected into the fleet timezone.
 *
 * @returns the calendar date, or null when the input is absent or unparseable
 */
export function toFleetCalendarDate(value: Date | string | null | undefined): CalendarDate | null {
  if (value === null || value === undefined || value === '') return null

  if (typeof value === 'string') {
    const dateOnly = DATE_ONLY_PATTERN.exec(value)
    if (dateOnly) {
      const [, year, month, day] = dateOnly
      const candidate: CalendarDate = { year: +year, month: +month, day: +day }
      return isRealCalendarDate(candidate) ? candidate : null
    }

    const parsed = new Date(value)
    return isNaN(parsed.getTime()) ? null : instantToFleetCalendarDate(parsed)
  }

  return isNaN(value.getTime()) ? null : instantToFleetCalendarDate(value)
}

/**
 * Reject impossible calendar dates (month 13, 31 February, ...). `Date.UTC`
 * silently rolls those over, which would otherwise turn bad data into a
 * plausible-looking compliance answer.
 */
function isRealCalendarDate({ year, month, day }: CalendarDate): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false
  if (month < 1 || month > 12 || day < 1 || day > 31) return false

  const roundTrip = new Date(Date.UTC(year, month - 1, day))
  return (
    roundTrip.getUTCFullYear() === year &&
    roundTrip.getUTCMonth() === month - 1 &&
    roundTrip.getUTCDate() === day
  )
}

/** The current calendar date at the fleet's operating base. */
export function fleetToday(): CalendarDate {
  return instantToFleetCalendarDate(new Date())
}

/**
 * Whole days between two calendar dates (`to - from`).
 *
 * Both dates are mapped to UTC midnight purely as a counting device, so the
 * result is always an exact integer and never affected by DST or the runtime's
 * timezone.
 */
export function differenceInCalendarDays(from: CalendarDate, to: CalendarDate): number {
  const fromMs = Date.UTC(from.year, from.month - 1, from.day)
  const toMs = Date.UTC(to.year, to.month - 1, to.day)
  return Math.round((toMs - fromMs) / 86_400_000)
}

/**
 * Days from today (fleet calendar) until `value`.
 *
 * Negative when the date has already passed. Returns null for absent or
 * unparseable input so callers can distinguish "no date" from "expires today".
 */
export function daysUntilFleetDate(value: Date | string | null | undefined): number | null {
  const target = toFleetCalendarDate(value)
  if (!target) return null

  return differenceInCalendarDays(fleetToday(), target)
}

/** Render a calendar date back to `YYYY-MM-DD`. */
export function formatCalendarDate({ year, month, day }: CalendarDate): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${year}-${pad(month)}-${pad(day)}`
}
