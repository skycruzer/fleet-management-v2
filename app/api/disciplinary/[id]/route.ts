/**
 * Disciplinary Matter Detail API Routes
 *
 * GET /api/disciplinary/[id] - Get single matter with timeline
 * PATCH /api/disciplinary/[id] - Update matter
 * DELETE /api/disciplinary/[id] - Soft delete matter
 *
 * @version 3.0.0
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 * @spec 001-missing-core-features (US6, T094)
 */

import { NextResponse } from 'next/server'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { authRateLimit } from '@/lib/rate-limit'
import {
  getMatterWithTimeline,
  updateMatter,
  deleteMatter,
} from '@/lib/services/disciplinary-service'
import { verifyRequestAuthorization, ResourceType } from '@/lib/middleware/authorization-middleware'
import { revalidatePath } from 'next/cache'

/**
 * GET /api/disciplinary/[id]
 *
 * Get single disciplinary matter with full timeline of actions
 */
export const GET = createAdminRoute(
  {
    operation: 'getMatterWithTimeline',
    endpoint: '/api/disciplinary/[id]',
    rateLimit: false,
  },
  async ({ params }) => {
    const { id } = params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid matter ID format' },
        { status: 400 }
      )
    }

    const result = await getMatterWithTimeline(id)

    if (!result.success) {
      if (result.error === 'Matter not found') {
        return NextResponse.json({ success: false, error: result.error }, { status: 404 })
      }
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 200 })
  }
)

/**
 * PATCH /api/disciplinary/[id]
 *
 * Update disciplinary matter
 *
 * Body: Partial matter update fields
 * - title?: string
 * - description?: string
 * - status?: string
 * - severity?: string
 * - assigned_to?: string
 * - due_date?: string
 * - resolution_notes?: string
 * - corrective_actions?: string
 * - impact_on_operations?: string
 * - regulatory_notification_required?: boolean
 * - regulatory_body?: string
 * - notification_date?: string
 * ... and other fields
 */
export const PATCH = createAdminRoute(
  {
    operation: 'updateMatter',
    endpoint: '/api/disciplinary/[id]',
    rateLimit: { limiter: authRateLimit, by: 'user' },
  },
  async ({ request: _request, params, admin }) => {
    const { id } = params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid matter ID format' },
        { status: 400 }
      )
    }

    // AUTHORIZATION: Verify user can update this disciplinary matter
    const authResult = await verifyRequestAuthorization(_request, ResourceType.DISCIPLINARY, id)

    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.statusCode }
      )
    }

    const body = await _request.json()

    // Validate at least one field to update
    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields provided for update' },
        { status: 400 }
      )
    }

    // Sanitize: Convert empty strings to null for UUID and optional fields
    const sanitizedBody = {
      ...body,
      assigned_to: body.assigned_to === '' ? null : body.assigned_to,
      incident_type_id: body.incident_type_id === '' ? null : body.incident_type_id,
      pilot_id: body.pilot_id === '' ? null : body.pilot_id,
      aircraft_registration: body.aircraft_registration === '' ? null : body.aircraft_registration,
      flight_number: body.flight_number === '' ? null : body.flight_number,
      location: body.location === '' ? null : body.location,
      corrective_actions: body.corrective_actions === '' ? null : body.corrective_actions,
      impact_on_operations: body.impact_on_operations === '' ? null : body.impact_on_operations,
      regulatory_body: body.regulatory_body === '' ? null : body.regulatory_body,
      notification_date: body.notification_date === '' ? null : body.notification_date,
      due_date: body.due_date === '' ? null : body.due_date,
      resolution_notes: body.resolution_notes === '' ? null : body.resolution_notes,
    }

    const result = await updateMatter(id, sanitizedBody, admin.userId)

    if (!result.success) {
      if (result.error === 'Matter not found') {
        return NextResponse.json({ success: false, error: result.error }, { status: 404 })
      }
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    revalidatePath('/dashboard/disciplinary')
    revalidatePath(`/dashboard/disciplinary/${id}`)

    return NextResponse.json({ success: true, data: result.data }, { status: 200 })
  }
)

/**
 * DELETE /api/disciplinary/[id]
 *
 * Soft delete matter (sets status to CLOSED)
 */
export const DELETE = createAdminRoute(
  {
    operation: 'deleteMatter',
    endpoint: '/api/disciplinary/[id]',
    rateLimit: { limiter: authRateLimit, by: 'user' },
  },
  async ({ request: _request, params }) => {
    const { id } = params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid matter ID format' },
        { status: 400 }
      )
    }

    // AUTHORIZATION: Verify user can delete this disciplinary matter
    const authResult = await verifyRequestAuthorization(_request, ResourceType.DISCIPLINARY, id)

    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.statusCode }
      )
    }

    const result = await deleteMatter(id)

    if (!result.success) {
      if (result.error === 'Matter not found') {
        return NextResponse.json({ success: false, error: result.error }, { status: 404 })
      }
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    revalidatePath('/dashboard/disciplinary')
    revalidatePath(`/dashboard/disciplinary/${id}`)

    return NextResponse.json(
      { success: true, message: 'Matter closed successfully' },
      { status: 200 }
    )
  }
)
