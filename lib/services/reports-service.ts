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

import { readFileSync } from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { unifiedCacheService, invalidateCacheByTag } from '@/lib/services/unified-cache-service'
import type { ReportType, ReportFilters, ReportData, PaginationMeta } from '@/types/reports'
import { rosterPeriodsToDateRange } from '@/lib/utils/roster-periods'
import { getAffectedRosterPeriods } from '@/lib/utils/roster-utils'
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
import { isRHSCaptainValid } from '@/lib/utils/qualification-utils'
import {
  DEFAULT_THRESHOLDS,
  getCertificationStatus,
  getDaysUntilExpiry,
} from '@/lib/utils/certification-status'
import { parseLocalDate, DEFAULT_RETIREMENT_AGE } from '@/lib/utils/retirement-utils'
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
 * Deterministic JSON serializer: recursively sorts object keys so semantically-equal
 * filters always produce the same string. Plain `JSON.stringify(obj, keys.sort())` uses
 * the second arg as an ALLOWLIST and silently drops nested-object keys not in the list,
 * which was producing identical cache keys for different date ranges.
 * Arrays are NOT sorted — order is significant for fields like `groupBy`.
 */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`
}

/**
 * Generate cache key from report type and filters.
 * Uses SHA-256 (not a truncated base64 prefix) so two filter sets that happen to share
 * a leading prefix don't collide.
 */
function generateCacheKey(reportType: ReportType, filters: ReportFilters): string {
  const hash = createHash('sha256').update(stableStringify(filters)).digest('base64url')
  return `report:${reportType}:${hash}`
}

/**
 * Resolve the invalidation tag for a report type. Returns undefined for unknown types
 * rather than throwing, so the caching path stays best-effort.
 */
function getReportCacheTag(reportType: ReportType): string | undefined {
  const key = reportType.toUpperCase().replace(/-/g, '_') as keyof typeof REPORT_CACHE_CONFIG.TAGS
  return REPORT_CACHE_CONFIG.TAGS[key]
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
 * Compute multi-roster period string from a request's date range
 * Falls back to static roster_period field if calculation fails
 */
function computeRosterPeriods(item: any): string {
  if (!item.start_date) return item.roster_period || 'N/A'
  try {
    const startDate = new Date(item.start_date)
    const endDate = item.end_date ? new Date(item.end_date) : startDate
    const periods = getAffectedRosterPeriods(startDate, endDate)
    return periods.map((p) => p.code).join(', ')
  } catch {
    return item.roster_period || 'N/A'
  }
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
    // Overlap semantics: a leave intersects [startDate, endDate] if it starts on
    // or before endDate AND ends on or after startDate (NULL end_date = ongoing).
    // Containment semantics dropped multi-day leaves (notably SICK) that crossed
    // a roster-period boundary; matches the pattern in leave-eligibility-service.
    query = query
      .lte('start_date', effectiveDateRange.endDate)
      .or(`end_date.gte.${effectiveDateRange.startDate},end_date.is.null`)
  }

  if (filters.status && filters.status.length > 0) {
    query = query.in('workflow_status', filters.status)
  }

  if (filters.requestType && filters.requestType.length > 0) {
    query = query.in('request_type', filters.requestType)
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

  // Calculate summary statistics (before pagination).
  // Note: workflow_status values are UPPERCASE in database (3-table architecture).
  // Every workflow_status value gets its own bucket so the breakdown sums to
  // totalRequests — previously `draft` was missing, so DRAFT rows appeared in
  // the total but in no category, making the summary look internally broken.
  const summary = {
    totalRequests: filteredData.length,

    draft: filteredData.filter((r: any) => r.workflow_status?.toUpperCase() === 'DRAFT').length,

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
    // Overlap semantics — see generateLeaveReport for rationale.
    query = query
      .lte('start_date', effectiveDateRange.endDate)
      .or(`end_date.gte.${effectiveDateRange.startDate},end_date.is.null`)
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

  // Calculate expiry and filter by threshold. Use the shared `getDaysUntilExpiry`
  // util (setHours(0,0,0,0) + Math.ceil) so the report agrees with the dashboard
  // badge for the same cert — the previous inline `Math.floor` math flipped a
  // "expires today" cert to EXPIRED any time the report ran after ~14:00 PNG.
  //
  // "Expiring soon" threshold semantics:
  //   - When the user picks a threshold, use it (their filter and the summary
  //     buckets should agree on what counts as "soon").
  //   - When no threshold is set, default to EXTENDED_WARNING_DAYS (90) — the
  //     "approaching renewal" window operations managers use for this report.
  //     Note: this is intentionally wider than the 30-day badge default in
  //     certification-status.ts; both are documented FAA-aligned operational
  //     concepts (30 = mandatory advance notice, 90 = renewal-planning window).
  const expiringSoonThreshold = filters.expiryThreshold ?? DEFAULT_THRESHOLDS.EXTENDED_WARNING_DAYS

  const dataWithExpiry = filteredData.map((cert: any) => {
    const daysUntilExpiry = getDaysUntilExpiry(cert.expiry_date) ?? 0

    return {
      ...cert,
      daysUntilExpiry,
      isExpired: daysUntilExpiry < 0,
      isExpiringSoon: daysUntilExpiry >= 0 && daysUntilExpiry <= expiringSoonThreshold,
      // Add formatted dates for safe display (Australian + PNG TZ via shared helper)
      formattedExpiryDate: formatAustralianDate(cert.expiry_date),
      formattedCompletionDate: formatAustralianDate(cert.completion_date),
    }
  })

  // Filter by expiry threshold if provided. Future-only (>= 0) — "Expiring in
  // 30 days" semantically excludes already-expired certs (those belong in a
  // separate "needs immediate attention" view, not a forward-looking renewal
  // report). Was previously inclusive of negative values, silently dragging
  // months of expired certs into a "next 30 days" report.
  let finalData = dataWithExpiry
  if (filters.expiryThreshold !== undefined) {
    finalData = dataWithExpiry.filter(
      (cert: any) => cert.daysUntilExpiry >= 0 && cert.daysUntilExpiry <= filters.expiryThreshold!
    )
  }

  /**
   * Calculate summary statistics (after threshold filter, so totals always equal
   * the table the user sees).
   *
   * Certification Status Thresholds:
   * - Expired:       daysUntilExpiry < 0
   * - Expiring Soon: 0 <= daysUntilExpiry <= expiringSoonThreshold
   *                  (user filter when set, otherwise EXTENDED_WARNING_DAYS = 90)
   * - Current:       daysUntilExpiry > expiringSoonThreshold
   *
   * The summary's "Expiring Soon" definition now tracks the user's threshold, so
   * the breakdown agrees with what's visible — previously the bucket was hard-
   * coded to 90 days even when the user filtered to 30, leaving "current" at 0
   * because everything beyond 30 had been filtered out.
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
    // Overlap semantics — see generateLeaveReport for rationale.
    rdoSdoQuery = rdoSdoQuery
      .lte('start_date', effectiveDateRange.endDate)
      .or(`end_date.gte.${effectiveDateRange.startDate},end_date.is.null`)
  }

  // Split `filters.status` by which table the status value can actually appear in.
  // pilot_requests uses workflow_status (DRAFT/SUBMITTED/IN_REVIEW/APPROVED/DENIED/WITHDRAWN);
  // leave_bids uses status (PENDING/APPROVED/REJECTED/WITHDRAWN). Without this split, the
  // same array got passed to both .in() filters — e.g. picking PENDING returned 0 from
  // pilot_requests (no such workflow_status), and picking SUBMITTED returned 0 from
  // leave_bids (no such bid status), silently dropping rows the user expected to see.
  const PILOT_REQUEST_STATUSES = new Set([
    'DRAFT',
    'SUBMITTED',
    'IN_REVIEW',
    'APPROVED',
    'DENIED',
    'WITHDRAWN',
  ])
  const LEAVE_BID_STATUSES = new Set(['PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN'])
  const statusIsActive = !!filters.status && filters.status.length > 0
  const workflowStatuses = filters.status?.filter((s) => PILOT_REQUEST_STATUSES.has(s)) ?? []
  const bidStatuses = filters.status?.filter((s) => LEAVE_BID_STATUSES.has(s)) ?? []

  if (workflowStatuses.length > 0) {
    rdoSdoQuery = rdoSdoQuery.in('workflow_status', workflowStatuses)
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
    // Overlap semantics — see generateLeaveReport for rationale.
    leaveQuery = leaveQuery
      .lte('start_date', effectiveDateRange.endDate)
      .or(`end_date.gte.${effectiveDateRange.startDate},end_date.is.null`)
  }

  if (workflowStatuses.length > 0) {
    leaveQuery = leaveQuery.in('workflow_status', workflowStatuses)
  }

  if (filters.rosterPeriod) {
    leaveQuery = leaveQuery.eq('roster_period', filters.rosterPeriod)
  }

  // Fetch Leave bids - join with pilots to filter by active status
  let leaveBidsQuery = supabase
    .from('leave_bids')
    .select('*, pilot:pilots!pilot_id(is_active)')
    .order('created_at', { ascending: false })

  if (bidStatuses.length > 0) {
    leaveBidsQuery = leaveBidsQuery.in('status', bidStatuses)
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

  // When the user actively filtered status, exclude any source for which no
  // applicable status value was chosen. Otherwise the source would return ALL
  // rows (unfiltered) and over-include — e.g. filtering only by DRAFT would
  // accidentally surface every leave bid.
  const includeWorkflow = !statusIsActive || workflowStatuses.length > 0
  const includeBids = !statusIsActive || bidStatuses.length > 0

  // Combine all data with source tags
  // Filter out inactive pilots (Supabase can't filter on joined table fields)
  const allRequests: any[] = [
    ...(includeWorkflow ? rdoSdoResult.data || [] : [])
      .filter((r: any) => r.pilot?.is_active === true)
      .map((r: any) => ({ ...r, request_source: 'RDO/SDO' })),

    ...(includeWorkflow ? leaveResult.data || [] : [])
      .filter((r: any) => r.pilot?.is_active === true)
      .map((r: any) => ({ ...r, request_source: 'LEAVE' })),

    ...(includeBids ? leaveBidsResult.data || [] : [])
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
 * Group pilot data by role or qualification category.
 * Returns a Map with group label as key and matching pilots as values.
 */
function groupPilotsByCategory(data: any[], category: string): Map<string, any[]> {
  // Special case: group by rank splits into Captains and First Officers
  if (category === 'rank') {
    const captains = data.filter((p: any) => p.rank === 'Captain')
    const firstOfficers = data.filter((p: any) => p.rank === 'First Officer')
    const result = new Map<string, any[]>()
    if (captains.length > 0) result.set('Captains', captains)
    if (firstOfficers.length > 0) result.set('First Officers', firstOfficers)
    return result
  }

  const matched: any[] = []
  const unmatched: any[] = []

  for (const pilot of data) {
    let belongs = false
    if (category === 'captain') {
      belongs = pilot.rank === 'Captain'
    } else if (category === 'first_officer') {
      belongs = pilot.rank === 'First Officer'
    } else if (category === 'line_captain') {
      belongs = pilot.qualifications?.line_captain === true
    } else if (category === 'training_captain') {
      belongs = pilot.qualifications?.training_captain === true
    } else if (category === 'examiner') {
      belongs = pilot.qualifications?.examiner === true
    } else if (category === 'rhs_captain') {
      belongs = pilot.qualifications?.rhs_captain === true
    }

    if (belongs) matched.push(pilot)
    else unmatched.push(pilot)
  }

  const labels: Record<string, string> = {
    captain: 'Captains',
    first_officer: 'First Officers',
    line_captain: 'Line Captains',
    training_captain: 'Training Captains',
    examiner: 'Examiners',
    rhs_captain: 'RHS Captains',
  }

  const result = new Map<string, any[]>()
  if (matched.length > 0) result.set(labels[category] || category, matched)
  if (unmatched.length > 0) result.set('Other Pilots', unmatched)
  return result
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
  const orientation = reportType === 'pilot-info' ? 'landscape' : 'portrait'
  const doc = new jsPDF({ orientation })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Air Niugini brand red — one constant so every table head looks the same
  // regardless of report. Replaces the previous per-report fillColor scatter
  // (blue/green/purple/sky/red/yellow) that included a WCAG-failing white-on-
  // yellow combination on the Crew Shortage table.
  const BRAND_HEAD_STYLES = {
    fillColor: [231, 76, 60] as [number, number, number],
    textColor: [255, 255, 255] as [number, number, number],
    fontStyle: 'bold' as const,
  }
  // Subtle zebra striping makes dense 8-column tables at fontSize 6-7 scannable.
  const ALTERNATE_ROW_STYLES = {
    fillColor: [248, 248, 248] as [number, number, number],
  }
  // Margins reserve space for the per-page letterhead and footer so autoTable
  // doesn't render rows underneath them on page 2+.
  const PAGE_MARGIN = { top: 38, bottom: 16, left: 14, right: 14 }

  // PDF metadata so viewers show the report title (not the filename) and DMS
  // systems can index author/keywords. setLanguage helps screen readers.
  doc.setProperties({
    title: report.title,
    subject: report.description,
    author: report.generatedBy || 'Air Niugini Fleet Management System',
    creator: 'Air Niugini Fleet Management System',
    keywords: `air-niugini,fleet,${reportType},${report.generatedAt}`,
  })
  doc.setLanguage('en-AU')

  // Resolve the days-count cell for RDO/SDO/Flight Request rows. Computes from start/end
  // dates when `days_count` is null so multi-day requests don't silently render as "1".
  const formatRequestDays = (item: any): string => {
    if (item.days_count != null) return String(item.days_count)
    if (item.start_date && item.end_date) {
      const start = new Date(item.start_date).getTime()
      const end = new Date(item.end_date).getTime()
      if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
        return String(Math.floor((end - start) / 86400000) + 1)
      }
    }
    return '-'
  }

  // Cache the logo bytes once so multi-page reports don't re-read the file
  // on every page draw inside the didDrawPage callback.
  let logoBase64: string | null = null
  try {
    const logoPath = join(process.cwd(), 'public', 'images', 'air-niugini-logo.jpg')
    const logoData = readFileSync(logoPath)
    logoBase64 = `data:image/jpeg;base64,${logoData.toString('base64')}`
  } catch {
    // Logo not found — continue without it (already-failed draws will simply skip)
  }

  // Split title: base title (before first " - ") and filter segments (after)
  const filterSepIndex = report.title.indexOf(' - ')
  const baseTitle = filterSepIndex > -1 ? report.title.substring(0, filterSepIndex) : report.title
  const filterSegments =
    filterSepIndex > -1
      ? report.title
          .substring(filterSepIndex + 3)
          .split(' - ')
          .join('  |  ')
      : ''

  // Draw the brand letterhead. Called both on page 1 (immediately, so the
  // filter/summary block below stays where it was) and via didDrawPage on
  // subsequent pages so multi-page reports don't lose branding after p1.
  const drawReportHeader = () => {
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'JPEG', 14, 8, 16, 16)
      } catch {
        // skip — cached but couldn't be re-added
      }
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0)
    doc.text(baseTitle, 34, 15, { align: 'left' })

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100)
    doc.text('Air Niugini — Fleet Management System', 34, 21, { align: 'left' })
    doc.setTextColor(0)

    doc.setFontSize(8)
    doc.text(`Generated: ${formatAustralianDateTime(report.generatedAt)}`, pageWidth - 14, 15, {
      align: 'right',
    })
    if (report.generatedBy) {
      doc.setTextColor(100)
      doc.text(`By: ${report.generatedBy}`, pageWidth - 14, 20, { align: 'right' })
      doc.setTextColor(0)
    }

    // Header separator
    doc.setDrawColor(200)
    doc.setLineWidth(0.3)
    doc.line(14, 28, pageWidth - 14, 28)
  }

  // didDrawPage callback for autoTable. Fires after EVERY page autoTable
  // produces. Skip page 1 — the main code already drew the header + summary
  // there and rendering it again would duplicate the strip.
  const drawSubsequentPageHeader = (data: any) => {
    if (data.pageNumber > 1) drawReportHeader()
  }

  drawReportHeader()

  // Filter + summary compact block below separator
  let yPos = 31
  if (filterSegments) {
    doc.setFontSize(7)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(100)
    doc.text(`Filters: ${filterSegments}`, 14, yPos)
    doc.setTextColor(0)
    doc.setFont('helvetica', 'normal')
    yPos += 5
  }

  if (report.summary) {
    const entries = Object.entries(report.summary)
    const colCount = 4
    const colWidth = (pageWidth - 28) / colCount
    const rowHeight = 4.5

    doc.setFontSize(7)
    entries.forEach(([key, value], index) => {
      const col = index % colCount
      const row = Math.floor(index / colCount)
      const x = 14 + col * colWidth
      const y = yPos + row * rowHeight
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100)
      doc.text(`${label}: `, x, y)
      const labelWidth = doc.getTextWidth(`${label}: `)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0)
      doc.text(`${value}`, x + labelWidth, y)
    })

    const totalRows = Math.ceil(entries.length / colCount)
    yPos += totalRows * rowHeight + 3
  }

  yPos += 2

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
          head: [
            [
              'Pilot',
              'Rank',
              'Type',
              'Submitted',
              'Start Date',
              'End Date',
              'Status',
              'Late',
              'Roster Period',
            ],
          ],
          body: groupData.map((item: any) => [
            item.name ||
              [item.pilot?.first_name, item.pilot?.last_name].filter(Boolean).join(' ') ||
              'N/A',
            item.rank || item.pilot?.role || 'N/A',
            item.request_type || item.leave_type || 'N/A',
            formatAustralianDate(item.submission_date),
            formatAustralianDate(item.start_date),
            formatAustralianDate(item.end_date),
            item.workflow_status || item.status || 'N/A',
            item.is_late_request ? 'Yes' : '',
            computeRosterPeriods(item),
          ]),
          styles: { fontSize: 7 },
          headStyles: BRAND_HEAD_STYLES,
          alternateRowStyles: ALTERNATE_ROW_STYLES,
          margin: PAGE_MARGIN,
          didDrawPage: drawSubsequentPageHeader,
        })

        yPos = (doc as any).lastAutoTable?.finalY + 15 || yPos + 50
      }
    } else {
      // Flat rendering (no grouping)
      autoTable(doc, {
        startY: yPos,
        head: [
          [
            'Pilot',
            'Rank',
            'Type',
            'Submitted',
            'Start Date',
            'End Date',
            'Status',
            'Late',
            'Roster Period',
          ],
        ],
        body: report.data.map((item: any) => [
          item.name ||
            [item.pilot?.first_name, item.pilot?.last_name].filter(Boolean).join(' ') ||
            'N/A',
          item.rank || item.pilot?.role || 'N/A',
          item.request_type || item.leave_type || 'N/A',
          formatAustralianDate(item.submission_date),
          formatAustralianDate(item.start_date),
          formatAustralianDate(item.end_date),
          item.workflow_status || item.status || 'N/A',
          item.is_late_request ? 'Yes' : '',
          computeRosterPeriods(item),
        ]),
        styles: { fontSize: 7 },
        headStyles: BRAND_HEAD_STYLES,
        alternateRowStyles: ALTERNATE_ROW_STYLES,
        margin: PAGE_MARGIN,
        didDrawPage: drawSubsequentPageHeader,
      })
    }
  } else if (reportType === 'rdo-sdo' || reportType === 'flight-requests') {
    // `flight-requests` is a deprecated alias; the service redirects it to generateRdoSdoReport,
    // so rows share the unified pilot_requests shape — share the renderer to avoid field drift.
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
            [
              'Pilot',
              'Rank',
              'Type',
              'Submitted',
              'Start Date',
              'End Date',
              'Days',
              'Status',
              'Late',
              'Roster Period',
            ],
          ],
          body: groupData.map((item: any) => [
            item.name || 'N/A',
            item.rank || 'N/A',
            item.request_type || 'N/A',
            formatAustralianDate(item.submission_date),
            formatAustralianDate(item.start_date),
            item.end_date
              ? formatAustralianDate(item.end_date)
              : formatAustralianDate(item.start_date),
            formatRequestDays(item),
            item.workflow_status || 'N/A',
            item.is_late_request ? 'Yes' : '',
            computeRosterPeriods(item),
          ]),
          styles: { fontSize: 7 },
          headStyles: BRAND_HEAD_STYLES,
          alternateRowStyles: ALTERNATE_ROW_STYLES,
          margin: PAGE_MARGIN,
          didDrawPage: drawSubsequentPageHeader,
        })

        yPos = (doc as any).lastAutoTable?.finalY + 15 || yPos + 50
      }
    } else {
      // Flat rendering (no grouping)
      autoTable(doc, {
        startY: yPos,
        head: [
          [
            'Pilot',
            'Rank',
            'Type',
            'Submitted',
            'Start Date',
            'End Date',
            'Days',
            'Status',
            'Late',
            'Roster Period',
          ],
        ],
        body: report.data.map((item: any) => [
          item.name || 'N/A',
          item.rank || 'N/A',
          item.request_type || 'N/A',
          formatAustralianDate(item.submission_date),
          formatAustralianDate(item.start_date),
          item.end_date
            ? formatAustralianDate(item.end_date)
            : formatAustralianDate(item.start_date),
          formatRequestDays(item),
          item.workflow_status || 'N/A',
          item.is_late_request ? 'Yes' : '',
          computeRosterPeriods(item),
        ]),
        styles: { fontSize: 7 },
        headStyles: BRAND_HEAD_STYLES,
        alternateRowStyles: ALTERNATE_ROW_STYLES,
        margin: PAGE_MARGIN,
        didDrawPage: drawSubsequentPageHeader,
      })
    }
  } else if (reportType === 'all-requests') {
    autoTable(doc, {
      startY: yPos,
      head: [
        [
          'Source',
          'Pilot',
          'Rank',
          'Type',
          'Submitted',
          'Start Date',
          'Status',
          'Late',
          'Roster Period',
        ],
      ],

      body: report.data.map((item: any) => [
        item.request_source || 'N/A',
        item.name || 'N/A',
        item.rank || 'N/A',
        item.request_type || item.leave_type || 'N/A',
        formatAustralianDate(item.submission_date || item.created_at),
        formatAustralianDate(item.start_date || item.created_at),
        item.workflow_status || item.status || 'N/A',
        item.is_late_request ? 'Yes' : '',
        computeRosterPeriods(item),
      ]),
      styles: { fontSize: 7 },
      headStyles: BRAND_HEAD_STYLES,
      alternateRowStyles: ALTERNATE_ROW_STYLES,
      margin: PAGE_MARGIN,
      didDrawPage: drawSubsequentPageHeader,
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
            [item.pilot?.first_name, item.pilot?.last_name].filter(Boolean).join(' ') || 'N/A',
            item.pilot?.role || 'N/A',
            item.check_type?.check_description || item.check_type?.check_code || 'N/A',
            formatAustralianDate(item.expiry_date),
            item.daysUntilExpiry,
            // Text markers stop the status from being color-only — important for
            // B&W printing of compliance docs (auditors routinely print these).
            // 'X ' for expired, '! ' for expiring soon, no marker for current.
            item.isExpired ? 'X EXPIRED' : item.isExpiringSoon ? '! EXPIRING SOON' : 'CURRENT',
          ]),
          styles: { fontSize: 8 },
          headStyles: BRAND_HEAD_STYLES,
          alternateRowStyles: ALTERNATE_ROW_STYLES,
          margin: PAGE_MARGIN,
          didDrawPage: drawSubsequentPageHeader,
          bodyStyles: { cellPadding: 2 },
          didParseCell: (data) => {
            if (data.column.index === 5 && data.section === 'body') {
              const status = data.cell.text[0] ?? ''
              if (status.startsWith('X ')) {
                data.cell.styles.textColor = [231, 76, 60] // red
                data.cell.styles.fontStyle = 'bold'
              } else if (status.startsWith('! ')) {
                // Darkened from #F1C40F (~1.7:1 contrast) to #B58900 (~5.4:1, WCAG AA)
                data.cell.styles.textColor = [181, 137, 0]
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
          [item.pilot?.first_name, item.pilot?.last_name].filter(Boolean).join(' ') || 'N/A',
          item.pilot?.role || 'N/A',
          item.check_type?.check_description || item.check_type?.check_code || 'N/A',
          formatAustralianDate(item.expiry_date),
          item.daysUntilExpiry,
          // Text markers stop the status from being color-only — important for
          // B&W printing of compliance docs (auditors routinely print these).
          item.isExpired ? 'X EXPIRED' : item.isExpiringSoon ? '! EXPIRING SOON' : 'CURRENT',
        ]),
        styles: { fontSize: 8 },
        headStyles: BRAND_HEAD_STYLES,
        alternateRowStyles: ALTERNATE_ROW_STYLES,
        margin: PAGE_MARGIN,
        didDrawPage: drawSubsequentPageHeader,
        bodyStyles: {
          cellPadding: 2,
        },
        didParseCell: (data) => {
          // Color code status column. Match on the marker prefix instead of the
          // full string so a future label tweak (i18n, casing) doesn't silently
          // lose the color.
          if (data.column.index === 5 && data.section === 'body') {
            const status = data.cell.text[0] ?? ''
            if (status.startsWith('X ')) {
              data.cell.styles.textColor = [231, 76, 60] // red
              data.cell.styles.fontStyle = 'bold'
            } else if (status.startsWith('! ')) {
              // Darkened from #F1C40F (~1.7:1 contrast) to #B58900 (~5.4:1, WCAG AA)
              data.cell.styles.textColor = [181, 137, 0]
              data.cell.styles.fontStyle = 'bold'
            }
          }
        },
      })
    }
  } else if (reportType === 'leave-bids') {
    // Use specialized leave bids PDF service
    const currentYear = new Date().getFullYear()
    const bidYear = report.data[0]?.bid_year || currentYear
    const statusFilter = (report.summary?.statusFilter as string) || 'all'

    // Pass enhanced summary and grouping to the PDF service
    return await generateLeaveBidsPDF(
      report.data,
      bidYear,
      statusFilter,
      report.summary as any,
      grouping
    )
  } else if (reportType === 'pilot-info') {
    const pilotGroupBy = report.filters?.pilotGroupBy
    const pilotTableHead = [
      [
        '#',
        'Emp ID',
        'Name',
        'Rank',
        'Licence',
        'Lic #',
        'Contract',
        'DOB',
        'Nationality',
        'Comm. Date',
        'Yrs Svc',
        'Retire Date',
        'Yrs to Ret',
        'Passport #',
        'Pass. Exp',
        'Email',
        'Phone',
        'Quals',
      ],
    ]
    const pilotTableStyles = { fontSize: 6, cellPadding: 1.5 }
    const pilotHeadStyles = {
      ...BRAND_HEAD_STYLES,
      fontSize: 6,
    }
    const pilotColumnStyles: Record<number, any> = {
      0: { cellWidth: 8 }, // Seniority
      1: { cellWidth: 14 }, // Emp ID
      2: { cellWidth: 28 }, // Name
      3: { cellWidth: 14 }, // Rank
      4: { cellWidth: 10 }, // Licence type
      5: { cellWidth: 16 }, // Licence #
      6: { cellWidth: 14 }, // Contract
      7: { cellWidth: 16 }, // DOB
      8: { cellWidth: 14 }, // Nationality
      9: { cellWidth: 16 }, // Comm date
      10: { cellWidth: 10 }, // Yrs service
      11: { cellWidth: 16 }, // Retire date
      12: { cellWidth: 10 }, // Yrs to ret
      13: { cellWidth: 18 }, // Passport #
      14: { cellWidth: 16 }, // Passport exp
      15: { cellWidth: 30 }, // Email
      16: { cellWidth: 20 }, // Phone
      17: { cellWidth: 16 }, // Quals
    }
    const pilotDidParseCell = (data: any) => {
      // Inactive status row styling
      if (data.section === 'body') {
        const rowData = data.row.raw
        if (Array.isArray(rowData) && rowData[3] === 'Inactive') {
          data.cell.styles.textColor = [150, 150, 150]
        }
      }
    }
    const fmtDate = (d: string | null) =>
      d
        ? new Date(d).toLocaleDateString('en-AU', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : '-'
    const pilotRowMapper = (item: any) => [
      item.seniority_number != null ? item.seniority_number : '-',
      item.employee_id || '-',
      item.name || '-',
      item.rank || '-',
      item.licence_type || '-',
      item.licence_number || '-',
      item.contract_type || '-',
      fmtDate(item.date_of_birth),
      item.nationality || '-',
      fmtDate(item.commencement_date),
      item.years_in_service != null ? `${item.years_in_service}` : '-',
      fmtDate(item.retirement_date),
      item.years_to_retirement != null ? `${item.years_to_retirement}` : '-',
      item.passport_number || '-',
      fmtDate(item.passport_expiry),
      item.email || '-',
      item.phone_number || '-',
      [
        item.qualifications?.line_captain ? 'LC' : '',
        item.qualifications?.training_captain ? 'TC' : '',
        item.qualifications?.examiner ? 'EX' : '',
        item.qualifications?.rhs_captain ? 'RHS' : '',
      ]
        .filter(Boolean)
        .join(', ') || '-',
    ]

    if (pilotGroupBy && pilotGroupBy !== 'none') {
      // Group pilots by selected category
      const grouped = groupPilotsByCategory(report.data, pilotGroupBy)
      const sortedKeys = Array.from(grouped.keys()).sort()

      for (const groupKey of sortedKeys) {
        const groupData = grouped.get(groupKey) || []

        // Group header
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text(`${groupKey} (${groupData.length})`, 14, yPos)
        yPos += 6

        autoTable(doc, {
          startY: yPos,
          head: pilotTableHead,
          body: groupData.map(pilotRowMapper),
          styles: pilotTableStyles,
          headStyles: pilotHeadStyles,
          columnStyles: pilotColumnStyles,
          alternateRowStyles: ALTERNATE_ROW_STYLES,
          margin: PAGE_MARGIN,
          didParseCell: pilotDidParseCell,
          didDrawPage: drawSubsequentPageHeader,
        })

        yPos = (doc as any).lastAutoTable?.finalY + 12 || yPos + 50
      }
    } else {
      // Flat rendering (no grouping)
      autoTable(doc, {
        startY: yPos,
        head: pilotTableHead,
        body: report.data.map(pilotRowMapper),
        styles: pilotTableStyles,
        headStyles: pilotHeadStyles,
        columnStyles: pilotColumnStyles,
        alternateRowStyles: ALTERNATE_ROW_STYLES,
        margin: PAGE_MARGIN,
        didParseCell: pilotDidParseCell,
        didDrawPage: drawSubsequentPageHeader,
      })
    }
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
          headStyles: BRAND_HEAD_STYLES,
          alternateRowStyles: ALTERNATE_ROW_STYLES,
          margin: PAGE_MARGIN,
          didDrawPage: drawSubsequentPageHeader,
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
          headStyles: BRAND_HEAD_STYLES,
          alternateRowStyles: ALTERNATE_ROW_STYLES,
          margin: PAGE_MARGIN,
          didDrawPage: drawSubsequentPageHeader,
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
          headStyles: BRAND_HEAD_STYLES,
          alternateRowStyles: ALTERNATE_ROW_STYLES,
          margin: PAGE_MARGIN,
          didDrawPage: drawSubsequentPageHeader,
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
 * Normalize leave bid options from either leave_bid_options table or preferred_dates JSON
 * Portal-submitted bids store dates in preferred_dates; admin-created bids use leave_bid_options
 */
function normalizeBidOptions(bid: any): any[] {
  const tableOptions = bid.leave_bid_options || []
  if (tableOptions.length > 0) return tableOptions

  // Parse preferred_dates JSON (portal submission format)
  if (!bid.preferred_dates) return []
  try {
    const parsed =
      typeof bid.preferred_dates === 'string'
        ? JSON.parse(bid.preferred_dates)
        : bid.preferred_dates
    if (!Array.isArray(parsed)) return []
    return parsed.map((item: any, index: number) => ({
      id: `${bid.id}-opt-${index}`,
      priority: item.priority || index + 1,
      start_date: item.start_date,
      end_date: item.end_date,
    }))
  } catch {
    return []
  }
}

/**
 * Generate Leave Bids Report
 * Queries leave_bids table with pilot and option information
 * Supports filtering by status, rank, roster periods, and year
 * Enriches bid options with affected roster period codes
 */
export async function generateLeaveBidsReport(
  filters: ReportFilters,
  fullExport: boolean = false,
  generatedBy?: string
): Promise<ReportData> {
  const supabase = createAdminClient()

  // Query leave_bids table with pilot and options information
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
      ),
      leave_bid_options (
        id,
        priority,
        start_date,
        end_date
      )
    `
    )
    .order('submitted_at', { ascending: false })

  // Apply filters (database-level where possible)
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status)
  }

  // NOTE: filters.rosterPeriods is intentionally NOT applied at the DB level.
  // The primary `roster_period_code` column only reflects the bid's primary period
  // — bids whose options span other periods (e.g. primary RP12, options reaching
  // into RP13) would be silently filtered out when the user selects RP13.
  // We apply this filter post-enrichment against `roster_periods_all`, which is
  // the union of the primary code and every option's computed roster period.

  if (filters.pilotId) {
    query = query.eq('pilot_id', filters.pilotId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error generating leave bids report:', error)
    throw new Error(`Failed to generate leave bids report: ${error.message}`)
  }

  // Filter out inactive pilots, enrich with computed fields and roster periods
  let enrichedData = (data || [])
    .filter((bid: any) => bid.pilot?.is_active === true)
    .map((bid: any) => {
      // Normalize options from table or preferred_dates
      const options = normalizeBidOptions(bid)

      // Enrich each option with affected roster period codes
      const enrichedOptions = options.map((opt: any) => {
        let roster_periods: string[] = []
        if (opt.start_date && opt.end_date) {
          try {
            const periods = getAffectedRosterPeriods(
              new Date(opt.start_date),
              new Date(opt.end_date)
            )
            roster_periods = periods.map((p) => p.code)
          } catch {
            // fallback — leave empty
          }
        }
        return { ...opt, roster_periods }
      })

      // Collect all unique roster period codes across all options
      const allRosterPeriods = new Set<string>()
      enrichedOptions.forEach((opt: any) => {
        opt.roster_periods.forEach((rp: string) => allRosterPeriods.add(rp))
      })
      if (bid.roster_period_code) {
        allRosterPeriods.add(bid.roster_period_code)
      }

      // Extract bid year from first option's start_date
      let bid_year = new Date().getFullYear()
      if (enrichedOptions.length > 0 && enrichedOptions[0].start_date) {
        bid_year = new Date(enrichedOptions[0].start_date).getFullYear()
      }

      return {
        ...bid,
        leave_bid_options: enrichedOptions,
        name: bid.pilot ? `${bid.pilot.first_name} ${bid.pilot.last_name}` : 'N/A',
        rank: bid.pilot?.role || 'N/A',
        seniority: bid.pilot?.seniority_number ?? null,
        roster_periods_all: Array.from(allRosterPeriods),
        bid_year,
      }
    })

  // Filter by year (post-query — bid_year is computed from option dates)
  if (filters.year) {
    enrichedData = enrichedData.filter((bid: any) => bid.bid_year === filters.year)
  }

  // Filter by roster periods (post-enrichment — see note on the DB-level
  // filter above for why this is intentionally not pushed into the query).
  if (filters.rosterPeriods && filters.rosterPeriods.length > 0) {
    enrichedData = enrichedData.filter((bid: any) =>
      bid.roster_periods_all?.some((rp: string) => filters.rosterPeriods!.includes(rp))
    )
  }

  // Filter by rank (post-query — Supabase can't filter on joined fields)
  if (filters.rank && filters.rank.length > 0) {
    enrichedData = enrichedData.filter((bid: any) => filters.rank!.includes(bid.rank))
  }

  // Calculate enhanced summary statistics.
  // `approvalRate` is omitted when the user actively filters by status — the
  // ratio of approved-to-total within a status-narrowed subset is misleading
  // (filtering to APPROVED would always show 100%).
  const totalBids = enrichedData.length
  const approvedCount = enrichedData.filter((b: any) => b.status === 'APPROVED').length
  const statusFilterActive = (filters.status?.length ?? 0) > 0
  const approvalRate = statusFilterActive
    ? undefined
    : totalBids > 0
      ? Math.round((approvedCount / totalBids) * 100)
      : 0

  // Bids per roster period (count each bid in all affected periods)
  const bidsByRosterPeriod: Record<string, number> = {}
  enrichedData.forEach((bid: any) => {
    // Count in all affected roster periods, not just the primary period
    const periods = bid.roster_periods_all || []
    if (periods.length > 0) {
      periods.forEach((period: string) => {
        bidsByRosterPeriod[period] = (bidsByRosterPeriod[period] || 0) + 1
      })
    } else {
      // Fallback to single period code if roster_periods_all not available
      const rp = bid.roster_period_code || 'N/A'
      bidsByRosterPeriod[rp] = (bidsByRosterPeriod[rp] || 0) + 1
    }
  })

  const summary = {
    totalBids,
    byStatus: {
      pending: enrichedData.filter((b: any) => b.status === 'PENDING').length,
      processing: enrichedData.filter((b: any) => b.status === 'PROCESSING').length,
      approved: approvedCount,
      rejected: enrichedData.filter((b: any) => b.status === 'REJECTED').length,
    },
    byRank: {
      captain: enrichedData.filter((b: any) => b.rank === 'Captain').length,
      firstOfficer: enrichedData.filter((b: any) => b.rank === 'First Officer').length,
    },
    bidsByRosterPeriod,
    statusFilter: filters.status?.length === 1 ? filters.status[0].toLowerCase() : 'all',
    approvalRate,
  }

  // Calculate pagination (after all filtering is complete)
  const page = filters.page || 1
  const pageSize = filters.pageSize || DEFAULT_PAGE_SIZE
  const totalRecords = enrichedData.length
  const pagination = calculatePagination(totalRecords, page, pageSize)

  // Apply pagination if not full export
  const paginatedData = fullExport ? enrichedData : paginateData(enrichedData, page, pageSize)

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

  // Query pilots with certifications. Paginate-to-exhaustion (mirrors
  // certification-service.getCertificationsUnpaginated) so we don't silently
  // truncate at Supabase's default 1000-row limit when the org grows past it
  // — the table here can include inactive/historical pilots when
  // filters.activeStatus = 'all', so the row count is unbounded by intent.
  const PAGE_SIZE = 1000
  const MAX_PAGES = 50
  const selectFields = `
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
      date_of_birth,
      contract_type,
      nationality,
      email,
      phone_number,
      passport_number,
      passport_expiry,
      pilot_checks (
        id,
        expiry_date,
        check_types (check_code, check_description)
      )
    `

  const pilots: any[] = []
  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE_SIZE
    const { data: chunk, error } = await supabase
      .from('pilots')
      .select(selectFields)
      .order('seniority_number', { ascending: true, nullsFirst: false })
      .range(from, from + PAGE_SIZE - 1)

    if (error) {
      throw new Error(`Failed to fetch pilots: ${error.message}`)
    }
    if (!chunk || chunk.length === 0) break
    pilots.push(...chunk)
    if (chunk.length < PAGE_SIZE) break
  }

  // Apply filters
  let filteredData = pilots

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

  // Filter by qualifications. Captain qualifications are a Captain-only attribute,
  // so when the user picks "Examiners" they mean "Captains who are examiners" —
  // including all First Officers (because the filter is "inapplicable" to them)
  // produced surprising results. Now non-Captains are excluded entirely whenever
  // any qualification filter is active.
  if (filters.qualifications && filters.qualifications.length > 0) {
    filteredData = filteredData.filter((pilot: any) => {
      if (pilot.role !== 'Captain') return false
      const quals = parseCaptainQualifications(pilot.captain_qualifications)
      if (!quals) {
        // Malformed JSON in captain_qualifications — log so admins can fix the
        // record. Filter still excludes (we can't classify them safely).
        if (pilot.captain_qualifications != null) {
          console.warn(
            `[reports] pilot ${pilot.id} (${pilot.first_name} ${pilot.last_name}) has malformed captain_qualifications; excluded from qualification-filtered report.`
          )
        }
        return false
      }

      return filters.qualifications!.some((q) => {
        if (q === 'line_captain') return quals.line_captain
        if (q === 'training_captain') return quals.training_captain
        if (q === 'examiner') return quals.examiner
        if (q === 'rhs_captain') return isRHSCaptainValid(quals)
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

    // Compute retirement and service dates.
    // Use parseLocalDate so date-only DOB strings (`YYYY-MM-DD`) aren't shifted by
    // UTC parsing — without it, Feb-29 / late-month births land on the wrong day
    // in non-UTC server timezones and disagree with the pilot detail card.
    const retirementAge = DEFAULT_RETIREMENT_AGE
    const now = new Date()
    let retirementDate: string | null = null
    let yearsInService: number | null = null
    let yearsToRetirement: number | null = null

    if (pilot.date_of_birth) {
      const dob = parseLocalDate(pilot.date_of_birth)
      const retDate = new Date(dob)
      retDate.setFullYear(retDate.getFullYear() + retirementAge)
      // Feb-29 → Mar 1 overflow clamp (matches calculateRetirementCountdown).
      if (retDate.getMonth() !== dob.getMonth()) retDate.setDate(0)
      retirementDate = `${retDate.getFullYear()}-${String(retDate.getMonth() + 1).padStart(2, '0')}-${String(retDate.getDate()).padStart(2, '0')}`
      yearsToRetirement = Math.max(
        0,
        parseFloat(
          ((retDate.getTime() - now.getTime()) / (365.25 * 24 * 60 * 60 * 1000)).toFixed(1)
        )
      )
    }

    if (pilot.commencement_date) {
      const commDate = parseLocalDate(pilot.commencement_date)
      yearsInService = parseFloat(
        ((now.getTime() - commDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)).toFixed(1)
      )
    }

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
      date_of_birth: pilot.date_of_birth,
      contract_type: pilot.contract_type,
      nationality: pilot.nationality,
      email: pilot.email,
      phone_number: pilot.phone_number,
      passport_number: pilot.passport_number,
      passport_expiry: pilot.passport_expiry,
      retirement_date: retirementDate,
      years_in_service: yearsInService,
      years_to_retirement: yearsToRetirement,
      qualifications: {
        line_captain: quals?.line_captain || false,
        training_captain: quals?.training_captain || false,
        examiner: quals?.examiner || false,
        rhs_captain: isRHSCaptainValid(quals),
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
    rhsCaptains: enrichedData.filter((p: any) => p.qualifications.rhs_captain).length,
    atplHolders: enrichedData.filter((p: any) => p.licence_type === 'ATPL').length,
    cplHolders: enrichedData.filter((p: any) => p.licence_type === 'CPL').length,
  }

  // Sort by rank (Captains first) then seniority for consistent grouping
  const pilotGroupBy = filters.pilotGroupBy || 'rank'
  if (pilotGroupBy === 'rank' || pilotGroupBy === 'none') {
    enrichedData.sort((a: any, b: any) => {
      // Captains first, then First Officers
      if (a.rank !== b.rank) return a.rank === 'Captain' ? -1 : 1
      // Within rank, sort by seniority number; null/missing seniority sorts last (use ?? not || so 0 isn't buried)
      const aSen = a.seniority_number ?? Number.POSITIVE_INFINITY
      const bSen = b.seniority_number ?? Number.POSITIVE_INFINITY
      if (aSen === bSen) return 0
      return aSen < bSen ? -1 : 1
    })
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

  // Use the centralized default until a real system-settings lookup exists.
  const retirementAge = DEFAULT_RETIREMENT_AGE

  // Parallel data fetching for efficiency
  const [retirementData, successionData, crewImpactData] = await Promise.all([
    sections.includes('retirement') ? getRetirementForecastByRank(retirementAge) : null,
    sections.includes('succession') ? getCaptainPromotionCandidates() : null,
    sections.includes('shortage')
      ? getCrewImpactAnalysis(retirementAge, 10, 10, timeHorizon === '2yr' ? 24 : 60)
      : null,
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
  const cacheTag = getReportCacheTag(reportType)

  // unifiedCacheService.getOrSet expects ttl in MILLISECONDS (it divides by 1000 for Redis).
  // Passing TTL_SECONDS directly killed the local cache after 300 ms and gave Redis a
  // floor-to-zero TTL, leaving the whole cache layer effectively disabled.
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
    REPORT_CACHE_CONFIG.TTL_SECONDS * 1000,
    { tags: cacheTag ? [cacheTag] : undefined }
  )
}

/**
 * Invalidate report cache when data is mutated
 * Call this from API routes that modify leave requests, flight requests, or certifications
 */
export function invalidateReportCache(reportType?: ReportType): void {
  if (reportType) {
    // Invalidate specific report type
    const tag = getReportCacheTag(reportType)
    if (tag) invalidateCacheByTag(tag)
  } else {
    // Invalidate all reports
    Object.values(REPORT_CACHE_CONFIG.TAGS).forEach((tag) => invalidateCacheByTag(tag))
  }
}
