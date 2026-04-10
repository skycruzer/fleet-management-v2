/**
 * Certification Expiry Grouping Utilities
 * Filters and groups certifications by expiry timeframes
 *
 * Business Rules:
 * - ONLY include certifications that are expiring or expired
 * - DO NOT include current/valid certifications (green status)
 * - Group by specific day ranges: 90, 60, 30, 14 days, and expired
 */

import { CertificationWithDetails } from '@/lib/services/certification-service'

/**
 * Expiry group definitions with metadata
 */
export interface ExpiryGroup {
  id: string
  label: string
  description: string
  color: 'red' | 'yellow' | 'orange'
  icon: string
  certifications: CertificationWithDetails[]
  // Certifications grouped by category within this expiry group
  byCategory?: Record<string, CertificationWithDetails[]>
}

/**
 * Filter and group certifications by expiry timeframe
 *
 * @param certifications - All certifications from the database
 * @returns Object with certifications grouped by expiry ranges
 *
 * @example
 * const grouped = groupCertificationsByExpiry(allCertifications)
 * console.log(grouped.expired.length) // Number of expired certifications
 */
/**
 * Helper function to group certifications by category
 */
function groupByCategory(
  certifications: CertificationWithDetails[]
): Record<string, CertificationWithDetails[]> {
  return certifications.reduce(
    (acc, cert) => {
      const category = cert.check_type?.category || 'Uncategorized'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(cert)
      return acc
    },
    {} as Record<string, CertificationWithDetails[]>
  )
}

export function groupCertificationsByExpiry(
  certifications: CertificationWithDetails[]
): Record<string, ExpiryGroup> {
  // Filter out current certifications (green status)
  // Only keep expiring (yellow) and expired (red) certifications
  const expiringOrExpired = certifications.filter(
    (cert) => cert.status && (cert.status.color === 'red' || cert.status.color === 'yellow')
  )

  // Group by expiry timeframes
  const groups: Record<string, ExpiryGroup> = {
    expired: {
      id: 'expired',
      label: 'Expired',
      description: 'Certifications that have already expired',
      color: 'red',
      icon: 'AlertCircle',
      certifications: expiringOrExpired.filter(
        (cert) => cert.status?.daysUntilExpiry !== undefined && cert.status.daysUntilExpiry < 0
      ),
      byCategory: {},
    },
    within14Days: {
      id: 'within14Days',
      label: 'Expiring Within 14 Days',
      description: 'Critical - requires immediate action',
      color: 'red',
      icon: 'AlertTriangle',
      certifications: expiringOrExpired.filter(
        (cert) =>
          cert.status?.daysUntilExpiry !== undefined &&
          cert.status.daysUntilExpiry >= 0 &&
          cert.status.daysUntilExpiry <= 14
      ),
      byCategory: {},
    },
    within30Days: {
      id: 'within30Days',
      label: 'Expiring Within 30 Days',
      description: 'High priority - action required soon',
      color: 'orange',
      icon: 'Clock',
      certifications: expiringOrExpired.filter(
        (cert) =>
          cert.status?.daysUntilExpiry !== undefined &&
          cert.status.daysUntilExpiry >= 15 &&
          cert.status.daysUntilExpiry <= 30
      ),
      byCategory: {},
    },
    within60Days: {
      id: 'within60Days',
      label: 'Expiring Within 60 Days',
      description: 'Medium priority - plan renewal',
      color: 'yellow',
      icon: 'AlertCircle',
      certifications: expiringOrExpired.filter(
        (cert) =>
          cert.status?.daysUntilExpiry !== undefined &&
          cert.status.daysUntilExpiry >= 31 &&
          cert.status.daysUntilExpiry <= 60
      ),
      byCategory: {},
    },
    within90Days: {
      id: 'within90Days',
      label: 'Expiring Within 90 Days',
      description: 'Normal priority - schedule renewal',
      color: 'yellow',
      icon: 'Info',
      certifications: expiringOrExpired.filter(
        (cert) =>
          cert.status?.daysUntilExpiry !== undefined &&
          cert.status.daysUntilExpiry >= 61 &&
          cert.status.daysUntilExpiry <= 90
      ),
      byCategory: {},
    },
  }

  // Add category grouping to each expiry group
  Object.values(groups).forEach((group) => {
    group.byCategory = groupByCategory(group.certifications)
  })

  return groups
}

/**
 * Get total count of expiring/expired certifications across all groups
 */
export function getTotalExpiringCount(groups: Record<string, ExpiryGroup>): number {
  return Object.values(groups).reduce((total, group) => total + group.certifications.length, 0)
}

/**
 * Get the most critical group (with certifications)
 * Priority: expired > 14 days > 30 days > 60 days > 90 days
 */
export function getMostCriticalGroup(groups: Record<string, ExpiryGroup>): ExpiryGroup | null {
  const priority = ['expired', 'within14Days', 'within30Days', 'within60Days', 'within90Days']

  for (const groupId of priority) {
    const group = groups[groupId]
    if (group && group.certifications.length > 0) {
      return group
    }
  }

  return null
}

/**
 * Format days until expiry as human-readable string
 */
export function formatDaysUntilExpiry(days: number): string {
  if (days < 0) {
    const daysAgo = Math.abs(days)
    return `Expired ${daysAgo} ${daysAgo === 1 ? 'day' : 'days'} ago`
  } else if (days === 0) {
    return 'Expires today'
  } else if (days === 1) {
    return 'Expires tomorrow'
  } else {
    return `Expires in ${days} days`
  }
}
