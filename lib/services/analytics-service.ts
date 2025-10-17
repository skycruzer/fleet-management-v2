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
import { logError, logInfo, logWarning, ErrorSeverity } from '@/lib/error-logger'

/**
 * Get comprehensive pilot analytics for charts and KPIs
 */
export async function getPilotAnalytics() {
  const supabase = await createClient()

  try {
    const { data: pilots, error } = await supabase
      .from('pilots')
      .select('role, is_active, date_of_birth, commencement_date')

    if (error) throw error

    const now = new Date()
    const stats = (pilots || []).reduce(
      (acc, pilot) => {
        acc.total++
        if (pilot.is_active) acc.active++
        else acc.inactive++

        if (pilot.role === 'Captain') acc.captains++
        else if (pilot.role === 'First Officer') acc.firstOfficers++

        // Calculate retirement metrics
        if (pilot.date_of_birth) {
          const birthDate = new Date(pilot.date_of_birth)
          const retirementDate = new Date(birthDate)
          retirementDate.setFullYear(retirementDate.getFullYear() + 65)

          const yearsToRetirement = Math.floor(
            (retirementDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
          )

          if (yearsToRetirement <= 2 && yearsToRetirement >= 0) {
            acc.retirementPlanning.retiringIn2Years++
          } else if (yearsToRetirement <= 5 && yearsToRetirement >= 0) {
            acc.retirementPlanning.retiringIn5Years++
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
        },
      }
    )

    return stats
  } catch (error) {
    console.error('Analytics Service: Error getting pilot analytics', error)
    throw error
  }
}

/**
 * Get comprehensive certification analytics for charts
 */
export async function getCertificationAnalytics() {
  const supabase = await createClient()

  try {
    const { data: checks, error: checksError } = await supabase
      .from('pilot_checks')
      .select(
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
        categoryBreakdown: {} as Record<string, { current: number; expiring: number; expired: number }>,
      }
    )

    const complianceRate =
      stats.total > 0 ? Math.round((stats.current / stats.total) * 100) : 100

    return {
      ...stats,
      complianceRate,
      categoryBreakdown: Object.entries(stats.categoryBreakdown).map(([category, data]) => ({
        category,
        ...data,
      })),
    }
  } catch (error) {
    console.error('Analytics Service: Error getting certification analytics', error)
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
      .from('leave_requests')
      .select('status, request_type, days_count, created_at')

    if (error) throw error

    const stats = (leaveRequests || []).reduce(
      (acc, req: any) => {
        acc.total++
        if (req.status === 'PENDING') acc.pending++
        else if (req.status === 'APPROVED') acc.approved++
        else if (req.status === 'DENIED') acc.denied++

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
    console.error('Analytics Service: Error getting leave analytics', error)
    throw error
  }
}

/**
 * Get fleet utilization and readiness analytics
 */
export async function getFleetAnalytics() {
  const supabase = await createClient()

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
    console.error('Analytics Service: Error getting fleet analytics', error)
    throw error
  }
}

/**
 * Get risk analytics and alerts
 */
export async function getRiskAnalytics() {
  const supabase = await createClient()

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
    console.error('Analytics Service: Error getting risk analytics', error)
    throw error
  }
}
