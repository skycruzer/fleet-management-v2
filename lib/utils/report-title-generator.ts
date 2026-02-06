/**
 * Report Title Generator
 * Author: Maurice Rondeau
 * Date: February 2026
 *
 * Generates dynamic report titles based on applied filters and criteria.
 * Titles reflect the specific filters used to generate reports.
 */

import type { ReportType, ReportFilters } from '@/types/reports'

/**
 * Base titles for each report type
 */
const BASE_TITLES: Record<ReportType, string> = {
  'rdo-sdo': 'RDO/SDO Requests Report',
  leave: 'Leave Requests Report',
  'leave-bids': 'Leave Bids Report',
  'all-requests': 'All Requests Report',
  'flight-requests': 'Flight Requests Report',
  certifications: 'Certifications Report',
  'pilot-info': 'Pilot Information Report',
  forecast: 'Workforce Forecast',
}

/**
 * Format a date as "Mon YYYY" (e.g., "Jan 2026")
 */
function formatMonthYear(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

/**
 * Format roster periods for display
 * Single: "RP01/2026"
 * Range: "RP01-RP03/2026" (same year) or "RP12/2025 to RP03/2026" (different years)
 */
function formatRosterPeriods(rosterPeriods: string[]): string | null {
  if (!rosterPeriods || rosterPeriods.length === 0) return null

  if (rosterPeriods.length === 1) {
    return rosterPeriods[0]
  }

  // Sort periods chronologically
  const sorted = [...rosterPeriods].sort((a, b) => {
    const matchA = a.match(/^RP(\d+)\/(\d{4})$/)
    const matchB = b.match(/^RP(\d+)\/(\d{4})$/)
    if (!matchA || !matchB) return 0

    const yearA = parseInt(matchA[2], 10)
    const yearB = parseInt(matchB[2], 10)
    if (yearA !== yearB) return yearA - yearB

    return parseInt(matchA[1], 10) - parseInt(matchB[1], 10)
  })

  const first = sorted[0]
  const last = sorted[sorted.length - 1]

  // Parse first and last periods
  const firstMatch = first.match(/^RP(\d+)\/(\d{4})$/)
  const lastMatch = last.match(/^RP(\d+)\/(\d{4})$/)

  if (!firstMatch || !lastMatch) {
    return rosterPeriods.join(', ')
  }

  const firstYear = firstMatch[2]
  const lastYear = lastMatch[2]

  if (firstYear === lastYear) {
    // Same year: "RP01-RP03/2026"
    return `RP${firstMatch[1]}-RP${lastMatch[1]}/${firstYear}`
  }

  // Different years: "RP12/2025 to RP03/2026"
  return `${first} to ${last}`
}

/**
 * Format date range for display
 * Returns "Jan 2026 to Mar 2026" format
 */
function formatDateRange(dateRange: { startDate: string; endDate: string }): string | null {
  if (!dateRange?.startDate || !dateRange?.endDate) return null

  const start = formatMonthYear(dateRange.startDate)
  const end = formatMonthYear(dateRange.endDate)

  if (start === end) {
    return start
  }

  return `${start} to ${end}`
}

/**
 * Format status array for display
 * Converts status codes to readable format
 */
function formatStatus(status: string[]): string | null {
  if (!status || status.length === 0) return null

  const statusLabels: Record<string, string> = {
    SUBMITTED: 'Submitted',
    IN_REVIEW: 'In Review',
    APPROVED: 'Approved',
    DENIED: 'Denied',
    WITHDRAWN: 'Withdrawn',
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    REJECTED: 'Rejected',
  }

  const formatted = status.map((s) => statusLabels[s.toUpperCase()] || s)

  if (formatted.length === 1) {
    return formatted[0]
  }

  // For multiple statuses, join them
  return formatted.join(', ')
}

/**
 * Format rank filter for display
 */
function formatRank(rank: string[]): string | null {
  if (!rank || rank.length === 0) return null

  if (rank.length === 1) {
    if (rank[0] === 'Captain') return 'Captains Only'
    if (rank[0] === 'First Officer') return 'First Officers Only'
    return rank[0]
  }

  // If both ranks are selected, no need to show filter
  if (rank.includes('Captain') && rank.includes('First Officer')) {
    return null
  }

  return rank.join(', ')
}

/**
 * Format request type filter for RDO/SDO reports
 */
function formatRequestType(requestType: string[]): string | null {
  if (!requestType || requestType.length === 0) return null

  if (requestType.length === 1) {
    return requestType[0]
  }

  // If both types selected, return null (default behavior)
  if (requestType.includes('RDO') && requestType.includes('SDO')) {
    return null
  }

  return requestType.join('/')
}

/**
 * Format expiry threshold for certifications
 */
function formatExpiryThreshold(threshold: number): string | null {
  if (threshold === undefined || threshold === null) return null
  return `Expiring in ${threshold} Days`
}

/**
 * Format certification categories
 */
function formatCategories(categories: string[]): string | null {
  if (!categories || categories.length === 0) return null

  // Capitalize each category
  const formatted = categories.map((c) => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase())

  if (formatted.length <= 3) {
    return formatted.join(', ')
  }

  // If too many, show count
  return `${formatted.length} Categories`
}

/**
 * Format time horizon for forecast reports
 */
function formatTimeHorizon(horizon: string): string | null {
  if (!horizon) return null

  const horizonLabels: Record<string, string> = {
    '2yr': '2 Year Horizon',
    '5yr': '5 Year Horizon',
    '10yr': '10 Year Horizon',
  }

  return horizonLabels[horizon] || horizon
}

/**
 * Format forecast sections
 */
function formatForecastSections(sections: string[]): string | null {
  if (!sections || sections.length === 0) return null

  // If all sections selected, no need to show
  if (sections.length >= 3) return null

  const sectionLabels: Record<string, string> = {
    retirement: 'Retirement',
    succession: 'Succession',
    shortage: 'Shortage',
  }

  const formatted = sections.map((s) => sectionLabels[s] || s)
  return formatted.join(', ')
}

/**
 * Format active status filter
 */
function formatActiveStatus(status: string): string | null {
  if (!status || status === 'all') return null
  return status === 'active' ? 'Active Only' : 'Inactive Only'
}

/**
 * Format qualifications filter
 */
function formatQualifications(qualifications: string[]): string | null {
  if (!qualifications || qualifications.length === 0) return null

  const qualLabels: Record<string, string> = {
    line_captain: 'Line Captain',
    training_captain: 'Training Captain',
    examiner: 'Examiner',
  }

  const formatted = qualifications.map((q) => qualLabels[q] || q)

  if (formatted.length === 1) {
    return formatted[0]
  }

  return formatted.join(', ')
}

/**
 * Format licence type filter
 */
function formatLicenceType(types: string[]): string | null {
  if (!types || types.length === 0) return null

  if (types.length === 1) {
    return types[0]
  }

  // If both types, don't show filter
  if (types.includes('ATPL') && types.includes('CPL')) {
    return null
  }

  return types.join('/')
}

/**
 * Build title segments based on report type and filters
 */
function buildTitleSegments(reportType: ReportType, filters: ReportFilters): string[] {
  const segments: string[] = []

  // Priority: Roster periods > Date range (don't show both)
  if (filters.rosterPeriods && filters.rosterPeriods.length > 0) {
    const rpSegment = formatRosterPeriods(filters.rosterPeriods)
    if (rpSegment) segments.push(rpSegment)
  } else if (filters.rosterPeriod) {
    segments.push(filters.rosterPeriod)
  } else if (filters.dateRange) {
    const dateSegment = formatDateRange(filters.dateRange)
    if (dateSegment) segments.push(dateSegment)
  }

  // Report-type specific segments
  switch (reportType) {
    case 'rdo-sdo': {
      const requestTypeSegment = formatRequestType(filters.requestType || [])
      if (requestTypeSegment) segments.push(requestTypeSegment)
      break
    }

    case 'certifications': {
      const expirySegment = formatExpiryThreshold(filters.expiryThreshold as number)
      if (expirySegment) segments.push(expirySegment)

      const categorySegment = formatCategories(filters.categories || [])
      if (categorySegment) segments.push(categorySegment)
      break
    }

    case 'forecast': {
      const horizonSegment = formatTimeHorizon(filters.timeHorizon || '')
      if (horizonSegment) segments.push(horizonSegment)

      const sectionSegment = formatForecastSections(filters.forecastSections || [])
      if (sectionSegment) segments.push(sectionSegment)
      break
    }

    case 'pilot-info': {
      const activeSegment = formatActiveStatus(filters.activeStatus || '')
      if (activeSegment) segments.push(activeSegment)

      const licenceSegment = formatLicenceType(filters.licenceType || [])
      if (licenceSegment) segments.push(licenceSegment)

      const qualsSegment = formatQualifications(filters.qualifications || [])
      if (qualsSegment) segments.push(qualsSegment)
      break
    }
  }

  // Common filters: Rank and Status
  const rankSegment = formatRank(filters.rank || [])
  if (rankSegment) segments.push(rankSegment)

  // Only add status for request-type reports (not certifications or pilot-info)
  if (['rdo-sdo', 'leave', 'leave-bids', 'all-requests', 'flight-requests'].includes(reportType)) {
    const statusSegment = formatStatus(filters.status || [])
    if (statusSegment) segments.push(statusSegment)
  }

  return segments
}

/**
 * Generate dynamic report title based on type and filters
 *
 * @example
 * // No filters
 * generateReportTitle('leave', {}) // "Leave Requests Report"
 *
 * // With roster period
 * generateReportTitle('leave', { rosterPeriods: ['RP01/2026'] })
 * // "Leave Requests Report - RP01/2026"
 *
 * // With multiple filters
 * generateReportTitle('leave', { rank: ['Captain'], status: ['APPROVED'] })
 * // "Leave Requests Report - Captains Only - Approved"
 *
 * // RDO only
 * generateReportTitle('rdo-sdo', { requestType: ['RDO'] })
 * // "RDO/SDO Requests Report - RDO"
 */
export function generateReportTitle(reportType: ReportType, filters: ReportFilters): string {
  const baseTitle = BASE_TITLES[reportType] || 'Report'

  // Handle special case for RDO/SDO when only one type is selected
  let effectiveBaseTitle = baseTitle
  if (reportType === 'rdo-sdo' && filters.requestType?.length === 1) {
    if (filters.requestType[0] === 'RDO') {
      effectiveBaseTitle = 'RDO Requests Report'
    } else if (filters.requestType[0] === 'SDO') {
      effectiveBaseTitle = 'SDO Requests Report'
    }
  }

  const segments = buildTitleSegments(reportType, filters)

  // Remove request type segment if already in base title (for RDO/SDO)
  const filteredSegments =
    reportType === 'rdo-sdo' ? segments.filter((s) => s !== 'RDO' && s !== 'SDO') : segments

  if (filteredSegments.length === 0) {
    return effectiveBaseTitle
  }

  return `${effectiveBaseTitle} - ${filteredSegments.join(' - ')}`
}

/**
 * Generate description based on report type and filters
 * Provides a more detailed explanation of what the report contains
 */
export function generateReportDescription(reportType: ReportType, filters: ReportFilters): string {
  const title = generateReportTitle(reportType, filters)

  const descriptions: Record<ReportType, (filters: ReportFilters) => string> = {
    'rdo-sdo': (f) => {
      const base = 'Comprehensive report of RDO and SDO requests'
      if (f.requestType?.length === 1) {
        return `Comprehensive report of ${f.requestType[0]} requests`
      }
      return base
    },
    leave: () => 'Comprehensive report of all leave requests',
    'leave-bids': (f) => {
      const base = 'Annual leave preference bids'
      if (f.rosterPeriods?.length) {
        return `${base} for ${f.rosterPeriods.join(', ')}`
      }
      return base
    },
    'all-requests': () =>
      'Comprehensive report combining RDO/SDO requests, Leave requests, and Leave bids',
    'flight-requests': () => 'Comprehensive report of flight requests',
    certifications: () => 'Comprehensive report of pilot certifications and compliance',
    'pilot-info': () => 'Comprehensive pilot profiles, qualifications, and certifications summary',
    forecast: (f) => {
      const horizon =
        f.timeHorizon === '2yr' ? '2-year' : f.timeHorizon === '10yr' ? '10-year' : '5-year'
      return `Retirement forecasts, succession planning, and crew shortage predictions (${horizon} horizon)`
    },
  }

  return descriptions[reportType]?.(filters) || title
}
