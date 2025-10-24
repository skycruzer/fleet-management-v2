/**
 * API Route: Clear All Renewal Plans
 * DELETE /api/renewal-planning/clear
 *
 * Deletes all existing renewal plans from the database
 * Use with caution - this is a destructive operation
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE() {
  try {
    const supabase = await createClient()

    // Delete all renewal plans
    const { error } = await supabase
      .from('certification_renewal_plans')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'All renewal plans have been cleared',
    })
  } catch (error: any) {
    console.error('Error clearing renewal plans:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clear renewal plans',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
