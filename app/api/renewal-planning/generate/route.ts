/**
 * API Route: Generate Renewal Plan
 * POST /api/renewal-planning/generate
 *
 * Generates complete renewal plan for all pilots based on certification expiry dates
 *
 * Developer: Maurice Rondeau
 * @version 2.0.0
 * @updated 2025-11-02 - Added authentication and role validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateRenewalPlan } from '@/lib/services/certification-renewal-planning-service'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    // Verify admin/manager role
    // For Supabase Auth users: trust them as admins (only admins can access dashboard via Supabase Auth)
    // For admin-session users: look up by ID in an_users table
    const supabase = await createClient()

    if (auth.source === 'admin-session') {
      // Admin session - verify role in an_users table
      const { data: adminUser } = await supabase
        .from('an_users')
        .select('role')
        .eq('id', auth.userId!)
        .single()

      if (!adminUser || !['admin', 'manager'].includes(adminUser.role)) {
        return NextResponse.json(
          { success: false, error: 'Forbidden - Admin or Manager access required' },
          { status: 403 }
        )
      }
    }
    // Supabase Auth users are trusted as admins (dashboard access requires Supabase Auth)

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
    const sanitized = sanitizeError(error, {
      operation: 'generateRenewalPlan',
      endpoint: '/api/renewal-planning/generate',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
