/**
 * Grace Period Utilities
 * Handles grace period calculations for different certification categories
 *
 * Business Rules:
 * - Pilot Medical: 28 days grace period
 * - Flight/Simulator Checks: 90 days grace period
 * - Ground Courses: 60 days grace period
 * - ID Cards/Work Permits/Visas: 0 days (renew on or after expiry)
 */

import { subDays } from 'date-fns'

/**
 * Grace period configuration by certification category
 */
export const GRACE_PERIODS: Record<string, number> = {
  'Pilot Medical': 28,
  'Flight Checks': 90,
  'Simulator Checks': 90,
  'Ground Courses Refresher': 60,
  'ID Cards': 0,
  'Foreign Pilot Work Permit': 0,
  'Travel Visa': 0,
  'Non-renewal': 0,
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
 */
export function calculateRenewalWindow(
  expiryDate: Date,
  category: string
): { start: Date; end: Date } {
  const gracePeriod = getGracePeriod(category)
  const windowStart = subDays(expiryDate, gracePeriod)

  return {
    start: windowStart,
    end: expiryDate,
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
