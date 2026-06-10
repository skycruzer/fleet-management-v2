/**
 * Portal Users Admin API Endpoint
 * GET /api/admin/portal-users — List pilot portal users with activity data
 *
 * Returns paginated portal users enriched with session counts, request totals,
 * leave bid counts, and feedback counts. Also returns summary stats for cards.
 *
 * @author Maurice Rondeau
 * @date February 2026
 *
 * @version 2.0.0
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import {
  getPortalUsersWithActivity,
  getPortalUsersSummary,
  type PortalUsersFilters,
} from '@/lib/services/portal-admin-service'
import { logger } from '@/lib/services/logging-service'

export const GET = createAdminRoute(
  {
    operation: 'getPortalUsers',
    endpoint: '/api/admin/portal-users',
    rateLimit: false,
  },
  async ({ request, admin }) => {
    try {
      const { searchParams } = request.nextUrl

      // Map client-side sort fields to actual DB column names
      const sortFieldMap: Record<string, string> = {
        name: 'first_name',
        employee_id: 'employee_id',
        rank: 'rank',
        registration_date: 'registration_date',
        last_login_at: 'last_login_at',
        // total_requests and active_sessions are computed fields — sort by registration_date
        total_requests: 'registration_date',
        active_sessions: 'last_login_at',
      }

      const rawSort = searchParams.get('sortBy') ?? 'registration_date'

      const filters: PortalUsersFilters = {
        status: (searchParams.get('status') as PortalUsersFilters['status']) ?? 'all',
        rank: searchParams.get('rank') ?? undefined,
        search: searchParams.get('search') ?? undefined,
        sortBy: sortFieldMap[rawSort] ?? 'registration_date',
        sortOrder: (searchParams.get('sortOrder') as PortalUsersFilters['sortOrder']) ?? undefined,
        page: Math.max(1, Number(searchParams.get('page')) || 1),
        pageSize: Math.min(100, Math.max(1, Number(searchParams.get('pageSize')) || 25)),
      }

      const [result, summary] = await Promise.all([
        getPortalUsersWithActivity(filters),
        getPortalUsersSummary(),
      ])

      if (result.error) {
        logger.error('Failed to fetch portal users', {
          error: result.error,
          action: 'getPortalUsersWithActivity',
          userId: admin.userId,
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
        userId: admin.userId,
      })

      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
  }
)
