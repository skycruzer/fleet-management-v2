/**
 * Disciplinary Matters API Routes
 *
 * GET /api/disciplinary - List disciplinary matters with filtering
 * POST /api/disciplinary - Create new disciplinary matter
 *
 * @spec 001-missing-core-features (US6, T093)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMatters, createMatter, getMatterStats } from '@/lib/services/disciplinary-service'

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
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = _request.nextUrl.searchParams

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

    const page = pageStr ? parseInt(pageStr, 10) : 1
    const pageSize = pageSizeStr ? parseInt(pageSizeStr, 10) : 20

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
export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await _request.json()

    // Validate required fields
    if (
      !body.title ||
      !body.description ||
      !body.pilot_id ||
      !body.incident_date ||
      !body.incident_type_id ||
      !body.severity ||
      !body.status
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Missing required fields: title, description, pilot_id, incident_date, incident_type_id, severity, status',
        },
        { status: 400 }
      )
    }

    // Create matter
    const result = await createMatter({
      ...body,
      reported_by: user.id, // Auto-set reported_by to current user
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/disciplinary:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
