/**
 * Disciplinary Matters API Routes
 *
 * GET /api/disciplinary - List disciplinary matters with filtering
 * POST /api/disciplinary - Create new disciplinary matter
 *
 * @spec 001-missing-core-features (US6, T093)
 *
 * @version 2.0.0
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { mutationRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { getMatters, createMatter, getMatterStats } from '@/lib/services/disciplinary-service'
import { CreateDisciplinarySchema } from '@/lib/validations/disciplinary-schema'
import { invalidateDisciplinaryCaches } from '@/lib/services/cache-invalidation-helper'

/**
 * GET /api/disciplinary
 *
 * List disciplinary matters with filtering and pagination
 *
 * Query params:
 * - pilotId: Filter by pilot ID
 * - status: Filter by matter status
 * - severity: Filter by severity level
 * - incidentTypeId: Filter by incident type
 * - assignedTo: Filter by assigned user ID
 * - reportedBy: Filter by reporting user ID
 * - startDate: Filter by incident date (from)
 * - endDate: Filter by incident date (to)
 * - searchQuery: Search in title, description, flight number
 * - includeResolved: Include resolved matters (default: false)
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20)
 * - sortBy: Sort field (incident_date, created_at, updated_at, severity)
 * - sortOrder: Sort order (asc, desc)
 * - stats: Return statistics instead of list (default: false)
 */
export const GET = createAdminRoute(
  {
    operation: 'getDisciplinaryMatters',
    endpoint: '/api/disciplinary',
    rateLimit: false,
  },
  async ({ request }) => {
    try {
      const searchParams = request.nextUrl.searchParams

      // Check if requesting stats
      const requestStats = searchParams.get('stats') === 'true'

      if (requestStats) {
        const startDateStr = searchParams.get('startDate')
        const endDateStr = searchParams.get('endDate')
        const pilotId = searchParams.get('pilotId')

        const statsFilters = {
          startDate: startDateStr ? new Date(startDateStr) : undefined,
          endDate: endDateStr ? new Date(endDateStr) : undefined,
          pilotId: pilotId || undefined,
        }

        const result = await getMatterStats(statsFilters)

        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error }, { status: 500 })
        }

        return NextResponse.json({ success: true, data: result.data }, { status: 200 })
      }

      // Build filters from query params
      const pilotId = searchParams.get('pilotId')
      const status = searchParams.get('status')
      const severity = searchParams.get('severity')
      const incidentTypeId = searchParams.get('incidentTypeId')
      const assignedTo = searchParams.get('assignedTo')
      const reportedBy = searchParams.get('reportedBy')
      const startDateStr = searchParams.get('startDate')
      const endDateStr = searchParams.get('endDate')
      const searchQuery = searchParams.get('searchQuery')
      const includeResolved = searchParams.get('includeResolved') === 'true'
      const pageStr = searchParams.get('page')
      const pageSizeStr = searchParams.get('pageSize')
      const sortBy = searchParams.get('sortBy') as
        | 'incident_date'
        | 'created_at'
        | 'updated_at'
        | 'severity'
        | null
      const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | null

      const page = Math.max(1, pageStr ? parseInt(pageStr, 10) || 1 : 1)
      const pageSize = Math.min(
        100,
        Math.max(1, pageSizeStr ? parseInt(pageSizeStr, 10) || 20 : 20)
      )

      const filters = {
        pilotId: pilotId || undefined,
        status: status || undefined,
        severity: severity || undefined,
        incidentTypeId: incidentTypeId || undefined,
        assignedTo: assignedTo || undefined,
        reportedBy: reportedBy || undefined,
        startDate: startDateStr ? new Date(startDateStr) : undefined,
        endDate: endDateStr ? new Date(endDateStr) : undefined,
        searchQuery: searchQuery || undefined,
        includeResolved,
        page,
        pageSize,
        sortBy: sortBy || undefined,
        sortOrder: sortOrder || undefined,
      }

      const result = await getMatters(filters)

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 })
      }

      const totalPages = Math.ceil(result.data!.totalCount / pageSize)

      return NextResponse.json(
        {
          success: true,
          data: result.data!.matters,
          pagination: {
            page,
            pageSize,
            totalCount: result.data!.totalCount,
            totalPages,
          },
        },
        { status: 200 }
      )
    } catch (error) {
      console.error('Error in GET /api/disciplinary:', error)
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
  }
)

/**
 * POST /api/disciplinary
 *
 * Create new disciplinary matter
 *
 * Body:
 * - title: string (required)
 * - description: string (required)
 * - pilot_id: string (required)
 * - incident_date: string (ISO date, required)
 * - incident_type_id: string (required)
 * - severity: string (required)
 * - status: string (required)
 * - reported_by: string (required, auto-set to current user)
 * - assigned_to?: string
 * - aircraft_registration?: string
 * - flight_number?: string
 * - location?: string
 * - witnesses?: object
 * - evidence_files?: object
 * - corrective_actions?: string
 * - impact_on_operations?: string
 * - regulatory_notification_required?: boolean
 * - regulatory_body?: string
 * - notification_date?: string
 * - due_date?: string
 */
export const POST = createAdminRoute(
  {
    operation: 'createDisciplinaryMatter',
    endpoint: '/api/disciplinary',
    rateLimit: { limiter: mutationRateLimit, by: 'user' },
  },
  async ({ request, admin }) => {
    try {
      // Parse and validate request body with Zod
      const body = await request.json()
      const validation = CreateDisciplinarySchema.safeParse(body)

      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            details: validation.error.flatten().fieldErrors,
          },
          { status: 400 }
        )
      }

      // Create matter with validated data
      const result = await createMatter({
        ...validation.data,
        reported_by: admin.userId, // Auto-set reported_by to current user
      })

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 })
      }

      await invalidateDisciplinaryCaches(result.data?.id).catch((error) =>
        console.error('Cache invalidation failed (non-blocking):', error)
      )

      return NextResponse.json({ success: true, data: result.data }, { status: 201 })
    } catch (error) {
      console.error('Error in POST /api/disciplinary:', error)
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
  }
)
