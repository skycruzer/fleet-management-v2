/**
 * Certification Renewal Planning Service
 *
 * Core service for managing the certification renewal planning system.
 * Distributes pilot certification renewals evenly across 13 roster periods
 * to prevent clustering and operational bottlenecks.
 *
 * Features:
 * - Generate renewal plans for all pilots
 * - Assign optimal roster periods based on capacity
 * - Pair pilots for renewal efficiency
 * - Track capacity utilization
 * - Audit trail for all changes
 */

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { Database } from '@/types/supabase'
import { calculateRenewalWindow, validateRenewalDate } from '@/lib/utils/grace-period-utils'
import { getRosterPeriodFromDate, getRosterPeriodsInRange } from '@/lib/utils/roster-utils'
import { addDays, parseISO, differenceInDays, max, min } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'
import {
  PairingResult,
  PairedCrew,
  UnpairedPilot,
  PairingStatistics,
  PairingSuggestion,
  PairingOptions,
  requiresPairing,
  PAIRING_REQUIRED_CATEGORIES,
  PairingStatus,
  determineCaptainRole,
  determineSeatPosition,
} from '@/lib/types/pairing'

// Type aliases for clarity
type RenewalPlan = Database['public']['Tables']['certification_renewal_plans']['Row']
type BaseRenewalPlanInsert = Database['public']['Tables']['certification_renewal_plans']['Insert']
type RosterCapacity = Database['public']['Tables']['roster_period_capacity']['Row']

// Extended insert type with seat position and captain role columns
// These columns are added by migration 20260213000004 — regenerate types with `npm run db:types`
type RenewalPlanInsert = BaseRenewalPlanInsert & {
  seat_position?: string | null
  captain_role?: string | null
}

/**
 * Extended renewal plan with pilot and check type details
 */
export interface RenewalPlanWithDetails extends RenewalPlan {
  pilot: {
    id: string
    first_name: string
    last_name: string
    employee_id: string
    role: string
    seniority_number: number
  } | null
  check_type: {
    id: string
    check_code: string
    check_description: string
    category: string
  } | null
  paired_pilot: {
    id: string
    first_name: string
    last_name: string
  } | null
}

/**
 * Roster period summary with capacity details
 */
export interface RosterPeriodSummary {
  rosterPeriod: string
  periodStartDate: Date
  periodEndDate: Date
  categoryBreakdown: Record<
    string,
    {
      plannedCount: number
      capacity: number
      pilots: Array<{ id: string; name: string; checkType: string }>
    }
  >
  totalPlannedRenewals: number
  totalCapacity: number
  utilizationPercentage: number
}

/**
 * Generate complete renewal plan for all pilots
 *
 * Algorithm:
 * 1. Fetch all active certifications with future expiry dates
 * 2. Calculate renewal windows based on grace periods
 * 3. Assign each certification to optimal roster period (lowest load)
 * 4. Create renewal plan records
 *
 * @param options - Configuration options
 * @returns Array of created renewal plans
 */
export async function generateRenewalPlan(options?: {
  monthsAhead?: number
  categories?: string[]
  pilotIds?: string[]
}): Promise<RenewalPlanWithDetails[]> {
  const supabase = createServiceRoleClient()
  const { monthsAhead = 12, categories, pilotIds } = options || {}

  // Step 1: Fetch all certifications expiring in the next N months
  const endDate = addDays(new Date(), monthsAhead * 30)

  // Step 1a: If categories specified, first get the check_type_ids for those categories
  let checkTypeIds: string[] | undefined
  if (categories && categories.length > 0) {
    // Categories match exactly with database values (e.g., 'Flight Checks', 'Simulator Checks')
    const dbCategories = categories

    const { data: checkTypes } = await supabase
      .from('check_types')
      .select('id')
      .in('category', dbCategories)

    checkTypeIds = checkTypes?.map((ct) => ct.id) || []

    // If no check types found for the specified categories, return empty
    if (checkTypeIds.length === 0) {
      return []
    }
  }

  let query = supabase
    .from('pilot_checks')
    .select(
      `
      id,
      pilot_id,
      check_type_id,
      expiry_date,
      pilots (
        id,
        first_name,
        last_name,
        employee_id,
        role,
        seniority_number
      ),
      check_types (
        id,
        check_code,
        check_description,
        category
      )
    `
    )
    .gte('expiry_date', new Date().toISOString().split('T')[0])
    .lte('expiry_date', endDate.toISOString().split('T')[0])

  if (checkTypeIds && checkTypeIds.length > 0) {
    query = query.in('check_type_id', checkTypeIds)
  }

  if (pilotIds && pilotIds.length > 0) {
    query = query.in('pilot_id', pilotIds)
  }

  const { data: certifications, error } = await query

  if (error) throw error
  if (!certifications || certifications.length === 0) {
    return []
  }

  // Step 2: Get all roster periods for capacity tracking
  const { data: capacityData } = await supabase
    .from('roster_period_capacity')
    .select('*')
    .order('period_start_date')

  const capacityMap = new Map<string, RosterCapacity>()
  capacityData?.forEach((cap) => capacityMap.set(cap.roster_period, cap))

  // Step 3: Generate renewal plans
  const renewalPlans: RenewalPlanInsert[] = []
  const currentAllocations: Record<string, Record<string, number>> = {}

  for (const cert of certifications) {
    if (!cert.expiry_date || !cert.check_types || !cert.check_types.category) continue

    const expiryDate = parseISO(cert.expiry_date)
    const category = cert.check_types.category
    const { start: windowStart, end: windowEnd } = calculateRenewalWindow(expiryDate, category)

    // Get eligible roster periods within renewal window
    // All 13 roster periods are now available for scheduling (Dec/Jan exclusion removed)
    const filteredPeriods = getRosterPeriodsInRange(windowStart, windowEnd)

    if (filteredPeriods.length === 0) {
      console.warn(
        `No eligible roster periods for certification ${cert.id}, category ${category}. ` +
          `Renewal window: ${windowStart.toISOString()} - ${windowEnd.toISOString()}`
      )
      continue
    }

    // Find optimal period with capacity-aware distribution
    // Strategy: Select period with lowest utilization percentage (not just lowest count)
    const periodOptions = filteredPeriods.map((period) => {
      const load = getCurrentLoad(period.code, category, currentAllocations)
      const capacity = getCapacityForPeriod(period.code, category, capacityMap)
      const available = capacity - load
      const utilizationPercent = capacity > 0 ? (load / capacity) * 100 : 100

      return {
        period,
        load,
        capacity,
        available,
        utilizationPercent,
      }
    })

    // Sort by utilization percentage (lowest first) to achieve even distribution
    periodOptions.sort((a, b) => a.utilizationPercent - b.utilizationPercent)

    // Find first period with available capacity
    const optimalOption = periodOptions.find((opt) => opt.available > 0)

    if (!optimalOption) {
      console.error(
        `No capacity available for certification ${cert.id} (${cert.pilots?.first_name} ${cert.pilots?.last_name}), ` +
          `category ${category}, expiry ${cert.expiry_date}. All ${filteredPeriods.length} eligible periods are full.`
      )
      continue // Skip this certification - cannot be scheduled
    }

    const optimalPeriod = optimalOption.period

    // Create renewal plan
    // Ensure planned date falls within renewal window
    let plannedDate = optimalPeriod.startDate
    if (plannedDate < windowStart) {
      plannedDate = windowStart
    } else if (plannedDate > windowEnd) {
      plannedDate = windowEnd
    }

    renewalPlans.push({
      pilot_id: cert.pilot_id,
      check_type_id: cert.check_type_id,
      original_expiry_date: cert.expiry_date,
      planned_renewal_date: plannedDate.toISOString().split('T')[0],
      planned_roster_period: optimalPeriod.code,
      renewal_window_start: windowStart.toISOString().split('T')[0],
      renewal_window_end: windowEnd.toISOString().split('T')[0],
      status: 'planned',
      priority: calculatePriority(expiryDate),
    })

    // Update current allocations
    if (!currentAllocations[optimalPeriod.code]) {
      currentAllocations[optimalPeriod.code] = {}
    }
    currentAllocations[optimalPeriod.code][category] =
      (currentAllocations[optimalPeriod.code][category] || 0) + 1
  }

  // Step 4: Bulk upsert renewal plans (handles duplicates gracefully)
  const { data: created, error: insertError } = await supabase
    .from('certification_renewal_plans')
    .upsert(renewalPlans, {
      onConflict: 'pilot_id,check_type_id,original_expiry_date',
    }).select(`
      *,
      pilot:pilots!pilot_id (
        id,
        first_name,
        last_name,
        employee_id,
        role,
        seniority_number
      ),
      check_type:check_types!check_type_id (
        id,
        check_code,
        check_description,
        category
      )
    `)

  if (insertError) throw insertError

  return (created as any[]) || []
}

/**
 * Get renewal plan for a specific pilot
 */
export async function getPilotRenewalPlan(pilotId: string): Promise<RenewalPlanWithDetails[]> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('certification_renewal_plans')
    .select(
      `
      *,
      pilot:pilots!pilot_id (
        id,
        first_name,
        last_name,
        employee_id,
        role,
        seniority_number
      ),
      check_type:check_types!check_type_id (
        id,
        check_code,
        check_description,
        category
      ),
      paired_pilot:pilots!paired_pilot_id (
        id,
        first_name,
        last_name
      )
    `
    )
    .eq('pilot_id', pilotId)
    .order('planned_renewal_date')

  if (error) throw error
  return (data as any[]) || []
}

/**
 * Get all renewals for a specific roster period
 */
export async function getRenewalsByRosterPeriod(
  rosterPeriod: string
): Promise<RenewalPlanWithDetails[]> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('certification_renewal_plans')
    .select(
      `
      *,
      pilot:pilots!pilot_id (
        id,
        first_name,
        last_name,
        employee_id,
        role,
        seniority_number
      ),
      check_type:check_types!check_type_id (
        id,
        check_code,
        check_description,
        category
      ),
      paired_pilot:pilots!paired_pilot_id (
        id,
        first_name,
        last_name
      )
    `
    )
    .eq('planned_roster_period', rosterPeriod)
    .order('planned_renewal_date')

  if (error) throw error
  return (data as any[]) || []
}

/**
 * Get roster period capacity summary
 */
export async function getRosterPeriodCapacity(
  rosterPeriod: string
): Promise<RosterPeriodSummary | null> {
  const supabase = createServiceRoleClient()

  // Get capacity data
  const { data: capacity } = await supabase
    .from('roster_period_capacity')
    .select('*')
    .eq('roster_period', rosterPeriod)
    .single()

  if (!capacity) return null

  // Get all renewal plans for this period
  const renewals = await getRenewalsByRosterPeriod(rosterPeriod)

  // Group by category
  const categoryBreakdown: RosterPeriodSummary['categoryBreakdown'] = {}
  // Map category names to capacity columns - uses exact database category values
  const getCategoryCapacity = (category: string) => {
    switch (category) {
      case 'Pilot Medical':
        return capacity.medical_capacity || 4
      case 'Flight Checks':
        return capacity.flight_capacity || 4
      case 'Simulator Checks':
        return capacity.simulator_capacity || 6
      case 'Ground Courses Refresher':
        return capacity.ground_capacity || 10
      default:
        return 8 // Default capacity
    }
  }

  renewals.forEach((renewal) => {
    const category = renewal.check_type?.category || 'Unknown'
    if (!categoryBreakdown[category]) {
      categoryBreakdown[category] = {
        plannedCount: 0,
        capacity: getCategoryCapacity(category),
        pilots: [],
      }
    }

    categoryBreakdown[category].plannedCount++
    categoryBreakdown[category].pilots.push({
      id: renewal.pilot?.id || '',
      name: renewal.pilot ? `${renewal.pilot.first_name} ${renewal.pilot.last_name}` : 'Unknown',
      checkType: renewal.check_type?.check_code || '',
    })
  })

  const totalPlanned = renewals.length
  // Calculate total capacity from all category columns
  const totalCapacity =
    (capacity.medical_capacity || 4) +
    (capacity.flight_capacity || 4) +
    (capacity.simulator_capacity || 6) +
    (capacity.ground_capacity || 10)

  return {
    rosterPeriod: capacity.roster_period,
    periodStartDate: parseISO(capacity.period_start_date),
    periodEndDate: parseISO(capacity.period_end_date),
    categoryBreakdown,
    totalPlannedRenewals: totalPlanned,
    totalCapacity,
    utilizationPercentage: totalCapacity > 0 ? (totalPlanned / totalCapacity) * 100 : 0,
  }
}

/**
 * Check if roster period has capacity for additional renewal
 */
export async function checkCapacity(
  rosterPeriod: string,
  category: string
): Promise<{ hasCapacity: boolean; available: number; total: number }> {
  const summary = await getRosterPeriodCapacity(rosterPeriod)

  if (!summary) {
    return { hasCapacity: false, available: 0, total: 0 }
  }

  const breakdown = summary.categoryBreakdown[category]
  if (!breakdown) {
    return { hasCapacity: true, available: 0, total: 0 }
  }

  const available = breakdown.capacity - breakdown.plannedCount
  return {
    hasCapacity: available > 0,
    available: Math.max(0, available),
    total: breakdown.capacity,
  }
}

/**
 * Update planned renewal date
 */
export async function updatePlannedRenewalDate(
  planId: string,
  newDate: Date,
  reason: string,
  userId?: string
): Promise<RenewalPlanWithDetails> {
  const supabase = createServiceRoleClient()

  // Fetch existing plan
  const { data: existing } = await supabase
    .from('certification_renewal_plans')
    .select('*, check_type:check_types!check_type_id(category)')
    .eq('id', planId)
    .single()

  if (!existing) throw new Error('Renewal plan not found')

  // Validate new date is within renewal window
  const expiryDate = parseISO(existing.original_expiry_date!)
  const category = (existing.check_type as any)?.category || 'Unknown'
  const validation = validateRenewalDate(newDate, expiryDate, category)

  if (!validation.valid) {
    throw new Error(validation.error)
  }

  // Determine new roster period
  const newPeriod = getRosterPeriodFromDate(newDate)

  // Update plan
  const { data, error } = await supabase
    .from('certification_renewal_plans')
    .update({
      planned_renewal_date: newDate.toISOString().split('T')[0],
      planned_roster_period: newPeriod.code,
      updated_at: new Date().toISOString(),
    })
    .eq('id', planId)
    .select(
      `
      *,
      pilot:pilots!pilot_id (
        id,
        first_name,
        last_name,
        employee_id,
        role,
        seniority_number
      ),
      check_type:check_types!check_type_id (
        id,
        check_code,
        check_description,
        category
      )
    `
    )
    .single()

  if (error) throw error

  // Log change to history
  await supabase.from('renewal_plan_history').insert({
    renewal_plan_id: planId,
    change_type: 'rescheduled',
    previous_date: existing.planned_renewal_date,
    new_date: newDate.toISOString().split('T')[0],
    previous_roster_period: existing.planned_roster_period,
    new_roster_period: newPeriod.code,
    reason,
    changed_by: userId || null,
  })

  return data as any
}

/**
 * Confirm renewal plan
 */
export async function confirmRenewalPlan(
  planId: string,
  _userId?: string
): Promise<RenewalPlanWithDetails> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('certification_renewal_plans')
    .update({ status: 'confirmed', updated_at: new Date().toISOString() })
    .eq('id', planId)
    .select(
      `
      *,
      pilot:pilots!pilot_id (*),
      check_type:check_types!check_type_id (*)
    `
    )
    .single()

  if (error) throw error
  return data as any
}

/**
 * Mark renewal as completed
 */
export async function completeRenewal(
  planId: string,
  _actualDate: Date
): Promise<RenewalPlanWithDetails> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('certification_renewal_plans')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', planId)
    .select(
      `
      *,
      pilot:pilots!pilot_id (*),
      check_type:check_types!check_type_id (*)
    `
    )
    .single()

  if (error) throw error
  return data as any
}

// ============================================================================
// Helper Functions
// ============================================================================

function getCurrentLoad(
  rosterPeriod: string,
  category: string,
  allocations: Record<string, Record<string, number>>
): number {
  return allocations[rosterPeriod]?.[category] || 0
}

function getCapacityForPeriod(
  rosterPeriod: string,
  category: string,
  capacityMap: Map<string, RosterCapacity>
): number {
  const capacity = capacityMap.get(rosterPeriod)
  if (!capacity) return 8 // Default capacity

  // Map category names to capacity columns - uses exact database category values
  switch (category) {
    case 'Pilot Medical':
      return capacity.medical_capacity || 4
    case 'Flight Checks':
      return capacity.flight_capacity || 4
    case 'Simulator Checks':
      return capacity.simulator_capacity || 6
    case 'Ground Courses Refresher':
      return capacity.ground_capacity || 10
    default:
      return 8 // Default capacity
  }
}

function calculatePriority(expiryDate: Date): number {
  const today = new Date()
  const daysUntilExpiry = Math.ceil(
    (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysUntilExpiry < 0) return 10 // Expired - highest priority
  if (daysUntilExpiry <= 14) return 9 // Critical
  if (daysUntilExpiry <= 30) return 7 // High
  if (daysUntilExpiry <= 60) return 5 // Medium
  if (daysUntilExpiry <= 90) return 3 // Normal
  return 1 // Low
}

// ============================================================================
// Pairing Functions - Captain/First Officer Pairing for Flight/Simulator Checks
// ============================================================================

/**
 * Generate renewal plan with Captain/FO pairing for Flight and Simulator checks.
 * Medical and Ground checks are scheduled individually.
 *
 * Pairing Algorithm:
 * 1. Separate certifications by category (pairing vs individual)
 * 2. For pairing categories: group by role (Captain vs FO)
 * 3. Sort each group by urgency (expiry date) then seniority
 * 4. Match Captains with FOs based on overlapping renewal windows
 * 5. Assign pairs to lowest-utilization roster period
 * 6. Handle unpaired pilots based on urgency
 */
export async function generateRenewalPlanWithPairing(options?: {
  monthsAhead?: number
  categories?: string[]
  pilotIds?: string[]
  checkCodes?: string[]
  pairingOptions?: PairingOptions
}): Promise<{
  renewals: RenewalPlanWithDetails[]
  pairing: PairingResult
}> {
  const supabase = createServiceRoleClient()
  const { monthsAhead = 12, categories, pilotIds, checkCodes, pairingOptions } = options || {}
  const {
    minOverlapDays = 7,
    autoScheduleUrgent = true,
    urgentThresholdDays = 30,
    excludePeriods = [],
    captainRoles,
  } = pairingOptions || {}

  // Step 1: Fetch all certifications
  const endDate = addDays(new Date(), monthsAhead * 30)

  // Filter by checkCodes (specific check types) or categories
  // checkCodes takes priority as it's more specific
  let checkTypeIds: string[] | undefined
  if (checkCodes && checkCodes.length > 0) {
    // Filter by exact check_code values (e.g., 'B767_COMP', 'B767_IRR')
    const { data: checkTypes } = await supabase
      .from('check_types')
      .select('id')
      .in('check_code', checkCodes)

    checkTypeIds = checkTypes?.map((ct) => ct.id) || []
    if (checkTypeIds.length === 0) {
      return {
        renewals: [],
        pairing: {
          pairs: [],
          unpaired: [],
          statistics: createEmptyStatistics(),
          warnings: [],
        },
      }
    }
  } else if (categories && categories.length > 0) {
    // Fall back to category filtering if no checkCodes specified
    const { data: checkTypes } = await supabase
      .from('check_types')
      .select('id')
      .in('category', categories)

    checkTypeIds = checkTypes?.map((ct) => ct.id) || []
    if (checkTypeIds.length === 0) {
      return {
        renewals: [],
        pairing: {
          pairs: [],
          unpaired: [],
          statistics: createEmptyStatistics(),
          warnings: [],
        },
      }
    }
  }

  let query = supabase
    .from('pilot_checks')
    .select(
      `
      id,
      pilot_id,
      check_type_id,
      expiry_date,
      pilots (
        id,
        first_name,
        last_name,
        employee_id,
        role,
        seniority_number,
        captain_qualifications
      ),
      check_types (
        id,
        check_code,
        check_description,
        category
      )
    `
    )
    .gte('expiry_date', new Date().toISOString().split('T')[0])
    .lte('expiry_date', endDate.toISOString().split('T')[0])

  if (checkTypeIds && checkTypeIds.length > 0) {
    query = query.in('check_type_id', checkTypeIds)
  }

  if (pilotIds && pilotIds.length > 0) {
    query = query.in('pilot_id', pilotIds)
  }

  const { data: certifications, error } = await query

  if (error) throw error
  if (!certifications || certifications.length === 0) {
    return {
      renewals: [],
      pairing: {
        pairs: [],
        unpaired: [],
        statistics: createEmptyStatistics(),
        warnings: [],
      },
    }
  }

  // Step 2: Get roster period capacity
  const { data: capacityData } = await supabase
    .from('roster_period_capacity')
    .select('*')
    .order('period_start_date')

  const capacityMap = new Map<string, RosterCapacity>()
  capacityData?.forEach((cap) => capacityMap.set(cap.roster_period, cap))

  // Step 3: Separate certifications by pairing requirement
  const pairingCerts: typeof certifications = []
  const individualCerts: typeof certifications = []

  for (const cert of certifications) {
    if (!cert.expiry_date || !cert.check_types?.category) continue

    if (requiresPairing(cert.check_types.category)) {
      pairingCerts.push(cert)
    } else {
      individualCerts.push(cert)
    }
  }

  // Step 4: Process individual certifications (Medical, Ground)
  const renewalPlans: RenewalPlanInsert[] = []
  const currentAllocations: Record<string, Record<string, number>> = {}

  for (const cert of individualCerts) {
    const plan = createIndividualRenewalPlan(cert, capacityMap, currentAllocations, excludePeriods)
    if (plan) {
      renewalPlans.push(plan)
      updateAllocations(
        currentAllocations,
        plan.planned_roster_period,
        cert.check_types!.category || 'Unknown'
      )
    }
  }

  // Step 5: Process pairing certifications (Flight, Simulator)
  const pairingResult = await processPairingCertifications(
    pairingCerts,
    capacityMap,
    currentAllocations,
    {
      minOverlapDays,
      autoScheduleUrgent,
      urgentThresholdDays,
      excludePeriods,
      captainRoles,
    }
  )

  // Add paired renewal plans
  for (const pair of pairingResult.pairs) {
    const captainCert = pairingCerts.find((c) => c.pilot_id === pair.captain.pilotId)
    const foCert = pairingCerts.find((c) => c.pilot_id === pair.firstOfficer.pilotId)

    if (!captainCert || !foCert) continue // Skip if certs not found

    // Captain plan — includes seat position and captain role
    renewalPlans.push({
      pilot_id: pair.captain.pilotId,
      check_type_id: captainCert.check_type_id,
      original_expiry_date: pair.captain.expiryDate,
      planned_renewal_date: pair.plannedDate,
      planned_roster_period: pair.plannedRosterPeriod,
      renewal_window_start: pair.renewalWindowOverlap.start,
      renewal_window_end: pair.renewalWindowOverlap.end,
      status: 'planned',
      priority: calculatePriority(parseISO(pair.captain.expiryDate)),
      pair_group_id: pair.id,
      paired_pilot_id: pair.firstOfficer.pilotId,
      pairing_status: 'paired' as PairingStatus,
      captain_role: pair.captain.captainRole || null,
      seat_position: pair.captain.seatPosition || null,
    })

    // First Officer plan
    renewalPlans.push({
      pilot_id: pair.firstOfficer.pilotId,
      check_type_id: foCert.check_type_id,
      original_expiry_date: pair.firstOfficer.expiryDate,
      planned_renewal_date: pair.plannedDate,
      planned_roster_period: pair.plannedRosterPeriod,
      renewal_window_start: pair.renewalWindowOverlap.start,
      renewal_window_end: pair.renewalWindowOverlap.end,
      status: 'planned',
      priority: calculatePriority(parseISO(pair.firstOfficer.expiryDate)),
      pair_group_id: pair.id,
      paired_pilot_id: pair.captain.pilotId,
      pairing_status: 'paired' as PairingStatus,
      seat_position: pair.firstOfficer.seatPosition || null,
    })

    // Update allocations (pairs count as 2)
    updateAllocations(currentAllocations, pair.plannedRosterPeriod, pair.category)
    updateAllocations(currentAllocations, pair.plannedRosterPeriod, pair.category)
  }

  // Add unpaired solo plans (only those with valid planned dates)
  for (const unpaired of pairingResult.unpaired) {
    // Skip unpaired pilots without a valid planned date (they need manual review)
    if (!unpaired.plannedDate || !unpaired.plannedRosterPeriod) {
      // Debug: Unpaired pilot needs manual review (no planned date)
      continue
    }

    const cert = pairingCerts.find((c) => c.pilot_id === unpaired.pilotId)
    if (!cert) continue

    // Calculate proper renewal window for the unpaired pilot
    const expiryDate = parseISO(cert.expiry_date!)
    const category = cert.check_types?.category || 'Flight Checks'
    const { start: windowStart, end: windowEnd } = calculateRenewalWindow(expiryDate, category)

    renewalPlans.push({
      pilot_id: unpaired.pilotId,
      check_type_id: cert.check_type_id,
      original_expiry_date: unpaired.expiryDate,
      planned_renewal_date: unpaired.plannedDate,
      planned_roster_period: unpaired.plannedRosterPeriod,
      renewal_window_start: windowStart.toISOString().split('T')[0],
      renewal_window_end: windowEnd.toISOString().split('T')[0],
      status: 'planned',
      priority: calculatePriority(parseISO(unpaired.expiryDate)),
      pairing_status: 'unpaired_solo' as PairingStatus,
      captain_role: unpaired.captainRole || null,
      seat_position: unpaired.seatPosition || null,
    })

    updateAllocations(currentAllocations, unpaired.plannedRosterPeriod, unpaired.category)
  }

  // Step 6: Deduplicate renewal plans (a pilot may appear in both paired and unpaired)
  // Keep the first occurrence (paired entries are added first, so they take priority)
  const seenKeys = new Set<string>()
  const deduplicatedPlans = renewalPlans.filter((plan) => {
    const key = `${plan.pilot_id}-${plan.check_type_id}`
    if (seenKeys.has(key)) {
      // Debug: Removing duplicate - paired entry takes priority
      return false
    }
    seenKeys.add(key)
    return true
  })

  // Note: Deduplication removed (renewalPlans.length - deduplicatedPlans.length) duplicates

  // Step 7: Insert all renewal plans (skip if empty)
  if (deduplicatedPlans.length === 0) {
    return {
      renewals: [],
      pairing: pairingResult,
    }
  }

  // Strip columns that don't exist in the database yet (migration not applied)
  const cleanedPlans = deduplicatedPlans.map(
    ({ captain_role, seat_position, ...rest }) => rest
  )

  const { data: created, error: insertError } = await supabase
    .from('certification_renewal_plans')
    .upsert(cleanedPlans, {
      onConflict: 'pilot_id,check_type_id,original_expiry_date',
    })
    .select(
      `
      *,
      pilot:pilots!pilot_id (
        id,
        first_name,
        last_name,
        employee_id,
        role,
        seniority_number
      ),
      check_type:check_types!check_type_id (
        id,
        check_code,
        check_description,
        category
      ),
      paired_pilot:pilots!paired_pilot_id (
        id,
        first_name,
        last_name
      )
    `
    )

  if (insertError) throw insertError

  return {
    renewals: (created as any[]) || [],
    pairing: pairingResult,
  }
}

/**
 * Get pairing suggestions without committing to database
 * Useful for preview before generating plan
 */
export async function getPairingSuggestions(options?: {
  monthsAhead?: number
  categories?: string[]
  minOverlapDays?: number
}): Promise<PairingSuggestion[]> {
  const supabase = createServiceRoleClient()
  const { monthsAhead = 12, categories, minOverlapDays = 7 } = options || {}

  // Only process pairing-required categories
  const pairingCategories = categories?.filter((c) => requiresPairing(c)) || [
    ...PAIRING_REQUIRED_CATEGORIES,
  ]

  if (pairingCategories.length === 0) {
    return []
  }

  const endDate = addDays(new Date(), monthsAhead * 30)

  const { data: checkTypes } = await supabase
    .from('check_types')
    .select('id, category')
    .in('category', pairingCategories)

  const checkTypeIds = checkTypes?.map((ct) => ct.id) || []
  if (checkTypeIds.length === 0) return []

  const { data: certifications } = await supabase
    .from('pilot_checks')
    .select(
      `
      id, pilot_id, check_type_id, expiry_date,
      pilots (id, first_name, last_name, employee_id, role, seniority_number),
      check_types (id, category)
    `
    )
    .in('check_type_id', checkTypeIds)
    .gte('expiry_date', new Date().toISOString().split('T')[0])
    .lte('expiry_date', endDate.toISOString().split('T')[0])

  if (!certifications || certifications.length === 0) return []

  // Group by role
  const captains = certifications.filter((c) => c.pilots?.role === 'Captain')
  const firstOfficers = certifications.filter((c) => c.pilots?.role === 'First Officer')

  // Sort by urgency (earliest expiry first)
  captains.sort((a, b) => a.expiry_date!.localeCompare(b.expiry_date!))
  firstOfficers.sort((a, b) => a.expiry_date!.localeCompare(b.expiry_date!))

  const suggestions: PairingSuggestion[] = []
  const usedFOs = new Set<string>()

  for (const captain of captains) {
    const captainExpiry = parseISO(captain.expiry_date!)
    const captainCategory = captain.check_types!.category || 'Flight Checks'
    const captainWindow = calculateRenewalWindow(captainExpiry, captainCategory)

    let bestMatch: { fo: (typeof firstOfficers)[0]; overlap: number; score: number } | null = null

    for (const fo of firstOfficers) {
      if (usedFOs.has(fo.pilot_id)) continue
      if (fo.check_types!.category !== captainCategory) continue

      const foExpiry = parseISO(fo.expiry_date!)
      const foWindow = calculateRenewalWindow(foExpiry, fo.check_types!.category || 'Flight Checks')

      // Calculate overlap
      const overlapStart = max([captainWindow.start, foWindow.start])
      const overlapEnd = min([captainWindow.end, foWindow.end])
      const overlapDays = differenceInDays(overlapEnd, overlapStart)

      if (overlapDays >= minOverlapDays) {
        // Calculate pairing score (higher = better)
        const urgencyScore = 10 - Math.min(differenceInDays(captainExpiry, new Date()), 90) / 10
        const overlapScore = overlapDays / 10
        const score = urgencyScore + overlapScore

        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { fo, overlap: overlapDays, score }
        }
      }
    }

    if (bestMatch) {
      usedFOs.add(bestMatch.fo.pilot_id)

      const foExpiry = parseISO(bestMatch.fo.expiry_date!)
      const foWindow = calculateRenewalWindow(
        foExpiry,
        bestMatch.fo.check_types!.category || 'Flight Checks'
      )
      const overlapStart = max([captainWindow.start, foWindow.start])
      const overlapEnd = min([captainWindow.end, foWindow.end])

      // Get suggested period - all 13 roster periods available
      const eligiblePeriods = getRosterPeriodsInRange(overlapStart, overlapEnd)

      if (eligiblePeriods.length > 0) {
        suggestions.push({
          captain: {
            pilotId: captain.pilot_id,
            name: `${captain.pilots!.first_name} ${captain.pilots!.last_name}`,
            employeeId: captain.pilots!.employee_id,
            expiryDate: captain.expiry_date!,
            windowStart: captainWindow.start.toISOString().split('T')[0],
            windowEnd: captainWindow.end.toISOString().split('T')[0],
          },
          firstOfficer: {
            pilotId: bestMatch.fo.pilot_id,
            name: `${bestMatch.fo.pilots!.first_name} ${bestMatch.fo.pilots!.last_name}`,
            employeeId: bestMatch.fo.pilots!.employee_id,
            expiryDate: bestMatch.fo.expiry_date!,
            windowStart: foWindow.start.toISOString().split('T')[0],
            windowEnd: foWindow.end.toISOString().split('T')[0],
          },
          category: captainCategory,
          suggestedPeriod: eligiblePeriods[0].code,
          suggestedDate: eligiblePeriods[0].startDate.toISOString().split('T')[0],
          overlapDays: bestMatch.overlap,
          score: bestMatch.score,
        })
      }
    }
  }

  return suggestions.sort((a, b) => b.score - a.score)
}

/**
 * Manually pair two pilots
 */
export async function manuallyPairPilots(
  captainPlanId: string,
  foPlanId: string
): Promise<{ captain: RenewalPlanWithDetails; firstOfficer: RenewalPlanWithDetails }> {
  const supabase = createServiceRoleClient()

  // Fetch both plans
  const { data: plans, error } = await supabase
    .from('certification_renewal_plans')
    .select(
      `
      *,
      pilot:pilots!pilot_id (id, first_name, last_name, employee_id, role, seniority_number),
      check_type:check_types!check_type_id (id, check_code, check_description, category)
    `
    )
    .in('id', [captainPlanId, foPlanId])

  if (error) throw error
  if (!plans || plans.length !== 2) {
    throw new Error('Could not find both renewal plans')
  }

  const captain = plans.find((p: any) => p.pilot?.role === 'Captain')
  const fo = plans.find((p: any) => p.pilot?.role === 'First Officer')

  if (!captain || !fo) {
    throw new Error('Must pair a Captain with a First Officer')
  }

  // Validate same category
  if ((captain as any).check_type?.category !== (fo as any).check_type?.category) {
    throw new Error('Both pilots must have the same certification category')
  }

  // Create pair group ID
  const pairGroupId = uuidv4()

  // Update both plans
  const { data: updatedCaptain, error: captainError } = await supabase
    .from('certification_renewal_plans')
    .update({
      pair_group_id: pairGroupId,
      paired_pilot_id: fo.pilot_id,
      pairing_status: 'paired',
      updated_at: new Date().toISOString(),
    })
    .eq('id', captainPlanId)
    .select(
      `
      *,
      pilot:pilots!pilot_id (*),
      check_type:check_types!check_type_id (*),
      paired_pilot:pilots!paired_pilot_id (id, first_name, last_name)
    `
    )
    .single()

  if (captainError) throw captainError

  const { data: updatedFO, error: foError } = await supabase
    .from('certification_renewal_plans')
    .update({
      pair_group_id: pairGroupId,
      paired_pilot_id: captain.pilot_id,
      pairing_status: 'paired',
      updated_at: new Date().toISOString(),
    })
    .eq('id', foPlanId)
    .select(
      `
      *,
      pilot:pilots!pilot_id (*),
      check_type:check_types!check_type_id (*),
      paired_pilot:pilots!paired_pilot_id (id, first_name, last_name)
    `
    )
    .single()

  if (foError) throw foError

  return {
    captain: updatedCaptain as any,
    firstOfficer: updatedFO as any,
  }
}

/**
 * Break a pair (unpair pilots)
 */
export async function breakPair(planId: string): Promise<RenewalPlanWithDetails[]> {
  const supabase = createServiceRoleClient()

  // Get the plan to find pair group
  const { data: plan, error } = await supabase
    .from('certification_renewal_plans')
    .select('pair_group_id')
    .eq('id', planId)
    .single()

  if (error) throw error
  if (!plan?.pair_group_id) {
    throw new Error('This renewal plan is not paired')
  }

  // Update both plans in the pair
  const { data: updated, error: updateError } = await supabase
    .from('certification_renewal_plans')
    .update({
      pair_group_id: null,
      paired_pilot_id: null,
      pairing_status: 'unpaired_solo',
      updated_at: new Date().toISOString(),
    })
    .eq('pair_group_id', plan.pair_group_id)
    .select(
      `
      *,
      pilot:pilots!pilot_id (*),
      check_type:check_types!check_type_id (*)
    `
    )

  if (updateError) throw updateError
  return (updated as any[]) || []
}

/**
 * Get paired renewals for a roster period
 */
export async function getPairedRenewalsByPeriod(rosterPeriod: string): Promise<{
  pairs: PairedCrew[]
  unpaired: UnpairedPilot[]
}> {
  const supabase = createServiceRoleClient()

  const { data: renewals, error } = await supabase
    .from('certification_renewal_plans')
    .select(
      `
      *,
      pilot:pilots!pilot_id (id, first_name, last_name, employee_id, role, seniority_number),
      check_type:check_types!check_type_id (id, check_code, category),
      paired_pilot:pilots!paired_pilot_id (id, first_name, last_name, employee_id)
    `
    )
    .eq('planned_roster_period', rosterPeriod)
    .in('check_type.category', [...PAIRING_REQUIRED_CATEGORIES])

  if (error) throw error
  if (!renewals) return { pairs: [], unpaired: [] }

  // Group paired renewals
  const pairGroups = new Map<string, any[]>()
  const unpairedList: UnpairedPilot[] = []

  for (const renewal of renewals as any[]) {
    if (renewal.pair_group_id) {
      const existing = pairGroups.get(renewal.pair_group_id) || []
      existing.push(renewal)
      pairGroups.set(renewal.pair_group_id, existing)
    } else if (renewal.pairing_status === 'unpaired_solo') {
      const daysUntilExpiry = differenceInDays(parseISO(renewal.original_expiry_date), new Date())
      unpairedList.push({
        pilotId: renewal.pilot_id,
        renewalPlanId: renewal.id,
        name: `${renewal.pilot.first_name} ${renewal.pilot.last_name}`,
        employeeId: renewal.pilot.employee_id,
        role: renewal.pilot.role,
        expiryDate: renewal.original_expiry_date,
        daysUntilExpiry,
        category: renewal.check_type.category,
        plannedRosterPeriod: renewal.planned_roster_period,
        plannedDate: renewal.planned_renewal_date,
        reason: 'no_matching_role',
        status: 'unpaired_solo',
        urgency: daysUntilExpiry <= 14 ? 'critical' : daysUntilExpiry <= 30 ? 'high' : 'normal',
      })
    }
  }

  // Convert pair groups to PairedCrew objects
  const pairs: PairedCrew[] = []
  for (const [pairGroupId, members] of pairGroups) {
    if (members.length !== 2) continue

    const captain = members.find((m) => m.pilot.role === 'Captain')
    const fo = members.find((m) => m.pilot.role === 'First Officer')

    if (captain && fo) {
      pairs.push({
        id: pairGroupId,
        captain: {
          pilotId: captain.pilot_id,
          renewalPlanId: captain.id,
          name: `${captain.pilot.first_name} ${captain.pilot.last_name}`,
          employeeId: captain.pilot.employee_id,
          expiryDate: captain.original_expiry_date,
          seniorityNumber: captain.pilot.seniority_number,
        },
        firstOfficer: {
          pilotId: fo.pilot_id,
          renewalPlanId: fo.id,
          name: `${fo.pilot.first_name} ${fo.pilot.last_name}`,
          employeeId: fo.pilot.employee_id,
          expiryDate: fo.original_expiry_date,
          seniorityNumber: fo.pilot.seniority_number,
        },
        category: captain.check_type.category,
        plannedRosterPeriod: captain.planned_roster_period,
        plannedDate: captain.planned_renewal_date,
        renewalWindowOverlap: {
          start: captain.renewal_window_start,
          end: captain.renewal_window_end,
          days: differenceInDays(
            parseISO(captain.renewal_window_end),
            parseISO(captain.renewal_window_start)
          ),
        },
        status: 'paired',
      })
    }
  }

  return { pairs, unpaired: unpairedList }
}

/**
 * Get all pairing data for a year (aggregated across all roster periods)
 * This combines pairs and unpaired pilots from all periods (Feb-Nov)
 */
export async function getPairingDataForYear(year: number): Promise<{
  pairs: PairedCrew[]
  unpaired: UnpairedPilot[]
  statistics: PairingStatistics
}> {
  const supabase = createServiceRoleClient()

  // Get all 13 roster periods for the year (full year coverage)
  const { data: periods, error } = await supabase
    .from('roster_period_capacity')
    .select('roster_period')
    .gte('period_start_date', `${year}-01-01`)
    .lte('period_start_date', `${year}-12-31`)
    .order('period_start_date')

  if (error) throw error
  if (!periods || periods.length === 0) {
    return {
      pairs: [],
      unpaired: [],
      statistics: createEmptyStatistics(),
    }
  }

  // Fetch pairing data for each period in parallel
  const periodResults = await Promise.all(
    periods.map((p) => getPairedRenewalsByPeriod(p.roster_period))
  )

  // Aggregate results
  const allPairs: PairedCrew[] = []
  const allUnpaired: UnpairedPilot[] = []

  for (const result of periodResults) {
    allPairs.push(...result.pairs)
    allUnpaired.push(...result.unpaired)
  }

  // Calculate statistics
  const byCategory: PairingStatistics['byCategory'] = []
  const categories = new Set([
    ...allPairs.map((p) => p.category),
    ...allUnpaired.map((u) => u.category),
  ])

  for (const category of categories) {
    const categoryPairs = allPairs.filter((p) => p.category === category)
    const categoryUnpaired = allUnpaired.filter((u) => u.category === category)

    byCategory.push({
      category,
      pairsCount: categoryPairs.length,
      unpairedCount: categoryUnpaired.length,
      captainsUnpaired: categoryUnpaired.filter((u) => u.role === 'Captain').length,
      firstOfficersUnpaired: categoryUnpaired.filter((u) => u.role === 'First Officer').length,
    })
  }

  const totalOverlapDays = allPairs.reduce((sum, p) => sum + p.renewalWindowOverlap.days, 0)

  // Count RHS checks and captain role breakdown
  const rhsCheckCount = [
    ...allPairs.filter((p) => p.captain.seatPosition === 'right_seat'),
    ...allUnpaired.filter((u) => u.seatPosition === 'right_seat'),
  ].length

  const allCaptainRoles = [
    ...allPairs.map((p) => p.captain.captainRole),
    ...allUnpaired.filter((u) => u.role === 'Captain').map((u) => u.captainRole),
  ]

  return {
    pairs: allPairs,
    unpaired: allUnpaired,
    statistics: {
      totalPairs: allPairs.length,
      totalUnpaired: allUnpaired.length,
      byCategory,
      urgentUnpaired: allUnpaired.filter((u) => u.urgency === 'critical' || u.urgency === 'high')
        .length,
      averageOverlapDays: allPairs.length > 0 ? Math.round(totalOverlapDays / allPairs.length) : 0,
      rhsCheckCount,
      captainRoleBreakdown: {
        lineCaptains: allCaptainRoles.filter((r) => r === 'line_captain').length,
        trainingCaptains: allCaptainRoles.filter((r) => r === 'training_captain').length,
        examiners: allCaptainRoles.filter((r) => r === 'examiner').length,
        rhsCaptains: allCaptainRoles.filter((r) => r === 'rhs_captain').length,
      },
    },
  }
}

/**
 * Get all renewal plans for a given year (flat list with details)
 * Used by the Gantt timeline visualization
 */
export async function getRenewalPlansForYear(year: number): Promise<RenewalPlanWithDetails[]> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('certification_renewal_plans')
    .select(
      `
      *,
      pilot:pilots!pilot_id (
        id,
        first_name,
        last_name,
        employee_id,
        role,
        seniority_number
      ),
      check_type:check_types!check_type_id (
        id,
        check_code,
        check_description,
        category
      ),
      paired_pilot:pilots!paired_pilot_id (
        id,
        first_name,
        last_name
      )
    `
    )
    .like('planned_roster_period', `%/${year}`)
    .order('planned_renewal_date')

  if (error) throw error
  return (data as any[]) || []
}

// ============================================================================
// Pairing Helper Functions
// ============================================================================

function createIndividualRenewalPlan(
  cert: any,
  capacityMap: Map<string, RosterCapacity>,
  currentAllocations: Record<string, Record<string, number>>,
  excludePeriods: string[]
): RenewalPlanInsert | null {
  const expiryDate = parseISO(cert.expiry_date)
  const category = cert.check_types.category
  const { start: windowStart, end: windowEnd } = calculateRenewalWindow(expiryDate, category)

  // All 13 roster periods available, only filter by explicitly excluded periods
  const eligiblePeriods = getRosterPeriodsInRange(windowStart, windowEnd).filter(
    (period) => !excludePeriods.includes(period.code)
  )

  if (eligiblePeriods.length === 0) return null

  // Find optimal period
  const periodOptions = eligiblePeriods.map((period) => {
    const load = getCurrentLoad(period.code, category, currentAllocations)
    const capacity = getCapacityForPeriod(period.code, category, capacityMap)
    return { period, utilization: capacity > 0 ? load / capacity : 1 }
  })

  periodOptions.sort((a, b) => a.utilization - b.utilization)
  const optimal = periodOptions[0]

  let plannedDate = optimal.period.startDate
  if (plannedDate < windowStart) plannedDate = windowStart
  if (plannedDate > windowEnd) plannedDate = windowEnd

  return {
    pilot_id: cert.pilot_id,
    check_type_id: cert.check_type_id,
    original_expiry_date: cert.expiry_date,
    planned_renewal_date: plannedDate.toISOString().split('T')[0],
    planned_roster_period: optimal.period.code,
    renewal_window_start: windowStart.toISOString().split('T')[0],
    renewal_window_end: windowEnd.toISOString().split('T')[0],
    status: 'planned',
    priority: calculatePriority(expiryDate),
    pairing_status: 'not_applicable' as PairingStatus,
  }
}

async function processPairingCertifications(
  certifications: any[],
  capacityMap: Map<string, RosterCapacity>,
  currentAllocations: Record<string, Record<string, number>>,
  options: {
    minOverlapDays: number
    autoScheduleUrgent: boolean
    urgentThresholdDays: number
    excludePeriods: string[]
    captainRoles?: string[]
  }
): Promise<PairingResult> {
  const pairs: PairedCrew[] = []
  const unpaired: UnpairedPilot[] = []
  const warnings: string[] = []

  // Group by category
  const byCategory = new Map<string, any[]>()
  for (const cert of certifications) {
    const category = cert.check_types?.category
    if (!category) continue
    const existing = byCategory.get(category) || []
    existing.push(cert)
    byCategory.set(category, existing)
  }

  // Process each category
  for (const [category, certs] of byCategory) {
    const allCaptainCerts = certs
      .filter((c) => c.pilots?.role === 'Captain')
      .sort((a, b) => {
        // Sort by expiry date (urgent first), then seniority
        const expiryCompare = a.expiry_date.localeCompare(b.expiry_date)
        if (expiryCompare !== 0) return expiryCompare
        return (a.pilots?.seniority_number || 999) - (b.pilots?.seniority_number || 999)
      })

    // Filter captains by selected roles if captainRoles is specified
    // Captains whose role is not selected are excluded from pairing and treated as unpaired/individual
    let captains = allCaptainCerts
    const excludedCaptains: typeof allCaptainCerts = []
    if (options.captainRoles && options.captainRoles.length > 0) {
      captains = allCaptainCerts.filter((c) => {
        const role = determineCaptainRole(c.pilots?.captain_qualifications)
        return options.captainRoles!.includes(role)
      })
      const excludedFromPairing = allCaptainCerts.filter((c) => {
        const role = determineCaptainRole(c.pilots?.captain_qualifications)
        return !options.captainRoles!.includes(role)
      })
      excludedCaptains.push(...excludedFromPairing)
    }

    const firstOfficers = certs
      .filter((c) => c.pilots?.role === 'First Officer')
      .sort((a, b) => {
        const expiryCompare = a.expiry_date.localeCompare(b.expiry_date)
        if (expiryCompare !== 0) return expiryCompare
        return (a.pilots?.seniority_number || 999) - (b.pilots?.seniority_number || 999)
      })

    const usedFOs = new Set<string>()

    // Match each captain with best available FO
    for (const captain of captains) {
      const captainExpiry = parseISO(captain.expiry_date)
      const captainWindow = calculateRenewalWindow(captainExpiry, category)

      let bestFO: { fo: any; overlapDays: number } | null = null

      for (const fo of firstOfficers) {
        if (usedFOs.has(fo.pilot_id)) continue

        const foExpiry = parseISO(fo.expiry_date)
        const foWindow = calculateRenewalWindow(foExpiry, category)

        const overlapStart = max([captainWindow.start, foWindow.start])
        const overlapEnd = min([captainWindow.end, foWindow.end])
        const overlapDays = differenceInDays(overlapEnd, overlapStart)

        if (overlapDays >= options.minOverlapDays) {
          if (!bestFO || overlapDays > bestFO.overlapDays) {
            bestFO = { fo, overlapDays }
          }
        }
      }

      if (bestFO) {
        usedFOs.add(bestFO.fo.pilot_id)

        const foExpiry = parseISO(bestFO.fo.expiry_date)
        const foWindow = calculateRenewalWindow(foExpiry, category)
        const overlapStart = max([captainWindow.start, foWindow.start])
        const overlapEnd = min([captainWindow.end, foWindow.end])

        // Find optimal period for pair - all 13 roster periods available
        const eligiblePeriods = getRosterPeriodsInRange(overlapStart, overlapEnd).filter(
          (p) => !options.excludePeriods.includes(p.code)
        )

        if (eligiblePeriods.length > 0) {
          // Find period with lowest utilization (pairs need 2 slots)
          const periodOptions = eligiblePeriods.map((period) => {
            const load = getCurrentLoad(period.code, category, currentAllocations)
            const capacity = getCapacityForPeriod(period.code, category, capacityMap)
            return { period, available: capacity - load }
          })

          periodOptions.sort((a, b) => b.available - a.available)
          const optimalPeriod = periodOptions.find((p) => p.available >= 2)

          if (optimalPeriod) {
            const pairId = uuidv4()
            // Ensure planned date falls within the renewal window overlap
            let plannedDate = optimalPeriod.period.startDate
            if (plannedDate < overlapStart) plannedDate = overlapStart
            if (plannedDate > overlapEnd) plannedDate = overlapEnd

            // Determine captain role and seat positions
            const captainRole = determineCaptainRole(captain.pilots?.captain_qualifications)
            const captainSeat = determineSeatPosition('Captain', captainRole, category)
            const foSeat = determineSeatPosition('First Officer', undefined, category)

            pairs.push({
              id: pairId,
              captain: {
                pilotId: captain.pilot_id,
                renewalPlanId: '', // Will be assigned after insert
                name: `${captain.pilots.first_name} ${captain.pilots.last_name}`,
                employeeId: captain.pilots.employee_id,
                expiryDate: captain.expiry_date,
                seniorityNumber: captain.pilots.seniority_number,
                captainRole,
                seatPosition: captainSeat,
              },
              firstOfficer: {
                pilotId: bestFO.fo.pilot_id,
                renewalPlanId: '',
                name: `${bestFO.fo.pilots.first_name} ${bestFO.fo.pilots.last_name}`,
                employeeId: bestFO.fo.pilots.employee_id,
                expiryDate: bestFO.fo.expiry_date,
                seniorityNumber: bestFO.fo.pilots.seniority_number,
                seatPosition: foSeat,
              },
              category: category as any,
              plannedRosterPeriod: optimalPeriod.period.code,
              plannedDate: plannedDate.toISOString().split('T')[0],
              renewalWindowOverlap: {
                start: overlapStart.toISOString().split('T')[0],
                end: overlapEnd.toISOString().split('T')[0],
                days: bestFO.overlapDays,
              },
              status: 'paired',
            })

            // Reserve capacity
            updateAllocations(currentAllocations, optimalPeriod.period.code, category)
            updateAllocations(currentAllocations, optimalPeriod.period.code, category)
            continue
          }
        }
      }

      // Could not pair this captain - handle as unpaired
      const daysUntilExpiry = differenceInDays(captainExpiry, new Date())
      const unpairedCaptainRole = determineCaptainRole(captain.pilots?.captain_qualifications)
      const unpairedCaptainSeat = determineSeatPosition('Captain', unpairedCaptainRole, category)

      if (options.autoScheduleUrgent && daysUntilExpiry <= options.urgentThresholdDays) {
        // All 13 roster periods available for urgent solo scheduling
        const eligiblePeriods = getRosterPeriodsInRange(captainWindow.start, captainWindow.end)

        if (eligiblePeriods.length > 0) {
          // Ensure planned date falls within the renewal window
          let plannedDate = eligiblePeriods[0].startDate
          if (plannedDate < captainWindow.start) plannedDate = captainWindow.start
          if (plannedDate > captainWindow.end) plannedDate = captainWindow.end

          unpaired.push({
            pilotId: captain.pilot_id,
            renewalPlanId: '',
            name: `${captain.pilots.first_name} ${captain.pilots.last_name}`,
            employeeId: captain.pilots.employee_id,
            role: 'Captain',
            expiryDate: captain.expiry_date,
            daysUntilExpiry,
            category: category as any,
            plannedRosterPeriod: eligiblePeriods[0].code,
            plannedDate: plannedDate.toISOString().split('T')[0],
            reason: 'no_matching_role',
            status: 'unpaired_solo',
            urgency: daysUntilExpiry <= 14 ? 'critical' : daysUntilExpiry <= 30 ? 'high' : 'normal',
            captainRole: unpairedCaptainRole,
            seatPosition: unpairedCaptainSeat,
          })
          warnings.push(
            `Captain ${captain.pilots.first_name} ${captain.pilots.last_name} scheduled solo (urgent, no matching FO)`
          )
        }
      } else {
        unpaired.push({
          pilotId: captain.pilot_id,
          renewalPlanId: '',
          name: `${captain.pilots.first_name} ${captain.pilots.last_name}`,
          employeeId: captain.pilots.employee_id,
          role: 'Captain',
          expiryDate: captain.expiry_date,
          daysUntilExpiry,
          category: category as any,
          plannedRosterPeriod: '',
          plannedDate: '',
          reason: 'no_matching_role',
          status: 'unpaired_solo',
          urgency: daysUntilExpiry <= 14 ? 'critical' : daysUntilExpiry <= 30 ? 'high' : 'normal',
          captainRole: unpairedCaptainRole,
          seatPosition: unpairedCaptainSeat,
        })
        warnings.push(
          `Captain ${captain.pilots.first_name} ${captain.pilots.last_name} needs manual review (no matching FO)`
        )
      }
    }

    // Handle captains excluded by captainRoles filter (treated as unpaired/individual)
    for (const captain of excludedCaptains) {
      const captainExpiry = parseISO(captain.expiry_date)
      const daysUntilExpiry = differenceInDays(captainExpiry, new Date())
      const excludedRole = determineCaptainRole(captain.pilots?.captain_qualifications)
      const excludedSeat = determineSeatPosition('Captain', excludedRole, category)
      const captainWindow = calculateRenewalWindow(captainExpiry, category)

      const eligiblePeriods = getRosterPeriodsInRange(captainWindow.start, captainWindow.end)
      if (eligiblePeriods.length > 0) {
        let plannedDate = eligiblePeriods[0].startDate
        if (plannedDate < captainWindow.start) plannedDate = captainWindow.start
        if (plannedDate > captainWindow.end) plannedDate = captainWindow.end

        unpaired.push({
          pilotId: captain.pilot_id,
          renewalPlanId: '',
          name: `${captain.pilots.first_name} ${captain.pilots.last_name}`,
          employeeId: captain.pilots.employee_id,
          role: 'Captain',
          expiryDate: captain.expiry_date,
          daysUntilExpiry,
          category: category as any,
          plannedRosterPeriod: eligiblePeriods[0].code,
          plannedDate: plannedDate.toISOString().split('T')[0],
          reason: 'no_matching_role',
          status: 'unpaired_solo',
          urgency: daysUntilExpiry <= 14 ? 'critical' : daysUntilExpiry <= 30 ? 'high' : 'normal',
          captainRole: excludedRole,
          seatPosition: excludedSeat,
        })
      }
    }

    // Handle remaining unmatched FOs
    for (const fo of firstOfficers) {
      if (usedFOs.has(fo.pilot_id)) continue

      const foExpiry = parseISO(fo.expiry_date)
      const daysUntilExpiry = differenceInDays(foExpiry, new Date())
      const foWindow = calculateRenewalWindow(foExpiry, category)

      if (options.autoScheduleUrgent && daysUntilExpiry <= options.urgentThresholdDays) {
        // All 13 roster periods available for urgent solo scheduling
        const eligiblePeriods = getRosterPeriodsInRange(foWindow.start, foWindow.end)

        if (eligiblePeriods.length > 0) {
          // Ensure planned date falls within the renewal window
          let plannedDate = eligiblePeriods[0].startDate
          if (plannedDate < foWindow.start) plannedDate = foWindow.start
          if (plannedDate > foWindow.end) plannedDate = foWindow.end

          unpaired.push({
            pilotId: fo.pilot_id,
            renewalPlanId: '',
            name: `${fo.pilots.first_name} ${fo.pilots.last_name}`,
            employeeId: fo.pilots.employee_id,
            role: 'First Officer',
            expiryDate: fo.expiry_date,
            daysUntilExpiry,
            category: category as any,
            plannedRosterPeriod: eligiblePeriods[0].code,
            plannedDate: plannedDate.toISOString().split('T')[0],
            reason: 'no_matching_role',
            status: 'unpaired_solo',
            urgency: daysUntilExpiry <= 14 ? 'critical' : daysUntilExpiry <= 30 ? 'high' : 'normal',
          })
          warnings.push(
            `FO ${fo.pilots.first_name} ${fo.pilots.last_name} scheduled solo (urgent, no matching Captain)`
          )
        }
      } else {
        unpaired.push({
          pilotId: fo.pilot_id,
          renewalPlanId: '',
          name: `${fo.pilots.first_name} ${fo.pilots.last_name}`,
          employeeId: fo.pilots.employee_id,
          role: 'First Officer',
          expiryDate: fo.expiry_date,
          daysUntilExpiry,
          category: category as any,
          plannedRosterPeriod: '',
          plannedDate: '',
          reason: 'no_matching_role',
          status: 'unpaired_solo',
          urgency: daysUntilExpiry <= 14 ? 'critical' : daysUntilExpiry <= 30 ? 'high' : 'normal',
        })
        warnings.push(
          `FO ${fo.pilots.first_name} ${fo.pilots.last_name} needs manual review (no matching Captain)`
        )
      }
    }
  }

  return {
    pairs,
    unpaired,
    statistics: calculatePairingStatistics(pairs, unpaired),
    warnings,
  }
}

function updateAllocations(
  allocations: Record<string, Record<string, number>>,
  period: string,
  category: string
): void {
  if (!allocations[period]) {
    allocations[period] = {}
  }
  allocations[period][category] = (allocations[period][category] || 0) + 1
}

function calculatePairingStatistics(
  pairs: PairedCrew[],
  unpaired: UnpairedPilot[]
): PairingStatistics {
  const byCategory: PairingStatistics['byCategory'] = []

  const categories = new Set([...pairs.map((p) => p.category), ...unpaired.map((u) => u.category)])

  for (const category of categories) {
    const categoryPairs = pairs.filter((p) => p.category === category)
    const categoryUnpaired = unpaired.filter((u) => u.category === category)

    byCategory.push({
      category,
      pairsCount: categoryPairs.length,
      unpairedCount: categoryUnpaired.length,
      captainsUnpaired: categoryUnpaired.filter((u) => u.role === 'Captain').length,
      firstOfficersUnpaired: categoryUnpaired.filter((u) => u.role === 'First Officer').length,
    })
  }

  const totalOverlapDays = pairs.reduce((sum, p) => sum + p.renewalWindowOverlap.days, 0)

  const allCaptainRoles = [
    ...pairs.map((p) => p.captain.captainRole),
    ...unpaired.filter((u) => u.role === 'Captain').map((u) => u.captainRole),
  ]

  return {
    totalPairs: pairs.length,
    totalUnpaired: unpaired.length,
    byCategory,
    urgentUnpaired: unpaired.filter((u) => u.urgency === 'critical' || u.urgency === 'high').length,
    averageOverlapDays: pairs.length > 0 ? totalOverlapDays / pairs.length : 0,
    rhsCheckCount: [
      ...pairs.filter((p) => p.captain.seatPosition === 'right_seat'),
      ...unpaired.filter((u) => u.seatPosition === 'right_seat'),
    ].length,
    captainRoleBreakdown: {
      lineCaptains: allCaptainRoles.filter((r) => r === 'line_captain').length,
      trainingCaptains: allCaptainRoles.filter((r) => r === 'training_captain').length,
      examiners: allCaptainRoles.filter((r) => r === 'examiner').length,
      rhsCaptains: allCaptainRoles.filter((r) => r === 'rhs_captain').length,
    },
  }
}

function createEmptyStatistics(): PairingStatistics {
  return {
    totalPairs: 0,
    totalUnpaired: 0,
    byCategory: [],
    urgentUnpaired: 0,
    averageOverlapDays: 0,
    rhsCheckCount: 0,
    captainRoleBreakdown: {
      lineCaptains: 0,
      trainingCaptains: 0,
      examiners: 0,
      rhsCaptains: 0,
    },
  }
}
