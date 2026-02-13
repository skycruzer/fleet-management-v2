/**
 * Portal Users Admin API Endpoint
 * GET /api/admin/portal-users — List pilot portal users with activity data
 *
 * Returns paginated portal users enriched with session counts, request totals,
 * leave bid counts, and feedback counts. Also returns summary stats for cards.
 *
 * @author Maurice Rondeau
 * @date February 2026
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import {
  getPortalUsersWithActivity,
  getPortalUsersSummary,
  type PortalUsersFilters,
} from '@/lib/services/portal-admin-service'
import { unauthorizedResponse } from '@/lib/utils/api-response-helper'
import { logger } from '@/lib/services/logging-service'

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    return unauthorizedResponse()
  }

  try {
    const { searchParams } = request.nextUrl

    const filters: PortalUsersFilters = {
      status: (searchParams.get('status') as PortalUsersFilters['status']) ?? 'all',
      rank: searchParams.get('rank') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: (searchParams.get('sortOrder') as PortalUsersFilters['sortOrder']) ?? undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : 25,
    }

    const [result, summary] = await Promise.all([
      getPortalUsersWithActivity(filters),
      getPortalUsersSummary(),
    ])

    if (result.error) {
      logger.error('Failed to fetch portal users', {
        error: result.error,
        action: 'getPortalUsersWithActivity',
        userId: auth.userId ?? undefined,
      })

      return NextResponse.json(
        { success: false, error: 'Failed to fetch portal users' },
        { status: 500 }
      )
    }

    const page = filters.page ?? 1
    const pageSize = filters.pageSize ?? 25

    return NextResponse.json({
      success: true,
      data: result.users,
      summary,
      pagination: {
        total: result.total,
        page,
        pageSize,
        totalPages: Math.ceil(result.total / pageSize),
      },
    })
  } catch (error) {
    logger.error('GET /api/admin/portal-users error', {
      error: error instanceof Error ? error : String(error),
      action: 'GET /api/admin/portal-users',
      userId: auth.userId ?? undefined,
    })

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
