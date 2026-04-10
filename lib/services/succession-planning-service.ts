/**
 * Succession Planning Service for Fleet Management V2
 * Identifies captain promotion candidates and calculates succession readiness
 *
 * This service supports strategic workforce planning by:
 * - Identifying First Officers ready for captain promotion
 * - Calculating qualification gaps
 * - Providing succession readiness score for the fleet
 * - Generating actionable recommendations
 *
 * @version 1.0.0
 * @since 2025-10-25
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { logError, ErrorSeverity } from '@/lib/error-logger'

/**
 * Succession Candidate Type
 * Represents a First Officer candidate for captain promotion
 */
export interface SuccessionCandidate {
  id: string
  fullName: string
  seniorityNumber: number
  yearsOfService: number
  age: number
  promotionReadiness: 'Ready' | 'Potential' | 'Developing' | 'Not Eligible'
  qualificationGaps: string[]
  recommendedActions: string[]
}

/**
 * Get captain promotion candidates from succession pipeline
 * Queries the materialized view for First Officers ready or potentially ready for promotion
 *
 * @param readinessFilter - Filter by readiness level (default: all)
 * @returns List of succession candidates with qualification gaps and recommendations
 *
 * @example
 * const readyCandidates = await getCaptainPromotionCandidates('Ready')
 * // Returns: [{ id: '123', fullName: 'John Doe', yearsOfService: 15, ... }]
 */
export async function getCaptainPromotionCandidates(
  readinessFilter?: 'Ready' | 'Potential' | 'Developing' | 'Not Eligible'
): Promise<{
  ready: SuccessionCandidate[]
  potential: SuccessionCandidate[]
  developing: SuccessionCandidate[]
  summary: {
    totalCandidates: number
    readyCount: number
    potentialCount: number
    developingCount: number
  }
}> {
  const supabase = createAdminClient()

  try {
    // Query materialized view
    // @ts-ignore - Materialized view not yet in generated types until migration is deployed
    let query = (supabase as any)
      .from('mv_pilot_succession_pipeline')
      .select('*')
      .order('seniority_number', { ascending: true })

    if (readinessFilter) {
      query = query.eq('promotion_readiness', readinessFilter)
    }

    const { data: candidates, error } = await query

    if (error) {
      // If materialized view doesn't exist yet, fall back to direct query
      // PGRST205 = PostgREST "table not in schema cache", 42P01 = PostgreSQL "table doesn't exist"
      if (error.code === '42P01' || error.code === 'PGRST205') {
        console.warn('Succession pipeline materialized view not found. Using fallback query.')
        return await getFallbackPromotionCandidates(readinessFilter)
      }
      throw error
    }

    // Group candidates by readiness level
    const ready: SuccessionCandidate[] = []
    const potential: SuccessionCandidate[] = []
    const developing: SuccessionCandidate[] = []

    candidates?.forEach((candidate: any) => {
      const mappedCandidate: SuccessionCandidate = {
        id: candidate.id,
        fullName: candidate.full_name,
        seniorityNumber: candidate.seniority_number,
        yearsOfService: candidate.years_of_service,
        age: candidate.age,
        promotionReadiness:
          candidate.promotion_readiness as SuccessionCandidate['promotionReadiness'],
        qualificationGaps: candidate.qualification_gaps || [],
        recommendedActions: candidate.recommended_actions || [],
      }

      if (candidate.promotion_readiness === 'Ready') {
        ready.push(mappedCandidate)
      } else if (candidate.promotion_readiness === 'Potential') {
        potential.push(mappedCandidate)
      } else if (candidate.promotion_readiness === 'Developing') {
        developing.push(mappedCandidate)
      }
    })

    return {
      ready,
      potential,
      developing,
      summary: {
        totalCandidates: candidates?.length || 0,
        readyCount: ready.length,
        potentialCount: potential.length,
        developingCount: developing.length,
      },
    }
  } catch (error) {
    logError(error as Error, {
      source: 'SuccessionPlanningService',
      severity: ErrorSeverity.HIGH,
      metadata: {
        operation: 'getCaptainPromotionCandidates',
        readinessFilter,
      },
    })
    throw error
  }
}

/**
 * Fallback function to get promotion candidates when materialized view is not available
 * Performs the same logic as the materialized view but queries pilots directly
 *
 * @param readinessFilter - Filter by readiness level
 * @returns Succession candidates grouped by readiness
 */
async function getFallbackPromotionCandidates(
  readinessFilter?: 'Ready' | 'Potential' | 'Developing' | 'Not Eligible'
): Promise<{
  ready: SuccessionCandidate[]
  potential: SuccessionCandidate[]
  developing: SuccessionCandidate[]
  summary: {
    totalCandidates: number
    readyCount: number
    potentialCount: number
    developingCount: number
  }
}> {
  const supabase = createAdminClient()

  const { data: pilots, error } = await supabase
    .from('pilots')
    .select(
      'id, first_name, last_name, role, seniority_number, commencement_date, date_of_birth, is_active'
    )
    .eq('role', 'First Officer')
    .eq('is_active', true)
    .order('seniority_number', { ascending: true })

  if (error) throw error

  const now = new Date()
  const ready: SuccessionCandidate[] = []
  const potential: SuccessionCandidate[] = []
  const developing: SuccessionCandidate[] = []

  pilots?.forEach((pilot: any) => {
    if (!pilot.commencement_date || !pilot.date_of_birth) return

    const commencementDate = new Date(pilot.commencement_date)
    const birthDate = new Date(pilot.date_of_birth)

    const yearsOfService = Math.floor(
      (now.getTime() - commencementDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    )

    const age = Math.floor((now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25))

    // Calculate readiness
    let promotionReadiness: SuccessionCandidate['promotionReadiness']
    const qualificationGaps: string[] = []
    const recommendedActions: string[] = []

    if (yearsOfService >= 15 && age >= 35) {
      promotionReadiness = 'Ready'
      recommendedActions.push('Consider for Captain upgrade training')
      recommendedActions.push('Schedule check ride')
    } else if (yearsOfService >= 10 && age >= 30) {
      promotionReadiness = 'Potential'
      if (yearsOfService < 15) {
        qualificationGaps.push(`Needs ${15 - yearsOfService} more years of service`)
      }
      if (age < 35) {
        qualificationGaps.push('Must be 35+ years old')
      }
      recommendedActions.push('Continue building experience')
      recommendedActions.push('Monitor for readiness')
    } else if (yearsOfService >= 5) {
      promotionReadiness = 'Developing'
      qualificationGaps.push(`Needs ${15 - yearsOfService} more years of service`)
      if (age < 35) {
        qualificationGaps.push('Must be 35+ years old')
      }
    } else {
      promotionReadiness = 'Not Eligible'
      qualificationGaps.push('Insufficient experience')
    }

    // Apply filter if provided
    if (readinessFilter && promotionReadiness !== readinessFilter) {
      return
    }

    const candidate: SuccessionCandidate = {
      id: pilot.id,
      fullName: `${pilot.first_name} ${pilot.last_name}`,
      seniorityNumber: pilot.seniority_number,
      yearsOfService,
      age,
      promotionReadiness,
      qualificationGaps,
      recommendedActions,
    }

    if (promotionReadiness === 'Ready') {
      ready.push(candidate)
    } else if (promotionReadiness === 'Potential') {
      potential.push(candidate)
    } else if (promotionReadiness === 'Developing') {
      developing.push(candidate)
    }
  })

  return {
    ready,
    potential,
    developing,
    summary: {
      totalCandidates: ready.length + potential.length + developing.length,
      readyCount: ready.length,
      potentialCount: potential.length,
      developingCount: developing.length,
    },
  }
}

/**
 * Calculate succession readiness score for the fleet
 * Score ranges from 0-100, where 100 means optimal succession pipeline
 *
 * Scoring Formula:
 * - Ready candidates: 10 points each (up to 50 points)
 * - Potential candidates: 5 points each (up to 30 points)
 * - Developing candidates: 2 points each (up to 20 points)
 * - Deduct points for upcoming retirements without coverage
 *
 * @returns Succession readiness score (0-100) with detailed breakdown
 *
 * @example
 * const readiness = await getSuccessionReadinessScore()
 * // Returns: { score: 75, level: 'Good', ... }
 */
export async function getSuccessionReadinessScore(): Promise<{
  score: number
  level: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical'
  breakdown: {
    readyCandidatesPoints: number
    potentialCandidatesPoints: number
    developingCandidatesPoints: number
    retirementCoveragePoints: number
  }
  recommendations: string[]
  gaps: Array<{
    issue: string
    severity: 'high' | 'medium' | 'low'
    impact: string
  }>
}> {
  const supabase = createAdminClient()

  try {
    // Get promotion candidates
    const candidates = await getCaptainPromotionCandidates()

    // Get upcoming captain retirements (next 5 years)
    const { data: pilots, error } = await supabase
      .from('pilots')
      .select('id, role, date_of_birth')
      .eq('is_active', true)

    if (error) throw error

    const now = new Date()
    const fiveYearsFromNow = new Date()
    fiveYearsFromNow.setFullYear(fiveYearsFromNow.getFullYear() + 5)

    let upcomingCaptainRetirements = 0

    pilots?.forEach((pilot: any) => {
      if (pilot.role !== 'Captain' || !pilot.date_of_birth) return

      const birthDate = new Date(pilot.date_of_birth)
      const retirementDate = new Date(birthDate)
      retirementDate.setFullYear(retirementDate.getFullYear() + 65)

      if (retirementDate >= now && retirementDate <= fiveYearsFromNow) {
        upcomingCaptainRetirements++
      }
    })

    // Calculate score components
    const readyCandidatesPoints = Math.min(candidates.ready.length * 10, 50)
    const potentialCandidatesPoints = Math.min(candidates.potential.length * 5, 30)
    const developingCandidatesPoints = Math.min(candidates.developing.length * 2, 20)

    // Retirement coverage score (0-20 points)
    // Perfect coverage = ready candidates >= upcoming retirements
    const coverageRatio =
      upcomingCaptainRetirements > 0 ? candidates.ready.length / upcomingCaptainRetirements : 1

    const retirementCoveragePoints = Math.min(Math.round(coverageRatio * 20), 20)

    // Total score
    const score = Math.min(
      readyCandidatesPoints +
        potentialCandidatesPoints +
        developingCandidatesPoints +
        retirementCoveragePoints,
      100
    )

    // Determine readiness level
    let level: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical'
    if (score >= 80) {
      level = 'Excellent'
    } else if (score >= 60) {
      level = 'Good'
    } else if (score >= 40) {
      level = 'Fair'
    } else if (score >= 20) {
      level = 'Poor'
    } else {
      level = 'Critical'
    }

    // Generate recommendations
    const recommendations: string[] = []
    const gaps: Array<{
      issue: string
      severity: 'high' | 'medium' | 'low'
      impact: string
    }> = []

    if (candidates.ready.length === 0) {
      recommendations.push('Immediately identify First Officers for captain upgrade training')
      gaps.push({
        issue: 'No ready promotion candidates',
        severity: 'high',
        impact: 'Cannot fill upcoming captain vacancies',
      })
    }

    if (candidates.ready.length < upcomingCaptainRetirements) {
      recommendations.push('Accelerate promotion training to match upcoming retirement rate')
      gaps.push({
        issue: `Insufficient ready candidates (${candidates.ready.length}) for upcoming retirements (${upcomingCaptainRetirements})`,
        severity: 'high',
        impact: 'Risk of captain shortage',
      })
    }

    if (candidates.potential.length < 5) {
      recommendations.push('Build deeper bench of potential captain candidates')
      gaps.push({
        issue: 'Limited potential candidate pipeline',
        severity: 'medium',
        impact: 'May face future promotion gaps',
      })
    }

    if (candidates.developing.length < 10) {
      recommendations.push('Invest in First Officer development programs')
      gaps.push({
        issue: 'Thin developing candidate pipeline',
        severity: 'low',
        impact: 'Long-term succession risk',
      })
    }

    if (score >= 60 && recommendations.length === 0) {
      recommendations.push('Maintain current succession planning practices')
      recommendations.push('Continue monitoring First Officer development')
    }

    return {
      score,
      level,
      breakdown: {
        readyCandidatesPoints,
        potentialCandidatesPoints,
        developingCandidatesPoints,
        retirementCoveragePoints,
      },
      recommendations,
      gaps,
    }
  } catch (error) {
    logError(error as Error, {
      source: 'SuccessionPlanningService',
      severity: ErrorSeverity.HIGH,
      metadata: { operation: 'getSuccessionReadinessScore' },
    })
    throw error
  }
}
