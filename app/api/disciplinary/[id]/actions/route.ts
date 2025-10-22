/**
 * Disciplinary Actions API Route
 *
 * POST /api/disciplinary/[id]/actions - Add action to matter
 *
 * @spec 001-missing-core-features (US6, T095)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { addAction } from '@/lib/services/disciplinary-service'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * POST /api/disciplinary/[id]/actions
 *
 * Add disciplinary action to matter
 *
 * Body:
 * - action_type: string (required) - Type of action taken
 * - action_date: string (ISO date, required)
 * - action_time?: string - Time of action
 * - description: string (required) - Action description
 * - issued_by: string (required) - User ID of issuer
 * - location?: string - Location where action was issued
 * - warning_level?: string - Level of warning (if applicable)
 * - warning_sequence?: number - Warning sequence number
 * - suspension_days?: number - Number of suspension days
 * - effective_date?: string - Effective date of action
 * - expiry_date?: string - Expiry date of action
 * - appeal_deadline?: string - Deadline for appeal
 * - follow_up_required?: boolean - Whether follow-up is needed
 * - follow_up_date?: string - Date for follow-up
 * - acknowledged_by_pilot?: boolean - Whether pilot acknowledged
 * - acknowledgment_date?: string - Date of acknowledgment
 * - is_automatic_escalation?: boolean - Whether auto-escalated
 * - action_notes?: string - Additional notes
 * - status?: string - Status of action
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id: matterId } = params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(matterId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid matter ID format' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.action_type || !body.action_date || !body.description || !body.issued_by) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: action_type, action_date, description, issued_by',
        },
        { status: 400 }
      )
    }

    // Add action
    const result = await addAction({
      matter_id: matterId,
      action_type: body.action_type,
      action_date: body.action_date,
      action_time: body.action_time || null,
      description: body.description,
      issued_by: body.issued_by,
      location: body.location || null,
      warning_level: body.warning_level || null,
      warning_sequence: body.warning_sequence || null,
      suspension_days: body.suspension_days || null,
      effective_date: body.effective_date || null,
      expiry_date: body.expiry_date || null,
      appeal_deadline: body.appeal_deadline || null,
      follow_up_required: body.follow_up_required || false,
      follow_up_date: body.follow_up_date || null,
      acknowledged_by_pilot: body.acknowledged_by_pilot || false,
      acknowledgment_date: body.acknowledgment_date || null,
      is_automatic_escalation: body.is_automatic_escalation || false,
      action_notes: body.action_notes || null,
      status: body.status || 'PENDING',
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json(
      { success: true, data: result.data, message: 'Action added successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/disciplinary/[id]/actions:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
