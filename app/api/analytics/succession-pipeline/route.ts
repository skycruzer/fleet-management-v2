/**
 * Succession Pipeline API Route
 * Returns captain promotion candidates
 *
 * @route GET /api/analytics/succession-pipeline
 * @query readiness - Filter by readiness level (optional: Ready, Potential, Developing)
 *
 * NOTE: This endpoint requires Admin or Manager role due to sensitive succession planning data
 */

import {
  getCaptainPromotionCandidates,
  getSuccessionReadinessScore,
} from '@/lib/services/succession-planning-service'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { NextRequest, NextResponse } from 'next/server'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check role (Admin/Manager only for succession planning)
    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase
      .from('an_users')
      .select('role')
      .eq('id', auth.userId!)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'Failed to fetch user role' }, { status: 500 })
    }

    const isAuthorized = userData.role === 'Admin' || userData.role === 'Manager'

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
  } catch (error) {
    console.error('Error fetching succession pipeline:', error)
    const sanitized = sanitizeError(error, {
      operation: 'getSuccessionPipeline',
      endpoint: '/api/analytics/succession-pipeline',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
