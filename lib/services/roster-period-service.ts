/**
 * Roster Period Service
 *
 * Handles all roster period date calculations and database synchronization.
 * Roster periods are 28-day cycles used for leave request planning.
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 */

import { createClient } from '@/lib/supabase/server'

// ============================================================================
// Constants
// ============================================================================

/**
 * Known anchor point for roster period calculations
 * RP12/2025 starts on October 11, 2025
 */
const ANCHOR_ROSTER_PERIOD = 12
const ANCHOR_YEAR = 2025
const ANCHOR_START_DATE = new Date('2025-10-11')

/**
 * Roster period configuration
 */
const ROSTER_PERIOD_DAYS = 28
const ROSTER_PERIODS_PER_YEAR = 13
const ROSTER_PUBLISH_DAYS_BEFORE = 10
const REQUEST_DEADLINE_DAYS_BEFORE_PUBLISH = 21

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Complete roster period information with all calculated dates
 */
export interface RosterPeriodDates {
  /** Roster period code (e.g., "RP1/2025") */
  code: string
  /** Period number (1-13) */
  periodNumber: number
  /** Year */
  year: number
  /** Start date of roster period */
  startDate: Date
  /** End date of roster period (27 days after start) */
  endDate: Date
  /** Date when roster is published (10 days before start) */
  publishDate: Date
  /** Deadline for leave requests (31 days before start) */
  deadlineDate: Date
  /** Days until deadline (negative if past) */
  daysUntilDeadline: number
  /** Days until publish date (negative if past) */
  daysUntilPublish: number
  /** Days until period starts (negative if past) */
  daysUntilStart: number
  /** Whether requests can currently be submitted */
  isOpen: boolean
  /** Whether the deadline has passed */
  isPastDeadline: boolean
  /** Current status of the roster period */
  status: 'OPEN' | 'LOCKED' | 'PUBLISHED' | 'ARCHIVED'
}

/**
 * Minimal roster period info for database storage
 */
export interface RosterPeriod {
  id?: string
  code: string
  period_number: number
  year: number
  start_date: string
  end_date: string
  publish_date: string
  request_deadline_date: string
  status: 'OPEN' | 'LOCKED' | 'PUBLISHED' | 'ARCHIVED'
  created_at?: string
  updated_at?: string
}

// ============================================================================
// Core Calculation Functions
// ============================================================================

/**
 * Calculate the start date for any roster period
 *
 * Uses the known anchor point (RP12/2025 = 2025-10-11) and works backwards
 * or forwards to calculate the start date for any roster period.
 *
 * @param periodNumber - Roster period number (1-13)
 * @param year - Year
 * @returns Start date of the roster period
 *
 * @example
 * calculateRosterStartDate(1, 2025) // Returns start date of RP1/2025
 * calculateRosterStartDate(12, 2025) // Returns 2025-10-11 (anchor)
 */
export function calculateRosterStartDate(periodNumber: number, year: number): Date {
  // Validate inputs
  if (periodNumber < 1 || periodNumber > ROSTER_PERIODS_PER_YEAR) {
    throw new Error(`Period number must be between 1 and ${ROSTER_PERIODS_PER_YEAR}`)
  }

  // Calculate total periods from anchor point
  const anchorTotalPeriods = ANCHOR_YEAR * ROSTER_PERIODS_PER_YEAR + ANCHOR_ROSTER_PERIOD
  const targetTotalPeriods = year * ROSTER_PERIODS_PER_YEAR + periodNumber
  const periodsDifference = targetTotalPeriods - anchorTotalPeriods

  // Calculate days offset from anchor
  const daysOffset = periodsDifference * ROSTER_PERIOD_DAYS

  // Calculate start date
  const startDate = new Date(ANCHOR_START_DATE)
  startDate.setDate(startDate.getDate() + daysOffset)

  return startDate
}

/**
 * Calculate all dates and metadata for a roster period
 *
 * @param periodNumber - Roster period number (1-13)
 * @param year - Year
 * @returns Complete roster period information
 *
 * @example
 * const rp1 = calculateRosterPeriodDates(1, 2025)
 * console.log(rp1.code) // "RP1/2025"
 * console.log(rp1.daysUntilDeadline) // Days until request deadline
 */
export function calculateRosterPeriodDates(periodNumber: number, year: number): RosterPeriodDates {
  // Calculate start date
  const startDate = calculateRosterStartDate(periodNumber, year)

  // Calculate end date (27 days after start, inclusive 28-day period)
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + ROSTER_PERIOD_DAYS - 1)

  // Calculate publish date (10 days before start)
  const publishDate = new Date(startDate)
  publishDate.setDate(publishDate.getDate() - ROSTER_PUBLISH_DAYS_BEFORE)

  // Calculate deadline date (21 days before publish = 31 days before start)
  const deadlineDate = new Date(publishDate)
  deadlineDate.setDate(deadlineDate.getDate() - REQUEST_DEADLINE_DAYS_BEFORE_PUBLISH)

  // Calculate days until key dates
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()) // Midnight today

  const daysUntilDeadline = Math.ceil(
    (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )
  const daysUntilPublish = Math.ceil(
    (publishDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )
  const daysUntilStart = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  // Determine status
  const isPastDeadline = daysUntilDeadline < 0
  const isPublished = daysUntilPublish < 0
  const isActive = daysUntilStart <= 0 && now <= endDate
  const isPast = now > endDate

  let status: 'OPEN' | 'LOCKED' | 'PUBLISHED' | 'ARCHIVED'
  if (isPast) {
    status = 'ARCHIVED'
  } else if (isPublished) {
    status = 'PUBLISHED'
  } else if (isPastDeadline) {
    status = 'LOCKED'
  } else {
    status = 'OPEN'
  }

  const isOpen = status === 'OPEN'

  return {
    code: `RP${periodNumber.toString().padStart(2, '0')}/${year}`,
    periodNumber,
    year,
    startDate,
    endDate,
    publishDate,
    deadlineDate,
    daysUntilDeadline,
    daysUntilPublish,
    daysUntilStart,
    isOpen,
    isPastDeadline,
    status,
  }
}

/**
 * Get the roster period code for any given date
 *
 * Determines which roster period a specific date falls within.
 *
 * @param date - Any date
 * @returns Roster period code (e.g., "RP5/2025")
 *
 * @example
 * getRosterPeriodCodeFromDate(new Date('2025-10-15')) // "RP12/2025"
 */
export function getRosterPeriodCodeFromDate(date: Date): string {
  // Calculate days from anchor
  const daysFromAnchor = Math.floor(
    (date.getTime() - ANCHOR_START_DATE.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Calculate total periods from anchor (can be negative)
  const periodsFromAnchor = Math.floor(daysFromAnchor / ROSTER_PERIOD_DAYS)

  // Calculate target period and year
  const anchorTotalPeriods = ANCHOR_YEAR * ROSTER_PERIODS_PER_YEAR + ANCHOR_ROSTER_PERIOD
  const targetTotalPeriods = anchorTotalPeriods + periodsFromAnchor

  let year = Math.floor((targetTotalPeriods - 1) / ROSTER_PERIODS_PER_YEAR)
  let periodNumber = targetTotalPeriods - year * ROSTER_PERIODS_PER_YEAR

  // Handle edge cases
  if (periodNumber < 1) {
    year -= 1
    periodNumber += ROSTER_PERIODS_PER_YEAR
  } else if (periodNumber > ROSTER_PERIODS_PER_YEAR) {
    year += 1
    periodNumber -= ROSTER_PERIODS_PER_YEAR
  }

  return `RP${periodNumber.toString().padStart(2, '0')}/${year}`
}

/**
 * Get upcoming roster periods
 *
 * Returns the next N roster periods starting from today.
 * Useful for displaying upcoming periods in UI.
 *
 * @param count - Number of periods to return (default: 6)
 * @returns Array of roster period information
 *
 * @example
 * const upcoming = getUpcomingRosterPeriods(3)
 * // Returns next 3 roster periods with all calculated dates
 */
export function getUpcomingRosterPeriods(count: number = 6): RosterPeriodDates[] {
  const now = new Date()
  const currentPeriodCode = getRosterPeriodCodeFromDate(now)

  // Parse current period
  const match = currentPeriodCode.match(/RP(\d+)\/(\d+)/)
  if (!match) {
    throw new Error(`Invalid roster period code: ${currentPeriodCode}`)
  }

  let periodNumber = parseInt(match[1], 10)
  let year = parseInt(match[2], 10)

  const periods: RosterPeriodDates[] = []

  for (let i = 0; i < count; i++) {
    periods.push(calculateRosterPeriodDates(periodNumber, year))

    // Move to next period
    periodNumber += 1
    if (periodNumber > ROSTER_PERIODS_PER_YEAR) {
      periodNumber = 1
      year += 1
    }
  }

  return periods
}

/**
 * Calculate all roster periods that a date range spans
 *
 * Given a start and end date, returns all roster period codes that overlap
 * with that date range. Useful for showing which periods a request affects.
 *
 * @param startDate - Start date of the range
 * @param endDate - End date of the range
 * @returns Array of roster period codes (e.g., ["RP01/2026", "RP02/2026"])
 *
 * @example
 * // Request from Jan 30 to Feb 5 spans RP01 and RP02
 * const periods = getRosterPeriodsForDateRange(
 *   new Date('2026-01-30'),
 *   new Date('2026-02-05')
 * )
 * // Returns ["RP01/2026", "RP02/2026"]
 */
export function getRosterPeriodsForDateRange(
  startDate: Date | string,
  endDate: Date | string
): string[] {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate

  const periods: string[] = []
  const seenPeriods = new Set<string>()

  // Get the roster period for start date
  let currentDate = new Date(start)
  const endTime = end.getTime()

  // Iterate through dates until we reach the end date
  while (currentDate.getTime() <= endTime) {
    const periodCode = getRosterPeriodCodeFromDate(currentDate)

    if (!seenPeriods.has(periodCode)) {
      seenPeriods.add(periodCode)
      periods.push(periodCode)
    }

    // Move to next day
    currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)

    // Safety check: if we've found more than 5 periods, something is wrong
    if (periods.length > 5) {
      break
    }
  }

  return periods
}

// ============================================================================
// Database Synchronization
// ============================================================================

/**
 * Ensure roster periods exist in database
 *
 * Automatically checks if roster periods exist for current year + 2 years ahead.
 * If any years are missing, creates them automatically. This function is
 * idempotent (safe to call multiple times) and fast (< 1 second).
 *
 * Should be called:
 * - Before querying roster periods
 * - Before creating pilot requests
 * - In API endpoints that need roster period data
 *
 * @returns Object with success status and message
 *
 * @example
 * await ensureRosterPeriodsExist()
 * // Roster periods now guaranteed to exist for current + next 2 years
 */
export async function ensureRosterPeriodsExist(): Promise<{
  success: boolean
  message: string
  created: number
}> {
  const supabase = await createClient()
  const currentYear = new Date().getFullYear()
  const requiredYears = [currentYear, currentYear + 1, currentYear + 2]

  let totalCreated = 0

  try {
    for (const year of requiredYears) {
      // Check if any periods exist for this year
      const { data: existing, error: checkError } = await supabase
        .from('roster_periods')
        .select('code')
        .eq('year', year)
        .limit(1)

      if (checkError) {
        return {
          success: false,
          message: `Failed to check existing periods: ${checkError.message}`,
          created: totalCreated,
        }
      }

      // If no periods exist for this year, create all 13
      if (!existing || existing.length === 0) {
        const periodsToCreate: RosterPeriod[] = []

        for (let period = 1; period <= ROSTER_PERIODS_PER_YEAR; period++) {
          const dates = calculateRosterPeriodDates(period, year)

          periodsToCreate.push({
            code: dates.code,
            period_number: dates.periodNumber,
            year: dates.year,
            start_date: dates.startDate.toISOString().split('T')[0],
            end_date: dates.endDate.toISOString().split('T')[0],
            publish_date: dates.publishDate.toISOString().split('T')[0],
            request_deadline_date: dates.deadlineDate.toISOString().split('T')[0],
            status: dates.status,
          })
        }

        // Insert all periods for this year
        const { error: insertError } = await supabase.from('roster_periods').insert(periodsToCreate)

        if (insertError) {
          return {
            success: false,
            message: `Failed to create periods for ${year}: ${insertError.message}`,
            created: totalCreated,
          }
        }

        totalCreated += periodsToCreate.length
      }
    }

    return {
      success: true,
      message:
        totalCreated > 0
          ? `Created ${totalCreated} roster periods`
          : 'All required roster periods already exist',
      created: totalCreated,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      message: `Failed to ensure roster periods: ${errorMessage}`,
      created: totalCreated,
    }
  }
}

/**
 * Sync roster periods to database
 *
 * Creates or updates roster period records in the database for the current year
 * plus 2 years ahead. This ensures the database always has up-to-date roster
 * period information for leave request planning.
 *
 * Should be run:
 * - During application startup
 * - At the start of each new year
 * - When roster period configuration changes
 *
 * @returns Object containing sync statistics
 *
 * @example
 * const result = await syncRosterPeriodsToDatabase()
 * console.log(`Synced ${result.created} periods`)
 */
export async function syncRosterPeriodsToDatabase(): Promise<{
  created: number
  updated: number
  errors: string[]
}> {
  const supabase = await createClient()
  const now = new Date()
  const currentYear = now.getFullYear()

  const stats = {
    created: 0,
    updated: 0,
    errors: [] as string[],
  }

  try {
    // Generate periods for current year + 2 years ahead
    const periodsToSync: RosterPeriod[] = []

    for (let year = currentYear; year <= currentYear + 2; year++) {
      for (let period = 1; period <= ROSTER_PERIODS_PER_YEAR; period++) {
        const dates = calculateRosterPeriodDates(period, year)

        periodsToSync.push({
          code: dates.code,
          period_number: dates.periodNumber,
          year: dates.year,
          start_date: dates.startDate.toISOString().split('T')[0],
          end_date: dates.endDate.toISOString().split('T')[0],
          publish_date: dates.publishDate.toISOString().split('T')[0],
          request_deadline_date: dates.deadlineDate.toISOString().split('T')[0],
          status: dates.status,
        })
      }
    }

    // Upsert periods to database
    const { data, error } = await supabase
      .from('roster_periods')
      .upsert(periodsToSync, {
        onConflict: 'code',
        ignoreDuplicates: false,
      })
      .select()

    if (error) {
      stats.errors.push(`Database upsert failed: ${error.message}`)
      return stats
    }

    // Count created vs updated (this is approximate since upsert doesn't distinguish)
    stats.created = data?.length || periodsToSync.length
    stats.updated = 0 // Would need separate logic to track updates

    return stats
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    stats.errors.push(`Sync failed: ${errorMessage}`)
    return stats
  }
}

/**
 * Get roster period by code from database
 *
 * @param code - Roster period code (e.g., "RP1/2025")
 * @returns Roster period data or null if not found
 */
export async function getRosterPeriodByCode(code: string): Promise<RosterPeriod | null> {
  // Tracked: tasks/062 #4 - Uncomment after migration
  /*
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('roster_periods')
    .select('*')
    .eq('code', code)
    .single()

  if (error || !data) {
    return null
  }

  return data
  */

  // Fallback: calculate on-the-fly
  const parsed = parseRosterPeriodCode(code)
  if (!parsed) return null

  const dates = calculateRosterPeriodDates(parsed.periodNumber, parsed.year)
  return {
    code: dates.code,
    period_number: dates.periodNumber,
    year: dates.year,
    start_date: dates.startDate.toISOString().split('T')[0],
    end_date: dates.endDate.toISOString().split('T')[0],
    publish_date: dates.publishDate.toISOString().split('T')[0],
    request_deadline_date: dates.deadlineDate.toISOString().split('T')[0],
    status: dates.status,
  }
}

/**
 * Get all roster periods for a specific year
 *
 * @param year - Year to fetch periods for
 * @returns Array of roster periods
 */
export async function getRosterPeriodsByYear(year: number): Promise<RosterPeriod[]> {
  // Tracked: tasks/062 #4 - Uncomment after migration
  /*
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('roster_periods')
    .select('*')
    .eq('year', year)
    .order('period_number', { ascending: true })

  if (error || !data) {
    return []
  }

  return data
  */

  // Fallback: calculate on-the-fly
  const periods: RosterPeriod[] = []
  for (let period = 1; period <= ROSTER_PERIODS_PER_YEAR; period++) {
    const dates = calculateRosterPeriodDates(period, year)
    periods.push({
      code: dates.code,
      period_number: dates.periodNumber,
      year: dates.year,
      start_date: dates.startDate.toISOString().split('T')[0],
      end_date: dates.endDate.toISOString().split('T')[0],
      publish_date: dates.publishDate.toISOString().split('T')[0],
      request_deadline_date: dates.deadlineDate.toISOString().split('T')[0],
      status: dates.status,
    })
  }
  return periods
}

/**
 * Update roster period status in database
 *
 * @param code - Roster period code
 * @param status - New status
 * @returns Success boolean
 */
export async function updateRosterPeriodStatus(
  code: string,
  status: 'OPEN' | 'LOCKED' | 'PUBLISHED' | 'ARCHIVED'
): Promise<boolean> {
  // Tracked: tasks/062 #4 - Uncomment after migration
  /*
  const supabase = await createClient()

  const { error } = await supabase
    .from('roster_periods')
    .update({ status })
    .eq('code', code)

  return !error
  */

  console.warn('updateRosterPeriodStatus: Database sync not yet available')
  return false
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format roster period date for display
 *
 * @param date - Date to format
 * @returns Formatted date string (e.g., "Oct 11, 2025")
 */
export function formatRosterDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Get human-readable status description
 *
 * @param status - Roster period status
 * @returns Human-readable description
 */
export function getStatusDescription(status: 'OPEN' | 'LOCKED' | 'PUBLISHED' | 'ARCHIVED'): string {
  switch (status) {
    case 'OPEN':
      return 'Open for requests'
    case 'LOCKED':
      return 'Deadline passed - locked'
    case 'PUBLISHED':
      return 'Roster published'
    case 'ARCHIVED':
      return 'Period completed'
    default:
      return 'Unknown status'
  }
}

/**
 * Validate roster period code format
 *
 * Accepts both zero-padded (RP01, RP02) and non-padded (RP1, RP2) formats
 *
 * @param code - Roster period code to validate
 * @returns True if valid format
 */
export function isValidRosterPeriodCode(code: string): boolean {
  const pattern = /^RP(1[0-3]|0[1-9]|[1-9])\/\d{4}$/
  return pattern.test(code)
}

/**
 * Parse roster period code into components
 *
 * @param code - Roster period code (e.g., "RP1/2025")
 * @returns Object with period number and year, or null if invalid
 */
export function parseRosterPeriodCode(code: string): { periodNumber: number; year: number } | null {
  if (!isValidRosterPeriodCode(code)) {
    return null
  }

  const match = code.match(/RP(\d+)\/(\d+)/)
  if (!match) {
    return null
  }

  return {
    periodNumber: parseInt(match[1], 10),
    year: parseInt(match[2], 10),
  }
}
