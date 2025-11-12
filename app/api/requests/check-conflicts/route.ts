/**
 * Check Conflicts API
 *
 * POST /api/requests/check-conflicts
 * - Real-time conflict detection for pilot requests
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { detectConflicts, type RequestInput } from '@/lib/services/conflict-detection-service'
import { logger } from '@/lib/services/logging-service'
import { z } from 'zod'

// ============================================================================
// Validation Schema
// ============================================================================

const ConflictCheckSchema = z.object({
  pilotId: z.string().uuid('Invalid pilot ID'),
  rank: z.enum(['Captain', 'First Officer']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .nullable()
    .optional(),
  requestCategory: z.enum(['LEAVE', 'FLIGHT', 'LEAVE_BID']),
  requestId: z.string().uuid().optional(),
})

type ConflictCheckRequest = z.infer<typeof ConflictCheckSchema>

// ============================================================================
// API Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = ConflictCheckSchema.parse(body)

    logger.info('Checking conflicts for request', {
      userId: user.id,
      pilotId: validated.pilotId,
      startDate: validated.startDate,
    })

    const requestInput: RequestInput = {
      pilotId: validated.pilotId,
      rank: validated.rank,
      startDate: validated.startDate,
      endDate: validated.endDate || null,
      requestCategory: validated.requestCategory,
      requestId: validated.requestId,
    }

    const result = await detectConflicts(requestInput)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.issues,
        },
        { status: 400 }
      )
    }

    logger.error('Conflict check API error', { error })
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    )
  }
}
