/**
 * Grace Period Utilities
 * Handles grace period calculations for different certification categories
 *
 * Business Rules:
 * - Pilot Medical: 28 days grace period
 * - Flight Checks: 90 days grace period
 * - Simulator Checks: 60 days grace period
 * - Ground Courses: 60 days grace period
 * - ID Cards/Work Permits: 0 days (renew on or after expiry)
 */

import { subDays } from 'date-fns'

/**
 * Grace period configuration by certification category
 */
export const GRACE_PERIODS: Record<string, number> = {
  'Pilot Medical': 28,
  'Flight Checks': 90,
  'Simulator Checks': 60,
  'Ground Courses Refresher': 60,
  'ID Cards': 0,
  'Foreign Pilot Work Permit': 0,
}

/**
 * Get grace period days for a certification category
 */
export function getGracePeriod(category: string): number {
  return GRACE_PERIODS[category] ?? 0
}

/**
 * Calculate renewal window for a certification
 * Returns the start and end dates when renewal can occur
 *
 * Note: The renewal window END is one day BEFORE expiry, not on expiry date.
 * This ensures renewals happen before the certification expires.
 */
export function calculateRenewalWindow(
  expiryDate: Date,
  category: string
): { start: Date; end: Date } {
  const gracePeriod = getGracePeriod(category)
  const windowStart = subDays(expiryDate, gracePeriod)
  // End date is one day before expiry to ensure renewal happens before expiration
  const windowEnd = subDays(expiryDate, 1)

  return {
    start: windowStart,
    end: windowEnd,
  }
}

/**
 * Check if a given date falls within the renewal window
 */
export function isWithinRenewalWindow(date: Date, expiryDate: Date, category: string): boolean {
  const { start, end } = calculateRenewalWindow(expiryDate, category)
  return date >= start && date <= end
}

/**
 * Get human-readable description of grace period
 */
export function getGracePeriodDescription(category: string): string {
  const days = getGracePeriod(category)

  if (days === 0) {
    return 'No grace period - renew on or after expiry'
  }

  return `Can renew up to ${days} days before expiry`
}

/**
 * Validate that a planned renewal date is within the allowed window
 */
export function validateRenewalDate(
  plannedDate: Date,
  expiryDate: Date,
  category: string
): { valid: boolean; error?: string } {
  const { start, end } = calculateRenewalWindow(expiryDate, category)

  if (plannedDate < start) {
    return {
      valid: false,
      error: `Renewal date is too early. Earliest allowed: ${start.toLocaleDateString()}`,
    }
  }

  if (plannedDate > end) {
    return {
      valid: false,
      error: `Renewal date is past expiry. Latest allowed: ${end.toLocaleDateString()}`,
    }
  }

  return { valid: true }
}

/**
 * Categories that can be included in renewal planning
 * (grace period >= 60 days allows for meaningful advance scheduling)
 */
export const PLANNABLE_CATEGORIES = [
  'Flight Checks',
  'Simulator Checks',
  'Ground Courses Refresher',
] as const

/**
 * Categories excluded from renewal planning
 * Medical has 28-day window - too short for advance planning
 */
export const NON_PLANNABLE_CATEGORIES = ['Pilot Medical'] as const

/**
 * Check if a category is suitable for renewal planning
 * Categories with grace periods < 60 days are excluded
 */
export function isPlannable(category: string): boolean {
  return PLANNABLE_CATEGORIES.includes(category as (typeof PLANNABLE_CATEGORIES)[number])
}

/**
 * Get minimum grace period required for planning (60 days)
 */
export const MIN_PLANNABLE_GRACE_PERIOD = 60
