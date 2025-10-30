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
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check role (Admin/Manager only for succession planning)
    const { data: userData, error: userError } = await supabase
      .from('an_users')
      .select('role')
      .eq('id', user.id)
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
    return NextResponse.json(
      { error: 'Failed to fetch succession pipeline data' },
      { status: 500 }
    )
  }
}
