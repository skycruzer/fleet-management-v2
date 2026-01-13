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

import { createClient } from '@/lib/supabase/server'
import { unifiedCacheService, invalidateCacheByTag } from '@/lib/services/unified-cache-service'
import type { ReportType, ReportFilters, ReportData, PaginationMeta } from '@/types/reports'
import { rosterPeriodsToDateRange } from '@/lib/utils/roster-periods'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { generateLeaveBidsPDF } from '@/lib/services/leave-bids-pdf-service'

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
  },
}

/**
 * Generate cache key from report type and filters
 */
function generateCacheKey(reportType: ReportType, filters: ReportFilters): string {
  // Sort filter keys for consistent cache keys
  const filterString = JSON.stringify(filters, Object.keys(filters).sort())
  const hash = Buffer.from(filterString).toString('base64').substring(0, 32)
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
  const supabase = await createClient()

  // Query pilot_requests table (unified architecture)
  // Filter by request_category = 'LEAVE' to get only leave requests
  let query = supabase
    .from('pilot_requests')
    .select('*')
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

  // Filter by rank if needed (using denormalized rank field)

  let filteredData = data || []
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

  // For full exports (PDF/Email), return all data without pagination
  if (fullExport) {
    return {
      title: 'Leave Requests Report',
      description: 'Comprehensive report of all leave requests',
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
    title: 'Leave Requests Report',
    description: 'Comprehensive report of all leave requests',
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
  const supabase = await createClient()

  // Query pilot_requests table (unified architecture)
  // Filter by request_category = 'FLIGHT' to get RDO/SDO requests
  let query = supabase
    .from('pilot_requests')
    .select('*')
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

  // Filter by rank if needed (using denormalized rank field)

  let filteredData = data || []
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

  // For full exports (PDF/Email), return all data without pagination
  if (fullExport) {
    return {
      title: 'RDO/SDO Requests Report',
      description: 'Comprehensive report of all RDO and SDO requests',
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
    title: 'RDO/SDO Requests Report',
    description: 'Comprehensive report of all RDO and SDO requests',
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
  const supabase = await createClient()

  let query = supabase
    .from('pilot_checks')
    .select(
      `
      *,
      pilot:pilots!pilot_checks_pilot_id_fkey (
        first_name,
        last_name,
        employee_id,
        role
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

  // Filter by rank if needed

  let filteredData = data || []
  if (filters.rank && filters.rank.length > 0) {
    filteredData = filteredData.filter((item: any) => filters.rank!.includes(item.pilot?.role))
  }

  // Calculate expiry and filter by threshold
  const today = new Date()

  const dataWithExpiry = filteredData.map((cert: any) => {
    const expiryDate = new Date(cert.expiry_date)
    const daysUntilExpiry = Math.floor(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )

    return {
      ...cert,
      daysUntilExpiry,
      isExpired: daysUntilExpiry < 0,
      isExpiringSoon: daysUntilExpiry >= 0 && daysUntilExpiry <= 90,
    }
  })

  // Filter by expiry threshold if provided
  let finalData = dataWithExpiry
  if (filters.expiryThreshold !== undefined) {
    finalData = dataWithExpiry.filter(
      (cert: any) => cert.daysUntilExpiry <= filters.expiryThreshold!
    )
  }

  // Calculate summary statistics (before pagination)
  const summary = {
    totalCertifications: finalData.length,

    expired: finalData.filter((c: any) => c.isExpired).length,

    expiringSoon: finalData.filter((c: any) => c.isExpiringSoon && !c.isExpired).length,

    current: finalData.filter((c: any) => !c.isExpired && !c.isExpiringSoon).length,

    uniquePilots: [...new Set(finalData.map((c: any) => c.pilot_id))].length,
  }

  // For full exports (PDF/Email), return all data without pagination
  if (fullExport) {
    return {
      title: 'Certifications Report',
      description: 'Comprehensive report of pilot certifications and compliance',
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
    title: 'Certifications Report',
    description: 'Comprehensive report of pilot certifications and compliance',
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
  const supabase = await createClient()

  // Convert roster periods to date range if provided
  let effectiveDateRange = filters.dateRange
  if (filters.rosterPeriods && filters.rosterPeriods.length > 0) {
    const convertedRange = rosterPeriodsToDateRange(filters.rosterPeriods)
    if (convertedRange) {
      effectiveDateRange = convertedRange
    }
  }

  // Fetch RDO/SDO requests from pilot_requests table (unified architecture)
  let rdoSdoQuery = supabase
    .from('pilot_requests')
    .select('*')
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
  let leaveQuery = supabase
    .from('pilot_requests')
    .select('*')
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

  // Fetch Leave bids
  let leaveBidsQuery = supabase
    .from('leave_bids')
    .select('*')
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

  const allRequests: any[] = [
    ...(rdoSdoResult.data || []).map((r: any) => ({ ...r, request_source: 'RDO/SDO' })),

    ...(leaveResult.data || []).map((r: any) => ({ ...r, request_source: 'LEAVE' })),

    ...(leaveBidsResult.data || []).map((r: any) => ({ ...r, request_source: 'LEAVE_BID' })),
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

  // For full exports (PDF/Email), return all data without pagination
  if (fullExport) {
    return {
      title: 'All Requests Report',
      description:
        'Comprehensive report combining RDO/SDO requests, Leave requests, and Leave bids',
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
    title: 'All Requests Report',
    description: 'Comprehensive report combining RDO/SDO requests, Leave requests, and Leave bids',
    generatedAt: new Date().toISOString(),
    generatedBy: generatedBy || 'System',
    filters,
    data: paginatedData,
    summary,
    pagination,
  }
}

/**
 * Generate PDF from Report Data
 */
export async function generatePDF(report: ReportData, reportType: ReportType): Promise<Buffer> {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(report.title, pageWidth / 2, 20, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString()}`, pageWidth / 2, 28, {
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

  // Data table based on report type
  if (reportType === 'leave') {
    autoTable(doc, {
      startY: yPos,
      head: [['Pilot', 'Rank', 'Type', 'Start Date', 'End Date', 'Status', 'Roster Period']],

      body: report.data.map((item: any) => [
        item.name || `${item.pilot?.first_name} ${item.pilot?.last_name}` || 'N/A',
        item.rank || item.pilot?.role || 'N/A',
        item.request_type || item.leave_type || 'N/A',
        new Date(item.start_date).toLocaleDateString(),
        new Date(item.end_date).toLocaleDateString(),
        item.workflow_status || item.status || 'N/A',
        item.roster_period || 'N/A',
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    })
  } else if (reportType === 'rdo-sdo') {
    autoTable(doc, {
      startY: yPos,
      head: [
        ['Pilot', 'Rank', 'Type', 'Start Date', 'End Date', 'Days', 'Status', 'Roster Period'],
      ],

      body: report.data.map((item: any) => [
        item.name || 'N/A',
        item.rank || 'N/A',
        item.request_type || 'N/A',
        new Date(item.start_date).toLocaleDateString(),
        item.end_date
          ? new Date(item.end_date).toLocaleDateString()
          : new Date(item.start_date).toLocaleDateString(),
        item.days_count || '1',
        item.workflow_status || 'N/A',
        item.roster_period || 'N/A',
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [46, 204, 113] },
    })
  } else if (reportType === 'all-requests') {
    autoTable(doc, {
      startY: yPos,
      head: [['Source', 'Pilot', 'Rank', 'Type', 'Start Date', 'Status', 'Roster Period']],

      body: report.data.map((item: any) => [
        item.request_source || 'N/A',
        item.name || 'N/A',
        item.rank || 'N/A',
        item.request_type || item.leave_type || 'N/A',
        new Date(item.start_date || item.created_at).toLocaleDateString(),
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
        new Date(item.flight_date).toLocaleDateString(),
        item.description,
        item.status,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    })
  } else if (reportType === 'certifications') {
    autoTable(doc, {
      startY: yPos,
      head: [['Pilot', 'Rank', 'Check Type', 'Expiry', 'Days Until Expiry', 'Status']],

      body: report.data.map((item: any) => [
        `${item.pilot?.first_name} ${item.pilot?.last_name}`,
        item.pilot?.role || 'N/A',
        item.check_type?.check_description || item.check_type?.check_code || 'N/A',
        new Date(item.expiry_date).toLocaleDateString(),
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
        if (data.column.index === 6 && data.section === 'body') {
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
  } else if (reportType === 'leave-bids') {
    // Use specialized leave bids PDF service
    // Extract year from report data (default to current year if not available)
    const currentYear = new Date().getFullYear()

    const bidYear = report.data[0]?.bid_year || currentYear

    // Extract status filter if any (from report summary or default to 'all')
    const statusFilter = (report.summary?.statusFilter as string) || 'all'

    // Generate PDF using specialized service and return directly
    return await generateLeaveBidsPDF(report.data, bidYear, statusFilter)
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
  const supabase = await createClient()

  // Query leave_bids table with pilot information
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
        seniority_number
      )
    `
    )
    .order('submitted_at', { ascending: false })

  // Apply filters
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status)
  }

  if (filters.rank && filters.rank.length > 0) {
    // Filter by pilot rank via the join
    query = query.in('pilot.role', filters.rank)
  }

  if (filters.rosterPeriods && filters.rosterPeriods.length > 0) {
    query = query.in('roster_period_code', filters.rosterPeriods)
  }

  if (filters.pilotId) {
    query = query.eq('pilot_id', filters.pilotId)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('Error generating leave bids report:', error)
    throw new Error(`Failed to generate leave bids report: ${error.message}`)
  }

  // Add computed fields
  const enrichedData = (data || []).map((bid: any) => ({
    ...bid,
    name: bid.pilot ? `${bid.pilot.first_name} ${bid.pilot.last_name}` : 'N/A',
    rank: bid.pilot?.role || 'N/A',
    seniority: bid.pilot?.seniority_number || 0,
  }))

  // Calculate pagination
  const page = filters.page || 1
  const pageSize = filters.pageSize || DEFAULT_PAGE_SIZE
  const totalRecords = count !== null ? count : enrichedData.length
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

  return {
    title: 'Leave Bids Report',
    description: `Annual leave preference bids ${
      filters.rosterPeriods ? `for ${filters.rosterPeriods.join(', ')}` : ''
    }`,
    generatedAt: new Date().toISOString(),
    generatedBy: generatedBy || 'System',
    filters,
    data: paginatedData,
    summary,
    pagination: fullExport ? undefined : pagination,
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
