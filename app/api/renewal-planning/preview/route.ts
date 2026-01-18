/**
 * API Route: Preview Renewal Plan Generation
 * Author: Maurice Rondeau
 * Date: December 19, 2025
 *
 * POST /api/renewal-planning/preview
 *
 * Generates a dry-run preview of renewal plan generation
 * without saving anything to the database.
 *
 * Used by the generation preview component to show
 * real-time statistics as configuration changes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logError, ErrorSeverity } from '@/lib/error-logger'
import {
  getCategoryCapacity,
  getTotalCapacity,
  CATEGORY_CAPACITY_DEFAULTS,
} from '@/lib/utils/category-capacity-utils'
import { getRosterPeriodFromDate } from '@/lib/utils/roster-utils'

// Focus on checks with grace periods suitable for advance planning
const VALID_CATEGORIES = ['Flight Checks', 'Simulator Checks', 'Ground Courses Refresher']

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Parse request body
    const body = await request.json()
    const monthsAhead = Math.min(Math.max(body.monthsAhead || 12, 1), 24)
    const requestedCategories: string[] = body.categories || VALID_CATEGORIES

    // Calculate date range
    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + monthsAhead)

    // Build category filter for database - categories match exactly with database values
    const dbCategories = requestedCategories

    // Fetch expiring certifications (dry run - just count them)
    // Match the main service query structure - pilots table doesn't have status column
    const { data: expiringChecks, error: checksError } = await supabase
      .from('pilot_checks')
      .select(
        `
        id,
        pilot_id,
        check_type_id,
        expiry_date,
        pilots!inner (id, first_name, last_name, role),
        check_types!inner (id, check_code, category)
      `
      )
      .gte('expiry_date', startDate.toISOString().split('T')[0])
      .lte('expiry_date', endDate.toISOString().split('T')[0])
      .in('check_types.category', dbCategories)

    if (checksError) {
      throw checksError
    }

    const checks = expiringChecks || []

    // Get roster period capacities for the relevant periods
    const year = startDate.getFullYear()
    const { data: capacityData } = await supabase
      .from('roster_period_capacity')
      .select('*')
      .gte('period_start_date', `${year}-02-01`)
      .lte('period_start_date', `${year + 1}-11-30`)
      .order('period_start_date')

    // Create capacity map
    const capacityMap = new Map((capacityData || []).map((c) => [c.roster_period, c]))

    // Simulate distribution
    const distribution: Record<
      string,
      {
        rosterPeriod: string
        periodStart: string
        periodEnd: string
        plannedCount: number
        totalCapacity: number
        utilization: number
        byCategory: Record<string, number>
      }
    > = {}

    // Initialize distribution from capacity data
    for (const cap of capacityData || []) {
      distribution[cap.roster_period] = {
        rosterPeriod: cap.roster_period,
        periodStart: cap.period_start_date,
        periodEnd: cap.period_end_date,
        plannedCount: 0,
        totalCapacity: getTotalCapacity(cap),
        utilization: 0,
        byCategory: {},
      }
    }

    // Count by category
    const categoryBreakdown: Record<string, number> = {}

    // Simulate assignment
    for (const check of checks) {
      const category = (check.check_types as any)?.category || 'Unknown'

      // Skip checks with null expiry date
      if (!check.expiry_date) {
        continue
      }

      const expiryDate = new Date(check.expiry_date)

      // Find best roster period (simplified - just use expiry month)
      const rosterPeriodObj = getRosterPeriodFromDate(expiryDate)
      const rosterPeriod = rosterPeriodObj.code

      // Skip December/January periods
      const periodMonth = expiryDate.getMonth() + 1
      if (periodMonth === 12 || periodMonth === 1) {
        continue
      }

      if (distribution[rosterPeriod]) {
        distribution[rosterPeriod].plannedCount += 1
        distribution[rosterPeriod].byCategory[category] =
          (distribution[rosterPeriod].byCategory[category] || 0) + 1
      }

      // Track category breakdown
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1
    }

    // Calculate utilization and detect warnings
    const warnings: Array<{
      rosterPeriod: string
      message: string
      severity: 'warning' | 'critical'
    }> = []

    let totalPlanned = 0
    let totalUtilization = 0
    const periodsWithPlans: (typeof distribution)[string][] = []

    for (const period of Object.values(distribution)) {
      if (period.totalCapacity > 0) {
        period.utilization = Math.round((period.plannedCount / period.totalCapacity) * 100)
      }

      if (period.plannedCount > 0) {
        totalPlanned += period.plannedCount
        totalUtilization += period.utilization
        periodsWithPlans.push(period)
      }

      // Check for capacity issues
      if (period.utilization > 100) {
        warnings.push({
          rosterPeriod: period.rosterPeriod,
          message: `Over capacity by ${period.plannedCount - period.totalCapacity} renewals`,
          severity: 'critical',
        })
      } else if (period.utilization > 80) {
        warnings.push({
          rosterPeriod: period.rosterPeriod,
          message: `High utilization at ${period.utilization}%`,
          severity: 'warning',
        })
      }
    }

    // Calculate average utilization
    const avgUtilization =
      periodsWithPlans.length > 0 ? totalUtilization / periodsWithPlans.length : 0

    return NextResponse.json({
      success: true,
      data: {
        totalPlans: totalPlanned,
        periodsAffected: periodsWithPlans.length,
        avgUtilization: Math.round(avgUtilization),
        distribution: periodsWithPlans.sort((a, b) => a.rosterPeriod.localeCompare(b.rosterPeriod)),
        warnings,
        categoryBreakdown,
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
