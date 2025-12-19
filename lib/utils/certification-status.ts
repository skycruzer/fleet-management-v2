/**
 * Shared Certification Status Utility
 * Developer: Maurice Rondeau
 * Date: December 18, 2025
 *
 * Consolidates certification status calculation logic that was duplicated across:
 * - pilot-service.ts (30-day threshold)
 * - certification-service.ts (90-day threshold)
 * - expiring-certifications-service.ts (configurable thresholds)
 *
 * FAA Color Coding Standard:
 * - 🔴 Red: Expired (days < 0)
 * - 🟡 Yellow: Expiring Soon (days ≤ threshold)
 * - 🟢 Green: Current (days > threshold)
 */

export type CertificationColor = 'red' | 'yellow' | 'green' | 'gray'
export type CertificationLabel = 'Expired' | 'Expiring Soon' | 'Current' | 'No Date'

export interface CertificationStatus {
  color: CertificationColor
  label: CertificationLabel
  daysUntilExpiry?: number
}

/**
 * Default thresholds (in days) - matches FAA compliance standards
 */
export const DEFAULT_THRESHOLDS = {
  /** Items expiring within this many days show as "Expiring Soon" */
  WARNING_DAYS: 30,
  /** Extended threshold for certification overview pages */
  EXTENDED_WARNING_DAYS: 90,
} as const

/**
 * Calculate certification status based on expiry date
 *
 * @param expiryDate - The expiration date (Date object, string, or null)
 * @param warningThresholdDays - Days before expiry to show warning (default: 30)
 * @returns CertificationStatus with color, label, and daysUntilExpiry
 *
 * @example
 * // Basic usage
 * const status = getCertificationStatus(new Date('2025-01-15'))
 *
 * @example
 * // With custom threshold
 * const status = getCertificationStatus(expiryDate, 90)
 */
export function getCertificationStatus(
  expiryDate: Date | string | null | undefined,
  warningThresholdDays: number = DEFAULT_THRESHOLDS.WARNING_DAYS
): CertificationStatus {
  // Handle null/undefined case
  if (!expiryDate) {
    return { color: 'gray', label: 'No Date' }
  }

  // Normalize to Date object
  const expiry = expiryDate instanceof Date ? expiryDate : new Date(expiryDate)

  // Validate date
  if (isNaN(expiry.getTime())) {
    return { color: 'gray', label: 'No Date' }
  }

  const today = new Date()
  // Reset time to compare dates only (not time)
  today.setHours(0, 0, 0, 0)
  const expiryNormalized = new Date(expiry)
  expiryNormalized.setHours(0, 0, 0, 0)

  const daysUntilExpiry = Math.ceil(
    (expiryNormalized.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysUntilExpiry < 0) {
    return {
      color: 'red',
      label: 'Expired',
      daysUntilExpiry,
    }
  }

  if (daysUntilExpiry <= warningThresholdDays) {
    return {
      color: 'yellow',
      label: 'Expiring Soon',
      daysUntilExpiry,
    }
  }

  return {
    color: 'green',
    label: 'Current',
    daysUntilExpiry,
  }
}

/**
 * Get detailed certification status with multiple threshold levels
 * Useful for compliance dashboards that need more granular status
 *
 * @param expiryDate - The expiration date
 * @returns Extended status with specific expiry category
 */
export function getDetailedCertificationStatus(expiryDate: Date | string | null | undefined): {
  status: CertificationStatus
  category: 'EXPIRED' | 'EXPIRING_7_DAYS' | 'EXPIRING_30_DAYS' | 'EXPIRING_60_DAYS' | 'EXPIRING_90_DAYS' | 'CURRENT' | 'NO_DATE'
  urgency: 'critical' | 'high' | 'medium' | 'low' | 'none'
} {
  const status = getCertificationStatus(expiryDate, 90)

  if (!status.daysUntilExpiry && status.daysUntilExpiry !== 0) {
    return { status, category: 'NO_DATE', urgency: 'none' }
  }

  const days = status.daysUntilExpiry

  if (days < 0) {
    return { status, category: 'EXPIRED', urgency: 'critical' }
  }
  if (days <= 7) {
    return { status, category: 'EXPIRING_7_DAYS', urgency: 'critical' }
  }
  if (days <= 30) {
    return { status, category: 'EXPIRING_30_DAYS', urgency: 'high' }
  }
  if (days <= 60) {
    return { status, category: 'EXPIRING_60_DAYS', urgency: 'medium' }
  }
  if (days <= 90) {
    return { status, category: 'EXPIRING_90_DAYS', urgency: 'low' }
  }

  return { status, category: 'CURRENT', urgency: 'none' }
}

/**
 * Calculate days until expiry
 * Utility function for when you just need the number
 *
 * @param expiryDate - The expiration date
 * @returns Number of days until expiry (negative if expired), or null if no date
 */
export function getDaysUntilExpiry(expiryDate: Date | string | null | undefined): number | null {
  if (!expiryDate) return null

  const expiry = expiryDate instanceof Date ? expiryDate : new Date(expiryDate)
  if (isNaN(expiry.getTime())) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiryNormalized = new Date(expiry)
  expiryNormalized.setHours(0, 0, 0, 0)

  return Math.ceil(
    (expiryNormalized.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )
}

/**
 * Format days until expiry as human-readable string
 *
 * @param daysUntilExpiry - Number of days (can be negative)
 * @returns Formatted string like "15 days", "Expired 3 days ago", "Today"
 */
export function formatDaysUntilExpiry(daysUntilExpiry: number | null): string {
  if (daysUntilExpiry === null) return 'No date'
  if (daysUntilExpiry === 0) return 'Today'
  if (daysUntilExpiry === 1) return '1 day'
  if (daysUntilExpiry === -1) return 'Expired yesterday'
  if (daysUntilExpiry < 0) return `Expired ${Math.abs(daysUntilExpiry)} days ago`
  return `${daysUntilExpiry} days`
}
