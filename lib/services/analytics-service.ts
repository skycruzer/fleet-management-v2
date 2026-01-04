/**
 * Analytics Service for Fleet Management V2
 * Ported from air-niugini-pms v1 with Next.js 15 updates
 *
 * Advanced analytics processing for interactive dashboard charts and KPIs
 *
 * Key Changes from v1:
 * - Updated imports to use @/ alias
 * - Changed Supabase client imports to @/lib/supabase/server
 * - Added await before createClient()
 * - Removed logger and analytics-data-service dependencies
 * - Simplified to core analytics functions
 * - Retained all business logic
 *
 * @version 2.0.0
 * @since 2025-10-17
 */

import { createClient } from '@/lib/supabase/server'
import { logError, ErrorSeverity } from '@/lib/error-logger'

/**
 * Get comprehensive pilot analytics for charts and KPIs
 */
export async function getPilotAnalytics() {
  const supabase = await createClient()

  try {
    const { data: pilots, error } = await supabase
      .from('pilots')
      .select('id, first_name, last_name, role, is_active, date_of_birth, commencement_date')

    if (error) throw error

    const now = new Date()
    const retiringIn2YearsPilots: Array<{
      id: string
      name: string
      rank: string
      retirementDate: string
      yearsToRetirement: number
    }> = []
    const retiringIn5YearsPilots: Array<{
      id: string
      name: string
      rank: string
      retirementDate: string
      yearsToRetirement: number
    }> = []

    const stats = (pilots || []).reduce(
      (acc, pilot) => {
        acc.total++
        if (pilot.is_active) acc.active++
        else acc.inactive++

        if (pilot.role === 'Captain') acc.captains++
        else if (pilot.role === 'First Officer') acc.firstOfficers++

        // Calculate retirement metrics
        if (pilot.date_of_birth && pilot.is_active) {
          const birthDate = new Date(pilot.date_of_birth)
          const retirementDate = new Date(birthDate)
          retirementDate.setFullYear(retirementDate.getFullYear() + 65)

          const yearsToRetirement = Math.floor(
            (retirementDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
          )

          const pilotInfo = {
            id: pilot.id,
            name: `${pilot.first_name} ${pilot.last_name}`,
            rank: pilot.role || 'Unknown',
            retirementDate: retirementDate.toISOString().split('T')[0],
            yearsToRetirement,
          }

          // Only count active pilots who haven't retired yet
          // Count pilots retiring within 2 years (0-2 years inclusive)
          if (yearsToRetirement >= 0 && yearsToRetirement <= 2) {
            acc.retirementPlanning.retiringIn2Years++
            retiringIn2YearsPilots.push(pilotInfo)
          }

          // Count pilots retiring within 5 years (0-5 years inclusive)
          if (yearsToRetirement >= 0 && yearsToRetirement <= 5) {
            acc.retirementPlanning.retiringIn5Years++
            if (yearsToRetirement > 2) {
              // Only add pilots not already in 2-year list
              retiringIn5YearsPilots.push(pilotInfo)
            }
          }
        }

        return acc
      },
      {
        total: 0,
        active: 0,
        inactive: 0,
        captains: 0,
        firstOfficers: 0,
        retirementPlanning: {
          retiringIn2Years: 0,
          retiringIn5Years: 0,
          pilotsRetiringIn2Years: [] as typeof retiringIn2YearsPilots,
          pilotsRetiringIn5Years: [] as typeof retiringIn5YearsPilots,
        },
      }
    )

    // Add pilot lists to retirement planning
    stats.retirementPlanning.pilotsRetiringIn2Years = retiringIn2YearsPilots
    stats.retirementPlanning.pilotsRetiringIn5Years = retiringIn5YearsPilots

    return stats
  } catch (error) {
    logError(error as Error, {
      source: 'AnalyticsService',
      severity: ErrorSeverity.MEDIUM,
      metadata: {
        operation: 'getPilotAnalytics',
      },
    })
    throw error
  }
}

/**
 * Get comprehensive certification analytics for charts
 */
export async function getCertificationAnalytics() {
  const supabase = await createClient()

  try {
    const { data: checks, error: checksError } = await supabase.from('pilot_checks').select(
      `
        id,
        expiry_date,
        check_types (
          id,
          category
        )
      `
    )

    if (checksError) throw checksError

    const now = new Date()
    const stats = (checks || []).reduce(
      (acc, check: any) => {
        acc.total++

        if (!check.expiry_date) {
          acc.current++
          return acc
        }

        const expiryDate = new Date(check.expiry_date)
        const daysUntilExpiry = Math.ceil(
          (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysUntilExpiry < 0) {
          acc.expired++
        } else if (daysUntilExpiry <= 30) {
          acc.expiring++
        } else {
          acc.current++
        }

        // Category breakdown
        const category = check.check_types?.category || 'Other'
        if (!acc.categoryBreakdown[category]) {
          acc.categoryBreakdown[category] = { current: 0, expiring: 0, expired: 0 }
        }

        if (daysUntilExpiry < 0) {
          acc.categoryBreakdown[category].expired++
        } else if (daysUntilExpiry <= 30) {
          acc.categoryBreakdown[category].expiring++
        } else {
          acc.categoryBreakdown[category].current++
        }

        return acc
      },
      {
        total: 0,
        current: 0,
        expiring: 0,
        expired: 0,
        categoryBreakdown: {} as Record<
          string,
          { current: number; expiring: number; expired: number }
        >,
      }
    )

    const complianceRate = stats.total > 0 ? Math.round((stats.current / stats.total) * 100) : 100

    return {
      ...stats,
      complianceRate,
      categoryBreakdown: Object.entries(stats.categoryBreakdown).map(([category, data]) => ({
        category,
        ...data,
      })),
    }
  } catch (error) {
    logError(error as Error, {
      source: 'AnalyticsService',
      severity: ErrorSeverity.MEDIUM,
      metadata: { operation: 'getCertificationAnalytics' },
    })
    throw error
  }
}

/**
 * Get leave analytics with trends and patterns
 */
export async function getLeaveAnalytics() {
  const supabase = await createClient()

  try {
    const { data: leaveRequests, error } = await supabase
      .from('pilot_requests')
      .select('workflow_status, request_type, days_count, created_at')
      .eq('request_category', 'LEAVE')

    if (error) throw error

    const stats = (leaveRequests || []).reduce(
      (acc, req: any) => {
        acc.total++
        if (req.workflow_status === 'PENDING') acc.pending++
        else if (req.workflow_status === 'APPROVED') acc.approved++
        else if (req.workflow_status === 'DENIED') acc.denied++

        // Type breakdown
        const type = req.request_type || 'Unknown'
        if (!acc.byType[type]) {
          acc.byType[type] = { count: 0, totalDays: 0 }
        }
        acc.byType[type].count++
        acc.byType[type].totalDays += req.days_count || 0

        return acc
      },
      {
        total: 0,
        pending: 0,
        approved: 0,
        denied: 0,
        byType: {} as Record<string, { count: number; totalDays: number }>,
      }
    )

    return {
      ...stats,
      byType: Object.entries(stats.byType).map(([type, data]) => ({
        type,
        ...data,
      })),
    }
  } catch (error) {
    logError(error as Error, {
      source: 'AnalyticsService',
      severity: ErrorSeverity.MEDIUM,
      metadata: { operation: 'getLeaveAnalytics' },
    })
    throw error
  }
}

/**
 * Get fleet utilization and readiness analytics
 */
export async function getFleetAnalytics() {
  try {
    const [pilotAnalytics, certificationAnalytics, leaveAnalytics] = await Promise.all([
      getPilotAnalytics(),
      getCertificationAnalytics(),
      getLeaveAnalytics(),
    ])

    // Calculate fleet readiness based on pilot compliance
    const totalPilots = pilotAnalytics.total
    const compliantPilots = Math.round((certificationAnalytics.complianceRate / 100) * totalPilots)
    const pilotsOnLeave = leaveAnalytics.approved + leaveAnalytics.pending

    // Fleet readiness metrics based on real pilot and certification data
    const availability = Math.round(((totalPilots - pilotsOnLeave) / totalPilots) * 100)
    const readiness = Math.round((certificationAnalytics.complianceRate + availability) / 2)

    // Calculate real pilot status breakdown from leave data
    const availablePilots = totalPilots - leaveAnalytics.approved

    return {
      utilization: certificationAnalytics.complianceRate,
      availability,
      readiness,
      operationalMetrics: {
        totalFlightHours: 0,
        averageUtilization: 0,
        maintenanceHours: 0,
        groundTime: 0,
      },
      pilotAvailability: {
        available: availablePilots,
        onDuty: 0,
        onLeave: leaveAnalytics.approved,
        training: 0,
        medical: 0,
      },
      complianceStatus: {
        fullyCompliant: compliantPilots,
        minorIssues: certificationAnalytics.expiring,
        majorIssues: certificationAnalytics.expired,
        grounded: certificationAnalytics.expired,
      },
    }
  } catch (error) {
    logError(error as Error, {
      source: 'AnalyticsService',
      severity: ErrorSeverity.MEDIUM,
      metadata: { operation: 'getFleetAnalytics' },
    })
    throw error
  }
}

/**
 * Get risk analytics and alerts
 */
export async function getRiskAnalytics() {
  try {
    const [certificationAnalytics, pilotAnalytics] = await Promise.all([
      getCertificationAnalytics(),
      getPilotAnalytics(),
    ])

    // Calculate overall risk score (0-100, lower is better)
    const certificationRisk = (certificationAnalytics.expired / certificationAnalytics.total) * 40
    const expiringRisk = (certificationAnalytics.expiring / certificationAnalytics.total) * 20
    const retirementRisk =
      (pilotAnalytics.retirementPlanning.retiringIn2Years / pilotAnalytics.total) * 30
    const overallRiskScore = Math.round(certificationRisk + expiringRisk + retirementRisk)

    const riskFactors = [
      {
        factor: 'Expired Certifications',
        severity:
          certificationAnalytics.expired > 10
            ? 'critical'
            : certificationAnalytics.expired > 5
              ? 'high'
              : ('medium' as 'low' | 'medium' | 'high' | 'critical'),
        impact: certificationRisk,
        trend: 'improving' as 'improving' | 'stable' | 'worsening',
        description: `${certificationAnalytics.expired} certifications have expired`,
      },
      {
        factor: 'Expiring Certifications',
        severity:
          certificationAnalytics.expiring > 20
            ? 'high'
            : ('medium' as 'low' | 'medium' | 'high' | 'critical'),
        impact: expiringRisk,
        trend: 'stable' as 'improving' | 'stable' | 'worsening',
        description: `${certificationAnalytics.expiring} certifications expiring within 30 days`,
      },
      {
        factor: 'Retirement Planning',
        severity:
          pilotAnalytics.retirementPlanning.retiringIn2Years > 3
            ? 'high'
            : ('low' as 'low' | 'medium' | 'high' | 'critical'),
        impact: retirementRisk,
        trend: 'worsening' as 'improving' | 'stable' | 'worsening',
        description: `${pilotAnalytics.retirementPlanning.retiringIn2Years} pilots retiring within 2 years`,
      },
    ]

    const criticalAlerts = []

    // Generate alerts for critical issues
    if (certificationAnalytics.expired > 5) {
      criticalAlerts.push({
        id: 'expired-certs-critical',
        type: 'certification' as const,
        severity: 'critical' as const,
        title: 'Critical: Multiple Expired Certifications',
        description: `${certificationAnalytics.expired} certifications have expired and require immediate attention`,
        affectedItems: certificationAnalytics.expired,
        createdAt: new Date(),
      })
    }

    if (certificationAnalytics.expiring > 15) {
      criticalAlerts.push({
        id: 'expiring-certs-high',
        type: 'certification' as const,
        severity: 'high' as const,
        title: 'High Priority: Multiple Expiring Certifications',
        description: `${certificationAnalytics.expiring} certifications expiring within 30 days`,
        affectedItems: certificationAnalytics.expiring,
        createdAt: new Date(),
      })
    }

    return {
      overallRiskScore,
      riskFactors,
      criticalAlerts,
      complianceGaps: [],
    }
  } catch (error) {
    logError(error as Error, {
      source: 'AnalyticsService',
      severity: ErrorSeverity.MEDIUM,
      metadata: { operation: 'getRiskAnalytics' },
    })
    throw error
  }
}

// =====================================================
// Advanced Analytics Functions (Improvement #3)
// Added: 2025-10-25
// =====================================================

/**
 * Get multi-year retirement forecast (10-year outlook)
 * Returns year-by-year breakdown of expected retirements
 *
 * @param retirementAge - Standard retirement age (default: 65)
 * @param yearsAhead - Number of years to forecast (default: 10)
 * @returns Multi-year forecast with captain/FO/total breakdowns
 *
 * @example
 * const forecast = await getMultiYearRetirementForecast(65, 10)
 * // Returns: [{ year: 2025, captains: 2, firstOfficers: 1, total: 3 }, ...]
 */
export async function getMultiYearRetirementForecast(
  retirementAge: number = 65,
  yearsAhead: number = 10
): Promise<
  Array<{
    year: number
    captains: number
    firstOfficers: number
    total: number
    yearLabel: string
  }>
> {
  const supabase = await createClient()

  try {
    // @ts-ignore - Supabase type inference issue with select fields
    const { data: pilots, error } = await supabase
      .from('pilots')
      .select('id, rank, date_of_birth, status')
      .eq('status', 'active')

    if (error) throw error
    if (!pilots) return []

    const currentYear = new Date().getFullYear()
    const forecast: Array<{
      year: number
      captains: number
      firstOfficers: number
      total: number
      yearLabel: string
    }> = []

    // Generate forecast for each year
    for (let i = 0; i < yearsAhead; i++) {
      const targetYear = currentYear + i
      let captains = 0
      let firstOfficers = 0

      // @ts-ignore - Type inference issue with pilots array
      pilots?.forEach((pilot: any) => {
        if (!pilot.date_of_birth) return

        const birthDate = new Date(pilot.date_of_birth)
        const retirementYear = birthDate.getFullYear() + retirementAge

        if (retirementYear === targetYear) {
          if (pilot.rank === 'Captain') {
            captains++
          } else if (pilot.rank === 'First Officer') {
            firstOfficers++
          }
        }
      })

      forecast.push({
        year: targetYear,
        captains,
        firstOfficers,
        total: captains + firstOfficers,
        yearLabel: `${targetYear}`,
      })
    }

    return forecast
  } catch (error) {
    logError(error as Error, {
      source: 'AnalyticsService',
      severity: ErrorSeverity.HIGH,
      metadata: {
        operation: 'getMultiYearRetirementForecast',
        retirementAge,
        yearsAhead,
      },
    })
    throw error
  }
}

/**
 * Predict crew shortages based on retirement forecast and minimum crew requirements
 * Identifies months where crew levels may fall below operational minimums
 *
 * @param retirementAge - Standard retirement age (default: 65)
 * @param minimumCaptains - Minimum captains required (default: 10)
 * @param minimumFirstOfficers - Minimum first officers required (default: 10)
 * @returns Shortage predictions with severity levels and recommendations
 *
 * @example
 * const shortages = await predictCrewShortages(65, 10, 10)
 * // Returns critical periods, recommendations, and impact analysis
 */
export async function predictCrewShortages(
  retirementAge: number = 65,
  minimumCaptains: number = 10,
  minimumFirstOfficers: number = 10
): Promise<{
  criticalPeriods: Array<{
    startMonth: string
    endMonth: string
    severity: 'high' | 'critical'
    captainShortage: number
    firstOfficerShortage: number
    impactDescription: string
  }>
  recommendations: Array<{
    priority: 'immediate' | 'high' | 'medium'
    action: string
    timeline: string
    impact: string
  }>
  summary: {
    totalCriticalMonths: number
    worstCaseShortage: number
    timeToFirstShortage: number | null
  }
}> {
  const supabase = await createClient()

  try {
    // @ts-ignore - Supabase type inference issue with select fields
    const { data: pilots, error } = await supabase
      .from('pilots')
      .select('id, rank, date_of_birth, status')
      .eq('status', 'active')

    if (error) throw error
    if (!pilots) {
      return {
        criticalPeriods: [],
        recommendations: [],
        summary: { totalCriticalMonths: 0, worstCaseShortage: 0, timeToFirstShortage: null },
      }
    }

    const now = new Date()
    // @ts-ignore - Type inference issue with pilots array
    const currentCaptains = pilots?.filter((p: any) => p.rank === 'Captain').length || 0
    // @ts-ignore - Type inference issue with pilots array
    const currentFirstOfficers = pilots?.filter((p: any) => p.rank === 'First Officer').length || 0

    const criticalPeriods: Array<{
      startMonth: string
      endMonth: string
      severity: 'high' | 'critical'
      captainShortage: number
      firstOfficerShortage: number
      impactDescription: string
    }> = []

    // Analyze next 60 months (5 years)
    let availableCaptains = currentCaptains
    let availableFirstOfficers = currentFirstOfficers
    let inCriticalPeriod = false
    let periodStartMonth = ''

    for (let monthOffset = 0; monthOffset < 60; monthOffset++) {
      const targetDate = new Date(now)
      targetDate.setMonth(targetDate.getMonth() + monthOffset)
      const monthLabel = targetDate.toLocaleString('en-US', { month: 'short', year: 'numeric' })

      // Calculate retirements this month
      let captainRetirements = 0
      let firstOfficerRetirements = 0

      // @ts-ignore - Type inference issue with pilots array
      pilots?.forEach((pilot: any) => {
        if (!pilot.date_of_birth) return

        const birthDate = new Date(pilot.date_of_birth)
        const retirementDate = new Date(birthDate)
        retirementDate.setFullYear(retirementDate.getFullYear() + retirementAge)

        const retirementMonth = retirementDate.getMonth()
        const retirementYear = retirementDate.getFullYear()

        if (
          retirementMonth === targetDate.getMonth() &&
          retirementYear === targetDate.getFullYear()
        ) {
          if (pilot.rank === 'Captain') {
            captainRetirements++
          } else if (pilot.rank === 'First Officer') {
            firstOfficerRetirements++
          }
        }
      })

      availableCaptains -= captainRetirements
      availableFirstOfficers -= firstOfficerRetirements

      // Check for shortages
      const captainShortage = Math.max(0, minimumCaptains - availableCaptains)
      const firstOfficerShortage = Math.max(0, minimumFirstOfficers - availableFirstOfficers)

      if (captainShortage > 0 || firstOfficerShortage > 0) {
        if (!inCriticalPeriod) {
          inCriticalPeriod = true
          periodStartMonth = monthLabel
        }
      } else {
        if (inCriticalPeriod) {
          // End of critical period
          const severity: 'high' | 'critical' =
            captainShortage >= 3 || firstOfficerShortage >= 3 ? 'critical' : 'high'

          criticalPeriods.push({
            startMonth: periodStartMonth,
            endMonth: monthLabel,
            severity,
            captainShortage,
            firstOfficerShortage,
            impactDescription: `Shortage of ${captainShortage} captains and ${firstOfficerShortage} first officers`,
          })

          inCriticalPeriod = false
        }
      }
    }

    // Generate recommendations
    const recommendations: Array<{
      priority: 'immediate' | 'high' | 'medium'
      action: string
      timeline: string
      impact: string
    }> = []

    if (criticalPeriods.length > 0) {
      const firstCriticalPeriod = criticalPeriods[0]

      if (firstCriticalPeriod.severity === 'critical') {
        recommendations.push({
          priority: 'immediate',
          action: 'Accelerate recruitment for Captain and First Officer positions',
          timeline: 'Next 3-6 months',
          impact: 'Prevent operational capacity shortfall',
        })

        recommendations.push({
          priority: 'immediate',
          action: 'Identify First Officers eligible for Captain upgrade',
          timeline: 'Next 1-2 months',
          impact: 'Build internal promotion pipeline',
        })
      }

      recommendations.push({
        priority: 'high',
        action: 'Review and optimize succession planning process',
        timeline: 'Next 6 months',
        impact: 'Ensure smooth knowledge transfer',
      })

      recommendations.push({
        priority: 'medium',
        action: 'Consider contract extensions for retiring pilots',
        timeline: 'As needed',
        impact: 'Provide temporary capacity buffer',
      })
    }

    // Calculate summary metrics
    const worstCaseShortage = Math.max(
      ...criticalPeriods.map((p) => p.captainShortage + p.firstOfficerShortage),
      0
    )

    const timeToFirstShortage =
      criticalPeriods.length > 0
        ? Math.floor(
            (new Date(criticalPeriods[0].startMonth).getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24 * 30)
          )
        : null

    return {
      criticalPeriods,
      recommendations,
      summary: {
        totalCriticalMonths: criticalPeriods.length,
        worstCaseShortage,
        timeToFirstShortage,
      },
    }
  } catch (error) {
    logError(error as Error, {
      source: 'AnalyticsService',
      severity: ErrorSeverity.HIGH,
      metadata: {
        operation: 'predictCrewShortages',
        minimumCaptains,
        minimumFirstOfficers,
      },
    })
    throw error
  }
}

/**
 * Get historical retirement trends from materialized view
 * Provides year-over-year comparison and trend analysis
 *
 * @returns Historical retirement trends with averages and comparisons
 *
 * @example
 * const trends = await getHistoricalRetirementTrends()
 * // Returns: [{ year: 2025, total: 3, avgAge: 65, trend: 'increasing' }, ...]
 */
export async function getHistoricalRetirementTrends(): Promise<
  Array<{
    year: number
    captainRetirements: number
    firstOfficerRetirements: number
    totalRetirements: number
    avgRetirementAge: number
    trend: 'increasing' | 'stable' | 'decreasing'
  }>
> {
  const supabase = await createClient()

  try {
    // @ts-ignore - Materialized view not yet in generated types until migration is deployed
    const { data: trends, error } = await (supabase as any)
      .from('mv_historical_retirement_trends')
      .select('*')
      .order('year', { ascending: true })

    if (error) throw error

    if (!trends || trends.length === 0) {
      return []
    }

    // Calculate trend for each year
    // @ts-ignore - Materialized view type not in generated types yet
    const trendData = trends.map((yearData: any, index: number) => {
      let trend: 'increasing' | 'stable' | 'decreasing' = 'stable'

      if (index > 0) {
        const previousYear = trends[index - 1] as any
        const change = yearData.total_retirements - previousYear.total_retirements

        if (change > 0) {
          trend = 'increasing'
        } else if (change < 0) {
          trend = 'decreasing'
        }
      }

      return {
        year: yearData.year,
        captainRetirements: yearData.captain_retirements || 0,
        firstOfficerRetirements: yearData.first_officer_retirements || 0,
        totalRetirements: yearData.total_retirements || 0,
        avgRetirementAge: Math.round(yearData.avg_retirement_age || 65),
        trend,
      }
    })

    return trendData
  } catch (error) {
    logError(error as Error, {
      source: 'AnalyticsService',
      severity: ErrorSeverity.MEDIUM,
      metadata: { operation: 'getHistoricalRetirementTrends' },
    })
    throw error
  }
}
