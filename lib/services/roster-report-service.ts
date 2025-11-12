/**
 * Roster Report Service
 *
 * Generates comprehensive roster period reports for submission to the rostering team.
 * Aggregates all approved/denied requests with crew availability calculations.
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 */

import { createClient } from '@/lib/supabase/server'
import { calculateRosterPeriodDates } from './roster-period-service'
import { logger } from './logging-service'

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Roster period report data structure
 */
export interface RosterPeriodReport {
  // Roster Period Info
  rosterPeriod: {
    code: string
    startDate: string
    endDate: string
    publishDate: string
    deadlineDate: string
  }

  // Request Statistics
  statistics: {
    totalRequests: number
    approvedCount: number
    deniedCount: number
    pendingCount: number
    submittedCount: number
    withdrawnCount: number
  }

  // Approved Requests (grouped by category)
  approvedRequests: {
    leaveRequests: RosterRequestItem[]
    flightRequests: RosterRequestItem[]
    leaveBids: RosterRequestItem[]
  }

  // Denied Requests
  deniedRequests: RosterRequestItem[]

  // Crew Availability Analysis
  crewAvailability: {
    captains: CrewAvailabilityData
    firstOfficers: CrewAvailabilityData
    minimumCrewDate: string | null
    minimumCrewCaptains: number
    minimumCrewFirstOfficers: number
  }

  // Report Metadata
  metadata: {
    generatedAt: string
    generatedBy: string | null
    reportType: 'PREVIEW' | 'FINAL'
  }
}

/**
 * Individual request item in report
 */
export interface RosterRequestItem {
  id: string
  pilotName: string
  employeeNumber: string
  rank: 'Captain' | 'First Officer'
  seniorityNumber: number
  requestType: string
  startDate: string
  endDate: string | null
  daysCount: number | null
  reason: string | null
  submissionChannel: string
  submissionDate: string
  isLateRequest: boolean
  isPastDeadline: boolean
  reviewComments: string | null
}

/**
 * Crew availability analysis data
 */
export interface CrewAvailabilityData {
  totalCrew: number
  onLeave: number
  available: number
  percentageAvailable: number
  belowMinimum: boolean
}

/**
 * Service response wrapper
 */
export interface ServiceResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// ============================================================================
// Report Generation Functions
// ============================================================================

/**
 * Generate complete roster period report
 *
 * @param rosterPeriodCode - Roster period code (e.g., "RP01/2026")
 * @param reportType - Report type (PREVIEW or FINAL)
 * @param generatedBy - User ID who generated the report
 * @returns Complete roster period report
 */
export async function generateRosterPeriodReport(
  rosterPeriodCode: string,
  reportType: 'PREVIEW' | 'FINAL' = 'PREVIEW',
  generatedBy: string | null = null
): Promise<ServiceResponse<RosterPeriodReport>> {
  try {
    logger.info('Generating roster period report', {
      rosterPeriodCode,
      reportType,
      generatedBy,
    })

    const supabase = await createClient()

    // Get roster period details
    const [periodNumber, year] = rosterPeriodCode.replace('RP', '').split('/').map(Number)
    const rosterPeriod = calculateRosterPeriodDates(periodNumber, year)

    // Fetch all requests for this roster period
    const { data: requests, error: requestsError } = await supabase
      .from('pilot_requests')
      .select(
        `
        *,
        pilot:pilots(first_name, last_name, seniority_number)
      `
      )
      .eq('roster_period', rosterPeriodCode)
      .order('start_date', { ascending: true })

    if (requestsError) {
      logger.error('Failed to fetch roster requests', { error: requestsError })
      return {
        success: false,
        error: 'Failed to fetch roster period requests',
      }
    }

    // Categorize requests
    const approvedLeave = requests
      .filter((r) => r.workflow_status === 'APPROVED' && r.request_category === 'LEAVE')
      .map(mapToRequestItem)

    const approvedFlight = requests
      .filter((r) => r.workflow_status === 'APPROVED' && r.request_category === 'FLIGHT')
      .map(mapToRequestItem)

    const approvedBids = requests
      .filter((r) => r.workflow_status === 'APPROVED' && r.request_category === 'LEAVE_BID')
      .map(mapToRequestItem)

    const deniedRequests = requests
      .filter((r) => r.workflow_status === 'DENIED')
      .map(mapToRequestItem)

    // Calculate statistics
    const statistics = {
      totalRequests: requests.length,
      approvedCount: requests.filter((r) => r.workflow_status === 'APPROVED').length,
      deniedCount: requests.filter((r) => r.workflow_status === 'DENIED').length,
      pendingCount: requests.filter(
        (r) => r.workflow_status === 'SUBMITTED' || r.workflow_status === 'IN_REVIEW'
      ).length,
      submittedCount: requests.filter((r) => r.workflow_status === 'SUBMITTED').length,
      withdrawnCount: requests.filter((r) => r.workflow_status === 'WITHDRAWN').length,
    }

    // Calculate crew availability
    const crewAvailability = await calculateCrewAvailability(
      rosterPeriod.startDate,
      rosterPeriod.endDate,
      approvedLeave
    )

    // Build report
    const report: RosterPeriodReport = {
      rosterPeriod: {
        code: rosterPeriodCode,
        startDate: rosterPeriod.startDate.toISOString().split('T')[0],
        endDate: rosterPeriod.endDate.toISOString().split('T')[0],
        publishDate: rosterPeriod.publishDate.toISOString().split('T')[0],
        deadlineDate: rosterPeriod.deadlineDate.toISOString().split('T')[0],
      },
      statistics,
      approvedRequests: {
        leaveRequests: approvedLeave,
        flightRequests: approvedFlight,
        leaveBids: approvedBids,
      },
      deniedRequests,
      crewAvailability,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy,
        reportType,
      },
    }

    logger.info('Roster period report generated successfully', {
      rosterPeriodCode,
      approvedCount: statistics.approvedCount,
      deniedCount: statistics.deniedCount,
    })

    return {
      success: true,
      data: report,
      message: 'Roster period report generated successfully',
    }
  } catch (error: any) {
    logger.error('Failed to generate roster period report', { error })
    return {
      success: false,
      error: error.message || 'Failed to generate roster period report',
    }
  }
}

/**
 * Save roster report to database
 *
 * @param report - Roster period report
 * @param pdfUrl - Optional PDF URL
 * @returns Service response with report record ID
 */
export async function saveRosterReport(
  report: RosterPeriodReport,
  pdfUrl?: string
): Promise<ServiceResponse<string>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('roster_reports')
      .insert({
        roster_period_code: report.rosterPeriod.code,
        generated_at: report.metadata.generatedAt,
        generated_by: report.metadata.generatedBy,
        report_type: report.metadata.reportType,
        approved_count: report.statistics.approvedCount,
        pending_count: report.statistics.pendingCount,
        denied_count: report.statistics.deniedCount,
        withdrawn_count: report.statistics.withdrawnCount,
        min_crew_captains: report.crewAvailability.minimumCrewCaptains,
        min_crew_fos: report.crewAvailability.minimumCrewFirstOfficers,
        min_crew_date: report.crewAvailability.minimumCrewDate,
        pdf_url: pdfUrl || null,
      })
      .select('id')
      .single()

    if (error) {
      logger.error('Failed to save roster report', { error })
      return {
        success: false,
        error: 'Failed to save roster report to database',
      }
    }

    logger.info('Roster report saved to database', { reportId: data.id })

    return {
      success: true,
      data: data.id,
      message: 'Roster report saved successfully',
    }
  } catch (error: any) {
    logger.error('Failed to save roster report', { error })
    return {
      success: false,
      error: error.message || 'Failed to save roster report',
    }
  }
}

/**
 * Get roster report history for a roster period
 *
 * @param rosterPeriodCode - Roster period code
 * @returns List of generated reports
 */
export async function getRosterReportHistory(
  rosterPeriodCode: string
): Promise<ServiceResponse<any[]>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('roster_reports')
      .select('*')
      .eq('roster_period_code', rosterPeriodCode)
      .order('generated_at', { ascending: false })

    if (error) {
      logger.error('Failed to fetch roster report history', { error })
      return {
        success: false,
        error: 'Failed to fetch roster report history',
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error: any) {
    logger.error('Failed to fetch roster report history', { error })
    return {
      success: false,
      error: error.message || 'Failed to fetch roster report history',
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Map database request to report item
 */
function mapToRequestItem(request: any): RosterRequestItem {
  return {
    id: request.id,
    pilotName: request.name,
    employeeNumber: request.employee_number,
    rank: request.rank,
    seniorityNumber: request.pilot?.seniority_number || 0,
    requestType: request.request_type,
    startDate: request.start_date,
    endDate: request.end_date,
    daysCount: request.days_count,
    reason: request.reason,
    submissionChannel: request.submission_channel,
    submissionDate: request.submission_date,
    isLateRequest: request.is_late_request,
    isPastDeadline: request.is_past_deadline,
    reviewComments: request.review_comments,
  }
}

/**
 * Calculate crew availability for roster period
 *
 * @param startDate - Period start date
 * @param endDate - Period end date
 * @param approvedLeave - Approved leave requests
 * @returns Crew availability analysis
 */
async function calculateCrewAvailability(
  startDate: Date,
  endDate: Date,
  approvedLeave: RosterRequestItem[]
): Promise<RosterPeriodReport['crewAvailability']> {
  const supabase = await createClient()

  // Get all active pilots
  const { data: pilots, error } = await supabase
    .from('pilots')
    .select('id, role')
    .eq('is_active', true)

  if (error) {
    logger.error('Failed to fetch pilots for availability calculation', { error })
    throw new Error('Failed to calculate crew availability')
  }

  const captains = pilots.filter((p) => p.role === 'Captain')
  const firstOfficers = pilots.filter((p) => p.role === 'First Officer')

  // Calculate minimum crew availability across the period
  let minCaptainsAvailable = captains.length
  let minFOsAvailable = firstOfficers.length
  let minCrewDate: string | null = null

  // Check each day in the period
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]

    // Count pilots on leave on this date
    const captainsOnLeave = approvedLeave.filter((leave) => {
      if (leave.rank !== 'Captain') return false
      const leaveStart = new Date(leave.startDate)
      const leaveEnd = leave.endDate ? new Date(leave.endDate) : leaveStart
      return currentDate >= leaveStart && currentDate <= leaveEnd
    }).length

    const fosOnLeave = approvedLeave.filter((leave) => {
      if (leave.rank !== 'First Officer') return false
      const leaveStart = new Date(leave.startDate)
      const leaveEnd = leave.endDate ? new Date(leave.endDate) : leaveStart
      return currentDate >= leaveStart && currentDate <= leaveEnd
    }).length

    const captainsAvailable = captains.length - captainsOnLeave
    const fosAvailable = firstOfficers.length - fosOnLeave

    // Track minimum
    if (captainsAvailable < minCaptainsAvailable || fosAvailable < minFOsAvailable) {
      minCaptainsAvailable = captainsAvailable
      minFOsAvailable = fosAvailable
      minCrewDate = dateStr
    }

    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Calculate average on leave for the period
  const avgCaptainsOnLeave = approvedLeave.filter((l) => l.rank === 'Captain').length
  const avgFOsOnLeave = approvedLeave.filter((l) => l.rank === 'First Officer').length

  return {
    captains: {
      totalCrew: captains.length,
      onLeave: avgCaptainsOnLeave,
      available: captains.length - avgCaptainsOnLeave,
      percentageAvailable: ((captains.length - avgCaptainsOnLeave) / captains.length) * 100,
      belowMinimum: minCaptainsAvailable < 10,
    },
    firstOfficers: {
      totalCrew: firstOfficers.length,
      onLeave: avgFOsOnLeave,
      available: firstOfficers.length - avgFOsOnLeave,
      percentageAvailable: ((firstOfficers.length - avgFOsOnLeave) / firstOfficers.length) * 100,
      belowMinimum: minFOsAvailable < 10,
    },
    minimumCrewDate: minCrewDate,
    minimumCrewCaptains: minCaptainsAvailable,
    minimumCrewFirstOfficers: minFOsAvailable,
  }
}
