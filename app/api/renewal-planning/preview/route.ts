/**
 * API Route: Preview Renewal Plan Generation
 * POST /api/renewal-planning/preview
 *
 * Generates a dry-run preview of renewal plan generation
 * without saving anything to the database.
 *
 * Enhanced to include:
 * - Captain/FO pairing simulation with roster assignments
 * - Category-specific capacity utilization
 * - Unpaired pilots with reasons
 * - All 13 roster periods (no Dec/Jan exclusion)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { logError, ErrorSeverity } from '@/lib/error-logger'
import {
  getCategoryCapacity,
  getTotalCapacity,
  CATEGORY_CAPACITY_DEFAULTS,
  calculateUtilization,
} from '@/lib/utils/category-capacity-utils'
import { getRosterPeriodFromDate, formatRosterPeriodFromObject } from '@/lib/utils/roster-utils'
import { calculateRenewalWindow } from '@/lib/utils/grace-period-utils'
import {
  PAIRING_REQUIRED_CATEGORIES,
  INDIVIDUAL_CATEGORIES,
  requiresPairing,
  type PilotForPairing,
  type UnpairedReason,
} from '@/lib/types/pairing'

// Focus on checks with grace periods suitable for advance planning
// Medical excluded - 28-day window too short for advance scheduling
import { PLANNABLE_CATEGORIES } from '@/lib/utils/grace-period-utils'
const VALID_CATEGORIES = [...PLANNABLE_CATEGORIES]

// ============================================================
// Type Definitions for Enhanced Preview Response
// ============================================================

interface PairingPreviewItem {
  captain: {
    pilotId: string
    name: string
    employeeId: string
    expiryDate: string
    windowStart: string
    windowEnd: string
  }
  firstOfficer: {
    pilotId: string
    name: string
    employeeId: string
    expiryDate: string
    windowStart: string
    windowEnd: string
  }
  category: string
  overlapDays: number
}

interface UnpairedPreviewItem {
  pilotId: string
  name: string
  employeeId: string
  role: 'Captain' | 'First Officer'
  expiryDate: string
  category: string
  reason: UnpairedReason
  urgency: 'critical' | 'high' | 'normal'
}

interface IndividualPreviewItem {
  pilotId: string
  name: string
  employeeId: string
  role: string
  expiryDate: string
  category: string
  checkCode: string
}

interface CategoryUtilization {
  flight: { current: number; capacity: number; percent: number }
  simulator: { current: number; capacity: number; percent: number }
  ground: { current: number; capacity: number; percent: number }
}

interface RosterPeriodPreview {
  code: string
  startDate: string
  endDate: string
  pairs: PairingPreviewItem[]
  unpaired: UnpairedPreviewItem[]
  individual: IndividualPreviewItem[]
  utilization: CategoryUtilization
  totalPlanned: number
  totalCapacity: number
  overallUtilization: number
}

interface ExpiringCheck {
  id: string
  pilot_id: string
  check_type_id: string
  expiry_date: string
  pilots: {
    id: string
    first_name: string
    last_name: string
    role: string
    employee_id?: string
    seniority_number?: number
  }
  check_types: {
    id: string
    check_code: string
    category: string
  }
}

// ============================================================
// API Route Handler
// ============================================================

export async function POST(request: NextRequest) {
  try {
    // Use service role client to bypass RLS for renewal planning queries
    // This is a read-only operation on non-sensitive planning data
    const supabase = createServiceRoleClient()

    // Parse request body
    const body = await request.json()
    const monthsAhead = Math.min(Math.max(body.monthsAhead || 12, 1), 24)
    const requestedCategories: string[] = body.categories || VALID_CATEGORIES
    const requestedCheckCodes: string[] | undefined = body.checkCodes // Optional filter by specific check codes

    // Calculate date range
    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + monthsAhead)

    // Build category filter for database
    const dbCategories = requestedCategories.filter((c) => VALID_CATEGORIES.includes(c as any))

    // Fetch expiring certifications with pilot info
    let checksQuery = supabase
      .from('pilot_checks')
      .select(
        `
        id,
        pilot_id,
        check_type_id,
        expiry_date,
        pilots!inner (id, first_name, last_name, role, employee_id, seniority_number),
        check_types!inner (id, check_code, category)
      `
      )
      .gte('expiry_date', startDate.toISOString().split('T')[0])
      .lte('expiry_date', endDate.toISOString().split('T')[0])
      .in('check_types.category', dbCategories)

    // Apply check code filter if provided
    if (requestedCheckCodes && requestedCheckCodes.length > 0) {
      checksQuery = checksQuery.in('check_types.check_code', requestedCheckCodes)
    }

    const { data: expiringChecks, error: checksError } = await checksQuery

    if (checksError) {
      throw checksError
    }

    const checks = (expiringChecks || []) as ExpiringCheck[]

    // Get roster period capacities for all 13 periods in the relevant time range
    const year = startDate.getFullYear()
    const { data: capacityData } = await supabase
      .from('roster_period_capacity')
      .select('*')
      .gte('period_start_date', `${year}-01-01`)
      .lte('period_start_date', `${year + 1}-12-31`)
      .order('period_start_date')

    // Create capacity map
    const capacityMap = new Map((capacityData || []).map((c) => [c.roster_period, c]))

    // Initialize roster period previews
    const rosterPeriodPreviews: Map<string, RosterPeriodPreview> = new Map()

    for (const cap of capacityData || []) {
      rosterPeriodPreviews.set(cap.roster_period, {
        code: cap.roster_period,
        startDate: cap.period_start_date,
        endDate: cap.period_end_date,
        pairs: [],
        unpaired: [],
        individual: [],
        utilization: {
          flight: {
            current: 0,
            capacity: getCategoryCapacity(cap, 'Flight Checks'),
            percent: 0,
          },
          simulator: {
            current: 0,
            capacity: getCategoryCapacity(cap, 'Simulator Checks'),
            percent: 0,
          },
          ground: {
            current: 0,
            capacity: getCategoryCapacity(cap, 'Ground Courses Refresher'),
            percent: 0,
          },
        },
        totalPlanned: 0,
        totalCapacity: getTotalCapacity(cap),
        overallUtilization: 0,
      })
    }

    // Separate checks by category type
    const pairingChecks: ExpiringCheck[] = []
    const individualChecks: ExpiringCheck[] = []

    for (const check of checks) {
      const category = check.check_types?.category
      if (!category || !check.expiry_date) continue

      if (requiresPairing(category)) {
        pairingChecks.push(check)
      } else if (INDIVIDUAL_CATEGORIES.includes(category as any)) {
        individualChecks.push(check)
      }
    }

    // ============================================================
    // Simulate Pairing Algorithm (Dry Run)
    // ============================================================

    // Group pairing checks by category
    const checksByCategory = new Map<string, ExpiringCheck[]>()
    for (const cat of PAIRING_REQUIRED_CATEGORIES) {
      checksByCategory.set(cat, [])
    }
    for (const check of pairingChecks) {
      const category = check.check_types?.category
      if (category && checksByCategory.has(category)) {
        checksByCategory.get(category)!.push(check)
      }
    }

    // Process each pairing category
    for (const [category, categoryChecks] of checksByCategory) {
      // Separate captains and first officers
      const captainChecks = categoryChecks.filter((c) => c.pilots?.role === 'Captain')
      const foChecks = categoryChecks.filter((c) => c.pilots?.role === 'First Officer')

      // Track matched pilots
      const matchedCaptains = new Set<string>()
      const matchedFOs = new Set<string>()

      // Calculate renewal windows for all pilots
      const captainWindows = captainChecks.map((c) => {
        const expiry = new Date(c.expiry_date)
        const window = calculateRenewalWindow(expiry, category)
        return { check: c, window }
      })

      const foWindows = foChecks.map((c) => {
        const expiry = new Date(c.expiry_date)
        const window = calculateRenewalWindow(expiry, category)
        return { check: c, window }
      })

      // Find pairs based on overlapping renewal windows
      for (const cpt of captainWindows) {
        if (matchedCaptains.has(cpt.check.pilot_id)) continue

        // Find best matching FO (most overlap days)
        let bestMatch: (typeof foWindows)[0] | null = null
        let bestOverlap = 0

        for (const fo of foWindows) {
          if (matchedFOs.has(fo.check.pilot_id)) continue

          // Calculate overlap
          const overlapStart = new Date(
            Math.max(cpt.window.start.getTime(), fo.window.start.getTime())
          )
          const overlapEnd = new Date(Math.min(cpt.window.end.getTime(), fo.window.end.getTime()))
          const overlapMs = overlapEnd.getTime() - overlapStart.getTime()
          const overlapDays = Math.floor(overlapMs / (1000 * 60 * 60 * 24))

          if (overlapDays >= 7 && overlapDays > bestOverlap) {
            bestMatch = fo
            bestOverlap = overlapDays
          }
        }

        if (bestMatch) {
          // Found a pair!
          matchedCaptains.add(cpt.check.pilot_id)
          matchedFOs.add(bestMatch.check.pilot_id)

          // Determine best roster period (midpoint of overlap)
          const overlapStart = new Date(
            Math.max(cpt.window.start.getTime(), bestMatch.window.start.getTime())
          )
          const overlapEnd = new Date(
            Math.min(cpt.window.end.getTime(), bestMatch.window.end.getTime())
          )
          const midpoint = new Date((overlapStart.getTime() + overlapEnd.getTime()) / 2)
          const rosterPeriod = getRosterPeriodFromDate(midpoint)

          // Add to appropriate roster period
          const periodPreview = rosterPeriodPreviews.get(rosterPeriod.code)
          if (periodPreview) {
            const pair: PairingPreviewItem = {
              captain: {
                pilotId: cpt.check.pilot_id,
                name: `${cpt.check.pilots.first_name} ${cpt.check.pilots.last_name}`,
                employeeId: cpt.check.pilots.employee_id || '',
                expiryDate: cpt.check.expiry_date,
                windowStart: cpt.window.start.toISOString().split('T')[0],
                windowEnd: cpt.window.end.toISOString().split('T')[0],
              },
              firstOfficer: {
                pilotId: bestMatch.check.pilot_id,
                name: `${bestMatch.check.pilots.first_name} ${bestMatch.check.pilots.last_name}`,
                employeeId: bestMatch.check.pilots.employee_id || '',
                expiryDate: bestMatch.check.expiry_date,
                windowStart: bestMatch.window.start.toISOString().split('T')[0],
                windowEnd: bestMatch.window.end.toISOString().split('T')[0],
              },
              category,
              overlapDays: bestOverlap,
            }

            periodPreview.pairs.push(pair)
            periodPreview.totalPlanned += 2 // Both pilots count

            // Update category utilization
            if (category === 'Flight Checks') {
              periodPreview.utilization.flight.current += 1 // One session for pair
            } else if (category === 'Simulator Checks') {
              periodPreview.utilization.simulator.current += 1
            }
          }
        }
      }

      // Handle unmatched captains
      for (const cpt of captainWindows) {
        if (matchedCaptains.has(cpt.check.pilot_id)) continue

        const expiry = new Date(cpt.check.expiry_date)
        const daysUntilExpiry = Math.floor((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        const urgency: 'critical' | 'high' | 'normal' =
          daysUntilExpiry <= 14 ? 'critical' : daysUntilExpiry <= 30 ? 'high' : 'normal'

        const rosterPeriod = getRosterPeriodFromDate(cpt.window.start)
        const periodPreview = rosterPeriodPreviews.get(rosterPeriod.code)
        if (periodPreview) {
          const unpaired: UnpairedPreviewItem = {
            pilotId: cpt.check.pilot_id,
            name: `${cpt.check.pilots.first_name} ${cpt.check.pilots.last_name}`,
            employeeId: cpt.check.pilots.employee_id || '',
            role: 'Captain',
            expiryDate: cpt.check.expiry_date,
            category,
            reason: 'no_matching_role',
            urgency,
          }
          periodPreview.unpaired.push(unpaired)
          periodPreview.totalPlanned += 1

          if (category === 'Flight Checks') {
            periodPreview.utilization.flight.current += 1
          } else if (category === 'Simulator Checks') {
            periodPreview.utilization.simulator.current += 1
          }
        }
      }

      // Handle unmatched FOs
      for (const fo of foWindows) {
        if (matchedFOs.has(fo.check.pilot_id)) continue

        const expiry = new Date(fo.check.expiry_date)
        const daysUntilExpiry = Math.floor((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        const urgency: 'critical' | 'high' | 'normal' =
          daysUntilExpiry <= 14 ? 'critical' : daysUntilExpiry <= 30 ? 'high' : 'normal'

        const rosterPeriod = getRosterPeriodFromDate(fo.window.start)
        const periodPreview = rosterPeriodPreviews.get(rosterPeriod.code)
        if (periodPreview) {
          const unpaired: UnpairedPreviewItem = {
            pilotId: fo.check.pilot_id,
            name: `${fo.check.pilots.first_name} ${fo.check.pilots.last_name}`,
            employeeId: fo.check.pilots.employee_id || '',
            role: 'First Officer',
            expiryDate: fo.check.expiry_date,
            category,
            reason: 'no_matching_role',
            urgency,
          }
          periodPreview.unpaired.push(unpaired)
          periodPreview.totalPlanned += 1

          if (category === 'Flight Checks') {
            periodPreview.utilization.flight.current += 1
          } else if (category === 'Simulator Checks') {
            periodPreview.utilization.simulator.current += 1
          }
        }
      }
    }

    // ============================================================
    // Process Individual Checks (Ground Courses)
    // ============================================================

    for (const check of individualChecks) {
      const category = check.check_types?.category
      if (!category || !check.expiry_date) continue

      const expiryDate = new Date(check.expiry_date)
      const rosterPeriod = getRosterPeriodFromDate(expiryDate)

      const periodPreview = rosterPeriodPreviews.get(rosterPeriod.code)
      if (periodPreview) {
        const individual: IndividualPreviewItem = {
          pilotId: check.pilot_id,
          name: `${check.pilots.first_name} ${check.pilots.last_name}`,
          employeeId: check.pilots.employee_id || '',
          role: check.pilots.role,
          expiryDate: check.expiry_date,
          category,
          checkCode: check.check_types.check_code,
        }

        periodPreview.individual.push(individual)
        periodPreview.totalPlanned += 1
        periodPreview.utilization.ground.current += 1
      }
    }

    // ============================================================
    // Calculate Final Utilization Percentages
    // ============================================================

    for (const [, preview] of rosterPeriodPreviews) {
      // Calculate category-specific utilization
      preview.utilization.flight.percent = calculateUtilization(
        preview.utilization.flight.current,
        preview.utilization.flight.capacity
      )
      preview.utilization.simulator.percent = calculateUtilization(
        preview.utilization.simulator.current,
        preview.utilization.simulator.capacity
      )
      preview.utilization.ground.percent = calculateUtilization(
        preview.utilization.ground.current,
        preview.utilization.ground.capacity
      )

      // Calculate overall utilization
      if (preview.totalCapacity > 0) {
        preview.overallUtilization = calculateUtilization(
          preview.totalPlanned,
          preview.totalCapacity
        )
      }
    }

    // ============================================================
    // Build Summary Statistics
    // ============================================================

    const warnings: Array<{
      rosterPeriod: string
      message: string
      severity: 'warning' | 'critical'
    }> = []

    let totalPlanned = 0
    let totalPairs = 0
    let totalUnpaired = 0
    let totalIndividual = 0
    const periodsWithPlans: RosterPeriodPreview[] = []
    const categoryBreakdown: Record<string, number> = {}

    for (const [, preview] of rosterPeriodPreviews) {
      if (preview.totalPlanned > 0) {
        totalPlanned += preview.totalPlanned
        totalPairs += preview.pairs.length
        totalUnpaired += preview.unpaired.length
        totalIndividual += preview.individual.length
        periodsWithPlans.push(preview)

        // Track category breakdown
        for (const pair of preview.pairs) {
          categoryBreakdown[pair.category] = (categoryBreakdown[pair.category] || 0) + 2
        }
        for (const unpaired of preview.unpaired) {
          categoryBreakdown[unpaired.category] = (categoryBreakdown[unpaired.category] || 0) + 1
        }
        for (const ind of preview.individual) {
          categoryBreakdown[ind.category] = (categoryBreakdown[ind.category] || 0) + 1
        }

        // Check for capacity issues
        if (preview.overallUtilization > 100) {
          warnings.push({
            rosterPeriod: preview.code,
            message: `Over capacity by ${preview.totalPlanned - preview.totalCapacity} renewals`,
            severity: 'critical',
          })
        } else if (preview.overallUtilization > 80) {
          warnings.push({
            rosterPeriod: preview.code,
            message: `High utilization at ${preview.overallUtilization}%`,
            severity: 'warning',
          })
        }

        // Check for category-specific over-capacity
        if (preview.utilization.flight.percent > 100) {
          warnings.push({
            rosterPeriod: preview.code,
            message: `Flight Checks over capacity (${preview.utilization.flight.current}/${preview.utilization.flight.capacity})`,
            severity: 'critical',
          })
        }
        if (preview.utilization.simulator.percent > 100) {
          warnings.push({
            rosterPeriod: preview.code,
            message: `Simulator Checks over capacity (${preview.utilization.simulator.current}/${preview.utilization.simulator.capacity})`,
            severity: 'critical',
          })
        }
        if (preview.utilization.ground.percent > 100) {
          warnings.push({
            rosterPeriod: preview.code,
            message: `Ground Courses over capacity (${preview.utilization.ground.current}/${preview.utilization.ground.capacity})`,
            severity: 'critical',
          })
        }
      }
    }

    // Calculate average utilization
    const avgUtilization =
      periodsWithPlans.length > 0
        ? Math.round(
            periodsWithPlans.reduce((sum, p) => sum + p.overallUtilization, 0) /
              periodsWithPlans.length
          )
        : 0

    // Pairing statistics
    const pairingStats = {
      totalPairs,
      totalUnpaired,
      pairingRate:
        totalPairs + totalUnpaired > 0
          ? Math.round(((totalPairs * 2) / (totalPairs * 2 + totalUnpaired)) * 100)
          : 0,
      urgentUnpaired: periodsWithPlans.reduce(
        (sum, p) => sum + p.unpaired.filter((u) => u.urgency === 'critical').length,
        0
      ),
    }

    return NextResponse.json({
      success: true,
      data: {
        // Summary stats
        totalPlans: totalPlanned,
        periodsAffected: periodsWithPlans.length,
        avgUtilization,
        categoryBreakdown,

        // Pairing stats
        pairingStats,

        // Enhanced: Full roster period distribution with pairing info
        distribution: periodsWithPlans
          .sort((a, b) => a.code.localeCompare(b.code))
          .map((p) => ({
            rosterPeriod: p.code,
            periodStart: p.startDate,
            periodEnd: p.endDate,
            plannedCount: p.totalPlanned,
            totalCapacity: p.totalCapacity,
            utilization: p.overallUtilization,
            byCategory: {
              'Flight Checks': p.utilization.flight.current,
              'Simulator Checks': p.utilization.simulator.current,
              'Ground Courses Refresher': p.utilization.ground.current,
            },
            // Enhanced pairing data
            pairs: p.pairs,
            unpaired: p.unpaired,
            individual: p.individual,
            categoryUtilization: p.utilization,
          })),

        warnings,
      },
    })
  } catch (error) {
    logError(error as Error, {
      source: 'RenewalPlanningPreviewAPI',
      severity: ErrorSeverity.MEDIUM,
      metadata: { operation: 'POST' },
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate preview',
        details: (error as Error).message,
      },
      { status: 500 }
    )
  }
}
