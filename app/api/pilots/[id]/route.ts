/**
 * Pilot API Route - Individual Pilot Operations
 * Handles DELETE requests for pilot deletion
 *
 * @version 2.0.0
 * @since 2025-10-20
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPilotById, updatePilot, deletePilot } from '@/lib/services/pilot-service'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/pilots/[id]
 * Fetch a single pilot by ID with certification status
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get pilot ID from params (Next.js 15 requires await)
    const { id: pilotId } = await params

    if (!pilotId) {
      return NextResponse.json({ success: false, error: 'Pilot ID is required' }, { status: 400 })
    }

    // Fetch pilot using service layer
    const pilot = await getPilotById(pilotId)

    if (!pilot) {
      return NextResponse.json({ success: false, error: 'Pilot not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: pilot,
    })
  } catch (error: any) {
    console.error('Error fetching pilot:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch pilot',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/pilots/[id]
 * Update a pilot's information
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get pilot ID from params (Next.js 15 requires await)
    const { id: pilotId } = await params

    if (!pilotId) {
      return NextResponse.json({ success: false, error: 'Pilot ID is required' }, { status: 400 })
    }

    // Parse request body
    const body = await _request.json()

    // Update pilot using service layer
    const updatedPilot = await updatePilot(pilotId, body)

    return NextResponse.json({
      success: true,
      data: updatedPilot,
      message: 'Pilot updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating pilot:', error)

    // Handle specific error cases
    if (error.message?.includes('not found')) {
      return NextResponse.json({ success: false, error: 'Pilot not found' }, { status: 404 })
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update pilot',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/pilots/[id]
 * Delete a pilot and all related records (atomic)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get pilot ID from params (Next.js 15 requires await)
    const { id: pilotId } = await params

    if (!pilotId) {
      return NextResponse.json({ success: false, error: 'Pilot ID is required' }, { status: 400 })
    }

    // Delete pilot using service layer (includes cascade deletion)
    await deletePilot(pilotId)

    return NextResponse.json({
      success: true,
      message: 'Pilot deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting pilot:', error)

    // Handle specific error cases
    if (error.message?.includes('not found')) {
      return NextResponse.json({ success: false, error: 'Pilot not found' }, { status: 404 })
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete pilot',
      },
      { status: 500 }
    )
  }
}
