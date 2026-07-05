/**
 * API Route: Clear All Renewal Plans
 * DELETE /api/renewal-planning/clear
 *
 * Deletes all existing renewal plans from the database
 * Use with caution - this is a destructive operation
 *
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { authRateLimit } from '@/lib/rate-limit'
import { invalidateRenewalPlanningCaches } from '@/lib/services/cache-invalidation-helper'

export const DELETE = createAdminRoute(
  {
    operation: 'clearAllRenewalPlans',
    endpoint: '/api/renewal-planning/clear',
    rateLimit: { limiter: authRateLimit, by: 'user' },
  },
  async ({ admin }) => {
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

    // Delete all renewal plans
    const { error } = await supabase
      .from('certification_renewal_plans')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (error) throw error

    await invalidateRenewalPlanningCaches().catch((cacheError) =>
      console.error('Cache invalidation failed (non-blocking):', cacheError)
    )

    return NextResponse.json({
      success: true,
      message: 'All renewal plans have been cleared',
    })
  }
)
