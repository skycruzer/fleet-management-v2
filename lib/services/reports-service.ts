/**
 * Reports Service - Centralized Report Generation
 * Author: Maurice Rondeau
 * Date: January 19, 2025
 *
 * Generates reports for RDO/SDO Requests, Leave Requests, Leave Bids, and Certifications
 * Supports preview, PDF export, and email delivery via Resend
 *
 * Phase 2.1: Redis-style caching for improved performance
 * Phase 2.3: Server-side pagination (50 records/page)
 * Phase 4.0: Updated for unified architecture (pilot_requests with request_category filter)
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { unifiedCacheService, invalidateCacheByTag } from '@/lib/services/unified-cache-service'
import type { ReportType, ReportFilters, ReportData, PaginationMeta } from '@/types/reports'
import { rosterPeriodsToDateRange } from '@/lib/utils/roster-periods'
import { generateLeaveBidsPDF } from '@/lib/services/leave-bids-pdf-service'
import {
  getRetirementForecastByRank,
  getCrewImpactAnalysis,
} from '@/lib/services/retirement-forecast-service'
import {
  getCaptainPromotionCandidates,
  getSuccessionReadinessScore,
} from '@/lib/services/succession-planning-service'
import { parseCaptainQualifications } from '@/lib/utils/type-guards'
import { getCertificationStatus } from '@/lib/utils/certification-status'
import { generateReportTitle, generateReportDescription } from '@/lib/utils/report-title-generator'
import { formatAustralianDate, formatAustralianDateTime } from '@/lib/utils/date-format'

/**
 * Pagination configuration
 */
const DEFAULT_PAGE_SIZE = 50
const MAX_PAGE_SIZE = 200

/**
 * Cache configuration for reports
 */
const REPORT_CACHE_CONFIG = {
  TTL_SECONDS: 300, // 5 minutes
  TAGS: {
    RDO_SDO: 'reports:rdo-sdo',
    LEAVE: 'reports:leave',
    LEAVE_BIDS: 'reports:leave-bids',
    ALL_REQUESTS: 'reports:all-requests',
    CERTIFICATIONS: 'reports:certifications',
    PILOT_INFO: 'reports:pilot-info',
    FORECAST: 'reports:forecast',
  },
}

/**
 * Generate cache key from report type and filters
 */
function generateCacheKey(reportType: ReportType, filters: ReportFilters): string {
  // Sort filter keys for consistent cache keys
  let filterString: string
  try {
    filterString = JSON.stringify(filters, Object.keys(filters).sort())
  } catch {
    filterString = String(filters)
  }
  const hash = Buffer.from(filterString).toString('base64url').substring(0, 48)
  return `report:${reportType}:${hash}`
}

/**
 * Calculate pagination metadata
 */
function calculatePagination(
  totalRecords: number,
  currentPage: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE
): PaginationMeta {
  const safePageSize = Math.min(pageSize, MAX_PAGE_SIZE)
  const totalPages = Math.ceil(totalRecords / safePageSize)
  const safePage = Math.max(1, Math.min(currentPage, totalPages || 1))

  return {
    currentPage: safePage,
    pageSize: safePageSize,
    totalRecords,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1,
  }
}

/**
 * Apply pagination to data array
 */
function paginateData<T>(data: T[], page: number = 1, pageSize: number = DEFAULT_PAGE_SIZE): T[] {
  const safePageSize = Math.min(pageSize, MAX_PAGE_SIZE)
  const start = (page - 1) * safePageSize
  const end = start + safePageSize
  return data.slice(start, end)
}

/**
 * Generate Leave Requests Report
 * Phase 2.3: Now supports pagination
 * Phase 2.6: Added fullExport flag and user context
 * Phase 3.0: Updated to query pilot_requests table (unified architecture)
 */
export async function generateLeaveReport(
  filters: ReportFilters,
  fullExport: boolean = false,
  generatedBy?: string
): Promise<ReportData> {
  const supabase = createAdminClient()

  // Query pilot_requests table (unified architecture)
  // Filter by request_category = 'LEAVE' to get only leave requests
  // Join with pilots table to filter by active status
  let query = supabase
    .from('pilot_requests')
    .select('*, pilot:pilots!pilot_requests_pilot_id_fkey(is_active)')
    .eq('request_category', 'LEAVE')
    .order('start_date', { ascending: false })

  // Apply filters
  // Convert roster periods to date range if provided
  let effectiveDateRange = filters.dateRange
  if (filters.rosterPeriods && filters.rosterPeriods.length > 0) {
    const convertedRange = rosterPeriodsToDateRange(filters.rosterPeriods)
    if (convertedRange) {
      effectiveDateRange = convertedRange
    }
  }

  if (effectiveDateRange) {
    query = query
      .gte('start_date', effectiveDateRange.startDate)
      .lte('end_date', effectiveDateRange.endDate)
  }

  if (filters.status && filters.status.length > 0) {
    query = query.in('workflow_status', filters.status)
  }

  if (filters.rosterPeriod) {
    query = query.eq('roster_period', filters.rosterPeriod)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch leave requests: ${error.message}`)
  }

  // Filter out inactive pilots (Supabase can't filter on joined table fields)
  let filteredData = (data || []).filter((item: any) => item.pilot?.is_active === true)

  // Filter by rank if needed (using denormalized rank field)
  if (filters.rank && filters.rank.length > 0) {
    filteredData = filteredData.filter((item: any) => filters.rank!.includes(item.rank))
  }

  // Calculate summary statistics (before pagination)
  // Note: workflow_status values are UPPERCASE in database (3-table architecture)
  const summary = {
    totalRequests: filteredData.length,

    submitted: filteredData.filter((r: any) => r.workflow_status?.toUpperCase() === 'SUBMITTED')
      .length,

    inReview: filteredData.filter((r: any) => r.workflow_status?.toUpperCase() === 'IN_REVIEW')
      .length,

    approved: filteredData.filter((r: any) => r.workflow_status?.toUpperCase() === 'APPROVED')
      .length,

    denied: filteredData.filter((r: any) => r.workflow_status?.toUpperCase() === 'DENIED').length,

    withdrawn: filteredData.filter((r: any) => r.workflow_status?.toUpperCase() === 'WITHDRAWN')
      .length,

    captainRequests: filteredData.filter((r: any) => r.rank === 'Captain').length,

    firstOfficerRequests: filteredData.filter((r: any) => r.rank === 'First Officer').length,
  }

  // Generate dynamic title based on filters
  const title = generateReportTitle('leave', filters)
  const description = generateReportDescription('leave', filters)

  // For full exports (PDF/Email), return all data without pagination
  if (fullExport) {
    return {
      title,
      description,
      generatedAt: new Date().toISOString(),
      generatedBy: generatedBy || 'System',
      filters,
      data: filteredData,
      summary,
      pagination: undefined,
    }
  }

  // For preview, apply pagination
  const page = filters.page || 1
  const pageSize = filters.pageSize || DEFAULT_PAGE_SIZE
  const paginatedData = paginateData(filteredData, page, pageSize)
  const pagination = calculatePagination(filteredData.length, page, pageSize)

  return {
    title,
    description,
    generatedAt: new Date().toISOString(),
    generatedBy: generatedBy || 'System',
    filters,
    data: paginatedData,
    summary,
    pagination,
  }
}

/**
 * Generate RDO/SDO Requests Report
 * Phase 3.0: New function for 3-table architecture
 */
export async function generateRdoSdoReport(
  filters: ReportFilters,
  fullExport: boolean = false,
  generatedBy?: string
): Promise<ReportData> {
  const supabase = createAdminClient()

  // Query pilot_requests table (unified architecture)
  // Filter by request_category = 'FLIGHT' to get RDO/SDO requests
  // Join with pilots table to filter by active status
  let query = supabase
    .from('pilot_requests')
    .select('*, pilot:pilots!pilot_requests_pilot_id_fkey(is_active)')
    .eq('request_category', 'FLIGHT')
    .order('start_date', { ascending: false })

  // Apply filters
  // Convert roster periods to date range if provided
  let effectiveDateRange = filters.dateRange
  if (filters.rosterPeriods && filters.rosterPeriods.length > 0) {
    const convertedRange = rosterPeriodsToDateRange(filters.rosterPeriods)
    if (convertedRange) {
      effectiveDateRange = convertedRange
    }
  }

  if (effectiveDateRange) {
    query = query
      .gte('start_date', effectiveDateRange.startDate)
      .lte('end_date', effectiveDateRange.endDate)
  }

  if (filters.status && filters.status.length > 0) {
    query = query.in('workflow_status', filters.status)
  }

  if (filters.rosterPeriod) {
    query = query.eq('roster_period', filters.rosterPeriod)
  }

  // Filter by request type (RDO or SDO)
  if (filters.requestType && filters.requestType.length > 0) {
    query = query.in('request_type', filters.requestType)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch RDO/SDO requests: ${error.message}`)
  }

  // Filter out inactive pilots (Supabase can't filter on joined table fields)
  let filteredData = (data || []).filter((item: any) => item.pilot?.is_active === true)

  // Filter by rank if needed (using denormalized rank field)
  if (filters.rank && filters.rank.length > 0) {
    filteredData = filteredData.filter((item: any) => filters.rank!.includes(item.rank))
  }

  // Calculate summary statistics (before pagination)
  const summary = {
    totalRequests: filteredData.length,

    submitted: filteredData.filter((r: any) => r.workflow_status?.toUpperCase() === 'SUBMITTED')
      .length,

    inReview: filteredData.filter((r: any) => r.workflow_status?.toUpperCase() === 'IN_REVIEW')
      .length,

    approved: filteredData.filter((r: any) => r.workflow_status?.toUpperCase() === 'APPROVED')
      .length,

    denied: filteredData.filter((r: any) => r.workflow_status?.toUpperCase() === 'DENIED').length,

    withdrawn: filteredData.filter((r: any) => r.workflow_status?.toUpperCase() === 'WITHDRAWN')
      .length,

    rdoRequests: filteredData.filter((r: any) => r.request_type === 'RDO').length,

    sdoRequests: filteredData.filter((r: any) => r.request_type === 'SDO').length,

    captainRequests: filteredData.filter((r: any) => r.rank === 'Captain').length,

    firstOfficerRequests: filteredData.filter((r: any) => r.rank === 'First Officer').length,
  }

  // Generate dynamic title based on filters
  const title = generateReportTitle('rdo-sdo', filters)
  const description = generateReportDescription('rdo-sdo', filters)

  // For full exports (PDF/Email), return all data without pagination
  if (fullExport) {
    return {
      title,
      description,
      generatedAt: new Date().toISOString(),
      generatedBy: generatedBy || 'System',
      filters,
      data: filteredData,
      summary,
      pagination: undefined,
    }
  }

  // For preview, apply pagination
  const page = filters.page || 1
  const pageSize = filters.pageSize || DEFAULT_PAGE_SIZE
  const paginatedData = paginateData(filteredData, page, pageSize)
  const pagination = calculatePagination(filteredData.length, page, pageSize)

  return {
    title,
    description,
    generatedAt: new Date().toISOString(),
    generatedBy: generatedBy || 'System',
    filters,
    data: paginatedData,
    summary,
    pagination,
  }
}

/**
 * Generate Flight Requests Report
 * Phase 3.0: DEPRECATED - Flight requests are now RDO/SDO requests
 * @deprecated Use generateRdoSdoReport instead
 * This function now redirects to generateRdoSdoReport for backward compatibility
 */
export async function generateFlightRequestReport(
  filters: ReportFilters,
  fullExport: boolean = false,
  generatedBy?: string
): Promise<ReportData> {
  // Redirect to RDO/SDO report (flight requests are now RDO/SDO in 3-table architecture)
  return generateRdoSdoReport(filters, fullExport, generatedBy)
}

/**
 * Generate Certifications Report
 * Phase 2.6: Added fullExport flag and user context
 */
export async function generateCertificationsReport(
  filters: ReportFilters,
  fullExport: boolean = false,
  generatedBy?: string
): Promise<ReportData> {
  const supabase = createAdminClient()

  let query = supabase
    .from('pilot_checks')
    .select(
      `
      *,
      pilot:pilots!pilot_checks_pilot_id_fkey (
        first_name,
        last_name,
        employee_id,
        role,
        is_active
      ),
      check_type:check_types!pilot_checks_check_type_id_fkey (
        check_code,
        check_description,
        category
      )
    `
    )
    .order('expiry_date', { ascending: true })

  // Apply filters (pilot_checks has expiry_date, not completion_date)
  // Convert roster periods to date range if provided
  let effectiveDateRange = filters.dateRange
  if (filters.rosterPeriods && filters.rosterPeriods.length > 0) {
    const convertedRange = rosterPeriodsToDateRange(filters.rosterPeriods)
    if (convertedRange) {
      effectiveDateRange = convertedRange
    }
  }

  if (effectiveDateRange) {
    query = query
      .gte('expiry_date', effectiveDateRange.startDate)
      .lte('expiry_date', effectiveDateRange.endDate)
  }

  if (filters.checkType) {
    query = query.eq('check_type_id', filters.checkType)
  }

  if (filters.checkTypes && filters.checkTypes.length > 0) {
    query = query.in('check_type_id', filters.checkTypes)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch certifications: ${error.message}`)
  }

  // Filter out inactive pilots (Supabase can't filter on joined table fields)
  let filteredData = (data || []).filter((item: any) => item.pilot?.is_active === true)

  // Filter out certifications with invalid/missing expiry dates
  // This prevents "Invalid Date", Unix epoch (1/1/1970), and massive negative day counts
  filteredData = filteredData.filter((item: any) => {
    if (!item.expiry_date) return false
    const date = new Date(item.expiry_date)
    // Check for valid date (not NaN) and not Unix epoch (year > 1970)
    return !isNaN(date.getTime()) && date.getFullYear() > 1970
  })

  // Filter by rank if needed
  if (filters.rank && filters.rank.length > 0) {
    filteredData = filteredData.filter((item: any) => filters.rank!.includes(item.pilot?.role))
  }

  // Filter by category if provided (post-query filter on check_type.category)
  if (filters.categories && filters.categories.length > 0) {
    filteredData = filteredData.filter(
      (item: any) =>
        item.check_type?.category && filters.categories!.includes(item.check_type.category)
    )
  }

  // Calculate expiry and filter by threshold
  const today = new Date()

  const dataWithExpiry = filteredData.map((cert: any) => {
    const expiryDate = new Date(cert.expiry_date)
    const completionDate = cert.completion_date ? new Date(cert.completion_date) : null
    const daysUntilExpiry = Math.floor(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )

    return {
      ...cert,
      daysUntilExpiry,
      isExpired: daysUntilExpiry < 0,
      isExpiringSoon: daysUntilExpiry >= 0 && daysUntilExpiry <= 90,
      // Add formatted dates for safe display
      formattedExpiryDate: expiryDate.toLocaleDateString(),
      formattedCompletionDate: completionDate?.toLocaleDateString() || 'N/A',
    }
  })

  // Filter by expiry threshold if provided
  let finalData = dataWithExpiry
  if (filters.expiryThreshold !== undefined) {
    finalData = dataWithExpiry.filter(
      (cert: any) => cert.daysUntilExpiry <= filters.expiryThreshold!
    )
  }

  /**
   * Calculate summary statistics (before pagination)
   *
   * Certification Status Thresholds:
   * - Expired: daysUntilExpiry < 0 (past expiry date)
   * - Expiring Soon: 0 <= daysUntilExpiry <= 90 (within 90 days of expiry)
   * - Current: daysUntilExpiry > 90 (more than 90 days until expiry)
   *
   * Note: The 90-day threshold for "Expiring Soon" aligns with FAA recommended
   * advance notice periods for recurrent training and certification renewals.
   */
  const summary = {
    totalCertifications: finalData.length,

    expired: finalData.filter((c: any) => c.isExpired).length,

    // isExpiringSoon already excludes expired items (days >= 0)
    expiringSoon: finalData.filter((c: any) => c.isExpiringSoon).length,

    current: finalData.filter((c: any) => !c.isExpired && !c.isExpiringSoon).length,

    uniquePilots: [...new Set(finalData.map((c: any) => c.pilot_id))].length,
  }

  // Generate dynamic title based on filters
  const title = generateReportTitle('certifications', filters)
  const description = generateReportDescription('certifications', filters)

  // For full exports (PDF/Email), return all data without pagination
  if (fullExport) {
    return {
      title,
      description,
      generatedAt: new Date().toISOString(),
      generatedBy: generatedBy || 'System',
      filters,
      data: finalData,
      summary,
      pagination: undefined,
    }
  }

  // For preview, apply pagination
  const page = filters.page || 1
  const pageSize = filters.pageSize || DEFAULT_PAGE_SIZE
  const paginatedData = paginateData(finalData, page, pageSize)
  const pagination = calculatePagination(finalData.length, page, pageSize)

  return {
    title,
    description,
    generatedAt: new Date().toISOString(),
    generatedBy: generatedBy || 'System',
    filters,
    data: paginatedData,
    summary,
    pagination,
  }
}

/**
 * Generate All Requests Report (UNION of all 3 tables)
 * Phase 4.0: Combined reporting from unified pilot_requests table (filtered by request_category)
 */
export async function generateAllRequestsReport(
  filters: ReportFilters,
  fullExport: boolean = false,
  generatedBy?: string
): Promise<ReportData> {
  const supabase = createAdminClient()

  // Convert roster periods to date range if provided
  let effectiveDateRange = filters.dateRange
  if (filters.rosterPeriods && filters.rosterPeriods.length > 0) {
    const convertedRange = rosterPeriodsToDateRange(filters.rosterPeriods)
    if (convertedRange) {
      effectiveDateRange = convertedRange
    }
  }

  // Fetch RDO/SDO requests from pilot_requests table (unified architecture)
  // Join with pilots table to filter by active status
  let rdoSdoQuery = supabase
    .from('pilot_requests')
    .select('*, pilot:pilots!pilot_requests_pilot_id_fkey(is_active)')
    .eq('request_category', 'FLIGHT')
    .order('start_date', { ascending: false })

  if (effectiveDateRange) {
    rdoSdoQuery = rdoSdoQuery
      .gte('start_date', effectiveDateRange.startDate)
      .lte('end_date', effectiveDateRange.endDate)
  }

  if (filters.status && filters.status.length > 0) {
    rdoSdoQuery = rdoSdoQuery.in('workflow_status', filters.status)
  }

  if (filters.rosterPeriod) {
    rdoSdoQuery = rdoSdoQuery.eq('roster_period', filters.rosterPeriod)
  }

  // Fetch Leave requests from pilot_requests table (unified architecture)
  // Join with pilots table to filter by active status
  let leaveQuery = supabase
    .from('pilot_requests')
    .select('*, pilot:pilots!pilot_requests_pilot_id_fkey(is_active)')
    .eq('request_category', 'LEAVE')
    .order('start_date', { ascending: false })

  if (effectiveDateRange) {
    leaveQuery = leaveQuery
      .gte('start_date', effectiveDateRange.startDate)
      .lte('end_date', effectiveDateRange.endDate)
  }

  if (filters.status && filters.status.length > 0) {
    leaveQuery = leaveQuery.in('workflow_status', filters.status)
  }

  if (filters.rosterPeriod) {
    leaveQuery = leaveQuery.eq('roster_period', filters.rosterPeriod)
  }

  // Fetch Leave bids - join with pilots to filter by active status
  let leaveBidsQuery = supabase
    .from('leave_bids')
    .select('*, pilot:pilots!pilot_id(is_active)')
    .order('created_at', { ascending: false })

  if (filters.status && filters.status.length > 0) {
    leaveBidsQuery = leaveBidsQuery.in('status', filters.status)
  }

  // Execute all queries in parallel
  const [rdoSdoResult, leaveResult, leaveBidsResult] = await Promise.all([
    rdoSdoQuery,
    leaveQuery,
    leaveBidsQuery,
  ])

  if (rdoSdoResult.error) {
    throw new Error(`Failed to fetch RDO/SDO requests: ${rdoSdoResult.error.message}`)
  }
  if (leaveResult.error) {
    throw new Error(`Failed to fetch leave requests: ${leaveResult.error.message}`)
  }
  if (leaveBidsResult.error) {
    throw new Error(`Failed to fetch leave bids: ${leaveBidsResult.error.message}`)
  }

  // Combine all data with source tags
  // Filter out inactive pilots (Supabase can't filter on joined table fields)
  const allRequests: any[] = [
    ...(rdoSdoResult.data || [])
      .filter((r: any) => r.pilot?.is_active === true)
      .map((r: any) => ({ ...r, request_source: 'RDO/SDO' })),

    ...(leaveResult.data || [])
      .filter((r: any) => r.pilot?.is_active === true)
      .map((r: any) => ({ ...r, request_source: 'LEAVE' })),

    ...(leaveBidsResult.data || [])
      .filter((r: any) => r.pilot?.is_active === true)
      .map((r: any) => ({ ...r, request_source: 'LEAVE_BID' })),
  ]

  // Sort by start_date (or created_at for leave bids)
  allRequests.sort((a: any, b: any) => {
    const dateA = new Date(a.start_date || a.created_at)
    const dateB = new Date(b.start_date || b.created_at)
    return dateB.getTime() - dateA.getTime()
  })

  // Filter by rank if needed
  let filteredData = allRequests
  if (filters.rank && filters.rank.length > 0) {
    filteredData = allRequests.filter((item: any) => filters.rank!.includes(item.rank))
  }

  // Calculate summary statistics (before pagination)
  const summary = {
    totalRequests: filteredData.length,

    rdoSdoRequests: filteredData.filter((r: any) => r.request_source === 'RDO/SDO').length,

    leaveRequests: filteredData.filter((r: any) => r.request_source === 'LEAVE').length,

    leaveBids: filteredData.filter((r: any) => r.request_source === 'LEAVE_BID').length,

    submitted: filteredData.filter(
      (r: any) =>
        r.workflow_status?.toUpperCase() === 'SUBMITTED' || r.status?.toUpperCase() === 'SUBMITTED'
    ).length,

    inReview: filteredData.filter(
      (r: any) =>
        r.workflow_status?.toUpperCase() === 'IN_REVIEW' || r.status?.toUpperCase() === 'IN_REVIEW'
    ).length,

    approved: filteredData.filter(
      (r: any) =>
        r.workflow_status?.toUpperCase() === 'APPROVED' || r.status?.toUpperCase() === 'APPROVED'
    ).length,

    denied: filteredData.filter(
      (r: any) =>
        r.workflow_status?.toUpperCase() === 'DENIED' || r.status?.toUpperCase() === 'DENIED'
    ).length,

    captainRequests: filteredData.filter((r: any) => r.rank === 'Captain').length,

    firstOfficerRequests: filteredData.filter((r: any) => r.rank === 'First Officer').length,
  }

  // Generate dynamic title based on filters
  const title = generateReportTitle('all-requests', filters)
  const description = generateReportDescription('all-requests', filters)

  // For full exports (PDF/Email), return all data without pagination
  if (fullExport) {
    return {
      title,
      description,
      generatedAt: new Date().toISOString(),
      generatedBy: generatedBy || 'System',
      filters,
      data: filteredData,
      summary,
      pagination: undefined,
    }
  }

  // For preview, apply pagination
  const page = filters.page || 1
  const pageSize = filters.pageSize || DEFAULT_PAGE_SIZE
  const paginatedData = paginateData(filteredData, page, pageSize)
  const pagination = calculatePagination(filteredData.length, page, pageSize)

  return {
    title,
    description,
    generatedAt: new Date().toISOString(),
    generatedBy: generatedBy || 'System',
    filters,
    data: paginatedData,
    summary,
    pagination,
  }
}

/**
 * Group data by specified field for PDF generation
 */
function groupDataByField(data: any[], field: string): Map<string, any[]> {
  const grouped = new Map<string, any[]>()
  data.forEach((item) => {
    let key = 'N/A'
    if (field === 'rosterPeriod') {
      key = item.roster_period || item.roster_period_code || 'N/A'
    } else if (field === 'rank') {
      key = item.rank || item.pilot?.role || 'N/A'
    } else if (field === 'category') {
      key = item.check_type?.category || 'N/A'
    }
    const existing = grouped.get(key) || []
    existing.push(item)
    grouped.set(key, existing)
  })
  return grouped
}

/**
 * Generate PDF from Report Data
 * Phase 5.1: Added grouping support and Australian date format
 */
export async function generatePDF(
  report: ReportData,
  reportType: ReportType,
  grouping?: string[]
): Promise<Buffer> {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(report.title, pageWidth / 2, 20, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${formatAustralianDateTime(report.generatedAt)}`, pageWidth / 2, 28, {
    align: 'center',
  })

  // Summary section
  let yPos = 40
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary', 14, yPos)

  yPos += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  if (report.summary) {
    Object.entries(report.summary).forEach(([key, value]) => {
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())
      doc.text(`${label}: ${value}`, 14, yPos)
      yPos += 6
    })
  }

  yPos += 10

  // Determine if we should group the data
  const shouldGroup =
    grouping && grouping.length > 0 && ['leave', 'rdo-sdo', 'certifications'].includes(reportType)
  const primaryGroupField = shouldGroup ? grouping[0] : null

  // Data table based on report type
  if (reportType === 'leave') {
    if (shouldGroup && primaryGroupField) {
      // Grouped rendering
      const grouped = groupDataByField(report.data, primaryGroupField)
      const sortedKeys = Array.from(grouped.keys()).sort()

      for (const groupKey of sortedKeys) {
        const groupData = grouped.get(groupKey) || []

        // Group header
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text(
          `${primaryGroupField === 'rosterPeriod' ? 'Roster Period' : 'Rank'}: ${groupKey} (${groupData.length} records)`,
          14,
          yPos
        )
        yPos += 8

        autoTable(doc, {
          startY: yPos,
          head: [['Pilot', 'Rank', 'Type', 'Start Date', 'End Date', 'Status', 'Roster Period']],
          body: groupData.map((item: any) => [
            item.name || `${item.pilot?.first_name} ${item.pilot?.last_name}` || 'N/A',
            item.rank || item.pilot?.role || 'N/A',
            item.request_type || item.leave_type || 'N/A',
            formatAustralianDate(item.start_date),
            formatAustralianDate(item.end_date),
            item.workflow_status || item.status || 'N/A',
            item.roster_period || 'N/A',
          ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [41, 128, 185] },
        })

        yPos = (doc as any).lastAutoTable?.finalY + 15 || yPos + 50
      }
    } else {
      // Flat rendering (no grouping)
      autoTable(doc, {
        startY: yPos,
        head: [['Pilot', 'Rank', 'Type', 'Start Date', 'End Date', 'Status', 'Roster Period']],
        body: report.data.map((item: any) => [
          item.name || `${item.pilot?.first_name} ${item.pilot?.last_name}` || 'N/A',
          item.rank || item.pilot?.role || 'N/A',
          item.request_type || item.leave_type || 'N/A',
          formatAustralianDate(item.start_date),
          formatAustralianDate(item.end_date),
          item.workflow_status || item.status || 'N/A',
          item.roster_period || 'N/A',
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
      })
    }
  } else if (reportType === 'rdo-sdo') {
    if (shouldGroup && primaryGroupField) {
      // Grouped rendering
      const grouped = groupDataByField(report.data, primaryGroupField)
      const sortedKeys = Array.from(grouped.keys()).sort()

      for (const groupKey of sortedKeys) {
        const groupData = grouped.get(groupKey) || []

        // Group header
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text(
          `${primaryGroupField === 'rosterPeriod' ? 'Roster Period' : 'Rank'}: ${groupKey} (${groupData.length} records)`,
          14,
          yPos
        )
        yPos += 8

        autoTable(doc, {
          startY: yPos,
          head: [
            ['Pilot', 'Rank', 'Type', 'Start Date', 'End Date', 'Days', 'Status', 'Roster Period'],
          ],
          body: groupData.map((item: any) => [
            item.name || 'N/A',
            item.rank || 'N/A',
            item.request_type || 'N/A',
            formatAustralianDate(item.start_date),
            item.end_date
              ? formatAustralianDate(item.end_date)
              : formatAustralianDate(item.start_date),
            item.days_count || '1',
            item.workflow_status || 'N/A',
            item.roster_period || 'N/A',
          ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [46, 204, 113] },
        })

        yPos = (doc as any).lastAutoTable?.finalY + 15 || yPos + 50
      }
    } else {
      // Flat rendering (no grouping)
      autoTable(doc, {
        startY: yPos,
        head: [
          ['Pilot', 'Rank', 'Type', 'Start Date', 'End Date', 'Days', 'Status', 'Roster Period'],
        ],
        body: report.data.map((item: any) => [
          item.name || 'N/A',
          item.rank || 'N/A',
          item.request_type || 'N/A',
          formatAustralianDate(item.start_date),
          item.end_date
            ? formatAustralianDate(item.end_date)
            : formatAustralianDate(item.start_date),
          item.days_count || '1',
          item.workflow_status || 'N/A',
          item.roster_period || 'N/A',
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [46, 204, 113] },
      })
    }
  } else if (reportType === 'all-requests') {
    autoTable(doc, {
      startY: yPos,
      head: [['Source', 'Pilot', 'Rank', 'Type', 'Start Date', 'Status', 'Roster Period']],

      body: report.data.map((item: any) => [
        item.request_source || 'N/A',
        item.name || 'N/A',
        item.rank || 'N/A',
        item.request_type || item.leave_type || 'N/A',
        formatAustralianDate(item.start_date || item.created_at),
        item.workflow_status || item.status || 'N/A',
        item.roster_period || 'N/A',
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [155, 89, 182] },
    })
  } else if (reportType === 'flight-requests') {
    autoTable(doc, {
      startY: yPos,
      head: [['Pilot', 'Rank', 'Type', 'Flight Date', 'Description', 'Status']],

      body: report.data.map((item: any) => [
        `${item.pilot?.first_name} ${item.pilot?.last_name}`,
        item.pilot?.role || 'N/A',
        item.request_type,
        formatAustralianDate(item.flight_date),
        item.description,
        item.status,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    })
  } else if (reportType === 'certifications') {
    if (shouldGroup && primaryGroupField) {
      // Grouped rendering for certifications
      const grouped = groupDataByField(report.data, primaryGroupField)
      const sortedKeys = Array.from(grouped.keys()).sort()

      for (const groupKey of sortedKeys) {
        const groupData = grouped.get(groupKey) || []

        // Group header
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        const groupLabel =
          primaryGroupField === 'rosterPeriod'
            ? 'Roster Period'
            : primaryGroupField === 'rank'
              ? 'Rank'
              : 'Category'
        doc.text(`${groupLabel}: ${groupKey} (${groupData.length} records)`, 14, yPos)
        yPos += 8

        autoTable(doc, {
          startY: yPos,
          head: [['Pilot', 'Rank', 'Check Type', 'Expiry', 'Days Until Expiry', 'Status']],
          body: groupData.map((item: any) => [
            `${item.pilot?.first_name} ${item.pilot?.last_name}`,
            item.pilot?.role || 'N/A',
            item.check_type?.check_description || item.check_type?.check_code || 'N/A',
            formatAustralianDate(item.expiry_date),
            item.daysUntilExpiry,
            item.isExpired ? 'EXPIRED' : item.isExpiringSoon ? 'EXPIRING SOON' : 'CURRENT',
          ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [41, 128, 185] },
          bodyStyles: { cellPadding: 2 },
          didParseCell: (data) => {
            if (data.column.index === 5 && data.section === 'body') {
              const status = data.cell.text[0]
              if (status === 'EXPIRED') {
                data.cell.styles.textColor = [231, 76, 60]
                data.cell.styles.fontStyle = 'bold'
              } else if (status === 'EXPIRING SOON') {
                data.cell.styles.textColor = [241, 196, 15]
                data.cell.styles.fontStyle = 'bold'
              }
            }
          },
        })

        yPos = (doc as any).lastAutoTable?.finalY + 15 || yPos + 50
      }
    } else {
      // Flat rendering (no grouping)
      autoTable(doc, {
        startY: yPos,
        head: [['Pilot', 'Rank', 'Check Type', 'Expiry', 'Days Until Expiry', 'Status']],

        body: report.data.map((item: any) => [
          `${item.pilot?.first_name} ${item.pilot?.last_name}`,
          item.pilot?.role || 'N/A',
          item.check_type?.check_description || item.check_type?.check_code || 'N/A',
          formatAustralianDate(item.expiry_date),
          item.daysUntilExpiry,
          item.isExpired ? 'EXPIRED' : item.isExpiringSoon ? 'EXPIRING SOON' : 'CURRENT',
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        bodyStyles: {
          cellPadding: 2,
        },
        didParseCell: (data) => {
          // Color code status column
          if (data.column.index === 5 && data.section === 'body') {
            const status = data.cell.text[0]
            if (status === 'EXPIRED') {
              data.cell.styles.textColor = [231, 76, 60] // Red
              data.cell.styles.fontStyle = 'bold'
            } else if (status === 'EXPIRING SOON') {
              data.cell.styles.textColor = [241, 196, 15] // Yellow/Orange
              data.cell.styles.fontStyle = 'bold'
            }
          }
        },
      })
    }
  } else if (reportType === 'leave-bids') {
    // Use specialized leave bids PDF service
    // Extract year from report data (default to current year if not available)
    const currentYear = new Date().getFullYear()

    const bidYear = report.data[0]?.bid_year || currentYear

    // Extract status filter if any (from report summary or default to 'all')
    const statusFilter = (report.summary?.statusFilter as string) || 'all'

    // Generate PDF using specialized service and return directly
    return await generateLeaveBidsPDF(report.data, bidYear, statusFilter)
  } else if (reportType === 'pilot-info') {
    autoTable(doc, {
      startY: yPos,
      head: [['Seniority', 'Employee ID', 'Name', 'Rank', 'Licence', 'Status', 'Qualifications']],

      body: report.data.map((item: any) => [
        item.seniority_number || 'N/A',
        item.employee_id || 'N/A',
        item.name || 'N/A',
        item.rank || 'N/A',
        item.licence_type || 'N/A',
        item.is_active ? 'Active' : 'Inactive',
        [
          item.qualifications?.line_captain ? 'LC' : '',
          item.qualifications?.training_captain ? 'TC' : '',
          item.qualifications?.examiner ? 'EX' : '',
        ]
          .filter(Boolean)
          .join(', ') || '-',
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [52, 152, 219] }, // Blue
      didParseCell: (data) => {
        // Color code status column (index 5)
        if (data.column.index === 5 && data.section === 'body') {
          const status = data.cell.text[0]
          if (status === 'Inactive') {
            data.cell.styles.textColor = [150, 150, 150] // Gray
          }
        }
      },
    })
  } else if (reportType === 'forecast') {
    // Group data by section
    const sections = ['Retirement Forecast', 'Succession Planning', 'Crew Shortage Predictions']

    sections.forEach((sectionName) => {
      const sectionData = report.data.filter((item: any) => item.section === sectionName)
      if (sectionData.length === 0) return

      // Section header
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(sectionName, 14, yPos)
      yPos += 8

      if (sectionName === 'Retirement Forecast') {
        autoTable(doc, {
          startY: yPos,
          head: [['Name', 'Rank', 'Retirement Date', 'Months Until Retirement']],
          body: sectionData
            .filter((item: any) => item.type !== 'summary')
            .map((item: any) => [
              item.name || 'N/A',
              item.rank || 'N/A',
              formatAustralianDate(item.retirementDate),
              item.monthsUntilRetirement?.toString() || 'N/A',
            ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [231, 76, 60] }, // Red for retirement
        })
      } else if (sectionName === 'Succession Planning') {
        autoTable(doc, {
          startY: yPos,
          head: [['Name', 'Readiness', 'Years of Service', 'Qualification Gaps']],
          body: sectionData
            .filter((item: any) => item.type !== 'readiness_score')
            .map((item: any) => [
              item.name || 'N/A',
              item.readiness || 'N/A',
              item.yearsOfService?.toString() || 'N/A',
              item.qualificationGaps?.join(', ') || 'None',
            ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [46, 204, 113] }, // Green for succession
        })
      } else if (sectionName === 'Crew Shortage Predictions') {
        autoTable(doc, {
          startY: yPos,
          head: [['Month', 'Warning Level', 'Captain Shortage', 'FO Shortage', 'Message']],
          body: sectionData.map((item: any) => [
            item.month || 'N/A',
            item.warningLevel || item.severity || 'N/A',
            item.captainShortage?.toString() || '0',
            item.firstOfficerShortage?.toString() || '0',
            item.message || '-',
          ]),
          styles: { fontSize: 7 },
          headStyles: { fillColor: [241, 196, 15] }, // Yellow for warnings
        })
      }

      // Update yPos for next section
      yPos = (doc as any).lastAutoTable?.finalY + 15 || yPos + 50
    })
  }

  // Footer with page numbers
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, {
      align: 'center',
    })
  }

  return Buffer.from(doc.output('arraybuffer'))
}

/**
 * Generate Leave Bids Report
 * Queries leave_bids table with pilot information
 * Supports filtering by status, rank, and roster periods
 */
export async function generateLeaveBidsReport(
  filters: ReportFilters,
  fullExport: boolean = false,
  generatedBy?: string
): Promise<ReportData> {
  const supabase = createAdminClient()

  // Query leave_bids table with pilot information
  // Filter by active pilots only
  let query = supabase
    .from('leave_bids')
    .select(
      `
      *,
      pilot:pilots!pilot_id (
        id,
        first_name,
        last_name,
        role,
        seniority_number,
        is_active
      )
    `
    )
    .order('submitted_at', { ascending: false })

  // Apply filters (database-level where possible)
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status)
  }

  if (filters.rosterPeriods && filters.rosterPeriods.length > 0) {
    query = query.in('roster_period_code', filters.rosterPeriods)
  }

  if (filters.pilotId) {
    query = query.eq('pilot_id', filters.pilotId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error generating leave bids report:', error)
    throw new Error(`Failed to generate leave bids report: ${error.message}`)
  }

  // Filter out inactive pilots and add computed fields (Supabase can't filter on joined fields)
  let enrichedData = (data || [])
    .filter((bid: any) => bid.pilot?.is_active === true)
    .map((bid: any) => ({
      ...bid,
      name: bid.pilot ? `${bid.pilot.first_name} ${bid.pilot.last_name}` : 'N/A',
      rank: bid.pilot?.role || 'N/A',
      seniority: bid.pilot?.seniority_number || 0,
    }))

  // Filter by rank (post-query - Supabase can't filter on joined fields)
  if (filters.rank && filters.rank.length > 0) {
    enrichedData = enrichedData.filter((bid: any) => filters.rank!.includes(bid.rank))
  }

  // Calculate pagination (after all filtering is complete)
  const page = filters.page || 1
  const pageSize = filters.pageSize || DEFAULT_PAGE_SIZE
  const totalRecords = enrichedData.length
  const pagination = calculatePagination(totalRecords, page, pageSize)

  // Apply pagination if not full export
  const paginatedData = fullExport ? enrichedData : paginateData(enrichedData, page, pageSize)

  // Generate summary statistics
  const summary = {
    totalBids: enrichedData.length,
    byStatus: {
      pending: enrichedData.filter((b: any) => b.status === 'PENDING').length,
      processing: enrichedData.filter((b: any) => b.status === 'PROCESSING').length,
      approved: enrichedData.filter((b: any) => b.status === 'APPROVED').length,
      rejected: enrichedData.filter((b: any) => b.status === 'REJECTED').length,
    },
    byRank: {
      captain: enrichedData.filter((b: any) => b.rank === 'Captain').length,
      firstOfficer: enrichedData.filter((b: any) => b.rank === 'First Officer').length,
    },
  }

  // Generate dynamic title based on filters
  const title = generateReportTitle('leave-bids', filters)
  const description = generateReportDescription('leave-bids', filters)

  return {
    title,
    description,
    generatedAt: new Date().toISOString(),
    generatedBy: generatedBy || 'System',
    filters,
    data: paginatedData,
    summary,
    pagination: fullExport ? undefined : pagination,
  }
}

/**
 * Generate Pilot Info Report
 * Includes pilot profiles, qualifications, certifications summary
 * Phase 5.0: New report type
 */
export async function generatePilotInfoReport(
  filters: ReportFilters,
  fullExport: boolean = false,
  generatedBy?: string
): Promise<ReportData> {
  const supabase = createAdminClient()

  // Query pilots with certifications
  const { data: pilots, error } = await supabase
    .from('pilots')
    .select(
      `
      id,
      employee_id,
      first_name,
      middle_name,
      last_name,
      role,
      seniority_number,
      commencement_date,
      licence_type,
      licence_number,
      is_active,
      captain_qualifications,
      pilot_checks (
        id,
        expiry_date,
        check_types (check_code, check_description)
      )
    `
    )
    .order('seniority_number', { ascending: true, nullsFirst: false })

  if (error) {
    throw new Error(`Failed to fetch pilots: ${error.message}`)
  }

  // Apply filters
  let filteredData = pilots || []

  // Filter by rank
  if (filters.rank && filters.rank.length > 0) {
    filteredData = filteredData.filter((pilot: any) => filters.rank!.includes(pilot.role))
  }

  // Filter by active status - defaults to active only
  // Only show inactive pilots if explicitly requested via 'inactive' or 'all'
  if (filters.activeStatus === 'inactive') {
    filteredData = filteredData.filter((pilot: any) => !pilot.is_active)
  } else if (filters.activeStatus !== 'all') {
    // Default: show only active pilots
    filteredData = filteredData.filter((pilot: any) => pilot.is_active)
  }

  // Filter by licence type
  if (filters.licenceType && filters.licenceType.length > 0) {
    filteredData = filteredData.filter((pilot: any) =>
      filters.licenceType!.includes(pilot.licence_type)
    )
  }

  // Filter by qualifications (for Captains only)
  if (filters.qualifications && filters.qualifications.length > 0) {
    filteredData = filteredData.filter((pilot: any) => {
      if (pilot.role !== 'Captain') return false
      const quals = parseCaptainQualifications(pilot.captain_qualifications)
      if (!quals) return false

      return filters.qualifications!.some((q) => {
        if (q === 'line_captain') return quals.line_captain
        if (q === 'training_captain') return quals.training_captain
        if (q === 'examiner') return quals.examiner
        return false
      })
    })
  }

  // Enrich data with certification status
  const enrichedData = filteredData.map((pilot: any) => {
    const certifications = pilot.pilot_checks || []
    let current = 0
    let expiring = 0
    let expired = 0

    certifications.forEach((check: any) => {
      const status = getCertificationStatus(check.expiry_date ? new Date(check.expiry_date) : null)
      if (status.color === 'green') current++
      else if (status.color === 'yellow') expiring++
      else if (status.color === 'red') expired++
    })

    const quals = parseCaptainQualifications(pilot.captain_qualifications)

    return {
      id: pilot.id,
      employee_id: pilot.employee_id,
      name: `${pilot.first_name} ${pilot.last_name}`,
      rank: pilot.role,
      seniority_number: pilot.seniority_number,
      commencement_date: pilot.commencement_date,
      licence_type: pilot.licence_type,
      licence_number: pilot.licence_number,
      is_active: pilot.is_active,
      qualifications: {
        line_captain: quals?.line_captain || false,
        training_captain: quals?.training_captain || false,
        examiner: quals?.examiner || false,
      },
      certificationStatus: { current, expiring, expired },
    }
  })

  // Calculate summary
  const summary = {
    totalPilots: enrichedData.length,
    captains: enrichedData.filter((p: any) => p.rank === 'Captain').length,
    firstOfficers: enrichedData.filter((p: any) => p.rank === 'First Officer').length,
    activePilots: enrichedData.filter((p: any) => p.is_active).length,
    inactivePilots: enrichedData.filter((p: any) => !p.is_active).length,
    lineCaptains: enrichedData.filter((p: any) => p.qualifications.line_captain).length,
    trainingCaptains: enrichedData.filter((p: any) => p.qualifications.training_captain).length,
    examiners: enrichedData.filter((p: any) => p.qualifications.examiner).length,
    atplHolders: enrichedData.filter((p: any) => p.licence_type === 'ATPL').length,
    cplHolders: enrichedData.filter((p: any) => p.licence_type === 'CPL').length,
  }

  // Generate dynamic title based on filters
  const title = generateReportTitle('pilot-info', filters)
  const description = generateReportDescription('pilot-info', filters)

  // For full exports (PDF/Email), return all data without pagination
  if (fullExport) {
    return {
      title,
      description,
      generatedAt: new Date().toISOString(),
      generatedBy: generatedBy || 'System',
      filters,
      data: enrichedData,
      summary,
      pagination: undefined,
    }
  }

  // For preview, apply pagination
  const page = filters.page || 1
  const pageSize = filters.pageSize || DEFAULT_PAGE_SIZE
  const start = (page - 1) * pageSize
  const paginatedData = enrichedData.slice(start, start + pageSize)

  const pagination: PaginationMeta = {
    currentPage: page,
    pageSize,
    totalRecords: enrichedData.length,
    totalPages: Math.ceil(enrichedData.length / pageSize),
    hasNextPage: page < Math.ceil(enrichedData.length / pageSize),
    hasPrevPage: page > 1,
  }

  return {
    title,
    description,
    generatedAt: new Date().toISOString(),
    generatedBy: generatedBy || 'System',
    filters,
    data: paginatedData,
    summary,
    pagination,
  }
}

/**
 * Generate Forecast Report
 * Includes retirement forecasts, succession planning, crew shortage predictions
 * Phase 5.0: New report type
 */
export async function generateForecastReport(
  filters: ReportFilters,
  fullExport: boolean = false,
  generatedBy?: string
): Promise<ReportData> {
  const timeHorizon = filters.timeHorizon || '5yr'
  const sections = filters.forecastSections || ['retirement', 'succession', 'shortage']

  // Get retirement age from system (default 65)
  const retirementAge = 65

  // Parallel data fetching for efficiency
  const [retirementData, successionData, crewImpactData] = await Promise.all([
    sections.includes('retirement') ? getRetirementForecastByRank(retirementAge) : null,
    sections.includes('succession') ? getCaptainPromotionCandidates() : null,
    sections.includes('shortage') ? getCrewImpactAnalysis(retirementAge) : null,
  ])

  // Get succession readiness score if succession section is included
  let readinessScore = null
  if (sections.includes('succession')) {
    readinessScore = await getSuccessionReadinessScore()
  }

  // Build forecast data based on time horizon
  type ForecastDataItem = {
    section: string
    type: string
    count?: number
    name?: string
    rank?: string
    retirementDate?: string
    monthsUntilRetirement?: number
    readiness?: string
    yearsOfService?: number
    qualificationGaps?: string[]
    month?: string
    warningLevel?: string
    captainShortage?: number
    firstOfficerShortage?: number
    message?: string
    severity?: string
  }

  const forecastData: ForecastDataItem[] = []

  // Retirement data
  if (retirementData) {
    const relevantRetirements =
      timeHorizon === '2yr' ? retirementData.twoYears : retirementData.fiveYears

    // Add summary row
    forecastData.push({
      section: 'Retirement Forecast',
      type: 'summary',
      count: relevantRetirements.total,
    })

    // Add captain retirements
    relevantRetirements.captainsList.forEach((pilot: any) => {
      forecastData.push({
        section: 'Retirement Forecast',
        type: 'captain',
        name: pilot.name,
        rank: 'Captain',
        retirementDate: pilot.retirementDate.toISOString?.() || pilot.retirementDate,
        monthsUntilRetirement: pilot.monthsUntilRetirement,
      })
    })

    // Add FO retirements
    relevantRetirements.firstOfficersList.forEach((pilot: any) => {
      forecastData.push({
        section: 'Retirement Forecast',
        type: 'first_officer',
        name: pilot.name,
        rank: 'First Officer',
        retirementDate: pilot.retirementDate.toISOString?.() || pilot.retirementDate,
        monthsUntilRetirement: pilot.monthsUntilRetirement,
      })
    })
  }

  // Succession data
  if (successionData && readinessScore) {
    // Add readiness score summary
    forecastData.push({
      section: 'Succession Planning',
      type: 'readiness_score',
      count: readinessScore.score,
    })

    // Add ready candidates
    successionData.ready.forEach((candidate) => {
      forecastData.push({
        section: 'Succession Planning',
        type: 'ready',
        name: candidate.fullName,
        readiness: 'Ready',
        yearsOfService: candidate.yearsOfService,
        qualificationGaps: candidate.qualificationGaps,
      })
    })

    // Add potential candidates
    successionData.potential.forEach((candidate) => {
      forecastData.push({
        section: 'Succession Planning',
        type: 'potential',
        name: candidate.fullName,
        readiness: 'Potential',
        yearsOfService: candidate.yearsOfService,
        qualificationGaps: candidate.qualificationGaps,
      })
    })
  }

  // Crew shortage predictions
  if (crewImpactData) {
    // Add critical warnings
    crewImpactData.warnings
      .filter((w) => w.severity === 'critical')
      .forEach((warning) => {
        forecastData.push({
          section: 'Crew Shortage Predictions',
          type: 'critical_warning',
          month: warning.month,
          rank: warning.rank,
          message: warning.message,
          severity: warning.severity,
        })
      })

    // Add monthly projections with issues
    crewImpactData.monthly
      .filter((m) => m.warningLevel !== 'none')
      .forEach((month) => {
        forecastData.push({
          section: 'Crew Shortage Predictions',
          type: 'monthly_projection',
          month: month.month,
          warningLevel: month.warningLevel,
          captainShortage: month.captainShortage,
          firstOfficerShortage: month.firstOfficerShortage,
        })
      })
  }

  // Calculate summary
  const summary = {
    timeHorizon,
    retirementsInPeriod: retirementData
      ? timeHorizon === '2yr'
        ? retirementData.twoYears.total
        : retirementData.fiveYears.total
      : 0,
    captainRetirements: retirementData
      ? timeHorizon === '2yr'
        ? retirementData.twoYears.captains
        : retirementData.fiveYears.captains
      : 0,
    foRetirements: retirementData
      ? timeHorizon === '2yr'
        ? retirementData.twoYears.firstOfficers
        : retirementData.fiveYears.firstOfficers
      : 0,
    successionReadinessScore: readinessScore?.score || 'N/A',
    successionReadinessLevel: readinessScore?.level || 'N/A',
    readyCandidates: successionData?.ready.length || 0,
    potentialCandidates: successionData?.potential.length || 0,
    criticalShortageMonths: crewImpactData?.summary.criticalMonths || 0,
    totalWarnings: crewImpactData?.summary.totalWarnings || 0,
  }

  // Generate dynamic title based on filters
  const title = generateReportTitle('forecast', filters)
  const description = generateReportDescription('forecast', filters)

  // For full exports (PDF/Email), return all data without pagination
  if (fullExport) {
    return {
      title,
      description,
      generatedAt: new Date().toISOString(),
      generatedBy: generatedBy || 'System',
      filters,
      data: forecastData,
      summary,
      pagination: undefined,
    }
  }

  // For preview, apply pagination
  const page = filters.page || 1
  const pageSize = filters.pageSize || DEFAULT_PAGE_SIZE
  const start = (page - 1) * pageSize
  const paginatedData = forecastData.slice(start, start + pageSize)

  const pagination: PaginationMeta = {
    currentPage: page,
    pageSize,
    totalRecords: forecastData.length,
    totalPages: Math.ceil(forecastData.length / pageSize),
    hasNextPage: page < Math.ceil(forecastData.length / pageSize),
    hasPrevPage: page > 1,
  }

  return {
    title,
    description,
    generatedAt: new Date().toISOString(),
    generatedBy: generatedBy || 'System',
    filters,
    data: paginatedData,
    summary,
    pagination,
  }
}

/**
 * Main report generation function with caching
 * Phase 2.6: Added fullExport and generatedBy parameters
 * Phase 3.0: Updated for 3-table architecture
 */
export async function generateReport(
  reportType: ReportType,
  filters: ReportFilters,
  fullExport: boolean = false,
  generatedBy?: string
): Promise<ReportData> {
  // For full exports, skip caching to ensure we get fresh, complete data
  if (fullExport) {
    switch (reportType) {
      case 'rdo-sdo':
        return generateRdoSdoReport(filters, true, generatedBy)
      case 'leave':
        return generateLeaveReport(filters, true, generatedBy)
      case 'leave-bids':
        return generateLeaveBidsReport(filters, true, generatedBy)
      case 'all-requests':
        return generateAllRequestsReport(filters, true, generatedBy)
      case 'flight-requests':
        // Redirect to RDO/SDO for backward compatibility
        return generateFlightRequestReport(filters, true, generatedBy)
      case 'certifications':
        return generateCertificationsReport(filters, true, generatedBy)
      case 'pilot-info':
        return generatePilotInfoReport(filters, true, generatedBy)
      case 'forecast':
        return generateForecastReport(filters, true, generatedBy)
      default:
        throw new Error(`Unknown report type: ${reportType}`)
    }
  }

  // For preview (paginated), use caching
  const cacheKey = generateCacheKey(reportType, filters)

  return unifiedCacheService.getOrSet(
    cacheKey,
    async () => {
      // Generate report based on type
      switch (reportType) {
        case 'rdo-sdo':
          return generateRdoSdoReport(filters, false, generatedBy)
        case 'leave':
          return generateLeaveReport(filters, false, generatedBy)
        case 'leave-bids':
          return generateLeaveBidsReport(filters, false, generatedBy)
        case 'all-requests':
          return generateAllRequestsReport(filters, false, generatedBy)
        case 'flight-requests':
          // Redirect to RDO/SDO for backward compatibility
          return generateFlightRequestReport(filters, false, generatedBy)
        case 'certifications':
          return generateCertificationsReport(filters, false, generatedBy)
        case 'pilot-info':
          return generatePilotInfoReport(filters, false, generatedBy)
        case 'forecast':
          return generateForecastReport(filters, false, generatedBy)
        default:
          throw new Error(`Unknown report type: ${reportType}`)
      }
    },
    REPORT_CACHE_CONFIG.TTL_SECONDS
  )
}

/**
 * Invalidate report cache when data is mutated
 * Call this from API routes that modify leave requests, flight requests, or certifications
 */
export function invalidateReportCache(reportType?: ReportType): void {
  if (reportType) {
    // Invalidate specific report type
    invalidateCacheByTag(
      REPORT_CACHE_CONFIG.TAGS[
        reportType.toUpperCase().replace('-', '_') as keyof typeof REPORT_CACHE_CONFIG.TAGS
      ]
    )
  } else {
    // Invalidate all reports
    Object.values(REPORT_CACHE_CONFIG.TAGS).forEach((tag) => invalidateCacheByTag(tag))
  }
}
