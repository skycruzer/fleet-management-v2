/**
 * API Route: Generate Renewal Plan
 * POST /api/renewal-planning/generate
 *
 * Generates complete renewal plan for all pilots based on certification expiry dates
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateRenewalPlan } from '@/lib/services/certification-renewal-planning-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { monthsAhead = 12, categories, pilotIds } = body

    // Generate renewal plans
    const plans = await generateRenewalPlan({
      monthsAhead,
      categories,
      pilotIds,
    })

    // Calculate summary statistics
    const byCategory: Record<string, number> = {}
    const byRosterPeriod: Record<string, number> = {}

    plans.forEach((plan) => {
      const category = plan.check_type?.category || 'Unknown'
      byCategory[category] = (byCategory[category] || 0) + 1

      const period = plan.planned_roster_period
      byRosterPeriod[period] = (byRosterPeriod[period] || 0) + 1
    })

    // Format roster period summary
    const rosterPeriodSummary = Object.entries(byRosterPeriod).map(([period, count]) => ({
      rosterPeriod: period,
      totalRenewals: count,
    }))

    return NextResponse.json({
      success: true,
      data: {
        totalPlans: plans.length,
        byCategory,
        rosterPeriodSummary,
        plans: plans.slice(0, 50), // Return first 50 for preview
      },
      message: `Successfully generated ${plans.length} renewal plans`,
    })
  } catch (error: any) {
    console.error('Error generating renewal plan:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate renewal plan',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
