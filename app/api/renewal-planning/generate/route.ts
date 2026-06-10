/**
 * API Route: Generate Renewal Plan
 * POST /api/renewal-planning/generate
 *
 * Generates complete renewal plan for all pilots based on certification expiry dates
 *
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { generateRenewalPlanWithPairing } from '@/lib/services/certification-renewal-planning-service'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

export const POST = createAdminRoute(
  {
    operation: 'generateRenewalPlan',
    endpoint: '/api/renewal-planning/generate',
    rateLimit: false,
  },
  async ({ request, admin }) => {
    // Verify admin/manager role
    // For Supabase Auth users: trust them as admins (only admins can access dashboard via Supabase Auth)
    // For admin-session users: look up by ID in an_users table
    const supabase = createAdminClient()

    if (admin.source === 'admin-session') {
      // Admin session - verify role in an_users table
      const { data: adminUser } = await supabase
        .from('an_users')
        .select('role')
        .eq('id', admin.userId)
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
    const {
      monthsAhead = 12,
      categories,
      pilotIds,
      checkCodes,
      clearExisting = false,
      captainRoles,
    } = body

    // Clear existing renewal plans if requested.
    //
    // Critical: Supabase doesn't expose a transaction boundary across HTTP,
    // so we cannot atomically "delete + regenerate". If generation fails after
    // a delete, the user is left with an empty table. We surface that state
    // explicitly to the user instead of returning a generic 500 — so they
    // know their existing plans were destroyed and can retry generation
    // (or restore from backup).
    let didClearExisting = false
    if (clearExisting) {
      const serviceClient = createServiceRoleClient()
      // Use gte on created_at to match all rows (Supabase requires a filter)
      const { error: deleteError } = await serviceClient
        .from('certification_renewal_plans')
        .delete()
        .gte('created_at', '1900-01-01')
        .select('id')

      if (deleteError) {
        throw new Error(`Failed to clear existing renewal plans: ${deleteError.message}`)
      }
      didClearExisting = true
    }

    // Generate renewal plans with Captain/FO pairing.
    // If this throws AFTER didClearExisting=true, the catch below tells the
    // user the table was emptied so they don't waste time wondering why.
    let renewals: Awaited<ReturnType<typeof generateRenewalPlanWithPairing>>['renewals']
    let pairing: Awaited<ReturnType<typeof generateRenewalPlanWithPairing>>['pairing']
    try {
      const result = await generateRenewalPlanWithPairing({
        monthsAhead,
        categories,
        pilotIds,
        checkCodes,
        pairingOptions: {
          ...(captainRoles?.length > 0 ? { captainRoles } : {}),
        },
      })
      renewals = result.renewals
      pairing = result.pairing
    } catch (genError) {
      if (didClearExisting) {
        console.error(
          '[generate] Existing plans were cleared but generation failed — table is now empty',
          {
            error: genError instanceof Error ? genError.message : String(genError),
          }
        )
        const sanitized = sanitizeError(genError, {
          operation: 'generateRenewalPlan:afterClear',
          endpoint: '/api/renewal-planning/generate',
        })
        return NextResponse.json(
          {
            ...sanitized,
            warning: 'EXISTING_PLANS_CLEARED',
            message:
              'Existing renewal plans were deleted before generation failed. The plans table is now empty. Please retry generation.',
          },
          { status: sanitized.statusCode }
        )
      }
      throw genError
    }

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

    // Revalidate dashboard pages so they reflect the newly generated data
    revalidatePath('/dashboard/renewal-planning')
    revalidatePath('/dashboard/renewal-planning/calendar')

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
  }
)
