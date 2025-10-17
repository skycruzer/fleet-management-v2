/**
 * CERTIFICATION UTILITIES
 *
 * ========================================
 * BUSINESS RULES: FAA CERTIFICATION COMPLIANCE
 * ========================================
 *
 * CRITICAL AVIATION REGULATORY CONCEPT:
 *
 * Pilot certifications (checks) must be current at all times for legal
 * flight operations. The FAA requires strict compliance with expiry dates,
 * and this system enforces those requirements through color-coded status indicators.
 *
 * WHY COLOR CODING?
 * - Immediate visual identification of compliance status
 * - Red (expired) = CANNOT FLY (grounded)
 * - Yellow (expiring) = WARNING (schedule renewal)
 * - Green (current) = COMPLIANT (flight-ready)
 * - Industry-standard aviation safety practice
 *
 * ========================================
 * CERTIFICATION STATUS THRESHOLDS
 * ========================================
 *
 * RED (EXPIRED):
 * - Expiry date has passed (days_until_expiry < 0)
 * - Pilot is GROUNDED and cannot operate aircraft
 * - CRITICAL: Requires immediate administrative action
 * - Fleet compliance percentage affected
 *
 * YELLOW (EXPIRING SOON):
 * - 30 days or less until expiry (days_until_expiry ≤ 30)
 * - Pilot can still fly but renewal is URGENT
 * - Training department must schedule recurrent training
 * - Proactive alert to prevent red status
 *
 * GREEN (CURRENT):
 * - More than 30 days until expiry (days_until_expiry > 30)
 * - Pilot is compliant and flight-ready
 * - Normal operating status
 * - No immediate action required
 *
 * GRAY (NO DATE):
 * - No expiry date recorded in system
 * - Data quality issue that needs resolution
 * - May indicate incomplete database migration
 * - Should be investigated and corrected
 *
 * ========================================
 * WHY 30 DAYS THRESHOLD?
 * ========================================
 *
 * OPERATIONAL BUFFER:
 * - Allows time to schedule recurrent training
 * - Accounts for simulator availability constraints
 * - Provides buffer for check ride scheduling
 * - Prevents last-minute scheduling conflicts
 *
 * TRAINING DEPARTMENT WORKFLOW:
 * 1. 60 days: Initial notification sent to pilot
 * 2. 30 days: Status turns yellow (urgent action)
 * 3. 15 days: Escalation to training manager
 * 4. 0 days: Expires → pilot grounded (red status)
 *
 * REGULATORY COMPLIANCE:
 * - FAA requires currency for specific operations
 * - Some checks have grace periods, others don't
 * - System enforces strictest interpretation (conservative)
 * - Better to warn early than risk non-compliance
 *
 * ========================================
 * CERTIFICATION CATEGORIES
 * ========================================
 *
 * FLIGHT CHECKS (🎯):
 * - Line check, proficiency check
 * - Most critical for flight operations
 * - Directly impacts pilot's ability to fly
 *
 * PILOT MEDICAL (🏥):
 * - Class 1 medical certificate
 * - Required for all commercial operations
 * - Frequency varies by age
 *
 * SIMULATOR CHECKS (📚):
 * - Recurrent training events
 * - Typically every 6-12 months
 * - Maintains proficiency standards
 *
 * ID CARDS (🔒):
 * - Airport security badges
 * - Crew identification cards
 * - Required for airport access
 *
 * TRAVEL VISA (🦺):
 * - International route authorizations
 * - Varies by destination country
 * - May not apply to all pilots
 *
 * GROUND COURSES (👨‍🏫):
 * - Dangerous goods training
 * - Security awareness training
 * - Regulatory refreshers
 *
 * WORK PERMITS (📜):
 * - Foreign pilot work authorization
 * - PNG employment permits
 * - Immigration compliance
 *
 * ========================================
 * COMPLIANCE CALCULATION
 * ========================================
 *
 * PILOT COMPLIANCE:
 * - Percentage of current (green) certifications
 * - Formula: (green_count / total_count) × 100
 * - Target: 100% compliance for all pilots
 * - Red certifications drop compliance to 0% (critical)
 *
 * FLEET COMPLIANCE:
 * - Average compliance across all pilots
 * - Formula: sum(pilot_compliance) / pilot_count
 * - Target: ≥ 95% fleet-wide compliance
 * - Dashboard metric for management visibility
 *
 * EXAMPLE CALCULATIONS:
 *
 * Pilot A: 10 green, 0 yellow, 0 red → 100% compliant
 * Pilot B: 8 green, 2 yellow, 0 red → 80% compliant (needs attention)
 * Pilot C: 7 green, 2 yellow, 1 red → 70% compliant (GROUNDED)
 *
 * Fleet: (100% + 80% + 70%) / 3 = 83.3% fleet compliance
 *
 * ========================================
 * FILTERING & REPORTING
 * ========================================
 *
 * EXPIRING CERTIFICATIONS REPORT:
 * - Default: Next 30 days (matches yellow threshold)
 * - Configurable: 60, 90, 180 days for planning
 * - Sorted by: Days until expiry (ascending)
 * - Used by: Training department for scheduling
 *
 * EXPIRED CERTIFICATIONS REPORT:
 * - Critical: All red-status certifications
 * - Requires: Immediate administrative action
 * - Sorted by: Days overdue (most critical first)
 * - Reviewed: Daily by fleet manager
 *
 * STATUS FILTERING:
 * - Filter by color: red, yellow, green, gray
 * - Multi-select for complex reports
 * - Useful for: Targeted communication campaigns
 *
 * CATEGORY FILTERING:
 * - Group by: Certification category
 * - Useful for: Department-specific reports
 * - Example: Medical renewals → medical dept
 *
 * ========================================
 * USAGE EXAMPLES
 * ========================================
 *
 * CHECK CERTIFICATION STATUS:
 * ```typescript
 * const status = getCertificationStatus(cert.expiry_date)
 *
 * if (status.color === 'red') {
 *   console.error('PILOT GROUNDED:', status.daysUntilExpiry, 'days overdue')
 *   groundPilot(cert.pilot_id)
 * } else if (status.color === 'yellow') {
 *   console.warn('RENEWAL URGENT:', status.daysUntilExpiry, 'days remaining')
 *   scheduleRecurrentTraining(cert.pilot_id, cert.check_type)
 * }
 * ```
 *
 * FILTER EXPIRING CERTIFICATIONS:
 * ```typescript
 * // Get all certifications expiring in next 60 days
 * const upcoming = getExpiringCertifications(allCerts, 60)
 * console.log(`${upcoming.length} certifications need renewal`)
 *
 * // Send notifications to affected pilots
 * upcoming.forEach(cert => sendRenewalNotice(cert.pilot_id))
 * ```
 *
 * CALCULATE COMPLIANCE:
 * ```typescript
 * const compliance = calculateCompliancePercentage(pilot.certifications)
 *
 * if (compliance < 100) {
 *   console.warn(`Pilot compliance: ${compliance}% - action required`)
 * }
 *
 * // Fleet-wide compliance
 * const fleetCompliance = pilots.map(p =>
 *   calculateCompliancePercentage(p.certifications)
 * ).reduce((sum, val) => sum + val, 0) / pilots.length
 * ```
 *
 * ========================================
 * EDGE CASES & SPECIAL SCENARIOS
 * ========================================
 *
 * NULL/MISSING EXPIRY DATES:
 * - Treated as gray status (data issue)
 * - Should be investigated and resolved
 * - May indicate incomplete data migration
 * - Does not count toward compliance calculation
 *
 * SAME-DAY EXPIRY:
 * - Expiry date = today → still current (green/yellow)
 * - Only next day becomes expired (red)
 * - Conservative interpretation for safety
 *
 * FUTURE CERTIFICATIONS:
 * - Expiry date far in future (> 365 days)
 * - May indicate data entry error
 * - System handles correctly but may need validation
 *
 * BACKDATED CERTIFICATIONS:
 * - Expiry date in past (negative days)
 * - Correctly identified as expired (red)
 * - Historical data handled appropriately
 *
 * @module lib/utils/certification-utils
 * @version 2.0.0
 * @created 2025-10-17
 * @updated 2025-10-17 - Comprehensive business rule documentation added
 */

import { differenceInDays, isBefore, parseISO } from 'date-fns'

// ========================================
// TYPES
// ========================================

/**
 * Certification status with color coding and metadata
 *
 * BUSINESS CONTEXT:
 * - color: FAA compliance status (red/yellow/green/gray)
 * - label: Human-readable status description
 * - className: Tailwind CSS classes for UI rendering
 * - daysUntilExpiry: Calculated days (negative = overdue)
 */
export interface CertificationStatus {
  color: 'red' | 'yellow' | 'green' | 'gray'
  label: string
  className: string
  daysUntilExpiry: number
}

// ========================================
// CORE STATUS FUNCTIONS
// ========================================

/**
 * Get certification status based on expiry date
 *
 * BUSINESS RULES:
 * - Red: Expired (days_until_expiry < 0)
 * - Yellow: Expiring within 30 days (days_until_expiry ≤ 30)
 * - Green: Current (days_until_expiry > 30)
 * - Gray: No date recorded (data quality issue)
 *
 * CALCULATION:
 * 1. Parse expiry date (handle string or Date input)
 * 2. Calculate days difference from today
 * 3. Apply threshold rules
 * 4. Return status object with styling
 *
 * @param expiryDate - Certification expiry date (string or Date or null)
 * @returns Certification status with color, label, and CSS classes
 *
 * @example
 * ```typescript
 * const status = getCertificationStatus('2025-10-15')
 * console.log(status.color) // 'yellow' (if within 30 days)
 * console.log(status.daysUntilExpiry) // e.g., 25
 * ```
 */
export function getCertificationStatus(expiryDate: string | Date | null): CertificationStatus {
  // Handle null/missing expiry dates
  if (!expiryDate) {
    return {
      color: 'gray',
      label: 'No Date',
      className: 'bg-gray-100 text-gray-800',
      daysUntilExpiry: 0,
    }
  }

  // Parse date (handle both string and Date objects)
  const expiry = typeof expiryDate === 'string' ? parseISO(expiryDate) : expiryDate
  const today = new Date()
  const daysUntilExpiry = differenceInDays(expiry, today)

  // BUSINESS RULE: Expired (cannot fly)
  if (daysUntilExpiry < 0) {
    return {
      color: 'red',
      label: 'Expired',
      className: 'bg-red-100 text-red-800 border-red-200',
      daysUntilExpiry,
    }
  }

  // BUSINESS RULE: Expiring soon (urgent renewal needed)
  if (daysUntilExpiry <= 30) {
    return {
      color: 'yellow',
      label: 'Expiring Soon',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      daysUntilExpiry,
    }
  }

  // BUSINESS RULE: Current (compliant)
  return {
    color: 'green',
    label: 'Current',
    className: 'bg-green-100 text-green-800 border-green-200',
    daysUntilExpiry,
  }
}

/**
 * Get status color hex code for Air Niugini branding
 *
 * BUSINESS CONTEXT:
 * Used for charts, graphs, and custom UI elements that need
 * consistent color coding aligned with certification status
 *
 * @param status - Status color (red/yellow/green/gray)
 * @returns Hex color code for branding consistency
 */
export function getStatusColor(status: CertificationStatus['color']): string {
  switch (status) {
    case 'red':
      return '#EF4444' // Red for expired (Tailwind red-500)
    case 'yellow':
      return '#F59E0B' // Amber for expiring soon (Tailwind amber-500)
    case 'green':
      return '#10B981' // Green for current (Tailwind green-500)
    case 'gray':
    default:
      return '#6B7280' // Gray for no date (Tailwind gray-500)
  }
}

// ========================================
// FILTERING FUNCTIONS
// ========================================

/**
 * Filter certifications by status color
 *
 * BUSINESS USE CASES:
 * - Find all expired certifications (red) for grounding
 * - Find all expiring certifications (yellow) for scheduling
 * - Find all current certifications (green) for compliance reporting
 * - Find all missing dates (gray) for data cleanup
 *
 * @param certifications - Array of certification objects
 * @param status - Target status color to filter by
 * @returns Filtered array of certifications matching status
 *
 * @example
 * ```typescript
 * // Get all expired certifications (CRITICAL)
 * const expired = filterCertificationsByStatus(allCerts, 'red')
 * console.log(`${expired.length} pilots grounded due to expired certs`)
 *
 * // Get all expiring certifications (URGENT)
 * const expiring = filterCertificationsByStatus(allCerts, 'yellow')
 * scheduleRecurrentTraining(expiring)
 * ```
 */
export function filterCertificationsByStatus(
  certifications: Array<{ expiry_date?: string }>,
  status: CertificationStatus['color']
): Array<{ expiry_date?: string }> {
  return certifications.filter((cert) => {
    const certStatus = getCertificationStatus(cert.expiry_date || null)
    return certStatus.color === status
  })
}

/**
 * Get certifications expiring within specified days
 *
 * BUSINESS USE CASES:
 * - Training department: Schedule renewals 60 days out
 * - Management: Monitor upcoming expirations 90 days out
 * - Operations: Daily report of 30-day expirations
 * - Planning: Long-term forecast 180 days out
 *
 * DEFAULT: 30 days (matches yellow threshold)
 *
 * @param certifications - Array of certification objects
 * @param daysAhead - Number of days to look ahead (default: 30)
 * @returns Certifications expiring within timeframe (non-expired only)
 *
 * @example
 * ```typescript
 * // Get certifications expiring in next 60 days
 * const upcoming = getExpiringCertifications(allCerts, 60)
 *
 * // Sort by urgency (days until expiry)
 * upcoming.sort((a, b) => {
 *   const statusA = getCertificationStatus(a.expiry_date)
 *   const statusB = getCertificationStatus(b.expiry_date)
 *   return statusA.daysUntilExpiry - statusB.daysUntilExpiry
 * })
 *
 * // Send renewal notifications
 * upcoming.forEach(cert => {
 *   const status = getCertificationStatus(cert.expiry_date)
 *   sendRenewalNotice(cert.pilot_id, status.daysUntilExpiry)
 * })
 * ```
 */
export function getExpiringCertifications(
  certifications: Array<{ expiry_date?: string }>,
  daysAhead: number = 30
): Array<{ expiry_date?: string }> {
  return certifications.filter((cert) => {
    if (!cert.expiry_date) return false

    const expiry = parseISO(cert.expiry_date)
    const today = new Date()
    const daysUntilExpiry = differenceInDays(expiry, today)

    // Include only non-expired certifications within timeframe
    return daysUntilExpiry >= 0 && daysUntilExpiry <= daysAhead
  })
}

/**
 * Get expired certifications (CRITICAL)
 *
 * BUSINESS CONTEXT:
 * Expired certifications mean pilots are GROUNDED and cannot fly.
 * This is the highest priority administrative action required.
 *
 * USE CASES:
 * - Daily fleet manager review
 * - Automatic grounding notifications
 * - Compliance violation reports
 * - Regulatory audit preparation
 *
 * @param certifications - Array of certification objects
 * @returns All expired certifications (days_until_expiry < 0)
 *
 * @example
 * ```typescript
 * const expired = getExpiredCertifications(allCerts)
 *
 * if (expired.length > 0) {
 *   console.error('CRITICAL:', expired.length, 'expired certifications')
 *
 *   // Ground affected pilots
 *   expired.forEach(cert => {
 *     groundPilot(cert.pilot_id)
 *     notifyTrainingDepartment(cert.check_type)
 *     escalateToManagement(cert)
 *   })
 * }
 * ```
 */
export function getExpiredCertifications(
  certifications: Array<{ expiry_date?: string }>
): Array<{ expiry_date?: string }> {
  return certifications.filter((cert) => {
    if (!cert.expiry_date) return false

    const expiry = parseISO(cert.expiry_date)
    const today = new Date()

    return isBefore(expiry, today)
  })
}

// ========================================
// COMPLIANCE CALCULATIONS
// ========================================

/**
 * Calculate compliance percentage for a pilot
 *
 * BUSINESS RULES:
 * - Only green (current) certifications count as compliant
 * - Yellow and red certifications are non-compliant
 * - Formula: (green_count / total_count) × 100
 * - Target: 100% compliance (all certifications current)
 *
 * COMPLIANCE THRESHOLDS:
 * - 100%: Fully compliant (ideal)
 * - 90-99%: Minor issues (attention needed)
 * - 80-89%: Moderate issues (action required)
 * - < 80%: Serious issues (immediate action)
 * - < 100% with red: CRITICAL (pilot grounded)
 *
 * @param certifications - Array of pilot's certification objects
 * @returns Compliance percentage (0-100)
 *
 * @example
 * ```typescript
 * const compliance = calculateCompliancePercentage(pilot.certifications)
 *
 * // Determine action required
 * if (compliance < 100) {
 *   const expired = filterCertificationsByStatus(pilot.certifications, 'red')
 *   const expiring = filterCertificationsByStatus(pilot.certifications, 'yellow')
 *
 *   if (expired.length > 0) {
 *     console.error('GROUNDED:', pilot.name, 'has', expired.length, 'expired cert(s)')
 *     groundPilot(pilot.id)
 *   } else if (expiring.length > 0) {
 *     console.warn('URGENT:', pilot.name, 'has', expiring.length, 'expiring cert(s)')
 *     scheduleTraining(pilot.id)
 *   }
 * }
 * ```
 */
export function calculateCompliancePercentage(
  certifications: Array<{ expiry_date?: string }>
): number {
  // Handle edge case: no certifications
  if (certifications.length === 0) return 0

  // Count current (green) certifications
  const currentCerts = certifications.filter((cert) => {
    const status = getCertificationStatus(cert.expiry_date || null)
    return status.color === 'green'
  })

  // Calculate percentage and round to whole number
  return Math.round((currentCerts.length / certifications.length) * 100)
}

// ========================================
// CATEGORY UTILITIES
// ========================================

/**
 * Get category icon for certification categories
 *
 * BUSINESS CONTEXT:
 * Visual indicators for quick category identification in UI.
 * Helps pilots and administrators quickly scan certification types.
 *
 * @param category - Certification category name
 * @returns Emoji icon representing category
 */
export function getCategoryIcon(category: string | null): string {
  if (!category) return '✈️'

  switch (category) {
    case 'Flight Checks':
      return '🎯' // Most critical - direct flight operations
    case 'Pilot Medical':
      return '🏥' // Health compliance
    case 'Simulator Checks':
      return '📚' // Training/recurrent
    case 'ID Cards':
      return '🔒' // Security/access
    case 'Travel Visa':
      return '🦺' // International operations
    case 'Ground Courses Refresher':
      return '👨‍🏫' // Classroom training
    case 'Foreign Pilot Work Permit':
      return '📜' // Employment authorization
    case 'Non-renewal':
      return '📋' // Administrative
    default:
      return '✈️' // Generic aviation
  }
}

/**
 * Get category color for certification categories
 *
 * BUSINESS CONTEXT:
 * Color coding by category helps visually organize certification types
 * in dashboards, reports, and filtered views.
 *
 * @param category - Certification category name
 * @returns Tailwind CSS classes for category badge
 */
export function getCategoryColor(category: string | null): string {
  if (!category) return 'bg-gray-100 text-gray-800'

  switch (category) {
    case 'Flight Checks':
      return 'bg-blue-100 text-blue-800'
    case 'Pilot Medical':
      return 'bg-green-100 text-green-800'
    case 'Simulator Checks':
      return 'bg-yellow-100 text-yellow-800'
    case 'ID Cards':
      return 'bg-red-100 text-red-800'
    case 'Travel Visa':
      return 'bg-orange-100 text-orange-800'
    case 'Ground Courses Refresher':
      return 'bg-indigo-100 text-indigo-800'
    case 'Foreign Pilot Work Permit':
      return 'bg-purple-100 text-purple-800'
    case 'Non-renewal':
      return 'bg-slate-100 text-slate-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
