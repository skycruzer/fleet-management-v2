/**
 * Disciplinary Matter Detail API Routes
 *
 * GET /api/disciplinary/[id] - Get single matter with timeline
 * PATCH /api/disciplinary/[id] - Update matter
 * DELETE /api/disciplinary/[id] - Soft delete matter
 *
 * @spec 001-missing-core-features (US6, T094)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getMatterWithTimeline,
  updateMatter,
  deleteMatter,
} from '@/lib/services/disciplinary-service'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/disciplinary/[id]
 *
 * Get single disciplinary matter with full timeline of actions
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

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
  } catch (error) {
    console.error('Error in GET /api/disciplinary/[id]:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

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
export async function PATCH(_request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid matter ID format' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate at least one field to update
    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields provided for update' },
        { status: 400 }
      )
    }

    const result = await updateMatter(id, body)

    if (!result.success) {
      if (result.error === 'Matter not found') {
        return NextResponse.json({ success: false, error: result.error }, { status: 404 })
      }
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 200 })
  } catch (error) {
    console.error('Error in PATCH /api/disciplinary/[id]:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/disciplinary/[id]
 *
 * Soft delete matter (sets status to CLOSED)
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid matter ID format' },
        { status: 400 }
      )
    }

    const result = await deleteMatter(id)

    if (!result.success) {
      if (result.error === 'Matter not found') {
        return NextResponse.json({ success: false, error: result.error }, { status: 404 })
      }
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json(
      { success: true, message: 'Matter closed successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in DELETE /api/disciplinary/[id]:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
