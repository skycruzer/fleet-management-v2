/**
 * Check Types API Route
 * Handles listing all check types for certification forms
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/check-types
 * List all check types
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch check types
    const { data: checkTypes, error } = await supabase
      .from('check_types')
      .select('id, check_code, check_description, category')
      .order('check_code', { ascending: true })

    if (error) throw error

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
