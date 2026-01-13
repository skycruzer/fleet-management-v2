/**
 * LEAVE ELIGIBILITY SERVICE
 *
 * Comprehensive service for checking leave request eligibility based on:
 * - Minimum crew requirements (Captains and First Officers)
 * - Conflicting leave requests for the same period
 * - Seniority-based recommendations (SEPARATE for each rank)
 * - Aircraft fleet requirements
 *
 * Business Rules (Updated 2025-10-04):
 *
 * CRITICAL: SENIORITY RULES APPLY SEPARATELY TO EACH RANK
 * - Captains are compared ONLY against other Captains
 * - First Officers are compared ONLY against other First Officers
 * - Each rank has its own minimum requirement: 10 Captains AND 10 First Officers
 * - Crew availability checked independently for each rank
 *
 * CREW CALCULATION LOGIC (Per Rank):
 * - currentAvailable = total pilots OF THIS RANK - pilots already on APPROVED leave OF THIS RANK
 * - totalRequesting = number of pilots OF THIS RANK requesting leave for overlapping dates
 * - remainingAfterApproval = currentAvailable - totalRequesting
 * - maxApprovable = how many can be approved while keeping remaining >= 10 FOR THIS RANK
 *
 * Examples (Captains):
 * • 19 Captains available, 2 Captains requesting → 19 - 2 = 17 remaining (≥10) ✅ Approve both
 * • 12 Captains available, 4 Captains requesting → 12 - 4 = 8 remaining (<10) ❌ Only approve 2
 *
 * Examples (First Officers):
 * • 15 First Officers available, 3 First Officers requesting → 15 - 3 = 12 remaining (≥10) ✅ Approve all 3
 * • 11 First Officers available, 3 First Officers requesting → 11 - 3 = 8 remaining (<10) ❌ Only approve 1
 *
 * SCENARIO 1: No other pilots of SAME RANK requesting same dates
 * → APPROVE if currentAvailable - 1 >= 10 (maintaining minimum crew FOR THIS RANK)
 *
 * SCENARIO 2: Multiple pilots of SAME RANK requesting same dates
 * → Calculate: remainingAfterAllApprovals = currentAvailable - totalRequesting
 * → Sub-scenarios:
 *    2a. remainingAfterAllApprovals >= 10 → APPROVE ALL in seniority order (green border)
 *    2b. remainingAfterAllApprovals < 10 BUT some can be approved → APPROVE highest seniority
 *        up to maxApprovable (currentAvailable - 10), recommend alternatives for rest (yellow border)
 *    2c. currentAvailable <= 10 (at/below minimum already) → Recommend spreading/sequential
 *        approval for all requests (red border)
 *
 * Key Principles:
 * - Minimum crew MUST be maintained: 10 Captains AND 10 First Officers at all times
 * - Priority order for approval decisions:
 *   1. Rank (Captain has priority over First Officer)
 *   2. Seniority Number (lower = higher priority WITHIN THE SAME RANK)
 *   3. Request Submission Date (earlier submission = higher priority for spreading tie-breaker)
 * - Captains and First Officers evaluated independently with separate minimums
 * - Leave requests evaluated against approved + pending requests OF THE SAME RANK
 * - Real-time conflict detection for overlapping dates WITHIN THE SAME RANK
 * - Seniority comparison ALWAYS shown when 2+ pilots OF THE SAME RANK request same dates
 *
 * Created: 2025-10-03
 * Updated: 2025-10-04 - Corrected crew availability calculation logic and clarified rank-specific rules
 * Purpose: Ensure operational crew requirements while managing leave requests per rank
 *
 * Ported to Fleet Management V2: 2025-10-17
 * - Updated imports to @/ alias
 * - Changed to @/lib/supabase/server
 * - Added await for createClient()
 * - Removed logger dependency
 * - All business logic PRESERVED
 */

import { createClient } from '@/lib/supabase/server'
import { differenceInDays, parseISO, isWithinInterval, eachDayOfInterval, addDays } from 'date-fns'

// ===================================
// TYPES & INTERFACES
// ===================================

export interface CrewRequirements {
  minimumCaptains: number
  minimumFirstOfficers: number
  numberOfAircraft: number
  captainsPerHull: number
  firstOfficersPerHull: number
}

export interface CrewAvailability {
  date: string
  availableCaptains: number
  availableFirstOfficers: number
  onLeaveCaptains: number
  onLeaveFirstOfficers: number
  totalCaptains: number
  totalFirstOfficers: number
  meetsMinimum: boolean
  captainsShortfall: number // Negative if below minimum
  firstOfficersShortfall: number
}

export interface LeaveEligibilityCheck {
  isEligible: boolean
  conflicts: LeaveConflict[]
  affectedDates: string[] // Dates that would violate minimum requirements
  recommendation: 'APPROVE' | 'DENY' | 'REVIEW_REQUIRED'
  reasons: string[]
  alternativePilots: PilotRecommendation[] // Based on seniority
  crewImpact: CrewAvailability[]
  conflictingRequests?: ConflictingRequest[] // Other pending requests for same dates
  seniorityRecommendation?: string // Seniority-based recommendation text
}

export interface LeaveConflict {
  date: string
  availableCaptains: number
  availableFirstOfficers: number
  requiredCaptains: number
  requiredFirstOfficers: number
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  message: string
}

export interface PilotRecommendation {
  pilotId: string
  pilotName: string
  employeeId: string
  role: 'Captain' | 'First Officer'
  seniorityNumber: number
  currentLeaveStatus: 'AVAILABLE' | 'ON_LEAVE' | 'PENDING_LEAVE'
  priority: number // 1 = highest priority (most senior available)
  reason: string
}

export interface ConflictingRequest {
  requestId: string
  pilotId: string
  pilotName: string
  employeeId: string
  role?: 'Captain' | 'First Officer' // Pilot rank
  seniorityNumber: number
  startDate: string
  endDate: string
  requestDate: string
  requestType?: string // RDO, WDO, ANNUAL, SICK, LSL, etc.
  reason?: string // Reason for the leave request
  overlappingDays: number
  isPriority: boolean // true if this pilot has higher seniority than the current request
  recommendation: string // Human-readable recommendation
  overlapType?: 'EXACT' | 'PARTIAL' | 'ADJACENT' | 'NEARBY' // Type of date overlap
  overlapMessage?: string // Explanation of the overlap
  spreadSuggestion?: string // Recommendation to spread out requests
}

export interface LeaveRequestCheck {
  requestId?: string // Omit for new requests
  pilotId: string
  pilotRole: 'Captain' | 'First Officer'
  startDate: string
  endDate: string
  requestType: string
}

// ===================================
// CREW REQUIREMENTS
// ===================================

/**
 * Get minimum crew requirements from settings
 */
export async function getCrewRequirements(): Promise<CrewRequirements> {
  const supabase = await createClient()

  const { data: settings, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'pilot_requirements')
    .single()

  if (error || !settings) {
    // Default fallback values based on current system
    return {
      minimumCaptains: 10, // 5 per hull × 2 aircraft
      minimumFirstOfficers: 10,
      numberOfAircraft: 2,
      captainsPerHull: 5,
      firstOfficersPerHull: 5,
    }
  }

  const reqs = settings.value as any
  return {
    minimumCaptains: (reqs.minimum_captains_per_hull || 5) * (reqs.number_of_aircraft || 2),
    minimumFirstOfficers:
      (reqs.minimum_first_officers_per_hull || 5) * (reqs.number_of_aircraft || 2),
    numberOfAircraft: reqs.number_of_aircraft || 2,
    captainsPerHull: reqs.minimum_captains_per_hull || 5,
    firstOfficersPerHull: reqs.minimum_first_officers_per_hull || 5,
  }
}

// ===================================
// CREW AVAILABILITY CALCULATIONS
// ===================================

/**
 * Result from atomic crew availability check
 * Uses database-level row locking to prevent race conditions
 */
export interface AtomicCrewCheck {
  totalPilots: number
  onLeaveCount: number
  available: number
  minimumRequired: number
  remainingAfterApproval: number
  canApprove: boolean
  reason: string
}

/**
 * Atomically check crew availability with row-level locking
 *
 * CRITICAL: This function uses a PostgreSQL function with FOR UPDATE
 * to prevent race conditions during concurrent leave approvals.
 *
 * Use this for approval decisions, not for display purposes.
 *
 * @param startDate - Start date of leave request (YYYY-MM-DD)
 * @param endDate - End date of leave request (YYYY-MM-DD)
 * @param excludeRequestId - Request ID to exclude from count (for updates)
 * @returns Object with canApprove boolean and availability details for both roles
 */
export async function checkCrewAvailabilityAtomic(
  startDate: string,
  endDate: string,
  excludeRequestId?: string
): Promise<{
  captains: AtomicCrewCheck
  firstOfficers: AtomicCrewCheck
  canApprove: boolean
  reason: string
}> {
  const supabase = await createClient()

  // Type for the atomic check result from PostgreSQL
  type AtomicCheckResult = {
    total_pilots: number
    on_leave_count: number
    available: number
    minimum_required: number
    remaining_after_approval: number
    can_approve: boolean
    reason: string
  }

  // Check Captains atomically with row locking
  // Note: Using type assertion because TypeScript types are regenerated after migration
  const { data: captainCheckData, error: captainError } = await supabase.rpc(
    'check_crew_availability_atomic' as never,
    {
      p_pilot_role: 'Captain',
      p_start_date: startDate,
      p_end_date: endDate,
      p_exclude_request_id: excludeRequestId || null,
    } as never
  )

  if (captainError) {
    console.error('Atomic crew check failed for Captains:', captainError)
    throw new Error(`Failed to check Captain availability: ${captainError.message}`)
  }

  const captainCheck = captainCheckData as unknown as AtomicCheckResult

  // Check First Officers atomically with row locking
  const { data: foCheckData, error: foError } = await supabase.rpc(
    'check_crew_availability_atomic' as never,
    {
      p_pilot_role: 'First Officer',
      p_start_date: startDate,
      p_end_date: endDate,
      p_exclude_request_id: excludeRequestId || null,
    } as never
  )

  if (foError) {
    console.error('Atomic crew check failed for First Officers:', foError)
    throw new Error(`Failed to check First Officer availability: ${foError.message}`)
  }

  const foCheck = foCheckData as unknown as AtomicCheckResult

  const captains: AtomicCrewCheck = {
    totalPilots: captainCheck.total_pilots,
    onLeaveCount: captainCheck.on_leave_count,
    available: captainCheck.available,
    minimumRequired: captainCheck.minimum_required,
    remainingAfterApproval: captainCheck.remaining_after_approval,
    canApprove: captainCheck.can_approve,
    reason: captainCheck.reason,
  }

  const firstOfficers: AtomicCrewCheck = {
    totalPilots: foCheck.total_pilots,
    onLeaveCount: foCheck.on_leave_count,
    available: foCheck.available,
    minimumRequired: foCheck.minimum_required,
    remainingAfterApproval: foCheck.remaining_after_approval,
    canApprove: foCheck.can_approve,
    reason: foCheck.reason,
  }

  const canApprove = captains.canApprove && firstOfficers.canApprove
  let reason = ''
  if (!canApprove) {
    const issues: string[] = []
    if (!captains.canApprove) issues.push(`Captains: ${captains.reason}`)
    if (!firstOfficers.canApprove) issues.push(`First Officers: ${firstOfficers.reason}`)
    reason = issues.join('; ')
  } else {
    reason = 'Sufficient crew available for both roles'
  }

  return { captains, firstOfficers, canApprove, reason }
}

/**
 * Calculate crew availability for a specific date range
 * Considers approved and pending leave requests
 *
 * NOTE: This function is for DISPLAY purposes (calendar, reports).
 * For approval decisions, use checkCrewAvailabilityAtomic() instead
 * to prevent race conditions.
 */
export async function calculateCrewAvailability(
  startDate: string,
  endDate: string,
  excludeRequestId?: string
): Promise<CrewAvailability[]> {
  const supabase = await createClient()
  const requirements = await getCrewRequirements()

  // Get all active pilots by role
  const { data: pilots, error: pilotsError } = await supabase
    .from('pilots')
    .select('id, role')
    .eq('is_active', true)

  if (pilotsError || !pilots) {
    throw new Error('Failed to fetch pilots data')
  }

  const totalCaptains = pilots.filter((p) => p.role === 'Captain').length
  const totalFirstOfficers = pilots.filter((p) => p.role === 'First Officer').length

  // Get all leave requests that overlap with the date range
  // Include both APPROVED and PENDING requests
  const { data: leaveRequests, error: leaveError } = await supabase
    .from('pilot_requests')
    .select(
      `
      id,
      pilot_id,
      start_date,
      end_date,
      workflow_status,
      pilots!inner (id, role)
    `
    )
    .eq('request_category', 'LEAVE')
    .in('workflow_status', ['APPROVED', 'PENDING'])
    .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)

  if (leaveError) {
    throw new Error('Failed to fetch leave requests')
  }

  // Filter out the request being checked (for updates)
  const relevantLeave = (leaveRequests || []).filter((lr) => lr.id !== excludeRequestId)

  // Calculate availability for each day in the range
  const days = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  })

  const availability: CrewAvailability[] = days.map((day) => {
    const dateStr = day.toISOString().split('T')[0]

    // Count pilots on leave for this specific date
    const onLeaveToday = relevantLeave.filter((lr) => {
      if (!lr.start_date || !lr.end_date) return false
      const leaveStart = parseISO(lr.start_date)
      const leaveEnd = parseISO(lr.end_date)
      return isWithinInterval(day, { start: leaveStart, end: leaveEnd })
    })

    const onLeaveCaptains = onLeaveToday.filter(
      (lr) => (lr.pilots as any)?.role === 'Captain'
    ).length
    const onLeaveFirstOfficers = onLeaveToday.filter(
      (lr) => (lr.pilots as any)?.role === 'First Officer'
    ).length

    const availableCaptains = totalCaptains - onLeaveCaptains
    const availableFirstOfficers = totalFirstOfficers - onLeaveFirstOfficers

    const captainsShortfall = availableCaptains - requirements.minimumCaptains
    const firstOfficersShortfall = availableFirstOfficers - requirements.minimumFirstOfficers

    return {
      date: dateStr,
      availableCaptains,
      availableFirstOfficers,
      onLeaveCaptains,
      onLeaveFirstOfficers,
      totalCaptains,
      totalFirstOfficers,
      meetsMinimum: captainsShortfall >= 0 && firstOfficersShortfall >= 0,
      captainsShortfall,
      firstOfficersShortfall,
    }
  })

  return availability
}

/**
 * Get conflicting PENDING leave requests for OVERLAPPING, ADJACENT, or NEARBY dates
 * Compares seniority to determine priority and suggests spreading requests
 * INCLUDES the current pilot in the comparison list
 */
export async function getConflictingPendingRequests(
  request: LeaveRequestCheck
): Promise<{ conflictingRequests: ConflictingRequest[]; seniorityRecommendation: string }> {
  const supabase = await createClient()

  // Get the current pilot's seniority
  const { data: currentPilot } = await supabase
    .from('pilots')
    .select('seniority_number, first_name, last_name, employee_id')
    .eq('id', request.pilotId)
    .single()

  if (!currentPilot) {
    return { conflictingRequests: [], seniorityRecommendation: '' }
  }

  const requestStart = parseISO(request.startDate)
  const requestEnd = parseISO(request.endDate)

  // Get all PENDING leave requests for same role with overlapping or nearby dates
  const { data: pendingRequests, error } = await supabase
    .from('pilot_requests')
    .select(
      `
      id,
      pilot_id,
      start_date,
      end_date,
      request_date,
      request_type,
      reason,
      pilots!inner (
        id,
        first_name,
        last_name,
        employee_id,
        role,
        seniority_number
      )
    `
    )
    .eq('request_category', 'LEAVE')
    .eq('workflow_status', 'PENDING')
    .gte('end_date', request.startDate) // Ends on or after our start
    .lte('start_date', request.endDate) // Starts on or before our end

  if (error || !pendingRequests || pendingRequests.length === 0) {
    return { conflictingRequests: [], seniorityRecommendation: '' }
  }

  // Filter for same role and process ALL matching requests (including current pilot)
  const conflictingRequests: ConflictingRequest[] = pendingRequests
    .filter((req: any) => req.pilots?.role === request.pilotRole)
    .map((req: any) => {
      const pilot = req.pilots
      const reqStart = parseISO(req.start_date)
      const reqEnd = parseISO(req.end_date)
      const isCurrentPilot = req.pilot_id === request.pilotId
      const totalDays = differenceInDays(reqEnd, reqStart) + 1

      // Determine overlap type and calculate spreading suggestions with specific dates
      let overlapType: 'EXACT' | 'PARTIAL' | 'ADJACENT' | 'NEARBY' = 'NEARBY'
      let overlapMessage = ''
      let spreadSuggestion = ''

      if (req.start_date === request.startDate && req.end_date === request.endDate) {
        overlapType = 'EXACT'
        overlapMessage = 'Exact same dates'

        // Suggest moving one of the requests forward or backward
        const gapDays = 7 // Minimum recommended spacing
        const alternativeStart1 = new Date(reqEnd)
        alternativeStart1.setDate(alternativeStart1.getDate() + gapDays)
        const alternativeEnd1 = new Date(alternativeStart1)
        alternativeEnd1.setDate(alternativeEnd1.getDate() + totalDays - 1)

        const alternativeStart2 = new Date(reqStart)
        alternativeStart2.setDate(alternativeStart2.getDate() - totalDays - gapDays + 1)
        const alternativeEnd2 = new Date(reqStart)
        alternativeEnd2.setDate(alternativeEnd2.getDate() - gapDays)

        spreadSuggestion = `💡 Suggested alternative dates: ${alternativeStart1.toLocaleDateString('en-AU')} - ${alternativeEnd1.toLocaleDateString('en-AU')} OR ${alternativeStart2.toLocaleDateString('en-AU')} - ${alternativeEnd2.toLocaleDateString('en-AU')}`
      } else if (reqStart <= requestEnd && reqEnd >= requestStart) {
        overlapType = 'PARTIAL'
        const actualOverlapDays =
          differenceInDays(
            reqEnd < requestEnd ? reqEnd : requestEnd,
            reqStart > requestStart ? reqStart : requestStart
          ) + 1
        overlapMessage = `${actualOverlapDays} days overlap`

        // Suggest moving to avoid overlap
        const gapDays = 3
        const moveAfter = new Date(requestEnd)
        moveAfter.setDate(moveAfter.getDate() + gapDays)
        const moveAfterEnd = new Date(moveAfter)
        moveAfterEnd.setDate(moveAfterEnd.getDate() + totalDays - 1)

        spreadSuggestion = `💡 To avoid overlap, suggest moving to: ${moveAfter.toLocaleDateString('en-AU')} - ${moveAfterEnd.toLocaleDateString('en-AU')} (${actualOverlapDays + gapDays} days separation)`
      } else {
        const daysBetween = Math.abs(differenceInDays(reqStart, requestEnd))
        if (daysBetween <= 3) {
          overlapType = 'ADJACENT'
          overlapMessage = `Within ${daysBetween} days`

          // Suggest adding more spacing
          const recommendedGap = 7
          const betterStart = new Date(requestEnd)
          betterStart.setDate(betterStart.getDate() + recommendedGap)
          const betterEnd = new Date(betterStart)
          betterEnd.setDate(betterEnd.getDate() + totalDays - 1)

          spreadSuggestion = `💡 Better spacing: ${betterStart.toLocaleDateString('en-AU')} - ${betterEnd.toLocaleDateString('en-AU')} (${recommendedGap} days gap)`
        } else {
          overlapType = 'NEARBY'
          overlapMessage = `${daysBetween} days apart - Good spacing`
        }
      }

      const isPriority =
        !isCurrentPilot &&
        (pilot.seniority_number ?? Infinity) < (currentPilot.seniority_number ?? Infinity)

      let recommendation = ''
      if (isCurrentPilot) {
        recommendation = `📋 This is the current request being reviewed`
      } else if (overlapType === 'EXACT') {
        if (isPriority) {
          recommendation = `❌ EXACT SAME DATES - Has HIGHER priority (Seniority #${pilot.seniority_number} vs #${currentPilot.seniority_number}) - Approve this pilot first`
        } else {
          recommendation = `✅ EXACT SAME DATES - Current pilot has HIGHER priority (Seniority #${currentPilot.seniority_number} vs #${pilot.seniority_number})`
        }
      } else if (overlapType === 'PARTIAL') {
        if (isPriority) {
          recommendation = `⚠️ OVERLAPPING DATES - Has higher priority. ${spreadSuggestion}`
        } else {
          recommendation = `⚠️ OVERLAPPING DATES - Current pilot has priority, but ${spreadSuggestion.toLowerCase()}`
        }
      } else if (overlapType === 'ADJACENT') {
        recommendation = `📌 ADJACENT DATES - ${spreadSuggestion}`
      } else {
        recommendation = `ℹ️ NEARBY REQUEST - Sufficient spacing between requests`
      }

      return {
        requestId: req.id,
        pilotId: req.pilot_id,
        pilotName: `${pilot.first_name} ${pilot.last_name}`,
        employeeId: pilot.employee_id,
        role: pilot.role,
        seniorityNumber: pilot.seniority_number,
        startDate: req.start_date,
        endDate: req.end_date,
        requestDate: req.request_date,
        requestType: req.request_type,
        reason: req.reason,
        overlappingDays: totalDays,
        isPriority,
        recommendation,
        overlapType,
        overlapMessage,
        spreadSuggestion,
      }
    })
    .sort((a, b) => {
      // Priority order: Overlap Type > Rank (Captain > First Officer) > Seniority Number (lower = higher) > Request Date (earlier = higher priority)
      const overlapPriority = { EXACT: 0, PARTIAL: 1, ADJACENT: 2, NEARBY: 3 }
      const overlapCompare = overlapPriority[a.overlapType!] - overlapPriority[b.overlapType!]
      if (overlapCompare !== 0) return overlapCompare

      // Then by rank (Captain = 0, First Officer = 1)
      const rankPriority: Record<string, number> = { Captain: 0, 'First Officer': 1 }
      const rankCompare = rankPriority[a.role!] - rankPriority[b.role!]
      if (rankCompare !== 0) return rankCompare

      // Then by seniority number (lower = higher priority)
      const seniorityCompare = a.seniorityNumber - b.seniorityNumber
      if (seniorityCompare !== 0) return seniorityCompare

      // Finally by request date (earlier submission = higher priority for spreading)
      const dateA = a.requestDate ? new Date(a.requestDate).getTime() : Infinity
      const dateB = b.requestDate ? new Date(b.requestDate).getTime() : Infinity
      return dateA - dateB
    })

  // Generate overall seniority recommendation
  let seniorityRecommendation = ''
  const higherPriorityRequests = conflictingRequests.filter((r) => r.isPriority)

  if (higherPriorityRequests.length > 0) {
    const mostSenior = higherPriorityRequests[0]
    seniorityRecommendation = `⚠️ SENIORITY CONFLICT: ${mostSenior.pilotName} (Seniority #${mostSenior.seniorityNumber}, Employee #${mostSenior.employeeId}) has higher seniority and should be given priority for overlapping dates. Current pilot is Seniority #${currentPilot.seniority_number}.`
  } else if (conflictingRequests.length > 0) {
    seniorityRecommendation = `✅ SENIORITY PRIORITY: Current pilot (${currentPilot.first_name} ${currentPilot.last_name}, Seniority #${currentPilot.seniority_number}) has the highest seniority among ${conflictingRequests.length} conflicting PENDING request(s).`
  }

  return { conflictingRequests, seniorityRecommendation }
}

/**
 * Generate intelligent spreading recommendations based on seniority and rank
 * to maintain minimum pilot requirements when crew shortage exists
 */
function generateSpreadingRecommendations(
  conflictingRequests: ConflictingRequest[],
  currentRequest: LeaveRequestCheck,
  availableCaptains: number,
  availableFirstOfficers: number,
  requirements: CrewRequirements
): string {
  const role = currentRequest.pilotRole
  const available = role === 'Captain' ? availableCaptains : availableFirstOfficers
  const minimum = requirements.minimumCaptains // Same for both roles (10 each)
  const shortage = minimum - available

  // Sort conflicting requests by priority (already sorted, but ensure correct order)
  const sortedRequests = [...conflictingRequests].sort((a, b) => {
    // Rank priority: Captain > First Officer
    const rankPriority: Record<string, number> = { Captain: 0, 'First Officer': 1 }
    const rankCompare = rankPriority[a.role!] - rankPriority[b.role!]
    if (rankCompare !== 0) return rankCompare

    // Seniority priority: Lower number = Higher priority
    return a.seniorityNumber - b.seniorityNumber
  })

  // Identify the highest priority pilot (should be approved)
  const highestPriority = sortedRequests[0]

  // Safety check - should not happen but TypeScript requires it
  if (!highestPriority) {
    return 'Unable to generate recommendations - no conflicting requests found.'
  }

  // Identify pilots that should reschedule (lower priority)
  const shouldReschedule = sortedRequests.slice(1)

  // Build recommendation message
  let recommendation = `⚠️ CREW SHORTAGE RISK: Only ${available} ${role}s available after approvals, which is ${shortage} below the minimum requirement of ${minimum}.\n\n`

  recommendation += `📋 SENIORITY-BASED SPREADING RECOMMENDATIONS:\n\n`

  recommendation += `✅ APPROVE (Highest Priority):\n`
  recommendation += `   • ${highestPriority.role} - Seniority #${highestPriority.seniorityNumber}: ${highestPriority.pilotName}\n`
  recommendation += `   • Employee ID: ${highestPriority.employeeId}\n`
  recommendation += `   • Dates: ${new Date(highestPriority.startDate).toLocaleDateString('en-AU')} to ${new Date(highestPriority.endDate).toLocaleDateString('en-AU')}\n`
  recommendation += `   • Duration: ${highestPriority.overlappingDays} days\n`
  if (highestPriority.reason) {
    recommendation += `   • Reason: ${highestPriority.reason}\n`
  }
  recommendation += `   • Priority: Rank (${highestPriority.role}) + Seniority (#${highestPriority.seniorityNumber} = Most Senior)\n\n`

  if (shouldReschedule.length > 0) {
    recommendation += `🔄 REQUEST TO RESCHEDULE (Lower Priority):\n\n`

    shouldReschedule.forEach((pilot, index) => {
      recommendation += `   ${index + 1}. ${pilot.role} - Seniority #${pilot.seniorityNumber}: ${pilot.pilotName}\n`
      recommendation += `      • Employee ID: ${pilot.employeeId}\n`
      recommendation += `      • Current Request: ${new Date(pilot.startDate).toLocaleDateString('en-AU')} to ${new Date(pilot.endDate).toLocaleDateString('en-AU')} (${pilot.overlappingDays} days)\n`

      // Generate spreading suggestion
      const spreadingOptions = generateDateSpreadingSuggestions(
        pilot.startDate,
        pilot.endDate,
        conflictingRequests
      )

      if (spreadingOptions.length > 0) {
        recommendation += `      • Suggested Alternative Dates:\n`
        spreadingOptions.forEach((option, optIndex) => {
          recommendation += `        ${optIndex + 1}) ${option}\n`
        })
      }

      recommendation += `      • Priority Reason: ${pilot.role === 'First Officer' ? 'Lower rank' : `Lower seniority (#${pilot.seniorityNumber})`}\n`
      recommendation += `\n`
    })
  }

  recommendation += `\n💡 ACTION REQUIRED:\n`
  recommendation += `   • Approve ${highestPriority.pilotName} (highest priority) to maintain operations\n`
  recommendation += `   • Contact ${shouldReschedule.length} lower-priority pilot(s) to discuss rescheduling options\n`
  recommendation += `   • Ensure minimum ${minimum} ${role}s maintained at all times for fleet operations\n`
  recommendation += `   • Consider roster periods when proposing alternative dates\n`

  return recommendation
}

/**
 * Generate date spreading suggestions for rescheduling
 */
function generateDateSpreadingSuggestions(
  startDate: string,
  endDate: string,
  _conflictingRequests: ConflictingRequest[]
): string[] {
  const suggestions: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  const duration = differenceInDays(end, start) + 1

  // Suggestion 1: Move 1 week earlier
  const oneWeekEarlier = addDays(start, -7)
  const oneWeekEarlierEnd = addDays(oneWeekEarlier, duration - 1)
  suggestions.push(
    `${oneWeekEarlier.toLocaleDateString('en-AU')} to ${oneWeekEarlierEnd.toLocaleDateString('en-AU')} (1 week earlier)`
  )

  // Suggestion 2: Move 1 week later
  const oneWeekLater = addDays(start, 7)
  const oneWeekLaterEnd = addDays(oneWeekLater, duration - 1)
  suggestions.push(
    `${oneWeekLater.toLocaleDateString('en-AU')} to ${oneWeekLaterEnd.toLocaleDateString('en-AU')} (1 week later)`
  )

  // Suggestion 3: Move 2 weeks later (next roster period consideration)
  const twoWeeksLater = addDays(start, 14)
  const twoWeeksLaterEnd = addDays(twoWeeksLater, duration - 1)
  suggestions.push(
    `${twoWeeksLater.toLocaleDateString('en-AU')} to ${twoWeeksLaterEnd.toLocaleDateString('en-AU')} (2 weeks later - different roster period)`
  )

  return suggestions
}

// ===================================
// LEAVE ELIGIBILITY CHECKING
// ===================================

/**
 * Check if a leave request is eligible based on crew requirements
 * Returns detailed analysis with conflicts, recommendations, and reasons
 */
export async function checkLeaveEligibility(
  request: LeaveRequestCheck
): Promise<LeaveEligibilityCheck> {
  const requirements = await getCrewRequirements()

  // Calculate crew availability if this request is approved
  const crewImpact = await calculateCrewAvailability(
    request.startDate,
    request.endDate,
    request.requestId
  )

  // Identify conflicts (days where minimum requirements would be violated)
  const conflicts: LeaveConflict[] = []
  const affectedDates: string[] = []

  crewImpact.forEach((day) => {
    const isCaptainRequest = request.pilotRole === 'Captain'
    const isFirstOfficerRequest = request.pilotRole === 'First Officer'

    // Calculate what availability would be if this request is approved
    const projectedCaptains = isCaptainRequest ? day.availableCaptains - 1 : day.availableCaptains
    const projectedFirstOfficers = isFirstOfficerRequest
      ? day.availableFirstOfficers - 1
      : day.availableFirstOfficers

    const captainViolation = projectedCaptains < requirements.minimumCaptains
    const firstOfficerViolation = projectedFirstOfficers < requirements.minimumFirstOfficers

    if (captainViolation || firstOfficerViolation) {
      affectedDates.push(day.date)

      const severity: 'CRITICAL' | 'WARNING' | 'INFO' =
        projectedCaptains < requirements.captainsPerHull ||
        projectedFirstOfficers < requirements.firstOfficersPerHull
          ? 'CRITICAL'
          : 'WARNING'

      let message = `${day.date}: `
      const issues: string[] = []

      if (captainViolation) {
        const shortage = requirements.minimumCaptains - projectedCaptains
        issues.push(
          `${shortage} Captain${shortage > 1 ? 's' : ''} below minimum (${projectedCaptains}/${requirements.minimumCaptains})`
        )
      }

      if (firstOfficerViolation) {
        const shortage = requirements.minimumFirstOfficers - projectedFirstOfficers
        issues.push(
          `${shortage} First Officer${shortage > 1 ? 's' : ''} below minimum (${projectedFirstOfficers}/${requirements.minimumFirstOfficers})`
        )
      }

      message += issues.join(', ')

      conflicts.push({
        date: day.date,
        availableCaptains: projectedCaptains,
        availableFirstOfficers: projectedFirstOfficers,
        requiredCaptains: requirements.minimumCaptains,
        requiredFirstOfficers: requirements.minimumFirstOfficers,
        severity,
        message,
      })
    }
  })

  // Get alternative pilot recommendations based on seniority
  const alternativePilots = await getAlternativePilotRecommendations(
    request.pilotRole,
    request.startDate,
    request.endDate,
    request.pilotId
  )

  // Determine eligibility for THIS request
  const isEligible = conflicts.length === 0
  const hasCriticalConflicts = conflicts.some((c) => c.severity === 'CRITICAL')

  // Get conflicting PENDING requests for same dates
  const {
    conflictingRequests: allConflictingRequests,
    seniorityRecommendation: _initialSeniorityRec,
  } = await getConflictingPendingRequests(request)

  // Now check if approving ALL conflicting requests would cause crew shortage
  // Only show seniority comparison if collective approval would violate minimums
  let conflictingRequests: ConflictingRequest[] = []
  let seniorityRecommendation = ''

  if (allConflictingRequests.length > 0) {
    // STEP 1: Check if we have minimum crew available
    // Logic: Do we have 10 Captains AND 10 First Officers available?
    const supabase = await createClient()

    // Get total active pilots
    const { data: pilots } = await supabase.from('pilots').select('id, role').eq('is_active', true)

    // Get already approved leave for these dates (excluding current conflicting requests)
    const conflictingRequestIds = allConflictingRequests.map((r) => r.requestId).filter((id) => id)
    let existingLeaveQuery = supabase
      .from('pilot_requests')
      .select(
        `
        id,
        pilot_id,
        pilots!inner (id, role)
      `
      )
      .eq('request_category', 'LEAVE')
      .eq('workflow_status', 'APPROVED')
      .gte('end_date', request.startDate)
      .lte('start_date', request.endDate)

    // Exclude the conflicting request IDs if any exist
    if (conflictingRequestIds.length > 0) {
      existingLeaveQuery = existingLeaveQuery.not(
        'id',
        'in',
        `(${conflictingRequestIds.join(',')})`
      )
    }

    const { data: existingLeave } = await existingLeaveQuery

    if (pilots) {
      const totalCaptains = pilots.filter((p) => p.role === 'Captain').length
      const totalFirstOfficers = pilots.filter((p) => p.role === 'First Officer').length

      // Count already on APPROVED leave
      const onLeaveCaptains = (existingLeave || []).filter(
        (lr: any) => lr.pilots?.role === 'Captain'
      ).length
      const onLeaveFirstOfficers = (existingLeave || []).filter(
        (lr: any) => lr.pilots?.role === 'First Officer'
      ).length

      // Calculate CURRENTLY available crew (before approving new requests)
      const availableCaptains = totalCaptains - onLeaveCaptains
      const availableFirstOfficers = totalFirstOfficers - onLeaveFirstOfficers

      // STEP 2: Decision based on the role being requested
      // Check if we have minimum crew for the specific role requesting leave

      // LOGIC UPDATE (2025-10-04): New seniority-based approval logic
      // CRITICAL: Must maintain minimum 10 Captains AND 10 First Officers
      //
      // Calculation Logic:
      // - currentAvailable = pilots of this rank currently available (not on approved leave)
      // - totalRequesting = number of pilots of this rank requesting leave for overlapping dates
      // - remainingAfterApproval = currentAvailable - totalRequesting
      // - maxApprovable = how many we can approve while keeping remainingAfterApproval >= 10
      //
      // Examples:
      // Scenario 1: 15 Captains available, 2 requesting → 15 - 2 = 13 remaining (>= 10) ✅ Approve both
      // Scenario 2: 12 FOs available, 4 requesting → 12 - 4 = 8 remaining (< 10) ❌ Only approve 2 (12-10=2)

      if (allConflictingRequests.length > 1) {
        conflictingRequests = allConflictingRequests

        // Count how many pilots can be approved while maintaining minimum crew
        const requestingRole = request.pilotRole
        const currentAvailable =
          requestingRole === 'Captain' ? availableCaptains : availableFirstOfficers
        const minimumRequired =
          requestingRole === 'Captain'
            ? requirements.minimumCaptains
            : requirements.minimumFirstOfficers
        const totalRequesting = allConflictingRequests.length

        // CORRECTED LOGIC: Calculate remaining crew after approving all requests
        // If (currentAvailable - totalRequesting) >= minimumRequired, then ALL can be approved
        // Otherwise, maxApprovable = currentAvailable - minimumRequired
        const remainingAfterAllApprovals = currentAvailable - totalRequesting
        const canApproveAll = remainingAfterAllApprovals >= minimumRequired
        const maxApprovable = canApproveAll
          ? totalRequesting
          : Math.max(0, currentAvailable - minimumRequired)

        if (maxApprovable >= allConflictingRequests.length) {
          // SCENARIO 2a: Above minimum crew - ALL can be approved, no spreading needed
          seniorityRecommendation = '' // No spreading recommendations needed when all can be approved
        } else if (maxApprovable > 0) {
          // SCENARIO 2b: Can approve some, but not all - use seniority to determine who gets approved
          const canApprove = allConflictingRequests.slice(0, maxApprovable)
          const mustReschedule = allConflictingRequests.slice(maxApprovable)

          seniorityRecommendation =
            `⚠️ CREW SHORTAGE RISK\n\n` +
            `Current ${requestingRole}s Available: ${currentAvailable}\n` +
            `Minimum Required: ${minimumRequired}\n` +
            `Total Requesting Leave: ${totalRequesting} ${requestingRole}${totalRequesting > 1 ? 's' : ''}\n` +
            `If All Approved, Remaining: ${remainingAfterAllApprovals} (❌ BELOW minimum of ${minimumRequired})\n` +
            `Maximum Can Approve: ${maxApprovable} pilot${maxApprovable > 1 ? 's' : ''} (to maintain minimum crew)\n\n` +
            `✅ APPROVE (Highest Seniority - ${maxApprovable} pilot${maxApprovable > 1 ? 's' : ''}):\n${canApprove
              .map(
                (req, index) =>
                  `  ${index + 1}. ${req.role} - Seniority #${req.seniorityNumber}: ${req.pilotName}\n` +
                  `     • Employee ID: ${req.employeeId}\n` +
                  `     • Dates: ${new Date(req.startDate).toLocaleDateString('en-AU')} to ${new Date(req.endDate).toLocaleDateString('en-AU')} (${req.overlappingDays} days)\n`
              )
              .join(
                '\n'
              )}\n🔄 REQUEST TO RESCHEDULE (Lower Seniority - ${mustReschedule.length} pilot${mustReschedule.length > 1 ? 's' : ''}):\n${mustReschedule
              .map((req, index) => {
                const spreadingOptions = generateDateSpreadingSuggestions(
                  req.startDate,
                  req.endDate,
                  allConflictingRequests
                )
                const remainingIfApproved = currentAvailable - maxApprovable - 1
                return (
                  `  ${index + 1}. ${req.role} - Seniority #${req.seniorityNumber}: ${req.pilotName}\n` +
                  `     • Employee ID: ${req.employeeId}\n` +
                  `     • Current Request: ${new Date(req.startDate).toLocaleDateString('en-AU')} to ${new Date(req.endDate).toLocaleDateString('en-AU')} (${req.overlappingDays} days)\n` +
                  `     • Reason: Approving would drop crew below minimum (${remainingIfApproved}/${minimumRequired})\n` +
                  `     • Suggested Alternative Dates:\n${spreadingOptions
                    .map((option, optIndex) => `        ${optIndex + 1}) ${option}\n`)
                    .join('')}`
                )
              })
              .join('\n')}`
        } else {
          // SCENARIO 2c: At or below minimum already - need spreading recommendations for ALL
          seniorityRecommendation = generateSpreadingRecommendations(
            allConflictingRequests,
            request,
            availableCaptains,
            availableFirstOfficers,
            requirements
          )
        }
      } else {
        // SCENARIO 1: Only ONE pilot requesting - straight approve based on crew availability
        conflictingRequests = []
        seniorityRecommendation = ''
      }
    }
  }

  const hasHigherPriorityRequests = conflictingRequests.some((r) => r.isPriority)

  let recommendation: 'APPROVE' | 'DENY' | 'REVIEW_REQUIRED'
  const reasons: string[] = []

  if (isEligible) {
    recommendation = 'APPROVE'
    reasons.push('✅ No conflicts with minimum crew requirements')
    reasons.push(
      `Available crew after approval: ${crewImpact[0]?.availableCaptains - (request.pilotRole === 'Captain' ? 1 : 0)} Captains, ${crewImpact[0]?.availableFirstOfficers - (request.pilotRole === 'First Officer' ? 1 : 0)} First Officers`
    )
  } else if (hasCriticalConflicts) {
    recommendation = 'DENY'
    reasons.push('❌ Critical crew shortage - fleet operations would be impacted')
    reasons.push(
      `${conflicts.filter((c) => c.severity === 'CRITICAL').length} critical conflict(s) detected`
    )
    reasons.push(
      `Affected dates: ${affectedDates.slice(0, 3).join(', ')}${affectedDates.length > 3 ? ` +${affectedDates.length - 3} more` : ''}`
    )
  } else {
    recommendation = 'REVIEW_REQUIRED'
    reasons.push('⚠️  Potential crew shortage - management review recommended')
    reasons.push(`${conflicts.length} warning(s) detected for minimum crew levels`)
  }

  // Add seniority-based recommendations for conflicting pending requests
  if (seniorityRecommendation) {
    reasons.push(seniorityRecommendation)
  }

  // Add seniority-based recommendations for alternative available pilots
  if (!isEligible && alternativePilots.length > 0) {
    const available = alternativePilots.filter((p) => p.currentLeaveStatus === 'AVAILABLE')
    if (available.length > 0) {
      reasons.push(
        `📋 ${available.length} alternative ${request.pilotRole}(s) available with higher seniority`
      )
    }
  }

  // Modify recommendation if there are higher priority pending requests
  if (hasHigherPriorityRequests && !hasCriticalConflicts) {
    recommendation = 'REVIEW_REQUIRED'
  }

  return {
    isEligible,
    conflicts,
    affectedDates,
    recommendation,
    reasons,
    alternativePilots,
    crewImpact,
    conflictingRequests,
    seniorityRecommendation,
  }
}

// ===================================
// SENIORITY-BASED RECOMMENDATIONS
// ===================================

/**
 * Get alternative pilot recommendations based on seniority
 * Returns pilots of the same role, sorted by seniority
 */
export async function getAlternativePilotRecommendations(
  role: 'Captain' | 'First Officer',
  startDate: string,
  endDate: string,
  excludePilotId: string
): Promise<PilotRecommendation[]> {
  const supabase = await createClient()

  // Get all pilots of the same role
  const { data: pilots, error } = await supabase
    .from('pilots')
    .select(
      `
      id,
      first_name,
      last_name,
      employee_id,
      role,
      seniority_number
    `
    )
    .eq('role', role)
    .eq('is_active', true)
    .neq('id', excludePilotId)
    .order('seniority_number', { ascending: true, nullsFirst: false })

  if (error || !pilots) {
    return []
  }

  // Get leave status for each pilot in the date range
  const { data: leaveRequests } = await supabase
    .from('pilot_requests')
    .select('pilot_id, start_date, end_date, workflow_status')
    .eq('request_category', 'LEAVE')
    .in(
      'pilot_id',
      pilots.map((p) => p.id)
    )
    .in('workflow_status', ['APPROVED', 'PENDING'])
    .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)

  // Build recommendations
  const recommendations: PilotRecommendation[] = pilots.map((pilot, index) => {
    const pilotLeave = (leaveRequests || []).filter((lr) => lr.pilot_id === pilot.id)

    let status: 'AVAILABLE' | 'ON_LEAVE' | 'PENDING_LEAVE' = 'AVAILABLE'
    if (pilotLeave.some((lr) => lr.workflow_status === 'APPROVED')) {
      status = 'ON_LEAVE'
    } else if (pilotLeave.some((lr) => lr.workflow_status === 'PENDING')) {
      status = 'PENDING_LEAVE'
    }

    let reason = ''
    if (status === 'AVAILABLE') {
      reason = `Senior ${role} (Seniority #${pilot.seniority_number || 'N/A'}) - Available for duty`
    } else if (status === 'ON_LEAVE') {
      reason = `Currently on approved leave during this period`
    } else {
      reason = `Has pending leave request for this period`
    }

    return {
      pilotId: pilot.id,
      pilotName: `${pilot.first_name} ${pilot.last_name}`,
      employeeId: pilot.employee_id,
      role: pilot.role as 'Captain' | 'First Officer',
      seniorityNumber: pilot.seniority_number || 9999,
      currentLeaveStatus: status,
      priority: index + 1, // Based on seniority order
      reason,
    }
  })

  return recommendations
}

// ===================================
// BULK ELIGIBILITY CHECKING
// ===================================

/**
 * Check multiple leave requests and return priority recommendations
 * Useful for reviewing all pending requests for a roster period
 */
export async function checkBulkLeaveEligibility(rosterPeriod: string): Promise<{
  eligible: string[] // Request IDs
  requiresReview: string[]
  shouldDeny: string[]
  recommendations: Map<string, LeaveEligibilityCheck>
}> {
  const supabase = await createClient()

  // Get all pending requests for the roster period
  const { data: requests, error } = await supabase
    .from('pilot_requests')
    .select(
      `
      id,
      pilot_id,
      start_date,
      end_date,
      request_type,
      pilots!inner (role)
    `
    )
    .eq('request_category', 'LEAVE')
    .eq('roster_period', rosterPeriod)
    .eq('workflow_status', 'PENDING')
    .order('start_date', { ascending: true })

  if (error || !requests) {
    return {
      eligible: [],
      requiresReview: [],
      shouldDeny: [],
      recommendations: new Map(),
    }
  }

  const recommendations = new Map<string, LeaveEligibilityCheck>()
  const eligible: string[] = []
  const requiresReview: string[] = []
  const shouldDeny: string[] = []

  // Check each request
  for (const req of requests) {
    // Skip requests without valid pilot_id or request_type
    if (!req.pilot_id || !req.request_type) continue

    // Skip requests with missing date information
    if (!req.start_date || !req.end_date) continue

    const check = await checkLeaveEligibility({
      requestId: req.id,
      pilotId: req.pilot_id,
      pilotRole: (req.pilots as any).role,
      startDate: req.start_date,
      endDate: req.end_date,
      requestType: req.request_type,
    })

    recommendations.set(req.id, check)

    if (check.recommendation === 'APPROVE') {
      eligible.push(req.id)
    } else if (check.recommendation === 'REVIEW_REQUIRED') {
      requiresReview.push(req.id)
    } else {
      shouldDeny.push(req.id)
    }
  }

  return {
    eligible,
    requiresReview,
    shouldDeny,
    recommendations,
  }
}
