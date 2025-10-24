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

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/supabase'
import { calculateRenewalWindow, validateRenewalDate } from '@/lib/utils/grace-period-utils'
import { getRosterPeriodFromDate, getRosterPeriodsInRange } from '@/lib/utils/roster-utils'
import { addDays, parseISO } from 'date-fns'

// Type aliases for clarity
type RenewalPlan = Database['public']['Tables']['certification_renewal_plans']['Row']
type RenewalPlanInsert = Database['public']['Tables']['certification_renewal_plans']['Insert']
type RosterCapacity = Database['public']['Tables']['roster_period_capacity']['Row']

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
  const supabase = await createClient()
  const { monthsAhead = 12, categories, pilotIds } = options || {}

  // Step 1: Fetch all certifications expiring in the next N months
  const endDate = addDays(new Date(), monthsAhead * 30)

  // Step 1a: If categories specified, first get the check_type_ids for those categories
  let checkTypeIds: string[] | undefined
  if (categories && categories.length > 0) {
    const { data: checkTypes } = await supabase
      .from('check_types')
      .select('id')
      .in('category', categories)

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
    const eligiblePeriods = getRosterPeriodsInRange(windowStart, windowEnd)

    // BUSINESS RULE: Exclude December and January from renewal scheduling
    // Reason: Holiday months with reduced operational capacity and higher pilot absence rates
    // This ensures critical certification renewals are not scheduled during holiday periods
    const filteredPeriods = eligiblePeriods.filter((period) => {
      const month = period.startDate.getMonth()
      // month 0 = January, month 11 = December
      return month !== 0 && month !== 11
    })

    if (filteredPeriods.length === 0) {
      console.warn(
        `No eligible roster periods for certification ${cert.id}, category ${category} ` +
          `after excluding December/January. Original window: ${windowStart.toISOString()} - ${windowEnd.toISOString()}`
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

  // Step 4: Bulk insert renewal plans
  const { data: created, error: insertError } = await supabase
    .from('certification_renewal_plans')
    .insert(renewalPlans).select(`
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
  const supabase = await createClient()

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
  const supabase = await createClient()

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
  const supabase = await createClient()

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
  const maxPilots = capacity.max_pilots_per_category as Record<string, number>

  renewals.forEach((renewal) => {
    const category = renewal.check_type?.category || 'Unknown'
    if (!categoryBreakdown[category]) {
      categoryBreakdown[category] = {
        plannedCount: 0,
        capacity: maxPilots[category] || 0,
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
  const totalCapacity = Object.values(maxPilots).reduce((sum, cap) => sum + cap, 0)

  return {
    rosterPeriod: capacity.roster_period,
    periodStartDate: parseISO(capacity.period_start_date),
    periodEndDate: parseISO(capacity.period_end_date),
    categoryBreakdown,
    totalPlannedRenewals: totalPlanned,
    totalCapacity,
    utilizationPercentage: (totalPlanned / totalCapacity) * 100,
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
  const supabase = await createClient()

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
  const supabase = await createClient()

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
  const supabase = await createClient()

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

  const maxPilots = capacity.max_pilots_per_category as Record<string, number>
  return maxPilots[category] || 8
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
