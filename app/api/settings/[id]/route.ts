/**
 * System Settings API - Individual Setting Operations
 * PUT /api/settings/[id] - Update a specific setting
 */

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { updateSystemSetting } from '@/lib/services/admin-service'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { value, description } = body

    console.log('📝 PUT /api/settings/[id] - Request received:', {
      id,
      value: JSON.stringify(value),
      description,
    })

    // Validate input
    if (value === undefined && !description) {
      return NextResponse.json({ success: false, error: 'No updates provided' }, { status: 400 })
    }

    // Update the setting
    const updated = await updateSystemSetting(id, { value, description })

    console.log('✅ PUT /api/settings/[id] - Update successful:', {
      id: updated.id,
      key: updated.key,
      updated_at: updated.updated_at,
    })

    // Revalidate all pages that use settings (especially app_title)
    revalidatePath('/dashboard', 'layout')
    revalidatePath('/dashboard/admin/settings', 'page')

    console.log('🔄 Cache revalidated for dashboard and settings pages')

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Setting updated successfully',
    })
  } catch (error) {
    console.error('❌ PUT /api/settings/[id] - Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update setting',
      },
      { status: 500 }
    )
  }
}
