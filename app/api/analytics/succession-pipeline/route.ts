/**
 * Succession Pipeline API Route
 * Returns captain promotion candidates
 *
 * @route GET /api/analytics/succession-pipeline
 * @query readiness - Filter by readiness level (optional: Ready, Potential, Developing)
 *
 * NOTE: This endpoint requires Admin or Manager role due to sensitive succession planning data
 *
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import {
  getCaptainPromotionCandidates,
  getSuccessionReadinessScore,
} from '@/lib/services/succession-planning-service'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { createAdminRoute } from '@/lib/middleware/create-api-route'

export const GET = createAdminRoute(
  {
    operation: 'getSuccessionPipeline',
    endpoint: '/api/analytics/succession-pipeline',
    rateLimit: false,
  },
  async ({ request, admin }) => {
    // Check role (Admin/Manager only for succession planning)
    const supabase = createAdminClient()
    const { data: userData, error: userError } = await supabase
      .from('an_users')
      .select('role')
      .eq('id', admin.userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'Failed to fetch user role' }, { status: 500 })
    }

    // an_users.role is lowercase
    const isAuthorized = ['admin', 'manager'].includes(userData.role?.toLowerCase())

    if (!isAuthorized) {
      return NextResponse.json(
        {
          error: 'Insufficient permissions',
          message: 'Succession planning access requires Admin or Manager role',
        },
        { status: 403 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const readinessFilter = searchParams.get('readiness') as
      | 'Ready'
      | 'Potential'
      | 'Developing'
      | 'Not Eligible'
      | null

    // Fetch candidates and readiness score in parallel
    const [candidates, readinessScore] = await Promise.all([
      getCaptainPromotionCandidates(readinessFilter || undefined),
      getSuccessionReadinessScore(),
    ])

    return NextResponse.json({
      candidates,
      readinessScore,
      isAuthorized,
    })
  }
)
