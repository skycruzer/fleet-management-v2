/**
 * Individual Pilot API Route
 * Handles single pilot operations (GET, PUT, DELETE)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPilotById, updatePilot, deletePilot } from '@/lib/services/pilot-service'
import { PilotUpdateSchema } from '@/lib/validations/pilot-validation'
import { createClient } from '@/lib/supabase/server'

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * GET /api/pilots/[id]
 * Get a single pilot by ID
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    // Fetch pilot
    const pilot = await getPilotById(id)

    if (!pilot) {
      return NextResponse.json(
        {
          success: false,
          error: 'Pilot not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: pilot,
    })
  } catch (error) {
    console.error('GET /api/pilots/[id] error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch pilot',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/pilots/[id]
 * Update a pilot
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    // Parse and validate request body
    const body = await request.json()
    const validatedData = PilotUpdateSchema.parse(body)

    // Update pilot
    const updatedPilot = await updatePilot(id, validatedData)

    if (!updatedPilot) {
      return NextResponse.json(
        {
          success: false,
          error: 'Pilot not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedPilot,
      message: 'Pilot updated successfully',
    })
  } catch (error) {
    console.error('PUT /api/pilots/[id] error:', error)

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.message,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update pilot',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/pilots/[id]
 * Delete a pilot
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    // Delete pilot
    await deletePilot(id)

    return NextResponse.json({
      success: true,
      message: 'Pilot deleted successfully',
    })
  } catch (error) {
    console.error('DELETE /api/pilots/[id] error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete pilot',
      },
      { status: 500 }
    )
  }
}
