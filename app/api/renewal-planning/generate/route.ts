/**
 * API Route: Generate Renewal Plan
 * POST /api/renewal-planning/generate
 *
 * Generates complete renewal plan for all pilots based on certification expiry dates
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { generateRenewalPlanWithPairing } from '@/lib/services/certification-renewal-planning-service'
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
    const supabase = createAdminClient()

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
    const { monthsAhead = 12, categories, pilotIds, checkCodes, clearExisting = false } = body

    // Clear existing renewal plans if requested
    if (clearExisting) {
      console.log('Clearing existing renewal plans...')
      const serviceClient = createServiceRoleClient()
      // Use gte on created_at to match all rows (Supabase requires a filter)
      const { data: deleteData, error: deleteError } = await serviceClient
        .from('certification_renewal_plans')
        .delete()
        .gte('created_at', '1900-01-01')
        .select('id')

      console.log('Delete result:', { deleted: deleteData?.length || 0, error: deleteError })

      if (deleteError) {
        console.error('Error clearing existing plans:', deleteError)
        throw new Error(`Failed to clear existing renewal plans: ${deleteError.message}`)
      }
      console.log(`Cleared ${deleteData?.length || 0} existing renewal plans`)
    }

    // Generate renewal plans with Captain/FO pairing
    const { renewals, pairing } = await generateRenewalPlanWithPairing({
      monthsAhead,
      categories,
      pilotIds,
      checkCodes,
    })

    // Calculate summary statistics
    const byCategory: Record<string, number> = {}
    const byRosterPeriod: Record<string, number> = {}

    renewals.forEach((plan) => {
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

    // Calculate pairing statistics
    const totalPaired = pairing.statistics.totalPairs * 2
    const totalUnpaired = pairing.statistics.totalUnpaired
    const totalWithPairingData = totalPaired + totalUnpaired
    const pairingRate =
      totalWithPairingData > 0 ? Math.round((totalPaired / totalWithPairingData) * 100) : 0

    return NextResponse.json({
      success: true,
      data: {
        totalPlans: renewals.length,
        byCategory,
        rosterPeriodSummary,
        pairingStats: {
          totalPairs: pairing.statistics.totalPairs,
          totalUnpaired: pairing.statistics.totalUnpaired,
          pairingRate,
        },
        plans: renewals.slice(0, 50), // Return first 50 for preview
      },
      message: `Successfully generated ${renewals.length} renewal plans`,
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
