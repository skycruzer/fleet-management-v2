/**
 * Check Types API Route
 * Handles listing all check types for certification forms
 *
 * Updated: 2025-10-22 - Refactored to use service layer pattern
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { getCheckTypes } from '@/lib/services/check-types-service'

/**
 * GET /api/check-types
 * List all check types
 *
 * Uses service layer for database operations (check-types-service.ts)
 */
export async function GET(_request: NextRequest) {
  try {
    // Check authentication (supports both Supabase Auth and admin-session cookie)
    const auth = await getAuthenticatedAdmin()

    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch check types using service layer
    const checkTypes = await getCheckTypes()

    return NextResponse.json({
      success: true,
      data: checkTypes,
      count: checkTypes?.length || 0,
    })
  } catch (error) {
    console.error('GET /api/check-types error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch check types',
      },
      { status: 500 }
    )
  }
}
