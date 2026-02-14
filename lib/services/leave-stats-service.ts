/**
 * Leave Statistics Service
 * Calculate approved days and fairness metrics
 *
 * @author Maurice Rondeau
 * Priority System:
 * 1. SENIORITY (Primary): Lower number = More senior = Higher priority
 * 2. DAYS TAKEN (Secondary): Fewer approved days = Higher priority
 *
 * @version 2.0.0 - Migrated to pilot_requests unified table
 * @since 2025-10-26
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { differenceInDays, parseISO } from 'date-fns'

export interface PilotLeaveStats {
  pilotId: string
  pilotName: string
  rank: 'Captain' | 'First Officer'
  seniorityNumber: number
  approvedDaysThisYear: number
  pendingDaysThisYear: number
  totalDaysThisYear: number
  year: number
}

export interface PriorityRanking {
  pilotId: string
  pilotName: string
  rank: 'Captain' | 'First Officer'
  seniorityNumber: number
  approvedDays: number
  priorityRank: number // 1 = highest priority
  priorityScore: number // Calculated score for sorting
}

/**
 * Get total approved days for a pilot in a specific year
 *
 * @param pilotId - UUID of the pilot
 * @param year - Year to calculate (defaults to current year)
 * @returns Total number of approved days
 */
export async function getApprovedDaysForYear(
  pilotId: string,
  year: number = new Date().getFullYear()
): Promise<number> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('pilot_requests')
    .select('start_date, end_date')
    .eq('request_category', 'LEAVE')
    .eq('pilot_id', pilotId)
    .eq('workflow_status', 'APPROVED')
    .gte('start_date', `${year}-01-01`)
    .lte('start_date', `${year}-12-31`)

  if (error) {
    console.error('Error fetching approved days:', error)
    return 0
  }

  if (!data || data.length === 0) {
    return 0
  }

  // Calculate total days for all approved requests
  const totalDays = data.reduce((total, request) => {
    if (!request.start_date || !request.end_date) return total
    const start = parseISO(request.start_date)
    const end = parseISO(request.end_date)
    const days = differenceInDays(end, start) + 1 // +1 to include both start and end dates
    return total + days
  }, 0)

  return totalDays
}

/**
 * Get pending days for a pilot in a specific year
 */
export async function getPendingDaysForYear(
  pilotId: string,
  year: number = new Date().getFullYear()
): Promise<number> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('pilot_requests')
    .select('start_date, end_date')
    .eq('request_category', 'LEAVE')
    .eq('pilot_id', pilotId)
    .in('workflow_status', ['SUBMITTED', 'IN_REVIEW'])
    .gte('start_date', `${year}-01-01`)
    .lte('start_date', `${year}-12-31`)

  if (error) {
    console.error('Error fetching pending days:', error)
    return 0
  }

  if (!data || data.length === 0) {
    return 0
  }

  const totalDays = data.reduce((total, request) => {
    if (!request.start_date || !request.end_date) return total
    const start = parseISO(request.start_date)
    const end = parseISO(request.end_date)
    const days = differenceInDays(end, start) + 1
    return total + days
  }, 0)

  return totalDays
}

/**
 * Get complete leave statistics for a pilot
 */
export async function getPilotLeaveStats(
  pilotId: string,
  year: number = new Date().getFullYear()
): Promise<PilotLeaveStats | null> {
  const supabase = createAdminClient()

  // Get pilot details
  const { data: pilot, error: pilotError } = await supabase
    .from('pilots')
    .select('id, first_name, last_name, role, seniority_number')
    .eq('id', pilotId)
    .single()

  if (pilotError || !pilot) {
    console.error('Error fetching pilot:', pilotError)
    return null
  }

  // Get approved and pending days
  const approvedDays = await getApprovedDaysForYear(pilotId, year)
  const pendingDays = await getPendingDaysForYear(pilotId, year)

  return {
    pilotId: pilot.id,
    pilotName: `${pilot.first_name} ${pilot.last_name}`,
    rank: pilot.role as 'Captain' | 'First Officer',
    seniorityNumber: pilot.seniority_number ?? 0,
    approvedDaysThisYear: approvedDays,
    pendingDaysThisYear: pendingDays,
    totalDaysThisYear: approvedDays + pendingDays,
    year,
  }
}

/**
 * Calculate enhanced priority score
 *
 * Priority Logic:
 * 1. SENIORITY (Primary): Lower seniority number gets higher score
 * 2. DAYS TAKEN (Secondary): Fewer approved days gets higher score
 *
 * Score Formula:
 * - Seniority Score: (100 - seniority_number) × 1000
 *   Example: Seniority #1 = 99,000 points
 *            Seniority #27 = 73,000 points
 *
 * - Days Taken Score: (365 - approved_days) × 10
 *   Example: 0 days taken = 3,650 points
 *            10 days taken = 3,550 points
 *            25 days taken = 3,400 points
 *
 * Total Score = Seniority Score + Days Taken Score
 * Range: 73,000 to 102,650 points
 *
 * @param seniorityNumber - Pilot's seniority number (1-27)
 * @param approvedDays - Total approved days this year
 * @returns Priority score (higher = higher priority)
 */
export function calculatePriorityScore(seniorityNumber: number, approvedDays: number): number {
  // Seniority is PRIMARY: weight it heavily (× 1000)
  const seniorityScore = (100 - seniorityNumber) * 1000

  // Days taken is SECONDARY: lower weight (× 10)
  const daysScore = (365 - approvedDays) * 10

  const totalScore = seniorityScore + daysScore

  return totalScore
}

/**
 * Get priority ranking for all pilots of a specific rank
 *
 * Pilots are ranked by:
 * 1. Seniority (primary) - lower seniority number first
 * 2. Approved days (secondary) - fewer days first
 *
 * @param rank - Captain or First Officer
 * @param year - Year to calculate
 * @returns Array of pilots ranked by priority (highest first)
 */
export async function getPriorityRanking(
  rank: 'Captain' | 'First Officer',
  year: number = new Date().getFullYear()
): Promise<PriorityRanking[]> {
  const supabase = createAdminClient()

  // Get all pilots of this rank
  const { data: pilots, error } = await supabase
    .from('pilots')
    .select('id, first_name, last_name, role, seniority_number')
    .eq('role', rank)
    .order('seniority_number', { ascending: true })

  if (error || !pilots) {
    console.error('Error fetching pilots:', error)
    return []
  }

  // Calculate stats and scores for each pilot
  const rankings = await Promise.all(
    pilots.map(async (pilot) => {
      const approvedDays = await getApprovedDaysForYear(pilot.id, year)
      const priorityScore = calculatePriorityScore(pilot.seniority_number ?? 0, approvedDays)

      return {
        pilotId: pilot.id,
        pilotName: `${pilot.first_name} ${pilot.last_name}`,
        rank: pilot.role as 'Captain' | 'First Officer',
        seniorityNumber: pilot.seniority_number ?? 0,
        approvedDays,
        priorityScore,
        priorityRank: 0, // Will be set after sorting
      }
    })
  )

  // Sort by priority score (descending - higher score = higher priority)
  rankings.sort((a, b) => b.priorityScore - a.priorityScore)

  // Assign priority ranks (1 = highest priority)
  rankings.forEach((ranking, index) => {
    ranking.priorityRank = index + 1
  })

  return rankings
}

/**
 * Get all leave statistics for all pilots
 * Useful for dashboard overview
 */
export async function getAllPilotLeaveStats(
  year: number = new Date().getFullYear()
): Promise<PilotLeaveStats[]> {
  const supabase = createAdminClient()

  const { data: pilots, error } = await supabase
    .from('pilots')
    .select('id')
    .order('seniority_number', { ascending: true })

  if (error || !pilots) {
    console.error('Error fetching pilots:', error)
    return []
  }

  const stats = await Promise.all(pilots.map((pilot) => getPilotLeaveStats(pilot.id, year)))

  return stats.filter((stat) => stat !== null) as PilotLeaveStats[]
}

/**
 * Compare two pilots to determine who has priority
 *
 * Returns:
 * - Negative if pilot1 has higher priority
 * - Positive if pilot2 has higher priority
 * - 0 if equal priority
 */
export function comparePriority(
  pilot1: { seniorityNumber: number; approvedDays: number },
  pilot2: { seniorityNumber: number; approvedDays: number }
): number {
  // First compare seniority (lower is better)
  if (pilot1.seniorityNumber !== pilot2.seniorityNumber) {
    return pilot1.seniorityNumber - pilot2.seniorityNumber
  }

  // If seniority is equal, compare approved days (fewer is better)
  return pilot1.approvedDays - pilot2.approvedDays
}

/**
 * Get pilot's priority explanation message
 */
export function getPriorityExplanation(
  seniorityNumber: number,
  approvedDays: number,
  rank: 'Captain' | 'First Officer'
): string {
  const messages: string[] = []

  // Seniority explanation
  if (seniorityNumber <= 5) {
    messages.push(`Very high seniority (#${seniorityNumber})`)
  } else if (seniorityNumber <= 13) {
    messages.push(`High seniority (#${seniorityNumber})`)
  } else if (seniorityNumber <= 20) {
    messages.push(`Mid seniority (#${seniorityNumber})`)
  } else {
    messages.push(`Junior seniority (#${seniorityNumber})`)
  }

  // Days taken explanation
  if (approvedDays === 0) {
    messages.push('No leave taken this year - excellent standing')
  } else if (approvedDays <= 10) {
    messages.push(`Only ${approvedDays} days taken this year - good standing`)
  } else if (approvedDays <= 20) {
    messages.push(`${approvedDays} days taken this year - moderate usage`)
  } else {
    messages.push(`${approvedDays} days taken this year - high usage`)
  }

  return messages.join('. ')
}
