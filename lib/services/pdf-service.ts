/**
 * PDF Service for Fleet Management V2
 * Ported from air-niugini-pms v1 (pdf-data-service.ts) with Next.js 15 updates
 *
 * Service layer for fetching and structuring data for PDF report generation
 *
 * Key Changes from v1:
 * - Renamed from pdf-data-service.ts to pdf-service.ts
 * - Updated imports to use @/ alias
 * - Changed Supabase client imports to @/lib/supabase/server
 * - Added await before createClient()
 * - Removed logger and settingsService dependencies
 * - Retained all business logic for PDF report generation
 *
 * @version 2.0.0
 * @since 2025-10-17
 */

import { createClient } from '@/lib/supabase/server'
import { differenceInDays, differenceInYears, format, addYears } from 'date-fns'
import { logError, logInfo, logWarning, ErrorSeverity } from '@/lib/error-logger'

/**
 * Get default settings values (fallback)
 */
async function getDefaultSettings() {
  return {
    app_title: 'B767 Pilot Management System',
    alert_thresholds: {
      critical_days: 7,
      urgent_days: 14,
      warning_30_days: 30,
      warning_60_days: 60,
      early_warning_90_days: 90,
    },
    pilot_requirements: {
      pilot_retirement_age: 65,
      number_of_aircraft: 2,
      captains_per_hull: 7,
      first_officers_per_hull: 7,
      minimum_captains_per_hull: 10,
      minimum_first_officers_per_hull: 10,
      training_captains_per_pilots: 11,
      examiners_per_pilots: 11,
    },
  }
}

/**
 * Fetch all pilots
 */
async function fetchPilots() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pilots')
    .select('*')
    .order('seniority_number', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Fetch single pilot
 */
async function fetchPilot(pilotId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.from('pilots').select('*').eq('id', pilotId).single()

  if (error) throw error
  return data
}

/**
 * Fetch pilot checks with optional filter
 */
async function fetchPilotChecks(pilotId?: string) {
  const supabase = await createClient()

  let query = supabase.from('pilot_checks').select(`
      *,
      pilot:pilots(*),
      check_type:check_types(*)
    `)

  if (pilotId) {
    query = query.eq('pilot_id', pilotId)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

/**
 * Fetch check types
 */
async function fetchCheckTypes() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('check_types')
    .select('*')
    .order('category', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Fetch leave requests with optional filter
 */
async function fetchLeaveRequests(pilotId?: string) {
  const supabase = await createClient()

  let query = supabase.from('leave_requests').select(`
      *,
      pilot:pilots(*)
    `)

  if (pilotId) {
    query = query.eq('pilot_id', pilotId)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

/**
 * Generate PDF metadata
 */
function generateMetadata(reportType: string, title: string, generatedBy: string) {
  return {
    reportType,
    title,
    generatedAt: new Date().toISOString(),
    generatedBy,
    companyName: 'Air Niugini',
    fleetType: 'B767',
    reportPeriod: format(new Date(), 'MMMM yyyy'),
  }
}

/**
 * Calculate compliance overview
 */
function calculateComplianceOverview(pilots: any[], checks: any[]) {
  const totalPilots = pilots.filter((p) => p.is_active).length
  const totalCertifications = checks.length

  const now = new Date()
  const currentCertifications = checks.filter((check) => {
    if (!check.expiry_date) return true
    return new Date(check.expiry_date) > now
  }).length

  const expiringCertifications = checks.filter((check) => {
    if (!check.expiry_date) return false
    const daysUntil = differenceInDays(new Date(check.expiry_date), now)
    return daysUntil <= 30 && daysUntil >= 0
  }).length

  const expiredCertifications = checks.filter((check) => {
    if (!check.expiry_date) return false
    return new Date(check.expiry_date) <= now
  }).length

  const complianceRate =
    totalCertifications > 0 ? Math.round((currentCertifications / totalCertifications) * 100) : 100

  return {
    totalPilots,
    totalCertifications,
    currentCertifications,
    expiringCertifications,
    expiredCertifications,
    complianceRate,
    lastUpdated: new Date().toISOString(),
  }
}

/**
 * Generate compliance report data
 */
export async function generateComplianceReportData(
  reportType: string,
  generatedBy: string,
  options?: { dateRange?: { from: string; to: string } }
) {
  try {
    const [pilotsData, checksData, checkTypesData] = await Promise.all([
      fetchPilots(),
      fetchPilotChecks(),
      fetchCheckTypes(),
    ])

    const metadata = generateMetadata(reportType, 'Fleet Compliance Report', generatedBy)
    const overview = calculateComplianceOverview(pilotsData, checksData)

    return {
      metadata,
      overview,
      pilots: pilotsData,
      checks: checksData,
      checkTypes: checkTypesData,
    }
  } catch (error) {
    logError(error as Error, {
      source: 'PDFService',
      severity: ErrorSeverity.HIGH,
      metadata: { operation: 'generateComplianceReportData' },
    })
    throw new Error('Failed to generate compliance report data')
  }
}

/**
 * Generate pilot report data
 */
export async function generatePilotReportData(
  reportType: string,
  generatedBy: string,
  pilotId?: string
) {
  try {
    const [pilotsData, checksData, checkTypesData, leaveData] = await Promise.all([
      pilotId ? fetchPilot(pilotId) : fetchPilots(),
      fetchPilotChecks(pilotId),
      fetchCheckTypes(),
      fetchLeaveRequests(pilotId),
    ])

    const pilots = Array.isArray(pilotsData) ? pilotsData : [pilotsData]
    const metadata = generateMetadata(
      reportType,
      pilotId ? `Individual Pilot Report` : 'Pilot Summary Report',
      generatedBy
    )

    return {
      metadata,
      reportScope: pilotId ? 'INDIVIDUAL' : 'ALL',
      pilots,
      checks: checksData,
      checkTypes: checkTypesData,
      leaveRequests: leaveData,
    }
  } catch (error) {
    logError(error as Error, {
      source: 'PDFService',
      severity: ErrorSeverity.HIGH,
      metadata: { operation: 'generatePilotReportData' },
    })
    throw new Error('Failed to generate pilot report data')
  }
}

/**
 * Generate fleet management report data
 */
export async function generateFleetManagementReportData(reportType: string, generatedBy: string) {
  try {
    const [pilotsData, checksData, checkTypesData, leaveData] = await Promise.all([
      fetchPilots(),
      fetchPilotChecks(),
      fetchCheckTypes(),
      fetchLeaveRequests(),
    ])

    const metadata = generateMetadata(reportType, 'Fleet Management Report', generatedBy)

    // Calculate roster analysis
    const totalPilots = pilotsData.length
    const activePilots = pilotsData.filter((p) => p.is_active).length
    const captains = pilotsData.filter((p) => p.role === 'Captain').length
    const firstOfficers = pilotsData.filter((p) => p.role === 'First Officer').length

    // Calculate operational readiness
    const now = new Date()
    const certifiedPilots = pilotsData.filter((pilot) => {
      const pilotChecks = checksData.filter((check: any) => check.pilot_id === pilot.id)
      const expiredChecks = pilotChecks.filter((check: any) => {
        if (!check.expiry_date) return false
        return new Date(check.expiry_date) <= now
      })
      return expiredChecks.length === 0
    })

    const certifiedCaptains = certifiedPilots.filter((p) => p.role === 'Captain').length
    const certifiedFirstOfficers = certifiedPilots.filter((p) => p.role === 'First Officer').length

    // Calculate upcoming retirements
    const RETIREMENT_AGE = 65
    const upcomingRetirements = pilotsData
      .filter((pilot) => pilot.date_of_birth && pilot.is_active)
      .map((pilot) => {
        const retirementDate = addYears(new Date(pilot.date_of_birth!), RETIREMENT_AGE)
        const yearsToRetirement = differenceInYears(retirementDate, now)

        return {
          pilot,
          retirementDate: retirementDate.toISOString(),
          yearsToRetirement,
        }
      })
      .filter(
        (retirement) => retirement.yearsToRetirement <= 5 && retirement.yearsToRetirement >= 0
      )
      .sort((a, b) => a.yearsToRetirement - b.yearsToRetirement)

    return {
      metadata,
      rosterAnalysis: {
        totalPilots,
        activePilots,
        captains,
        firstOfficers,
      },
      operationalReadiness: {
        totalCertifiedPilots: certifiedPilots.length,
        certifiedCaptains,
        certifiedFirstOfficers,
      },
      upcomingRetirements,
      leaveAnalysis: {
        totalRequests: leaveData.length,
        approved: leaveData.filter((l: any) => l.status === 'APPROVED').length,
        pending: leaveData.filter((l: any) => l.status === 'PENDING').length,
      },
    }
  } catch (error) {
    logError(error as Error, {
      source: 'PDFService',
      severity: ErrorSeverity.HIGH,
      metadata: { operation: 'generateFleetManagementReport' },
    })
    throw new Error('Failed to generate fleet management report data')
  }
}
